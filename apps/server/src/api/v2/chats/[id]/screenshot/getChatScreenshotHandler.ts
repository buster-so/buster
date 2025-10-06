import type {
  GetChatScreenshotParams,
  GetChatScreenshotQuery,
} from '@buster/server-shared/screenshots';
import type { Context } from 'hono';
import { createHrefFromLink } from '../../../../../shared-helpers/create-href-from-link';

export const getChatScreenshotHandler = async ({
  params,
  search,
  context,
}: {
  params: GetChatScreenshotParams;
  search: GetChatScreenshotQuery;
  context: Context;
}) => {
  const { width, height, type } = search;
  const { id: chatId } = params;

  const { browserLogin } = await import('../../../../../shared-helpers/browser-login');

  const { result: screenshotBuffer } = await browserLogin({
    width,
    height,
    fullPath: createHrefFromLink({
      to: '/screenshots/chats/$chatId/content' as const,
      params: { chatId },
      search: { type, width, height },
    }),
    context,
    callback: async ({ page }) => {
      return await page.screenshot({ type });
    },
  });

  return screenshotBuffer;
};
