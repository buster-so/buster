import React from 'react';
import { ChatHeaderOptions } from '@/components/features/chat/ChatHeaderOptions';
import { ChatHeaderTitle } from '@/components/features/chat/ChatHeaderTitle';
import { useGetActiveChatTitle, useIsStreamingMessage } from '@/context/Chats';
import { useGetChatId } from '@/context/Chats/useGetChatId';

export const ChatHeader: React.FC = React.memo(() => {
  const chatId = useGetChatId();
  const chatTitle = useGetActiveChatTitle();
  const isStreamingMessage = useIsStreamingMessage();

  return (
    <>
      <ChatHeaderTitle
        chatTitle={chatTitle || ''}
        chatId={chatId || ''}
        isStreamingMessage={isStreamingMessage}
      />
      <ChatHeaderOptions />
    </>
  );
});

ChatHeader.displayName = 'ChatContainerHeader';
