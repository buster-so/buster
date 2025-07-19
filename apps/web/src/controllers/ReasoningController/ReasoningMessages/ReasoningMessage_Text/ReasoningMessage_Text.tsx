import React from 'react';
import type { BusterChatMessageReasoning_text } from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import AppMarkdownStreaming from '@/components/ui/typography/AppMarkdownStreaming/AppMarkdownStreaming';
import type { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { cn } from '@/lib/classMerge';

export const ReasoningMessage_Text: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessageId, messageId, isCompletedStream }) => {
    const { data: message } = useGetChatMessage(messageId, {
      select: (x) =>
        (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)?.message
    });

    if (!message) return null;

    return (
      <div className={cn("text-text-secondary text-xs!")}>
        <AppMarkdownStreaming
          content={message}
          isStreamFinished={isCompletedStream}
        />
      </div>
    );
  }
);

ReasoningMessage_Text.displayName = 'ReasoningMessage_Text';
