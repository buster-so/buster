import { getChatScreenshot } from '@buster/server-shared/screenshots/methods';
import { logger, schemaTask } from '@trigger.dev/sdk';
import { TakeChartScreenshotTriggerSchema } from './schemas';
import { screenshots_task_keys } from './task-keys';
import { uploadScreenshotHandler } from './upload-screenshot-handler';

export const takeChartScreenshotHandlerTask: ReturnType<
  typeof schemaTask<
    typeof screenshots_task_keys.take_chart_screenshot,
    typeof TakeChartScreenshotTriggerSchema,
    { success: boolean } | undefined
  >
> = schemaTask({
  id: screenshots_task_keys.take_chart_screenshot,
  schema: TakeChartScreenshotTriggerSchema,
  run: async (args) => {
    logger.info('Getting chart screenshot', { args });

    const { chatId, organizationId } = args;

    const screenshotBuffer = await getChatScreenshot(args);

    logger.info('Chart screenshot taken', { screenshotBufferLength: screenshotBuffer.length });

    const result = await uploadScreenshotHandler({
      assetType: 'chat',
      assetId: chatId,
      image: screenshotBuffer,
      organizationId,
    });

    logger.info('Chart screenshot uploaded', { result });

    return result;
  },
});
