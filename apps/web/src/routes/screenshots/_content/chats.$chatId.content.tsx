import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetChat } from '@/api/buster_rest/chats';
import * as chatLayoutServerContext from '@/context/BusterAssets/chat-server/chatLayoutServer';
import { ChatLayout } from '@/layouts/ChatLayout';
import { DEFAULT_CHAT_ONLY_LAYOUT } from '@/layouts/ChatLayout/config';
import { GetChatScreenshotQuerySchema } from '../chats.$chatId';

export const Route = createFileRoute('/screenshots/_content/chats/$chatId/content')({
  ...chatLayoutServerContext,
  validateSearch: GetChatScreenshotQuerySchema,
  ssr: true,
  beforeLoad: async ({ context, params }) => {
    const chat = await prefetchGetChat({ id: params.chatId }, context.queryClient);
    if (!chat) {
      throw new Error('Chat not found');
    }
  },
  component: () => {
    return (
      <ChatLayout
        initialLayout={DEFAULT_CHAT_ONLY_LAYOUT}
        autoSaveId={'chat-screenshot'}
        defaultLayout={DEFAULT_CHAT_ONLY_LAYOUT}
        selectedLayout={'chat-only'}
        alignTitleToCenter
      >
        {null}
      </ChatLayout>
    );
  },
});
