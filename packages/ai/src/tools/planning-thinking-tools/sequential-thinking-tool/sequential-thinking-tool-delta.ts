import { updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import {
  normalizeEscapedText,
  unescapeJsonString,
} from '../../../utils/streaming/escape-normalizer';
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../utils/streaming/optimistic-json-parser';
import {
  createSequentialThinkingRawLlmMessageEntry,
  createSequentialThinkingReasoningMessage,
} from './helpers/sequential-thinking-tool-transform-helper';
import type {
  SequentialThinkingContext,
  SequentialThinkingInput,
  SequentialThinkingState,
} from './sequential-thinking-tool';

// Type-safe key extraction from the schema - will cause compile error if field names change
const THOUGHT_KEY = 'thought' as const satisfies keyof SequentialThinkingInput;
const NEXT_THOUGHT_NEEDED_KEY =
  'nextThoughtNeeded' as const satisfies keyof SequentialThinkingInput;
const THOUGHT_NUMBER_KEY = 'thoughtNumber' as const satisfies keyof SequentialThinkingInput;

export function createSequentialThinkingDelta(
  sequentialThinkingState: SequentialThinkingState,
  context: SequentialThinkingContext
) {
  return async function sequentialThinkingDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Skip delta updates if already complete
    if (sequentialThinkingState.isComplete) {
      return;
    }

    // Accumulate the delta to the args
    sequentialThinkingState.args = (sequentialThinkingState.args || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(sequentialThinkingState.args);

    // Extract values from the optimistically parsed values
    const thought = getOptimisticValue<string>(parseResult.extractedValues, THOUGHT_KEY);
    const nextThoughtNeeded = getOptimisticValue<boolean>(
      parseResult.extractedValues,
      NEXT_THOUGHT_NEEDED_KEY
    );
    const thoughtNumber = getOptimisticValue<number>(
      parseResult.extractedValues,
      THOUGHT_NUMBER_KEY
    );

    // Track if state changed to avoid unnecessary database updates
    let stateChanged = false;

    if (thought !== undefined && thought !== '') {
      // First unescape JSON string sequences, then normalize any double-escaped characters
      const unescapedThought = unescapeJsonString(thought);
      const normalizedThought = normalizeEscapedText(unescapedThought);
      if (sequentialThinkingState.thought !== normalizedThought) {
        sequentialThinkingState.thought = normalizedThought;
        stateChanged = true;
      }
    }

    if (
      nextThoughtNeeded !== undefined &&
      sequentialThinkingState.nextThoughtNeeded !== nextThoughtNeeded
    ) {
      sequentialThinkingState.nextThoughtNeeded = nextThoughtNeeded;
      stateChanged = true;
    }

    if (thoughtNumber !== undefined && sequentialThinkingState.thoughtNumber !== thoughtNumber) {
      sequentialThinkingState.thoughtNumber = thoughtNumber;
      stateChanged = true;
    }

    // Only update database if state actually changed
    if (stateChanged && context.messageId) {
      // Create the updated entries with the current state
      const reasoningEntry = createSequentialThinkingReasoningMessage(
        sequentialThinkingState,
        options.toolCallId
      );
      const rawLlmMessage = createSequentialThinkingRawLlmMessageEntry(
        sequentialThinkingState,
        options.toolCallId
      );

      try {
        const reasoningMessages = reasoningEntry ? [reasoningEntry] : [];
        const rawLlmMessages = rawLlmMessage ? [rawLlmMessage] : [];

        if (reasoningMessages.length > 0 || rawLlmMessages.length > 0) {
          await updateMessageEntries({
            messageId: context.messageId,
            reasoningMessages,
            rawLlmMessages,
          });
        }
      } catch (error) {
        console.error('[sequential-thinking] Failed to update reasoning entry on delta:', error);
      }
    }
  };
}
