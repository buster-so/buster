import { BusterRoutes } from '@/routes/busterRoutes';
import type { FileView } from '../useLayoutConfig';

const routeToFileView: Partial<Record<BusterRoutes, FileView>> = {
  [BusterRoutes.APP_METRIC_ID_CHART]: 'chart',
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART]: 'chart',
  [BusterRoutes.APP_METRIC_ID_RESULTS]: 'results',
  [BusterRoutes.APP_METRIC_ID_FILE__HIDDEN]: 'file',
  [BusterRoutes.APP_METRIC_ID_SQL]: 'sql',
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_SQL]: 'sql',
  [BusterRoutes.APP_CHAT_ID_METRIC_ID]: 'file',
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_FILE]: 'file',
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS]: 'results',
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID]: 'dashboard',
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_FILE]: 'file',
  [BusterRoutes.APP_DASHBOARD_ID]: 'dashboard',
  [BusterRoutes.APP_DASHBOARD_ID_FILE]: 'file'
};

export const getFileViewFromRoute = (route: BusterRoutes): FileView | undefined => {
  const routeFileView = routeToFileView[route];

  if (!routeFileView) {
    console.warn(`No file view found for route: ${route}`);
  }

  return routeFileView;
};
