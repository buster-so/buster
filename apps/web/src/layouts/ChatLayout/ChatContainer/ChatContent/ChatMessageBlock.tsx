'use client';

import React from 'react';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { ChatResponseMessages } from './ChatResponseMessages';
import { ChatUserMessage } from './ChatUserMessage';

export const ChatMessageBlock: React.FC<{
  messageId: string;
  chatId: string;
  messageIndex: number;
}> = React.memo(({ messageId, chatId, messageIndex }) => {
  const { data: messageExists } = useGetChatMessage(messageId, {
    select: (message) => !!message?.id
  });
  const { data: requestMessage } = useGetChatMessage(messageId, {
    select: (message) => message?.request_message
  });
  const { data: isCompletedStream = false } = useGetChatMessage(messageId, {
    select: (x) => x?.is_completed
  });

  if (!messageExists) return null;

  return (
    <div className={'flex flex-col space-y-3.5 py-2 pr-3 pl-4'} id={messageId}>
      {requestMessage && (
        <ChatUserMessage
          isCompletedStream={isCompletedStream}
          chatId={chatId}
          messageId={messageId}
          requestMessage={requestMessage}
        />
      )}
      <ChatResponseMessages
        isCompletedStream={isCompletedStream}
        messageId={messageId}
        chatId={chatId}
        messageIndex={messageIndex}
      />
    </div>
  );
});

ChatMessageBlock.displayName = 'ChatMessageBlock';
