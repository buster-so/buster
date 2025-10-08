import { z } from 'zod';
import { BrowserParamsContextSchema, browserLogin } from './browser-login';
import { createHrefFromLink } from './create-href-from-link';
import { DEFAULT_SCREENSHOT_CONFIG } from './screenshot-config';

export const GetChatScreenshotHandlerArgsSchema = z
  .object({
    chatId: z.string().uuid('Chat ID must be a valid UUID'),
    width: z.number().default(DEFAULT_SCREENSHOT_CONFIG.width).optional(),
    height: z.number().default(DEFAULT_SCREENSHOT_CONFIG.height).optional(),
    type: z.enum(['png', 'jpeg']).default(DEFAULT_SCREENSHOT_CONFIG.type).optional(),
  })
  .extend(BrowserParamsContextSchema.shape);

export type GetChatScreenshotHandlerArgs = z.infer<typeof GetChatScreenshotHandlerArgsSchema>;

export const getChatScreenshot = async (args: GetChatScreenshotHandlerArgs) => {
  const { type = DEFAULT_SCREENSHOT_CONFIG.type } = args;

  const { result: screenshotBuffer } = await browserLogin({
    ...args,
    fullPath: createHrefFromLink({
      to: '/screenshots/chats/$chatId/content' as const,
      params: { chatId: args.chatId },
    }),
    callback: async ({ page }) => {
      const screenshotBuffer = await page.screenshot({ type });
      return screenshotBuffer;
    },
  });

  return screenshotBuffer;
};
