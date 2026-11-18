
import { requireAuth } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';

export async function action({ request, params }: { request: Request; params: any }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  if (request.method !== 'DELETE' && request.method !== 'POST') {
    return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
  }

  const { projectId } = params;

  // Require auth to retrieve user context & isolated storeId
  const auth = await requireAuth(request);
  const { storeId } = auth;

  try {
    // 1. Fetch the project first to verify ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return jsonWithCors({ error: 'Project not found' }, request, { status: 404 });
    }

    if (project.storeId !== storeId) {
      console.warn(`[Projects Delete API] Security block: Store ${storeId} tried to delete project ${projectId} owned by store ${project.storeId}`);
      return jsonWithCors({ error: 'Access Forbidden' }, request, { status: 403 });
    }

    // 2. Perform isolated delete
    await prisma.project.delete({
      where: { id: projectId }
    });

    console.log(`[Projects Delete API] Successfully deleted project ${projectId} for store ${storeId}`);

    return jsonWithCors({ success: true }, request);
  } catch (error: any) {
    console.error('[Projects Delete API] Error:', error);
    return jsonWithCors({ error: error.message }, request, { status: 500 });
  }
}

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
}
