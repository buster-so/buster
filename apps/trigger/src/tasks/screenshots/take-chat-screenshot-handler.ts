import { hasChatScreenshotBeenTakenWithin } from '@buster/database/queries';
import { getChatScreenshot } from '@buster/server-shared/screenshots/methods';
import { logger, schemaTask } from '@trigger.dev/sdk';
import dayjs from 'dayjs';
import { type TakeChatScreenshotTrigger, TakeChatScreenshotTriggerSchema } from './schemas';
import { screenshots_task_keys } from './task-keys';
import { uploadScreenshotHandler } from './upload-screenshot-handler';

export const takeChatScreenshotHandlerTask: ReturnType<
  typeof schemaTask<
    typeof screenshots_task_keys.take_chat_screenshot,
    typeof TakeChatScreenshotTriggerSchema,
    { success: boolean } | undefined
  >
> = schemaTask({
  id: screenshots_task_keys.take_chat_screenshot,
  schema: TakeChatScreenshotTriggerSchema,
  run: async (args) => {
    logger.info('Getting chart screenshot', { args });

    const { chatId, isNewChatMessage, organizationId } = args;

    const shouldTakeNewScreenshot = await shouldTakeChatScreenshot({
      chatId,
      isNewChatMessage,
    });

    if (!shouldTakeNewScreenshot) {
      logger.info('Chat screenshot already taken', { chatId });
      return;
    }

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

const shouldTakeChatScreenshot = async (
  args: Pick<TakeChatScreenshotTrigger, 'chatId' | 'isNewChatMessage'>
) => {
  if (args.isNewChatMessage) {
    return true;
  }

  const hasRecentScreenshot = await hasChatScreenshotBeenTakenWithin(
    args.chatId,
    dayjs().subtract(4, 'weeks')
  );

  logger.info('Has recent screenshot', { hasRecentScreenshot });

  return !hasRecentScreenshot;
};
