import type { Chat } from '@buster/database/queries';
import { getAssetScreenshotSignedUrl } from '@buster/search';
import type { GetScreenshotResponse } from '@buster/server-shared/screenshots';
import type { Context } from 'hono';

export const getChatStaticScreenshotHandler = async ({
  chat,
  context,
}: {
  chat: Pick<Chat, 'organizationId' | 'id'> & { screenshotBucketKey: string };
  context: Context;
}) => {
  try {
    const signedUrl = await getAssetScreenshotSignedUrl({
      key: chat.screenshotBucketKey,
      organizationId: chat.organizationId,
    });
    const result: GetScreenshotResponse = {
      success: true,
      url: signedUrl,
    };
    return context.json(result);
  } catch (error) {
    console.error('Failed to get chat screenshot URL', {
      chatId: chat.id,
      error,
    });
    const result: GetScreenshotResponse = {
      success: false,
      error: 'Failed to get screenshot URL',
    };
    return context.json(result);
  }
};
