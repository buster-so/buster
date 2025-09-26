import { createFileRoute } from '@tanstack/react-router';
import * as reportIndexServerAssetContext from '@/context/BusterAssets/report-server/reportContentServerAssetContext';

export const Route = createFileRoute('/embed/chats/$chatId/reports/$reportId/_layout/')({
  ...reportIndexServerAssetContext,
});
