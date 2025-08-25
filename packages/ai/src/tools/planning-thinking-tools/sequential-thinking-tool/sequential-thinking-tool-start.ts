import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { createSequentialThinkingReasoningMessage } from './helpers/sequential-thinking-tool-transform-helper';
import type {
  SequentialThinkingContext,
  SequentialThinkingState,
} from './sequential-thinking-tool';

// Factory function that creates a type-safe callback for the specific agent context
export function createSequentialThinkingStart(
  sequentialThinkingState: SequentialThinkingState,
  context: SequentialThinkingContext
) {
  return async function sequentialThinkingStart(options: ToolCallOptions): Promise<void> {
    // Reset state for new tool call to prevent contamination from previous calls
    sequentialThinkingState.toolCallId = options.toolCallId;
    sequentialThinkingState.startTime = Date.now();
    sequentialThinkingState.args = undefined;
    sequentialThinkingState.thought = undefined;
    sequentialThinkingState.nextThoughtNeeded = undefined;
    sequentialThinkingState.thoughtNumber = undefined;

    // Create initial reasoning entry with loading status
    const reasoningEntry = createSequentialThinkingReasoningMessage(
      sequentialThinkingState,
      options.toolCallId
    );

    try {
      if (context.messageId) {
        const reasoningMessages = reasoningEntry ? [reasoningEntry] : [];

        if (reasoningMessages.length > 0) {
          await updateMessageEntries({
            messageId: context.messageId,
            reasoningMessages,
          });

          console.info('[sequential-thinking] Started sequential thinking:', {
            messageId: context.messageId,
            toolCallId: options.toolCallId,
          });
        }
      }
    } catch (error) {
      console.error('[sequential-thinking] Failed to update reasoning entry on start:', error);
    }
  };
}
