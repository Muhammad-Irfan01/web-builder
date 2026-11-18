import { requireAuth } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';
import { compileSitemap } from '../lib/sitemap.server';
import { products as productsApi } from '../lib/api';

export async function action({ request, params }: { request: Request; params: any }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  if (request.method !== 'PUT' && request.method !== 'POST') {
    return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
  }

  const { projectId } = params;

  // Require auth to retrieve user context & isolated storeId
  const auth = await requireAuth(request);
  const { storeId } = auth;

  try {
    // 1. Fetch the project first to verify ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        storeId: true,
        apiKey: true,
        domains: true,
      }
    });

    if (!project) {
      return jsonWithCors({ error: 'Project not found' }, request, { status: 404 });
    }

    if (project.storeId !== storeId) {
      console.warn(`[Projects Update API] Security block: Store ${storeId} tried to access project ${projectId} owned by store ${project.storeId}`);
      return jsonWithCors({ error: 'Access Forbidden' }, request, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    // Support both Next.js UI updates (name/title) and customize dashboard updates (themeData)
    if (body.name !== undefined) updateData.title = body.name;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    
    if (body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
      
      // ── Enforce Single Published Project per Store ────────────────────────
      if (body.isPublished === true) {
        await prisma.project.updateMany({
          where: { 
            storeId, 
            id: { not: projectId } 
          },
          data: { isPublished: false }
        });
        console.log(`[Projects Update API] Unpublished other projects for store ${storeId}.`);
      }
    }

    if (body.themeData !== undefined) {
      updateData.themeData = typeof body.themeData === 'string' 
        ? body.themeData 
        : JSON.stringify(body.themeData);
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    // ── Auto-generate site token (apiKey) on first publish ──────────────────
    let siteApiKey: string | null = project.apiKey;
    if (body.isPublished && !project.apiKey) {
      try {
        const adminJwt = request.headers.get('Authorization')?.replace('Bearer ', '') || null;
        let userId: string | null = null;
        if (adminJwt) {
          try {
            const parts = adminJwt.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
              userId = payload.userId || payload.sub || null;
            }
          } catch {}
        }

        if (userId) {
          const backendBase = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
          const tokenRes = await fetch(`${backendBase}/api/auth/internal/generate-site-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-api-key': process.env.INTERNAL_API_KEY || '',
            },
            body: JSON.stringify({ userId }),
          });

          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            siteApiKey = tokenData?.data?.token || tokenData.token || null;

            if (siteApiKey) {
              await prisma.project.update({
                where: { id: projectId },
                data: { apiKey: siteApiKey },
              });
            }
          }
        }
      } catch (tokenErr: any) {
        console.error(`[Projects Update API] Site token request error:`, tokenErr.message);
      }
    }

    // ── Regenerate sitemap on every save/publish ────────────────────────────
    (async () => {
      try {
        const allProducts: any[] = [];
        try {
          const resp = await productsApi.list({ limit: 250 }, siteApiKey, project.storeId);
          if (resp.data) allProducts.push(...resp.data);
        } catch {}

        const primaryDomain = project.domains?.find((d: any) => d.isPrimary)?.hostname || null;

        const sitemapXml = compileSitemap({
          projectId,
          customDomain: primaryDomain,
          products: allProducts,
        });

        await prisma.project.update({
          where: { id: projectId },
          data: { sitemap: sitemapXml },
        });
        console.log(`[Projects Update API] Sitemap regenerated for project ${projectId}`);
      } catch (sitemapErr: any) {
        console.error(`[Projects Update API] Sitemap generation failed:`, sitemapErr.message);
      }
    })();

    return jsonWithCors({
      success: true,
      project: {
        id: updated.id,
        title: updated.title,
        isPublished: updated.isPublished,
      }
    }, request);
  } catch (error: any) {
    console.error('[Projects Update API] Error:', error);
    return jsonWithCors({ error: error.message }, request, { status: 500 });
  }
}

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
}
