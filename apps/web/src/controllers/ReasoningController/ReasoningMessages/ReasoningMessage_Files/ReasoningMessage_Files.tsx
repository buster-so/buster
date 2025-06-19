import React from 'react';
import type {
  BusterChatMessage,
  BusterChatMessageReasoning_files
} from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { ReasoningMessage_File } from './ReasoningMessageFile';

const getReasoningMessage = (x: BusterChatMessage | undefined, reasoningMessageId: string) =>
  x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_files | undefined;

export const ReasoningMessage_Files: React.FC<ReasoningMessageProps> = React.memo(
  ({ isCompletedStream, chatId, reasoningMessageId, messageId }) => {
    const { data: file_ids } = useGetChatMessage(messageId, {
      select: (x) => {
        const reasoningMessage = getReasoningMessage(x, reasoningMessageId);
        const file_ids = reasoningMessage?.file_ids || [];
        return file_ids;
      }
    });

    if (!file_ids || file_ids.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        {file_ids.map((fileId, fileIndex) => (
          <ReasoningMessage_File
            key={fileIndex}
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
