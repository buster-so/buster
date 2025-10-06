import { createFileRoute } from '@tanstack/react-router';
import * as metricChartServerAssetContext from '@/context/BusterAssets/metric-server/metricChartServerAssetContext';

export const Route = createFileRoute(
  '/embed/chat/$chatId/reports/$reportId/metrics/$metricId/_content/chart'
)({
  ...metricChartServerAssetContext,
});
