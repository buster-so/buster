import { createFileRoute } from '@tanstack/react-router';
import * as chatLayoutServerContext from '@/context/BusterAssets/chat-server/chatLayoutServer';

export const Route = createFileRoute('/embed/chat/$chatId')({
  ...chatLayoutServerContext,
  ssr: false,
  component: () => {
    return <div>Hello "/embed/chat/$chatId"!</div>;
  },
});
