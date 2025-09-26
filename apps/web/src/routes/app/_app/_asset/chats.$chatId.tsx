import { createFileRoute } from '@tanstack/react-router';
import * as chatLayoutServerContext from '@/context/BusterAssets/chat-server/chatLayoutServer';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId')({
  ...chatLayoutServerContext,
});
