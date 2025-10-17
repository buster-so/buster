import type {
  ChatMessageReasoning_status,
  ChatMessageReasoningMessage_Text,
} from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import { formatElapsedTime } from '../../../shared/format-elapsed-time';
import type { SequentialThinkingState } from '../sequential-thinking-tool';

/**
 * Create a reasoning message entry for sequential thinking
 * This creates a text-type reasoning message that shows the current thought
 */
export function createSequentialThinkingReasoningMessage(
  sequentialThinkingState: SequentialThinkingState,
  toolCallId?: string,
  overrideStatus?: ChatMessageReasoning_status
): ChatMessageReasoningMessage_Text | null {
  // Use entry_id from state or fallback to provided toolCallId
  const id = sequentialThinkingState.toolCallId || toolCallId;

  if (!id) {
    return null;
  }

  // Determine status based on state.isComplete or override
  const status = overrideStatus ?? (sequentialThinkingState.isComplete ? 'completed' : 'loading');

  // Determine title based on status
  const title = status === 'completed' ? 'Thought for a few seconds' : 'Thinking it through...';

  // Calculate elapsed time if completed
  const secondaryTitle =
    status === 'completed' ? formatElapsedTime(sequentialThinkingState.startTime) : undefined;

  const reasoningMessage: ChatMessageReasoningMessage_Text = {
    id,
    type: 'text',
    title,
    status,
    message: sequentialThinkingState.thought || '',
    message_chunk: undefined,
    secondary_title: secondaryTitle,
  };

  return reasoningMessage;
}

/**
 * Create a raw LLM message entry for sequential thinking
 * This represents the raw tool call in the LLM message format
 */
export function createSequentialThinkingRawLlmMessageEntry(
  sequentialThinkingState: SequentialThinkingState,
  toolCallId?: string
): ModelMessage | null {
  const id = sequentialThinkingState.toolCallId || toolCallId;

  if (!id) {
    return null;
  }

  // Build the input object with available state
  const input: Record<string, unknown> = {};

  if (sequentialThinkingState.thought !== undefined) {
    input.thought = sequentialThinkingState.thought;
  }

  if (sequentialThinkingState.nextThoughtNeeded !== undefined) {
    input.nextThoughtNeeded = sequentialThinkingState.nextThoughtNeeded;
  }

  if (sequentialThinkingState.thoughtNumber !== undefined) {
    input.thoughtNumber = sequentialThinkingState.thoughtNumber;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: id,
        toolName: 'sequentialThinking',
        input,
      },
    ],
  };
}
