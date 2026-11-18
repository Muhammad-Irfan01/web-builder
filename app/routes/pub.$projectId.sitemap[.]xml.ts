/**
 * Sitemap endpoint for published storefronts.
 * Supports both path-prefixed preview and custom white-label domains.
 */
import { compileSitemap } from '../lib/sitemap.server';
import { products as productsApi } from '../lib/api';
import { resolveProject } from '../lib/project.server';

export async function loader({ params, request }: { params: any; request: Request }) {
  const resolved = await resolveProject(request, params.projectId);
  if (!resolved) {
    return new Response('Not Found', { status: 404 });
  }

  // Serve cached sitemap if available
  if (resolved.sitemap) {
    return new Response(resolved.sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Generate on-demand if not yet cached
  const allProducts: any[] = [];
  try {
    const resp = await productsApi.list({ limit: 250 }, resolved.apiKey, resolved.storeId);
    if (resp.data) allProducts.push(...resp.data);
  } catch {}

  const xml = compileSitemap({
    projectId: resolved.id,
    customDomain: resolved.primaryDomain,
    products: allProducts,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
