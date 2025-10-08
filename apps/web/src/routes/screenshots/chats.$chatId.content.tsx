import { GetChatScreenshotQuerySchema } from '@buster/server-shared/screenshots';
import { createFileRoute } from '@tanstack/react-router';
import { ensureChatData } from '@/api/buster_rest/chats';
import { ChatLayout } from '@/layouts/ChatLayout';
import { DEFAULT_CHAT_ONLY_LAYOUT } from '@/layouts/ChatLayout/config';

export const Route = createFileRoute('/screenshots/chats/$chatId/content')({
  validateSearch: GetChatScreenshotQuerySchema,
  ssr: true,
  loader: async ({ context, params }) => {
    await ensureChatData(context.queryClient, { id: params.chatId });
  },
  component: () => {
    return (
      <ChatLayout
        initialLayout={DEFAULT_CHAT_ONLY_LAYOUT}
        autoSaveId={'chat-screenshot'}
        defaultLayout={DEFAULT_CHAT_ONLY_LAYOUT}
        selectedLayout={'chat-only'}
        isScreenshotMode
      >
        {null}
      </ChatLayout>
    );
  },
});
