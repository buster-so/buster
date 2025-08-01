'use client';

import React from 'react';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { ChatHeaderOptions } from './ChatHeaderOptions';
import { ChatHeaderTitle } from './ChatHeaderTitle';

export const ChatHeader: React.FC = React.memo(() => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const chatTitle = useChatIndividualContextSelector((state) => state.chatTitle);
  const isStreamFinished = useChatIndividualContextSelector((state) => state.isStreamingMessage);

  return (
    <>
      <ChatHeaderTitle
        chatTitle={chatTitle || ''}
        chatId={chatId || ''}
        isStreamFinished={isStreamFinished}
      />
      <ChatHeaderOptions />
    </>
  );
});

ChatHeader.displayName = 'ChatContainerHeader';
