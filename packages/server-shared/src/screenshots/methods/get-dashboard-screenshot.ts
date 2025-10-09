import { z } from 'zod';
import { BrowserParamsContextSchema, browserLogin } from './browser-login';
import { createHrefFromLink } from './create-href-from-link';
import { DEFAULT_SCREENSHOT_CONFIG } from './screenshot-config';
import { takeScreenshot } from './take-screenshot';

export const GetDashboardScreenshotHandlerArgsSchema = z
  .object({
    dashboardId: z.string().uuid('Dashboard ID must be a valid UUID'),
    version_number: z.number().optional(),
  })
  .extend(BrowserParamsContextSchema.shape);

export type GetDashboardScreenshotHandlerArgs = z.infer<
  typeof GetDashboardScreenshotHandlerArgsSchema
>;

export const getDashboardScreenshot = async (args: GetDashboardScreenshotHandlerArgs) => {
  const { result: screenshotBuffer } = await browserLogin({
    ...args,
    fullPath: createHrefFromLink({
      to: '/screenshots/dashboards/$dashboardId/content' as const,
      params: { dashboardId: args.dashboardId },
      search: {
        version_number: args.version_number,
      },
    }),
    callback: takeScreenshot,
  });

  return screenshotBuffer;
};
