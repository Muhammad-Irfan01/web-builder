import { useLoaderData, data, redirect } from 'react-router';
import type { Route } from './+types/builder';
import { prisma } from '../lib/database.server';
import { requireAuth } from '../lib/auth.server';
import { products as productsApi, teams as teamsApi, bookings as bookingsApi } from '../lib/api';
import { normalizeThemeLayout } from '../lib/component-tree';
import { lazy, Suspense } from 'react';
const GrapesBuilderPage = lazy(() => import('../builder/GrapesBuilderPage'));
import PubHome from './pub.$projectId._index';
import '../app.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const templateId = url.searchParams.get('templateId');

  if (!projectId && !templateId) {
    // Dynamic CNAME/Subdomain routing: if this is a custom domain or custom subdomain query hitting '/', 
    // resolve the project via Host header and serve the storefront directly.
    const { resolveProject } = await import('../lib/project.server');
    const resolved = await resolveProject(request);
    
    if (resolved) {
      let featuredProducts: any[] = [];
      try {
        const { data } = await productsApi.list({ limit: 8 }, resolved.apiKey, resolved.storeId);
        featuredProducts = data;
      } catch {}

      let staffList: any[] = [];
      try {
        const fetchedStaff = await teamsApi.listStaff(resolved.storeId, resolved.apiKey) as any;
        staffList = fetchedStaff?.data || (Array.isArray(fetchedStaff) ? fetchedStaff : []);
      } catch (e) {
        console.error("Failed to load staff in white-label home loader:", e);
      }

      let slotsList: any[] = [];
      try {
        const fetchedSlots = await bookingsApi.listSlots(resolved.storeId, resolved.apiKey) as any;
        slotsList = fetchedSlots?.data || (Array.isArray(fetchedSlots) ? fetchedSlots : []);
      } catch (e) {
        console.error("Failed to load slots in white-label home loader:", e);
      }

      return data({
        isStorefront: true,
        products: featuredProducts,
        storeName: resolved.storeName,
        themeData: resolved.themeData,
        apiKey: resolved.apiKey,
        projectId: resolved.id,
        staff: staffList,
        slots: slotsList,
      });
    }

    return data({ project: null, error: 'Missing Project ID or Template ID' }, { status: 200 });
  }

  // Ensure authorized and get store context
  const auth = await requireAuth(request);
  const { storeId } = auth;

  try {
    let result: any = null;
    let headers: any = {};

    if (projectId) {
      let project: any = null;
      try {
        project = await prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            title: true,
            slug: true,
            themeData: true,
            apiKey: true,
            storeId: true,
            domains: true,
          }
        });
      } catch (dbErr) {
        console.warn('[Builder Loader] Initial DB attempt failed, retrying once...', dbErr);
        await new Promise(r => setTimeout(r, 600));
        project = await prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            title: true,
            slug: true,
            themeData: true,
            apiKey: true,
            storeId: true,
            domains: true,
          }
        }).catch(() => null);
      }

      if (!project) {
        // Fallback for resilient dev / offline editing
        project = {
          id: projectId,
          title: 'Storefront Project',
          apiKey: null,
          storeId: storeId,
          themeData: null,
        };
      }

      if (!project || project.storeId !== storeId) {
        throw data({ project: null, error: 'Project not found or access denied' }, { status: 403 });
      }

      result = { 
        project: {
          id: project.id,
          title: project.title,
          apiKey: project.apiKey,
          themeData: project.themeData,
        },
        error: null 
      };

      // Set session cookie for cleaner preview URLs
      headers['Set-Cookie'] = `orcayo_preview_project_id=${projectId}; Path=/; HttpOnly; SameSite=Lax`;
    } else {
      // Load template in preview mode
      const template = await prisma.template.findUnique({
        where: { id: templateId! },
      });

      if (!template) {
        throw data({ project: null, error: 'Template not found' }, { status: 404 });
      }

      result = {
        project: {
          id: `template-${template.id}`,
          title: `Preview: ${template.title}`,
          isTemplatePreview: true,
          templateId: template.id,
          themeData: template.themeData,
          apiKey: null,
        },
        error: null
      };

      // Set cookie for template preview too
      headers['Set-Cookie'] = `orcayo_preview_project_id=template-${template.id}; Path=/; HttpOnly; SameSite=Lax`;
    }

    return data(result, { headers });
  } catch (error) {
    if ((error as any).status) throw error;
    console.error('[Builder Loader] Error:', error);
    throw data({ project: null, error: 'Database connection failed' }, { status: 500 });
  }
}

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  let token = url.searchParams.get('token') || '';
  let projectId = url.searchParams.get('projectId') || '';
  let templateId = url.searchParams.get('templateId') || '';

  // Extract parameters from request body if possible
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.clone().json();
      if (body.token) token = body.token;
      if (body.projectId) projectId = body.projectId;
      if (body.templateId) templateId = body.templateId;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.clone().formData();
      const bodyToken = formData.get("token");
      const bodyProjectId = formData.get("projectId");
      const bodyTemplateId = formData.get("templateId");
      if (bodyToken) token = bodyToken.toString();
      if (bodyProjectId) projectId = bodyProjectId.toString();
      if (bodyTemplateId) templateId = bodyTemplateId.toString();
    }
  } catch (error) {
    console.error('[Builder Action] Error parsing body:', error);
  }

  // Redirect to GET route with parameters preserved
  const redirectUrl = new URL("/", url.origin);
  if (projectId) redirectUrl.searchParams.set("projectId", projectId);
  if (templateId) redirectUrl.searchParams.set("templateId", templateId);
  if (token) redirectUrl.searchParams.set("token", token);

  return redirect(redirectUrl.pathname + redirectUrl.search);
}

export default function BuilderRoute() {
  const data = useLoaderData<typeof loader>();
  
  if ((data as any)?.isStorefront) {
    const PubHomeComponent = PubHome as any;
    return <PubHomeComponent loaderData={data} />;
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#f4f6f3] text-gray-700 font-medium">Loading GrapesJS Visual Studio...</div>}>
      <GrapesBuilderPage initialData={data} />
    </Suspense>
  );
}
