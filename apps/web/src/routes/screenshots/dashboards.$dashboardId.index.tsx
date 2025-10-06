import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { createScreenshotResponse } from '@/api/server-functions/screenshot-helpers';
import { createHrefFromLink } from '@/lib/routes';

export const GetDashboardScreenshotParamsSchema = z.object({
  dashboardId: z.string(),
});

export const GetDashboardScreenshotQuerySchema = z.object({
  version_number: z.coerce.number().min(1).optional(),
  width: z.coerce.number().min(100).max(3840).default(800),
  height: z.coerce.number().min(100).max(4160).default(450),
  type: z.enum(['png', 'jpeg']).default('png'),
});

export const Route = createFileRoute('/screenshots/dashboards/$dashboardId/')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { dashboardId } = GetDashboardScreenshotParamsSchema.parse(params);
        const { version_number, width, height, type } = GetDashboardScreenshotQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams)
        );

        try {
          const { browserLogin } = await import('@/api/server-functions/browser-login');
          const { result: screenshotBuffer } = await browserLogin({
            width,
            height,
            fullPath: createHrefFromLink({
              to: '/screenshots/dashboards/$dashboardId/content',
              params: { dashboardId },
              search: { version_number, type, width, height },
            }),
            request,
            callback: async ({ page }) => {
              const screenshotBuffer = await page.screenshot({ type });
              return screenshotBuffer;
            },
          });

          return createScreenshotResponse({ screenshotBuffer });
        } catch (error) {
          console.error('Error capturing dashboard screenshot', error);
          return new Response(
            JSON.stringify({
              message: 'Failed to capture screenshot',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      },
    },
  },
});

// export const ServerRoute = createServerFileRoute('/screenshots/dashboards/$dashboardId/').methods({
//   GET: async ({ request, params }) => {
//     const { dashboardId } = GetDashboardScreenshotParamsSchema.parse(params);
//     const { version_number, width, height, type } = GetDashboardScreenshotQuerySchema.parse(
//       Object.fromEntries(new URL(request.url).searchParams)
//     );

//     try {
//       const { result: screenshotBuffer } = await browserLogin({
//         width,
//         height,
//         fullPath: createHrefFromLink({
//           to: '/screenshots/dashboards/$dashboardId/content',
//           params: { dashboardId },
//           search: { version_number, type, width, height },
//         }),
//         request,
//         callback: async ({ page }) => {
//           const screenshotBuffer = await page.screenshot({ type });
//           return screenshotBuffer;
//         },
//       });

//       return createScreenshotResponse({ screenshotBuffer });
//     } catch (error) {
//       console.error('Error capturing dashboard screenshot', error);
//       return new Response(
//         JSON.stringify({
//           message: 'Failed to capture screenshot',
//         }),
//         { status: 500, headers: { 'Content-Type': 'application/json' } }
//       );
//     }
//   },
// });
