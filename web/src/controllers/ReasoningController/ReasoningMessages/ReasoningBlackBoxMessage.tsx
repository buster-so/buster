'use client';
import React from 'react';
import { BarContainer } from './BarContainer';

export const BlackBoxMessage: React.FC<{
  blackBoxMessage: string | undefined | null;
  finalReasoningMessage: string | undefined | null;
  isCompletedStream: boolean;
}> = React.memo(({ blackBoxMessage, finalReasoningMessage, isCompletedStream }) => {
  if (blackBoxMessage || finalReasoningMessage) {
    return (
      <BarContainer
        showBar={false}
        status={finalReasoningMessage ? 'completed' : 'loading'}
        isCompletedStream={isCompletedStream}
        title={finalReasoningMessage ?? blackBoxMessage ?? 'Thinking...'}
        secondaryTitle={''}
      />
    );
  }

  return null;
});

BlackBoxMessage.displayName = 'BlackBoxMessage';
