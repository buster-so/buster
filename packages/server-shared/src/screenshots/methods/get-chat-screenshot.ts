import { z } from 'zod';
import { BrowserParamsContextSchema, browserLogin } from './browser-login';
import { createHrefFromLink } from './create-href-from-link';
import { takeScreenshot } from './take-screenshot';

export const GetChatScreenshotHandlerArgsSchema = z
  .object({
    chatId: z.string().uuid('Chat ID must be a valid UUID'),
  })
  .extend(BrowserParamsContextSchema.shape);

export type GetChatScreenshotHandlerArgs = z.infer<typeof GetChatScreenshotHandlerArgsSchema>;

export const getChatScreenshot = async (args: GetChatScreenshotHandlerArgs) => {
  const { result: screenshotBuffer } = await browserLogin({
    ...args,
    fullPath: createHrefFromLink({
      to: '/screenshots/chats/$chatId/content' as const,
      params: { chatId: args.chatId },
    }),
    callback: takeScreenshot,
  });

  return screenshotBuffer;
};
