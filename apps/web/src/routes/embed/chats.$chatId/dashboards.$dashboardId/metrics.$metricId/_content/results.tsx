import { createFileRoute } from '@tanstack/react-router';
import * as metricResultsServerAssetContext from '@/context/BusterAssets/metric-server/metricResultsServerAssetContext';

export const Route = createFileRoute(
  '/embed/chats/$chatId/dashboards/$dashboardId/metrics/$metricId/_content/results'
)({
  ...metricResultsServerAssetContext,
});
