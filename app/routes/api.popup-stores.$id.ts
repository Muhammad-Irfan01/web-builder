import { requireAuth } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';

export async function loader({ request, params }: { request: Request; params: any }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

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

    return jsonWithCors({ success: true, data: schedule }, request);
  } catch (error: any) {
    return jsonWithCors({ success: false, error: error.message }, request, { status: 500 });
  }
}

export async function action({ request, params }: { request: Request; params: any }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

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

    if (request.method === 'DELETE') {
      // If currently ACTIVE, revert project themeData before deleting
      if (schedule.status === 'ACTIVE' && schedule.backupThemeData) {
        await prisma.project.update({
          where: { id: schedule.projectId },
          data: { themeData: schedule.backupThemeData },
        });
      }

      await prisma.popupStoreSchedule.delete({ where: { id } });
      return jsonWithCors({ success: true, message: 'Schedule deleted successfully' }, request);
    }

    if (request.method === 'PUT' || request.method === 'POST') {
      const body = await request.json();
      const updateData: any = {};

      if (body.name !== undefined) updateData.name = body.name;
      if (body.occasion !== undefined) updateData.occasion = body.occasion;
      if (body.discountType !== undefined) updateData.discountType = body.discountType;
      if (body.discountValue !== undefined) updateData.discountValue = parseFloat(body.discountValue);
      if (body.startDate) updateData.startDate = new Date(body.startDate);
      if (body.endDate) updateData.endDate = new Date(body.endDate);
      if (body.customThemeData !== undefined) {
        updateData.customThemeData = typeof body.customThemeData === 'string'
          ? body.customThemeData
          : JSON.stringify(body.customThemeData);
      }

      const updated = await prisma.popupStoreSchedule.update({
        where: { id },
        data: updateData,
      });

      return jsonWithCors({ success: true, data: updated }, request);
    }

    return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
  } catch (error: any) {
    return jsonWithCors({ success: false, error: error.message }, request, { status: 500 });
  }
}
