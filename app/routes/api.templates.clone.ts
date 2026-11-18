
import { requireAuth, generatePersistentSiteToken } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { DEFAULT_THEME } from '../lib/theme';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';
import { normalizeThemeLayout } from '../lib/component-tree';

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
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // Support extracting templateId and title from body or query
    const templateId = body.templateId || url.searchParams.get('templateId') || '';
    const title = body.title || body.name || 'Cloned Storefront';

    let baseTheme = JSON.stringify(normalizeThemeLayout(DEFAULT_THEME));

    if (templateId) {
      const template = await prisma.template.findUnique({
        where: { id: templateId }
      });
      if (template) {
        try {
          const parsed = JSON.parse(template.themeData);
          if (parsed.version === 'grapesjs-v1') {
            baseTheme = template.themeData;
          } else {
            baseTheme = JSON.stringify(normalizeThemeLayout(parsed));
          }
        } catch {
          baseTheme = template.themeData;
        }
      } else {
        console.warn(`[Clone API] Template ${templateId} not found, falling back to default theme.`);
      }
    }

    // Generate a unique project-specific slug for the system subdomain
    const baseSlug = (title || 'cloned-site')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    // Generate a secure project-specific API key via Orcayo Backend
    const apiKey = await generatePersistentSiteToken(userId);

    // Create a new project cloned from the template
    const project = await prisma.project.create({
      data: {
        title,
        slug,
        description: `Cloned from template design.`,
        storeId,
        userId,
        apiKey,
        isPublished: false,
        themeData: baseTheme,
        domains: {
          create: [
            {
              hostname: `${slug}.wattlesol.com`,
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

    console.log(`[Clone API] Cloned template ${templateId} to project ${project.id} for store ${storeId}`);

    // Return both schemas (object wrap and flat id) for absolute compliance
    return jsonWithCors({
      id: project.id,
      project: {
        id: project.id,
        title: project.title,
      }
    }, request);
  } catch (error: any) {
    console.error('[Clone API] Error:', error);
    return jsonWithCors({ error: error.message }, request, { status: 500 });
  }
}

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
}
