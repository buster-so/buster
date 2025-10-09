import { z } from 'zod';
import { BrowserParamsContextSchema, browserLogin } from './browser-login';
import { createHrefFromLink } from './create-href-from-link';
import { takeScreenshot } from './take-screenshot';

export const GetMetricScreenshotHandlerArgsSchema = z
  .object({
    metricId: z.string().uuid('Metric ID must be a valid UUID'),
    version_number: z.number().optional(),
  })
  .extend(BrowserParamsContextSchema.shape);

export type GetMetricScreenshotHandlerArgs = z.infer<typeof GetMetricScreenshotHandlerArgsSchema>;

export const getMetricScreenshot = async (
  args: GetMetricScreenshotHandlerArgs
): Promise<Buffer<ArrayBufferLike>> => {
  const { result: screenshotBuffer } = await browserLogin({
    ...args,
    fullPath: createHrefFromLink({
      to: '/screenshots/metrics/$metricId/content' as const,
      params: { metricId: args.metricId },
      search: {
        version_number: args.version_number,
      },
    }),
    callback: takeScreenshot,
  });

  return screenshotBuffer;
};
