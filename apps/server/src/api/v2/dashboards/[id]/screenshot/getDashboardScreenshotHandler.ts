import type {
  GetDashboardScreenshotParams,
  GetDashboardScreenshotQuery,
} from '@buster/server-shared/screenshots';
import type { Context } from 'hono';
import { createHrefFromLink } from '../../../../../shared-helpers/create-href-from-link';

export const getDashboardScreenshotHandler = async ({
  params,
  search,
  context,
}: {
  params: GetDashboardScreenshotParams;
  search: GetDashboardScreenshotQuery;
  context: Context;
}) => {
  const { width, height, type } = search;
  const { id: dashboardId } = params;

  const { browserLogin } = await import('../../../../../shared-helpers/browser-login');

  const { result: screenshotBuffer } = await browserLogin({
    width,
    height,
    fullPath: createHrefFromLink({
      to: '/screenshots/dashboards/$dashboardId/content' as const,
      params: { dashboardId },
      search: { type, width, height },
    }),
    context,
    callback: async ({ page }) => {
      return await page.screenshot({ type });
    },
  });

  return screenshotBuffer;
};
