import React from 'react';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { ChatContent } from './ChatContent';
import { ChatHeader } from './ChatHeader';

export const CHAT_CONTAINER_ID = 'chat-container-content';

export const ChatContainer = React.memo(
  ({ chatId, isEmbed }: { chatId: string | undefined; isEmbed: boolean }) => {
    return (
      <AppPageLayout
        headerSizeVariant="default"
        header={<ChatHeader isEmbed={isEmbed} />}
        headerBorderVariant="ghost"
        headerClassName="bg-page-background"
        mainClassName="bg-page-background"
        scrollable
        id={CHAT_CONTAINER_ID}
        className="flex h-full w-full min-w-[295px] flex-col"
      >
        <ChatContent chatId={chatId} isEmbed={isEmbed} />
      </AppPageLayout>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
