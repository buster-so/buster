import { z } from 'zod';
import { BrowserParamsContextSchema, browserLogin } from './browser-login';
import { createHrefFromLink } from './create-href-from-link';
import { takeScreenshot } from './take-screenshot';

export const GetReportScreenshotHandlerArgsSchema = z
  .object({
    reportId: z.string().uuid('Report ID must be a valid UUID'),
    version_number: z.number().optional(),
  })
  .extend(BrowserParamsContextSchema.shape);

export type GetReportScreenshotHandlerArgs = z.infer<typeof GetReportScreenshotHandlerArgsSchema>;

export const getReportScreenshot = async (args: GetReportScreenshotHandlerArgs) => {
  const { result: screenshotBuffer } = await browserLogin({
    ...args,
    fullPath: createHrefFromLink({
      to: '/screenshots/reports/$reportId/content' as const,
      params: { reportId: args.reportId },
      search: {
        version_number: args.version_number,
      },
    }),
    callback: async (v) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return takeScreenshot(v);
    },
  });

  return screenshotBuffer;
};
