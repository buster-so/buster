import { createFileRoute } from '@tanstack/react-router';
import * as metricLayoutServerContext from '@/context/BusterAssets/metric-server/metricLayoutServerAssetContext';

export const Route = createFileRoute(
  '/embed/chat/$chatId/dashboards/$dashboardId/metrics/$metricId/_content'
)({
  ...metricLayoutServerContext,
  loader: metricLayoutServerContext.loader<{ metricId: string; dashboardId: string }>,
});
