import { createFileRoute } from '@tanstack/react-router';
import * as metricLayoutServerContext from '@/context/BusterAssets/metric-server/metricLayoutServerAssetContext';

export const Route = createFileRoute('/embed/chat/$chatId/metrics/$metricId/_layout')({
  ...metricLayoutServerContext,
  loader: metricLayoutServerContext.loader<{ metricId: string }>,
});
