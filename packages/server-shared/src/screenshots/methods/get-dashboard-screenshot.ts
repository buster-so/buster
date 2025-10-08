import { z } from 'zod';
import { BrowserParamsContextSchema, browserLogin } from './browser-login';
import { createHrefFromLink } from './create-href-from-link';
import { DEFAULT_SCREENSHOT_CONFIG } from './screenshot-config';

export const GetDashboardScreenshotHandlerArgsSchema = z
  .object({
    dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
    width: z.number().default(DEFAULT_SCREENSHOT_CONFIG.width).optional(),
    height: z.number().default(DEFAULT_SCREENSHOT_CONFIG.height).optional(),
    version_number: z.number().optional(),
    type: z.enum(['png', 'jpeg']).default(DEFAULT_SCREENSHOT_CONFIG.type).optional(),
  })
  .extend(BrowserParamsContextSchema.shape);

export type GetDashboardScreenshotHandlerArgs = z.infer<
  typeof GetDashboardScreenshotHandlerArgsSchema
>;

export const getDashboardScreenshot = async (args: GetDashboardScreenshotHandlerArgs) => {
  const { type = DEFAULT_SCREENSHOT_CONFIG.type } = args;

  const { result: screenshotBuffer } = await browserLogin({
    ...args,
    fullPath: createHrefFromLink({
      to: '/screenshots/dashboards/$dashboardId/content' as const,
      params: { dashboardId: args.dashboardId },
      search: {
        version_number: args.version_number,
      },
    }),
    callback: async ({ page }) => {
      const screenshotBuffer = await page.screenshot({ type });
      return screenshotBuffer;
    },
  });

  return screenshotBuffer;
};
