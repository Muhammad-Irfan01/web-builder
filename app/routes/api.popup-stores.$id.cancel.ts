import { requireAuth } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';

export async function action({ request, params }: { request: Request; params: any }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  if (request.method !== 'POST') {
    return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
  }

  const auth = await requireAuth(request);
  const { storeId } = auth;
  const { id } = params;

  try {
    const schedule = await prisma.popupStoreSchedule.findFirst({
      where: { id, storeId },
    });

    if (!schedule) {
      return jsonWithCors({ success: false, error: 'Schedule not found' }, request, { status: 404 });
    }

    // If currently ACTIVE, restore original themeData immediately
    if (schedule.status === 'ACTIVE' && schedule.backupThemeData) {
      await prisma.project.update({
        where: { id: schedule.projectId },
        data: { themeData: schedule.backupThemeData },
      });
      console.log(`[PopupStores API] Restored baseline theme on project ${schedule.projectId} upon schedule ${id} cancellation`);
    }

    const cancelled = await prisma.popupStoreSchedule.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return jsonWithCors({
      success: true,
      data: cancelled,
      message: 'Pop-up store schedule cancelled and storefront reverted.',
    }, request);
  } catch (error: any) {
    return jsonWithCors({ success: false, error: error.message }, request, { status: 500 });
  }
}

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
}
