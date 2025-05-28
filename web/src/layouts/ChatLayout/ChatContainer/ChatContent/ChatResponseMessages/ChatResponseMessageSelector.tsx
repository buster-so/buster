import type { BusterChatMessageResponse } from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import React from 'react';
import { ChatResponseMessage_File } from './ChatResponseMessage_File';
import { ChatResponseMessage_Text } from './ChatResponseMessage_Text';

const ChatResponseMessageRecord: Record<
  BusterChatMessageResponse['type'],
  React.FC<ChatResponseMessageProps>
> = {
  text: ChatResponseMessage_Text,
  file: ChatResponseMessage_File
};

export interface ChatResponseMessageProps {
  isCompletedStream: boolean;
  messageId: string;
  responseMessageId: string;
  chatId: string;
}

export interface ChatResponseMessageSelectorProps {
  responseMessageId: string;
  isCompletedStream: boolean;
  messageId: string;
  chatId: string;
}

export const ChatResponseMessageSelector: React.FC<ChatResponseMessageSelectorProps> = React.memo(
  ({ responseMessageId, messageId, chatId, isCompletedStream }) => {
    const { data: messageType } = useGetChatMessage(messageId, {
      select: (x) => x?.response_messages?.[responseMessageId]?.type || 'text'
    });
    const ChatResponseMessage =
      ChatResponseMessageRecord[messageType as BusterChatMessageResponse['type']];

    return (
      <ChatResponseMessage
        isCompletedStream={isCompletedStream}
        responseMessageId={responseMessageId}
        messageId={messageId}
        chatId={chatId}
      />
    );
  }
);

ChatResponseMessageSelector.displayName = 'ChatResponseMessageSelector';
