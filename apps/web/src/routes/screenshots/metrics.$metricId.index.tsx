import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { createScreenshotResponse } from '@/api/server-functions/screenshot-helpers';
import { createHrefFromLink } from '@/lib/routes';

export const GetMetricScreenshotParamsSchema = z.object({
  metricId: z.string(),
});

export const GetMetricScreenshotQuerySchema = z.object({
  version_number: z.coerce.number().min(1).optional(),
  width: z.coerce.number().min(100).max(3840).default(800),
  height: z.coerce.number().min(100).max(2160).default(450),
  type: z.enum(['png', 'jpeg']).default('png'),
});

export const Route = createFileRoute('/screenshots/metrics/$metricId/')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { metricId } = GetMetricScreenshotParamsSchema.parse(params);
        const { version_number, type, width, height } = GetMetricScreenshotQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams)
        );

        try {
          const { browserLogin } = await import('@/api/server-functions/browser-login');
          const { result: screenshotBuffer } = await browserLogin({
            width,
            height,
            request,
            fullPath: createHrefFromLink({
              to: '/screenshots/metrics/$metricId/content',
              params: { metricId },
              search: { version_number, type, width, height },
            }),
            callback: async ({ page }) => {
              return await page.screenshot({
                type,
              });
            },
          });

          return createScreenshotResponse({ screenshotBuffer });
        } catch (error) {
          console.error('Error generating metric image', error);
          throw Error('Failed to generate metric image');
        }
      },
    },
  },
});
