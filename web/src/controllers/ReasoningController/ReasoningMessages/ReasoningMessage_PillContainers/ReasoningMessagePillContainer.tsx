import React from 'react';
import type { BusterChatMessageReasoning_pillContainer } from '@/api/asset_interfaces/chat';
import { Text } from '@/components/ui/typography';
import { ReasoningMessagePills } from './ReasoningMessagePills';

export const ReasoningMessagePillContainer: React.FC<{
  pillContainer: BusterChatMessageReasoning_pillContainer;
  isCompletedStream: boolean;
  chatId: string;
}> = React.memo(({ pillContainer, isCompletedStream, chatId }) => {
  return (
    <div className="flex flex-col space-y-1">
      <Text size="xs" variant="tertiary">
        {pillContainer.title}
      </Text>
      <ReasoningMessagePills
        chatId={chatId}
        pills={pillContainer.pills}
        isCompletedStream={isCompletedStream}
      />
    </div>
  );
});

ReasoningMessagePillContainer.displayName = 'ReasoningMessage_PillContainer';
