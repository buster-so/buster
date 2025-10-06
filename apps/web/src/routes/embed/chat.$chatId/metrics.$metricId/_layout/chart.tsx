import { createFileRoute } from '@tanstack/react-router';
import * as metricChartServerAssetContext from '@/context/BusterAssets/metric-server/metricChartServerAssetContext';

export const Route = createFileRoute('/embed/chat/$chatId/metrics/$metricId/_layout/chart')({
  ...metricChartServerAssetContext,
});
