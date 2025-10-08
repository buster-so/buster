import { hasReportScreenshotBeenTakenWithin } from '@buster/database/queries';
import { getReportScreenshot } from '@buster/server-shared/screenshots';
import { logger, schemaTask } from '@trigger.dev/sdk';
import dayjs from 'dayjs';
import { TakeReportScreenshotTriggerSchema } from './schemas';
import { screenshots_task_keys } from './task-keys';
import { uploadScreenshotHandler } from './upload-screenshot-handler';

export const takeReportScreenshotHandlerTask: ReturnType<
  typeof schemaTask<
    typeof screenshots_task_keys.take_report_screenshot,
    typeof TakeReportScreenshotTriggerSchema,
    { success: boolean } | undefined
  >
> = schemaTask({
  id: screenshots_task_keys.take_report_screenshot,
  schema: TakeReportScreenshotTriggerSchema,
  run: async (args) => {
    logger.info('Getting report screenshot', { args });

    const { reportId, organizationId } = args;

    const shouldTakeNewScreenshot = await shouldTakenNewScreenshot({
      reportId,
    });

    if (!shouldTakeNewScreenshot) {
      return;
    }

    const screenshotBuffer = await getReportScreenshot(args);

    logger.info('Report screenshot taken', { screenshotBufferLength: screenshotBuffer.length });

    const result = await uploadScreenshotHandler({
      assetType: 'report_file',
      assetId: reportId,
      image: screenshotBuffer,
      organizationId,
    });

    logger.info('Report screenshot uploaded', { result });

    return result;
  },
});

const shouldTakenNewScreenshot = async ({ reportId }: { reportId: string }) => {
  const isScreenshotExpired = await hasReportScreenshotBeenTakenWithin(
    reportId,
    dayjs().subtract(24, 'hours')
  );

  return !isScreenshotExpired;
};
