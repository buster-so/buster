import { z } from 'zod';
import { BrowserParamsContextSchema, browserLogin } from './browser-login';
import { createHrefFromLink } from './create-href-from-link';
import { DEFAULT_CHAT_SCREENSHOT_CONFIG } from './screenshot-config';
import { takeScreenshot } from './take-screenshot';

export const GetChatScreenshotHandlerArgsSchema = z
  .object({
    chatId: z.string().uuid('Chat ID must be a valid UUID'),
  })
  .extend(BrowserParamsContextSchema.shape);

export type GetChatScreenshotHandlerArgs = z.infer<typeof GetChatScreenshotHandlerArgsSchema>;

export const getChatScreenshot = async (args: GetChatScreenshotHandlerArgs) => {
  const { result: screenshotBuffer } = await browserLogin({
    width: DEFAULT_CHAT_SCREENSHOT_CONFIG.width,
    height: DEFAULT_CHAT_SCREENSHOT_CONFIG.height,
    ...args,
    fullPath: createHrefFromLink({
      to: '/screenshots/chats/$chatId/content' as const,
      params: { chatId: args.chatId },
    }),
    callback: takeScreenshot,
  });

  return screenshotBuffer;
};
