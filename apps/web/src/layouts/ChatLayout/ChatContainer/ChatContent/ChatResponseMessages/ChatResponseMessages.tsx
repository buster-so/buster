import React from 'react';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { ChatMessageOptions } from '../ChatMessageOptions';
import { MessageContainer } from '../MessageContainer';
import { ChatResponseMessageSelector } from './ChatResponseMessageSelector';
import { ChatResponseReasoning } from './ChatResponseReasoning';

interface ChatResponseMessagesProps {
  isCompletedStream: boolean;
  messageId: string;
  chatId: string;
  messageIndex: number;
}

export const ChatResponseMessages: React.FC<ChatResponseMessagesProps> = React.memo(
  ({ chatId, isCompletedStream, messageId, messageIndex }) => {
    const { data: responseMessageIds } = useGetChatMessage(messageId, {
      select: (x) => x?.response_message_ids || []
    });
    const { data: lastReasoningMessageId } = useGetChatMessage(messageId, {
      select: (x) => x?.reasoning_message_ids?.[x.reasoning_message_ids.length - 1]
    });
    const { data: finalReasoningMessage } = useGetChatMessage(messageId, {
      select: (x) => x?.final_reasoning_message
    });
    const showReasoningMessage =
      messageIndex === 0 ? !!lastReasoningMessageId || !isCompletedStream : true;
    const hideAvatar = !lastReasoningMessageId;

    return (
      <MessageContainer
        className="group flex w-full flex-col space-y-3 overflow-hidden"
        hideAvatar={hideAvatar}>
        {showReasoningMessage && (
          <ChatResponseReasoning
            reasoningMessageId={lastReasoningMessageId}
            finalReasoningMessage={finalReasoningMessage}
            isCompletedStream={isCompletedStream}
            messageId={messageId}
            chatId={chatId}
          />
        )}

        {responseMessageIds?.map((responseMessageId, index) => (
          <React.Fragment key={responseMessageId}>
            <ChatResponseMessageSelector
              responseMessageId={responseMessageId}
              messageId={messageId}
              isCompletedStream={isCompletedStream}
              chatId={chatId}
            />
          </React.Fragment>
        ))}

        {isCompletedStream && <ChatMessageOptions messageId={messageId} chatId={chatId} />}
      </MessageContainer>
    );
  }
);

ChatResponseMessages.displayName = 'ChatResponseMessages';
