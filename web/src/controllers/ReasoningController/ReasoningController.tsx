'use client';

import React from 'react';
import { useGetChat, useGetChatMessage } from '@/api/buster_rest/chats';
import { ReasoningMessageSelector } from './ReasoningMessages';
import { BlackBoxMessage } from './ReasoningMessages/ReasoningBlackBoxMessage';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';

interface ReasoningControllerProps {
  chatId: string;
  messageId: string;
}

export const ReasoningController: React.FC<ReasoningControllerProps> = ({ chatId, messageId }) => {
  const { data: hasChat } = useGetChat({ id: chatId || '' }, (x) => !!x.id);

  const reasoningMessageIds = useGetChatMessage(messageId, (x) => x?.reasoning_message_ids);
  const isCompletedStream = useGetChatMessage(messageId, (x) => x?.isCompletedStream);

  if (!hasChat || !reasoningMessageIds) return <FileIndeterminateLoader />;

  return (
    <div className="h-full flex-col space-y-2 overflow-y-auto p-5">
      {reasoningMessageIds?.map((reasoningMessageId) => (
        <ReasoningMessageSelector
          key={reasoningMessageId}
          reasoningMessageId={reasoningMessageId}
          isCompletedStream={isCompletedStream ?? true}
          chatId={chatId}
          messageId={messageId}
        />
      ))}

      <BlackBoxMessage messageId={messageId} />
    </div>
  );
};
