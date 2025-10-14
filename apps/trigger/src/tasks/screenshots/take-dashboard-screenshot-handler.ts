import { hasDashboardScreenshotBeenTakenWithin } from '@buster/database/queries';
import { getDashboardScreenshot } from '@buster/server-shared/screenshots/methods';
import { logger, schemaTask } from '@trigger.dev/sdk';
import dayjs from 'dayjs';
import { TakeDashboardScreenshotTriggerSchema } from './schemas';
import { screenshots_task_keys } from './task-keys';
import { uploadScreenshotHandler } from './upload-screenshot-handler';

export const takeDashboardScreenshotHandlerTask: ReturnType<
  typeof schemaTask<
    typeof screenshots_task_keys.take_dashboard_screenshot,
    typeof TakeDashboardScreenshotTriggerSchema,
    { success: boolean } | undefined
  >
> = schemaTask({
  id: screenshots_task_keys.take_dashboard_screenshot,
  schema: TakeDashboardScreenshotTriggerSchema,
  run: async (args) => {
    logger.info('Getting dashboard screenshot', { args });

    const { isOnSaveEvent, dashboardId, organizationId } = args;

    const shouldTakeNewScreenshot = await shouldTakenNewScreenshot({
      dashboardId,
      isOnSaveEvent,
    });

    logger.info('Should take new screenshot', { shouldTakeNewScreenshot });

    if (!shouldTakeNewScreenshot) {
      logger.info('Dashboard screenshot already taken', { dashboardId });
      return;
    }

    const screenshotBuffer = await getDashboardScreenshot(args);

    logger.info('Dashboard screenshot taken', { screenshotBufferLength: screenshotBuffer.length });

    const result = await uploadScreenshotHandler({
      assetType: 'dashboard_file',
      assetId: dashboardId,
      image: screenshotBuffer,
      organizationId,
    });

    logger.info('Dashboard screenshot uploaded', { result });

    return result;
  },
});

const shouldTakenNewScreenshot = async ({
  dashboardId,
  isOnSaveEvent,
}: { dashboardId: string; isOnSaveEvent: boolean }) => {
  if (isOnSaveEvent) {
    return true;
  }

  const hasRecentScreenshot = await hasDashboardScreenshotBeenTakenWithin(
    dashboardId,
    dayjs().subtract(24, 'hours')
  );

  logger.info('Is screenshot expired', { hasRecentScreenshot });

  return !hasRecentScreenshot;
};
