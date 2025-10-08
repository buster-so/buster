import type {
  GetMetricScreenshotParams,
  GetMetricScreenshotQuery,
} from '@buster/server-shared/screenshots';
import type { BrowserParamsContextOrDirectRequest } from '@shared-helpers/browser-login';
import { createHrefFromLink } from '@shared-helpers/create-href-from-link';

type GetMetricScreenshotHandlerArgs = {
  params: GetMetricScreenshotParams;
  search: GetMetricScreenshotQuery;
} & BrowserParamsContextOrDirectRequest;

export const getMetricScreenshotHandler = async (args: GetMetricScreenshotHandlerArgs) => {
  const { params, search } = args;
  const { width, height, type, version_number } = search;
  const { id: metricId } = params;

  const { browserLogin } = await import('../../../../../shared-helpers/browser-login');

  const { result: screenshotBuffer } = await browserLogin({
    ...args,
    width,
    height,
    fullPath: createHrefFromLink({
      to: '/screenshots/metrics/$metricId/content' as const,
      params: { metricId },
      search: { version_number, type, width, height },
    }),
    callback: async ({ page }) => {
      return await page.screenshot({ type });
    },
  });

  return screenshotBuffer;
};
