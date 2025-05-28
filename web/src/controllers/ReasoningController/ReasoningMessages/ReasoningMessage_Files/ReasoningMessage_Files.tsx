import type {
  BusterChatMessage,
  BusterChatMessageReasoning_files
} from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import React from 'react';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { ReasoningMessage_File } from './ReasoningMessageFile';

const getReasoningMessage = (x: BusterChatMessage | undefined, reasoningMessageId: string) =>
  x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_files;

export const ReasoningMessage_Files: React.FC<ReasoningMessageProps> = React.memo(
  ({ isCompletedStream, chatId, reasoningMessageId, messageId }) => {
    const { data: file_ids } = useGetChatMessage(messageId, {
      select: (x) => getReasoningMessage(x, reasoningMessageId)?.file_ids
    });

    if (!file_ids || file_ids.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        {file_ids.map((fileId) => (
          <ReasoningMessage_File
            key={fileId}
            fileId={fileId}
            chatId={chatId}
            messageId={messageId}
            reasoningMessageId={reasoningMessageId}
            isCompletedStream={isCompletedStream}
          />
        ))}
      </div>
    );
  }
);

ReasoningMessage_Files.displayName = 'ReasoningMessage_Files';
