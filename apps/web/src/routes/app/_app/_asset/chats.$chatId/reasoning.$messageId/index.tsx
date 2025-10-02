import { createFileRoute } from '@tanstack/react-router';
import * as reportContent from '@/context/BusterAssets/reasoning-server/reasoningContent';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId/reasoning/$messageId/')({
  ...reportContent,
});
