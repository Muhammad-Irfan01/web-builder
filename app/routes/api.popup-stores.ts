import { requireAuth } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { handlePreflight, jsonWithCors } from '../lib/cors.server';

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const auth = await requireAuth(request);
  const { storeId } = auth;

  try {
    const schedules = await prisma.popupStoreSchedule.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });

    return jsonWithCors({
      success: true,
      data: schedules,
    }, request);
  } catch (error: any) {
    console.error('[PopupStores API] Error loading schedules:', error);
    return jsonWithCors({ success: false, error: error.message }, request, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  if (request.method !== 'POST') {
    return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
  }

  const auth = await requireAuth(request);
  const { storeId } = auth;

  try {
    const body = await request.json();
    const {
      projectId,
      templateId,
      name,
      occasion = 'CUSTOM',
      startDate,
      endDate,
      discountType,
      discountValue,
      customThemeData,
    } = body;

    if (!projectId || !name || !startDate || !endDate) {
      return jsonWithCors({
        success: false,
        error: 'Missing required fields: projectId, name, startDate, endDate',
      }, request, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return jsonWithCors({
        success: false,
        error: 'Invalid date range. End date must be after start date.',
      }, request, { status: 400 });
    }

    // Check for overlapping ACTIVE or SCHEDULED schedules for this store
    const conflicting = await prisma.popupStoreSchedule.findFirst({
      where: {
        storeId,
        status: { in: ['SCHEDULED', 'ACTIVE'] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (conflicting) {
      return jsonWithCors({
        success: false,
        error: `Conflicting schedule "${conflicting.name}" already overlaps this date window.`,
      }, request, { status: 409 });
    }

    const schedule = await prisma.popupStoreSchedule.create({
      data: {
        storeId,
        projectId,
        templateId: templateId || null,
        name,
        occasion,
        status: 'SCHEDULED',
        startDate: start,
        endDate: end,
        discountType: discountType || null,
        discountValue: discountValue ? parseFloat(discountValue) : null,
        customThemeData: customThemeData ? (typeof customThemeData === 'string' ? customThemeData : JSON.stringify(customThemeData)) : null,
      },
    });

    return jsonWithCors({
      success: true,
      data: schedule,
      message: 'Pop-up store schedule created successfully.',
    }, request);
  } catch (error: any) {
    console.error('[PopupStores API] Create error:', error);
    return jsonWithCors({ success: false, error: error.message }, request, { status: 500 });
  }
}
