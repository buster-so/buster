import React from 'react';
import type { BusterChatMessageReasoning_text } from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { AppMarkdown } from '@/components/ui/typography/AppMarkdown';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';

export const ReasoningMessage_Text: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isCompletedStream }) => {
    const { data: message } = useGetChatMessage(messageId, {
      select: (x) =>
        (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)?.message
    });

    if (!message) return null;

    return (
      <AppMarkdown
        markdown={message}
        showLoader={!isCompletedStream}
        className="text-text-secondary text-xs!"
        stripFormatting
      />
    );
  }
);

ReasoningMessage_Text.displayName = 'ReasoningMessage_Text';
