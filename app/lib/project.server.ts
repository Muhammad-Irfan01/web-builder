/**
 * Shared SSR loader helper for all storefront routes.
 *
 * Resolves a project by:
 *   1. `projectId` from URL search params (?projectId=...)
 *   2. `projectId` from the URL path (pub.$projectId routes)
 *   3. Custom domain lookup via the `host` request header
 *
 * Extracts `storeId` from the project's apiKey (persistent site token JWT).
 * This avoids having to do auth against the main Orcayo backend for every SSR request.
 */
import { prisma } from './database.server';
import { decodeJwt } from './auth.server';
import { normalizeThemeLayout } from './component-tree';

export interface ResolvedProject {
  id: string;
  storeId: string;
  apiKey: string | null;
  themeData: any;
  storeName: string;
  primaryDomain: string | null;
  domains: any[];
  sitemap: string | null;
}

/**
 * Resolve the project from the current request.
 * Returns null if no project is found (caller should render a 404).
 */
export async function resolveProject(
  request: Request,
  explicitProjectId?: string,
): Promise<ResolvedProject | null> {
  const url = new URL(request.url);
  
  // 1. Try explicit ID or URL param (highest priority, used in builder/preview)
  let projectId =
    explicitProjectId ||
    url.searchParams.get('projectId');

  // 2. Try cookie if no param (only inside sandbox visualizer or local dev previews)
  if (!projectId) {
    const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
    const isSandboxHost = host.includes('sandbox.wattlesol.com') || 
                          host.includes('localhost') || 
                          host.includes('127.0.0.1');
                          
    if (isSandboxHost) {
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/orcayo_preview_project_id=([^;]+)/);
        if (match) projectId = match[1];
      }
    }
  }

  let project: any = null;

  if (projectId) {
    project = await prisma.project.findUnique({ 
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        isPublished: true,
        themeData: true,
        apiKey: true,
        sitemap: true,
        storeId: true,
        domains: true,
      }
    });
  } else {
    // 3. Domain/Subdomain lookup via Host header
    const host = (request.headers.get('host') || '').split(':')[0];
    
    // a. Exact hostname match in the domains table (highest priority)
    const domainEntry = await prisma.domain.findUnique({
      where: { hostname: host },
      include: { 
        project: { 
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            isPublished: true,
            themeData: true,
            apiKey: true,
            sitemap: true,
            storeId: true,
            domains: true,
          }
        } 
      }
    });

    if (domainEntry) {
      project = domainEntry.project;
    } else {
      // b. Subdomain fallback: Try treating the first part of host as a project slug
      // e.g. "saloon.localhost" or "saloon.wattlesol.com" -> slug: "saloon"
      const parts = host.split('.');
      if (parts.length > 1) {
        const slugPart = parts[0];
        project = await prisma.project.findUnique({
          where: { slug: slugPart },
          include: { domains: true }
        });
      }
    }
  }

  if (!project) return null;

  // Extract storeId from the apiKey JWT payload
  let storeId: string = project.storeId; // fallback to direct DB column
  if (project.apiKey) {
    const decoded = decodeJwt(project.apiKey);
    if (decoded?.storeId) storeId = decoded.storeId;
  }

  // Parse themeData
  let themeData: any = {};
  try {
    themeData = typeof project.themeData === 'string'
      ? JSON.parse(project.themeData)
      : project.themeData ?? {};
  } catch {
    themeData = {};
  }

  // Only normalize if using legacy component tree, preserve grapesjs-v1 as-is
  if (themeData.version !== 'grapesjs-v1') {
    themeData = normalizeThemeLayout(themeData);
  }
  themeData.storeId = storeId;
  themeData.themeId = project.id;

  const storeName = themeData.storeName || project.title || 'Orcayo Store';
  const primaryDomain = project.domains?.find((d: any) => d.isPrimary)?.hostname || null;

  return {
    id: project.id,
    storeId,
    apiKey: project.apiKey ?? null,
    themeData,
    storeName,
    primaryDomain,
    domains: project.domains ?? [],
    sitemap: (project as any).sitemap ?? null,
  };
}

export interface StorefrontContext {
  storeId: string | null;
  apiKey: string | null;
  themeData: any | null;
  storeName: string;
}

export async function resolveStorefrontContext(request: Request): Promise<StorefrontContext> {
  const url = new URL(request.url);
  
  // Extract template ID if projectId starts with "template-" in query or cookie
  let projectId = url.searchParams.get('projectId') || '';
  if (!projectId && typeof request !== 'undefined') {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/orcayo_preview_project_id=([^;]+)/);
      if (match) projectId = match[1];
    }
  }

  let templateId = url.searchParams.get('templateId') || '';
  if (!templateId && projectId && projectId.startsWith('template-')) {
    templateId = projectId.replace('template-', '');
  }

  // 1. Try resolving project context normally (projectId from query/cookie/host)
  let resolved = await resolveProject(request);

  // 2. Resilient fallback: if no project context is resolved, fetch the first project from DB
  let fallbackProject: any = null;
  if (!resolved) {
    fallbackProject = await prisma.project.findFirst({
      select: {
        id: true,
        storeId: true,
        apiKey: true,
        themeData: true,
        title: true,
      }
    });
  }

  // Active credentials
  const apiKey = resolved?.apiKey || fallbackProject?.apiKey || null;
  const storeId = resolved?.storeId || fallbackProject?.storeId || null;

  // Resolve theme
  let themeData: any = null;
  if (templateId) {
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (template) {
      try {
        themeData = JSON.parse(template.themeData);
      } catch {}
    }
  }

  if (!themeData) {
    if (resolved) {
      themeData = resolved.themeData;
    } else if (fallbackProject?.themeData) {
      try {
        themeData = typeof fallbackProject.themeData === 'string'
          ? JSON.parse(fallbackProject.themeData)
          : fallbackProject.themeData;
      } catch {
        themeData = {};
      }
    }
  }

  // Inject storeId and themeId into themeData for client-side persistence and visual editor state tracking
  if (themeData) {
    themeData = normalizeThemeLayout(themeData);
    if (storeId) {
      themeData.storeId = storeId;
    }
    themeData.themeId = templateId || resolved?.id || fallbackProject?.id || null;
  }

  const storeName = themeData?.storeName || resolved?.storeName || fallbackProject?.title || 'My Orcayo Store';

  return {
    storeId,
    apiKey,
    themeData,
    storeName,
  };
}
