import { createFileRoute } from '@tanstack/react-router';
import * as dashboardLayoutServerAssetContext from '@/context/BusterAssets/dashboard-server/dashboardLayoutServerAssetContext';

export const Route = createFileRoute('/embed/chats/$chatId/dashboards/$dashboardId/_layout')({
  ...dashboardLayoutServerAssetContext,
});
