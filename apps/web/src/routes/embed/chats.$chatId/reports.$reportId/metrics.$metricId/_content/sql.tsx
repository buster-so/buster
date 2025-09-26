import { createFileRoute } from '@tanstack/react-router';
import * as metricSQLServerAsssetContext from '@/context/BusterAssets/metric-server/metricSQLServerAsssetContext';

export const Route = createFileRoute(
  '/embed/chats/$chatId/reports/$reportId/metrics/$metricId/_content/sql'
)({
  ...metricSQLServerAsssetContext,
});
