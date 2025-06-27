import React from 'react';
import { AppPageLayout } from '@/components/ui/layouts';
import { ChatContent } from './ChatContent';
import { ChatHeader } from './ChatHeader';

export const ChatContainer = React.memo(({ mounted }: { mounted?: boolean }) => {
  return (
    <AppPageLayout
      headerSizeVariant="default"
      header={<ChatHeader />}
      headerBorderVariant="ghost"
      scrollable
      className="chat-container-content flex h-full w-full min-w-[295px] flex-col">
      <ChatContent />
    </AppPageLayout>
  );
});

ChatContainer.displayName = 'ChatContainer';
