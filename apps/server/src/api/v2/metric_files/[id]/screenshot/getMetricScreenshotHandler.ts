import type { BrowserParamsContextOrDirectRequest } from '@shared-helpers/browser-login';
import { createHrefFromLink } from '@shared-helpers/create-href-from-link';
import { DEFAULT_SCREENSHOT_CONFIG } from '@shared-helpers/screenshot-config';

type GetMetricScreenshotHandlerArgs = {
  metricId: string;
  width: number;
  height: number;
  version_number: number | undefined;
  type?: 'png' | 'jpeg';
} & BrowserParamsContextOrDirectRequest;

export const getMetricScreenshotHandler = async (args: GetMetricScreenshotHandlerArgs) => {
  const { browserLogin } = await import('../../../../../shared-helpers/browser-login');
  const { width, height, type = DEFAULT_SCREENSHOT_CONFIG.type } = args;

  const { result: screenshotBuffer } = await browserLogin({
    ...args,
    fullPath: createHrefFromLink({
      to: '/screenshots/metrics/$metricId/content' as const,
      params: { metricId: args.metricId },
      search: {
        version_number: args.version_number,
        width,
        height,
      },
    }),
    callback: async ({ page }) => {
      return await page.screenshot({ type });
    },
  });

  return screenshotBuffer;
};
