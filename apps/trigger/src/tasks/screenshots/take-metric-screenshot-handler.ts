import { hasMetricScreenshotBeenTakenWithin } from '@buster/database/queries';
import { getMetricScreenshot } from '@buster/server-shared/screenshots';
import { logger, schemaTask } from '@trigger.dev/sdk';
import dayjs from 'dayjs';
import { z } from 'zod';
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
  id: screenshots_task_keys.take_metric_screenshot,
  schema: TakeMetricScreenshotTriggerSchema,
  maxDuration: 60 * 3, // 3 minutes max
  retry: {
    maxAttempts: 1,
    minTimeoutInMs: 1000, // 1 second
    maxTimeoutInMs: 60 * 1000, // 1 minute
  },
  run: async (args) => {
    logger.info('Getting metric screenshot', { args });

    const { isOnSaveEvent, metricId, organizationId } = args;

    const shouldTakeNewScreenshot = await shouldTakenNewScreenshot({
      metricId,
      isOnSaveEvent,
    });

    if (!shouldTakeNewScreenshot) {
      return;
    }

    const screenshotBuffer = await getMetricScreenshot(args);

    logger.info('Metric screenshot taken', { screenshotBufferLength: screenshotBuffer.length });

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
}: { metricId: string; isOnSaveEvent: boolean }) => {
  if (isOnSaveEvent) {
    return true;
  }

  const isScreenshotExpired = await hasMetricScreenshotBeenTakenWithin(
    metricId,
    dayjs().subtract(6, 'hours')
  );

  return !isScreenshotExpired;
};
