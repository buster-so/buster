import { type UpdateMessageEntriesParams, updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { normalizeEscapedText } from '../../../utils/streaming/escape-normalizer';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
import {
  createSequentialThinkingRawLlmMessageEntry,
  createSequentialThinkingReasoningMessage,
} from './helpers/sequential-thinking-tool-transform-helper';
import {
  SEQUENTIAL_THINKING_TOOL_NAME,
  type SequentialThinkingContext,
  type SequentialThinkingInput,
  type SequentialThinkingOutput,
  type SequentialThinkingState,
} from './sequential-thinking-tool';

// Process sequential thinking execution
async function processSequentialThinking(
  state: SequentialThinkingState,
  context: SequentialThinkingContext
): Promise<SequentialThinkingOutput> {
  const output: SequentialThinkingOutput = {
    success: true,
  };

  const entries: UpdateMessageEntriesParams = {
    messageId: context.messageId,
    reasoningMessages: [],
    rawLlmMessages: [],
  };

  if (state.toolCallId) {
    const reasoningEntry = createSequentialThinkingReasoningMessage(
      state,
      state.toolCallId,
      'completed'
    );
    const rawLlmMessage = createSequentialThinkingRawLlmMessageEntry(state, state.toolCallId);

    const rawToolResultEntry = createRawToolResultEntry(
      state.toolCallId,
      SEQUENTIAL_THINKING_TOOL_NAME,
      output
    );

    if (reasoningEntry) {
      entries.reasoningMessages = [reasoningEntry];
    }

    // Always send both raw LLM messages together to maintain proper ordering
    // If rawLlmMessage is null (shouldn't happen since we checked toolCallId), send just the result
    if (rawLlmMessage) {
      entries.rawLlmMessages = [rawLlmMessage, rawToolResultEntry];
    } else {
      // This shouldn't happen, but as a fallback, at least send the result
      entries.rawLlmMessages = [rawToolResultEntry];
    }

    try {
      await updateMessageEntries(entries);
    } catch (error) {
      console.error('[sequential-thinking] Error updating message entries:', error);
    }

    return {
      success: true,
    };
  }

  return {
    success: false,
  };
}

// Factory function that creates the execute function with proper context typing
export function createSequentialThinkingExecute(
  state: SequentialThinkingState,
  context: SequentialThinkingContext
) {
  return wrapTraced(
    async (_input: SequentialThinkingInput): Promise<SequentialThinkingOutput> => {
      if (!state.toolCallId) {
        throw new Error('Tool call ID is required');
      }

      return await processSequentialThinking(state, context);
    },
    { name: SEQUENTIAL_THINKING_TOOL_NAME }
  );
}
