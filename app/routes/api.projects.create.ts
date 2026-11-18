
import { requireAuth, generatePersistentSiteToken } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { DEFAULT_THEME } from '../lib/theme';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';
import { systemHostname } from '../lib/origins';

export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  if (request.method !== 'POST') {
    return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
  }

  // Require auth to retrieve user context & isolated storeId
  const auth = await requireAuth(request);
  const { storeId, userId } = auth;

  try {
    const body = await request.json();
    const title = body.name || body.title || 'Untitled Landing Page';
    const description = body.description || 'A custom storefront canvas section-based page.';

    // Generate a unique project-specific slug for the system subdomain
    const baseSlug = (body.name || body.title || 'site')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Add a short random suffix to ensure uniqueness in the DB
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // Generate a secure project-specific API key via Orcayo Backend
    const apiKey = await generatePersistentSiteToken(userId);

    // Create the project in the PostgreSQL builder schema
    const project = await prisma.project.create({
      data: {
        title,
        slug,
        description,
        storeId,
        userId,
        apiKey,
        isPublished: false,
        themeData: JSON.stringify({
          ...DEFAULT_THEME,
          storeName: title,
        }),
        domains: {
          create: [
            {
              hostname: systemHostname(slug),
              isPrimary: true,
              isVerified: true,
              type: 'SYSTEM',
              storeId
            }
          ]
        }
      },
      include: { domains: true }
    });

    console.log(`[Projects Create API] Successfully created project ${project.id} for store ${storeId}`);

    // Return exact layout expected by Next.js frontend
    return jsonWithCors({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        isPublished: project.isPublished,
        createdAt: project.createdAt.toISOString(),
      },
    }, request);
  } catch (error: any) {
    console.error('[Projects Create API] Error:', error);
    return jsonWithCors({ error: error.message }, request, { status: 500 });
  }
}

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
}
