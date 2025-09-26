import { createFileRoute } from '@tanstack/react-router';
import * as reportLayoutServerAssetContext from '@/context/BusterAssets/report-server/reportLayoutServerAssetContext';

export const Route = createFileRoute('/embed/chats/$chatId/reports/$reportId/_layout')({
  ...reportLayoutServerAssetContext,
});
