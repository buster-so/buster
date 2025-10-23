import { hasMetricScreenshotBeenTakenWithin } from '@buster/database/queries';
import { getMetricScreenshot } from '@buster/server-shared/screenshots/methods';
import { logger, schemaTask } from '@trigger.dev/sdk';
import dayjs from 'dayjs';
import { commonTriggerScreenshotConfig } from './config';
import { TakeMetricScreenshotTriggerSchema } from './schemas';
import { screenshots_task_keys } from './task-keys';
import { uploadScreenshotHandler } from './upload-screenshot-handler';

export const takeMetricScreenshotHandlerTask: ReturnType<
  typeof schemaTask<
    typeof screenshots_task_keys.take_metric_screenshot,
    typeof TakeMetricScreenshotTriggerSchema,
    { success: boolean } | undefined
  >
> = schemaTask({
  ...commonTriggerScreenshotConfig,
  id: screenshots_task_keys.take_metric_screenshot,
  schema: TakeMetricScreenshotTriggerSchema,
  run: async (args) => {
    logger.info('Getting metric screenshot', { args });

    const { isOnSaveEvent, metricId, organizationId } = args;

    const shouldTakeNewScreenshot = await shouldTakenNewScreenshot({
      metricId,
      isOnSaveEvent,
    });

    logger.info('Should take new screenshot', { shouldTakeNewScreenshot });

    if (!shouldTakeNewScreenshot) {
      logger.info('Metric screenshot already taken', { metricId });
      return;
    }

    logger.info('Getting metric screenshot');

    const screenshotBuffer = await getMetricScreenshot(args);

    logger.info('Metric screenshot taken', { screenshotBufferLength: screenshotBuffer.length });
    logger.log('This is the screenshot buffer', { screenshotBuffer });

    const result = await uploadScreenshotHandler({
      assetType: 'metric_file',
      assetId: metricId,
      image: screenshotBuffer,
      organizationId,
    });

    logger.info('Metric screenshot uploaded', { result });

    return result;
  },
});

const shouldTakenNewScreenshot = async ({
  metricId,
  isOnSaveEvent,
}: {
  metricId: string;
  isOnSaveEvent: boolean;
}) => {
  if (isOnSaveEvent) {
    return true;
  }

  const hasRecentScreenshot = await hasMetricScreenshotBeenTakenWithin(
    metricId,
    dayjs().subtract(6, 'hours')
  );

  logger.info('Has recent screenshot', { hasRecentScreenshot });

  return !hasRecentScreenshot;
};
