import { createFileRoute } from '@tanstack/react-router';
import * as metricChartServerAssetContext from '@/context/BusterAssets/metric-server/metricChartServerAssetContext';

export const Route = createFileRoute('/embed/chats/$chatId/metrics/$metricId/_layout/chart')({
  ...metricChartServerAssetContext,
});
