import { createFileRoute } from '@tanstack/react-router';
import * as reportContent from '@/context/BusterAssets/reasoning-server/reasoningContent';

export const Route = createFileRoute('/embed/chat/$chatId/reasoning/$messageId/')({
  ...reportContent,
});
