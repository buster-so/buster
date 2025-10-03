import { createServerFileRoute } from '@tanstack/react-start/server';
import { z } from 'zod';
import { browserLogin } from '@/api/server-functions/browser-login';
import { createScreenshotResponse } from '@/api/server-functions/screenshot-helpers';
import { createHrefFromLink } from '@/lib/routes';

export const GetChatScreenshotParamsSchema = z.object({
  chatId: z.string(),
});

export const GetChatScreenshotQuerySchema = z.object({
  width: z.coerce.number().min(600).max(3840).default(600),
  height: z.coerce.number().min(400).max(2160).default(338),
  type: z.enum(['png', 'jpeg']).default('png'),
});

export const ServerRoute = createServerFileRoute('/screenshots/chats/$chatId').methods({
  GET: async ({ request, params }) => {
    const { chatId } = GetChatScreenshotParamsSchema.parse(params);
    const { width, height, type } = GetChatScreenshotQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );

    try {
      const { result: screenshotBuffer } = await browserLogin({
        width,
        height,
        fullPath: createHrefFromLink({
          to: '/screenshots/chats/$chatId/content',
          params: { chatId },
          search: { type, width, height },
        }),
        request,
        callback: async ({ page }) => {
          const screenshotBuffer = await page.screenshot({
            type,
          });
          return screenshotBuffer;
        },
      });

      return createScreenshotResponse({ screenshotBuffer });
    } catch (error) {
      console.error('Error capturing chat screenshot', error);
      return new Response(
        JSON.stringify({
          message: 'Failed to capture screenshot',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
