import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { normalizeEscapedText } from '../../../utils/streaming/escape-normalizer';
import { createSequentialThinkingReasoningMessage } from './helpers/sequential-thinking-tool-transform-helper';
import type {
  SequentialThinkingContext,
  SequentialThinkingInput,
  SequentialThinkingState,
} from './sequential-thinking-tool';

export function createSequentialThinkingFinish(
  sequentialThinkingState: SequentialThinkingState,
  context: SequentialThinkingContext
) {
  return async function sequentialThinkingFinish(
    options: { input: SequentialThinkingInput } & ToolCallOptions
  ): Promise<void> {
    // Update state with the final input values
    sequentialThinkingState.toolCallId = options.toolCallId;
    sequentialThinkingState.thought = normalizeEscapedText(options.input.thought);
    sequentialThinkingState.nextThoughtNeeded = options.input.nextThoughtNeeded;
    sequentialThinkingState.thoughtNumber = options.input.thoughtNumber;

    // Create final reasoning entry with completed status
    const reasoningEntry = createSequentialThinkingReasoningMessage(
      sequentialThinkingState,
      options.toolCallId,
      'completed' // Mark as completed when finish is called
    );

    try {
      if (context.messageId) {
        const reasoningMessages = reasoningEntry ? [reasoningEntry] : [];

        if (reasoningMessages.length > 0) {
          await updateMessageEntries({
            messageId: context.messageId,
            reasoningMessages,
          });

          console.info('[sequential-thinking] Completed sequential thinking:', {
            messageId: context.messageId,
            toolCallId: options.toolCallId,
            thoughtNumber: options.input.thoughtNumber,
            nextThoughtNeeded: options.input.nextThoughtNeeded,
          });
        }
      }
    } catch (error) {
      console.error('[sequential-thinking] Failed to update reasoning entry on finish:', error);
    }
  };
}
