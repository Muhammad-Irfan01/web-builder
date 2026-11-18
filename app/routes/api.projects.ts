import { requireAuth } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  console.log('[Projects API] Loader hit - Version: Multi-Domain Refactor (May 23)');

  // Ensure the request is authenticated and get the isolated tenant storeId
  const auth = await requireAuth(request);
  const { storeId } = auth;

  const url = new URL(request.url);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  const limit = Number(url.searchParams.get('limit') ?? 10);

  try {
    // 1. Fetch total count of projects for this store (for pagination)
    const total = await prisma.project.count({
      where: { storeId }
    });

    // 2. Fetch projects matching the storeId, paginated
    const projects = await prisma.project.findMany({
      where: { storeId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        isPublished: true,
        themeData: true,
        apiKey: true,
        sitemap: true,
        createdAt: true,
        updatedAt: true,
        domains: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Map database properties to what Next.js frontend expects
    const formattedProjects = projects.map((p: any) => {
      const primaryDomain = p.domains?.find((d: any) => d.isPrimary)?.hostname;
      const systemDomain = p.domains?.find((d: any) => d.type === 'SYSTEM')?.hostname;

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description || 'Customizable Orcayo landing page storefront.',
        isPublished: p.isPublished,
        previewImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        domain: primaryDomain || systemDomain || `storefront-${p.id.slice(0, 8)}`,
        domains: p.domains || [],
      };
    });

    const nextOffset = offset + formattedProjects.length;
    const hasMore = nextOffset < total;

    return jsonWithCors({
      projects: formattedProjects,
      pagination: {
        offset,
        limit,
        total,
        nextOffset,
      },
      hasMore,
    }, request);
  } catch (error: any) {
    console.error('[Projects API] Error:', error);
    return jsonWithCors({ error: error.message }, request, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
}
