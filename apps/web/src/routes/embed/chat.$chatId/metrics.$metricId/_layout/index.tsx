import { createFileRoute } from '@tanstack/react-router';
import * as metricIndexServerContext from '@/context/BusterAssets/metric-server/metricIndexServerAssetContext';

export const Route = createFileRoute('/embed/chat/$chatId/metrics/$metricId/_layout/')({
  ...metricIndexServerContext,
});
