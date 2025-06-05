'use client';

import React from 'react';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { ChatHeaderOptions } from './ChatHeaderOptions';
import { ChatHeaderTitle } from './ChatHeaderTitle';

export const ChatHeader: React.FC = React.memo(() => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const chatTitle = useChatIndividualContextSelector((state) => state.chatTitle);
  const isCompletedStream = useChatIndividualContextSelector((state) => state.isStreamingMessage);

  if (!chatTitle) return null;

  return (
    <>
      <ChatHeaderTitle
        chatTitle={chatTitle || ''}
        chatId={chatId || ''}
        isCompletedStream={isCompletedStream}
      />
      <ChatHeaderOptions />
    </>
  );
});

ChatHeader.displayName = 'ChatContainerHeader';
