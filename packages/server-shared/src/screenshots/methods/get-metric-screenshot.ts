import { z } from 'zod';
import { BrowserParamsContextSchema, browserLogin } from './browser-login';
import { createHrefFromLink } from './create-href-from-link';
import { DEFAULT_SCREENSHOT_CONFIG } from './screenshot-config';

export const GetMetricScreenshotHandlerArgsSchema = z
  .object({
    metricId: z.string().uuid('Metric ID must be a valid UUID'),
    width: z.number().default(DEFAULT_SCREENSHOT_CONFIG.width).optional(),
    height: z.number().default(DEFAULT_SCREENSHOT_CONFIG.height).optional(),
    version_number: z.number().optional(),
    type: z.enum(['png', 'jpeg']).default(DEFAULT_SCREENSHOT_CONFIG.type).optional(),
  })
  .extend(BrowserParamsContextSchema.shape);

export type GetMetricScreenshotHandlerArgs = z.infer<typeof GetMetricScreenshotHandlerArgsSchema>;

export const getMetricScreenshot = async (
  args: GetMetricScreenshotHandlerArgs
): Promise<Buffer<ArrayBufferLike>> => {
  const { type = DEFAULT_SCREENSHOT_CONFIG.type } = args;

  const { result: screenshotBuffer } = await browserLogin({
    ...args,
    fullPath: createHrefFromLink({
      to: '/screenshots/metrics/$metricId/content' as const,
      params: { metricId: args.metricId },
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
