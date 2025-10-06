import { createFileRoute } from '@tanstack/react-router';
import * as reportIndexServerAssetContext from '@/context/BusterAssets/report-server/reportContentServerAssetContext';

export const Route = createFileRoute('/embed/chat/$chatId/reports/$reportId/_layout/')({
  ...reportIndexServerAssetContext,
});
