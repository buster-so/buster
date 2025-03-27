import { type BusterChatMessageReasoning_pillContainer } from '@/api/asset_interfaces/chat';
import React from 'react';
import { Text } from '@/components/ui/typography';
import { ReasoningMessagePills } from './ReasoningMessagePills';

export const ReasoningMessagePillContainer: React.FC<{
  pillContainer: BusterChatMessageReasoning_pillContainer;
  isCompletedStream: boolean;
}> = React.memo(({ pillContainer, isCompletedStream }) => {
  return (
    <div className="flex flex-col space-y-1">
      <Text size="xs" variant="tertiary">
        {pillContainer.title}
      </Text>
      <ReasoningMessagePills pills={pillContainer.pills} isCompletedStream={isCompletedStream} />
    </div>
  );
});

ReasoningMessagePillContainer.displayName = 'ReasoningMessage_PillContainer';
