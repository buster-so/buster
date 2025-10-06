import { createFileRoute } from '@tanstack/react-router';
import * as reportLayoutServerAssetContext from '@/context/BusterAssets/report-server/reportLayoutServerAssetContext';

export const Route = createFileRoute('/embed/chat/$chatId/reports/$reportId/_layout')({
  ...reportLayoutServerAssetContext,
});
