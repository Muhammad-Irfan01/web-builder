
import { requireAuth } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';

export async function action({ request, params }: { request: Request; params: any }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const { projectId } = params;

  // Verify authorization
  const auth = await requireAuth(request);
  const { storeId } = auth;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project || project.storeId !== storeId) {
      return jsonWithCors({ error: 'Access Forbidden' }, request, { status: 403 });
    }

    console.log(`[Projects Screenshot API] Simulating screenshot capture for project ${projectId}`);
    return jsonWithCors({ success: true, screenshotUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80' }, request);
  } catch (error: any) {
    return jsonWithCors({ error: error.message }, request, { status: 500 });
  }
}

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
}
