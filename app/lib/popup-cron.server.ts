import { prisma } from './database.server';

let isRunning = false;

export async function runPopupStoreCronCycle() {
  if (isRunning) return;
  isRunning = true;

  const now = new Date();

  try {
    const pendingActivations = await prisma.popupStoreSchedule.findMany({
      where: {
        status: 'SCHEDULED',
        startDate: { lte: now },
        endDate: { gt: now },
      },
    });

    for (const schedule of pendingActivations) {
      console.log(`[PopupCron] Activating seasonal store schedule "${schedule.name}" (${schedule.id}) for store ${schedule.storeId}`);

      const project = await prisma.project.findUnique({
        where: { id: schedule.projectId },
        select: { id: true, themeData: true },
      });

      if (!project) {
        console.warn(`[PopupCron] Project ${schedule.projectId} not found for schedule ${schedule.id}`);
        continue;
      }

      let targetThemeData: string = schedule.customThemeData || '';
      if (!targetThemeData && schedule.templateId) {
        const tmpl = await prisma.template.findUnique({
          where: { id: schedule.templateId },
          select: { themeData: true },
        });
        if (tmpl?.themeData) {
          targetThemeData = tmpl.themeData;
        }
      }

      if (!targetThemeData) {
        console.warn(`[PopupCron] No theme data found to activate for schedule ${schedule.id}`);
        continue;
      }

      await prisma.$transaction([
        prisma.project.update({
          where: { id: project.id },
          data: { themeData: targetThemeData },
        }),
        prisma.popupStoreSchedule.update({
          where: { id: schedule.id },
          data: {
            status: 'ACTIVE',
            backupThemeData: project.themeData,
          },
        }),
      ]);

      console.log(`[PopupCron] Successfully activated schedule ${schedule.id} and backed up baseline theme.`);
    }

    const expiredSchedules = await prisma.popupStoreSchedule.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: now },
      },
    });

    for (const schedule of expiredSchedules) {
      console.log(`[PopupCron] Expiring and reverting seasonal store "${schedule.name}" (${schedule.id})`);

      if (schedule.backupThemeData) {
        await prisma.project.update({
          where: { id: schedule.projectId },
          data: { themeData: schedule.backupThemeData },
        });
        console.log(`[PopupCron] Restored baseline themeData for project ${schedule.projectId}`);
      }

      await prisma.popupStoreSchedule.update({
        where: { id: schedule.id },
        data: { status: 'ENDED' },
      });

      console.log(`[PopupCron] Marked schedule ${schedule.id} as ENDED.`);
    }
  } catch (error) {
    console.error('[PopupCron] Error in popup store cron cycle:', error);
  } finally {
    isRunning = false;
  }
}

declare global {
  var __popupCronTimer: NodeJS.Timeout | undefined;
}

export function initPopupCron() {
  if (globalThis.__popupCronTimer) {
    return;
  }

  console.log('[PopupCron] Initializing popup store seasonal scheduler (1-minute interval)...');
  
  runPopupStoreCronCycle().catch(console.error);

  globalThis.__popupCronTimer = setInterval(() => {
    runPopupStoreCronCycle().catch(console.error);
  }, 60 * 1000);
}
