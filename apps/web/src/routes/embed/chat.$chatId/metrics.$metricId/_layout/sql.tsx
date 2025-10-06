import { createFileRoute } from '@tanstack/react-router';
import * as metricSQLServerAsssetContext from '@/context/BusterAssets/metric-server/metricSQLServerAsssetContext';

export const Route = createFileRoute('/embed/chat/$chatId/metrics/$metricId/_layout/sql')({
  ...metricSQLServerAsssetContext,
});
