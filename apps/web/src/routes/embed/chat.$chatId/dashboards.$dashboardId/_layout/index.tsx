import { createFileRoute } from '@tanstack/react-router';
import * as dashboardContentServerContext from '@/context/BusterAssets/dashboard-server/dashboardContentContext';

export const Route = createFileRoute('/embed/chat/$chatId/dashboards/$dashboardId/_layout/')({
  ...dashboardContentServerContext,
});
