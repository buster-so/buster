import type { ModelMessage } from '@buster/ai';
import {
  addReasoningContent,
  addTextContent,
  addToolCall,
  addToolResult,
  createMessageAccumulatorState,
  type MessageAccumulatorState,
  resetStepState,
} from './message-handler';

export interface StreamHandlerCallbacks {
  onMessageUpdate?: (messages: ModelMessage[]) => void;
  onThinkingStateChange?: (thinking: boolean) => void;
  onSaveMessages?: (messages: ModelMessage[]) => Promise<void>;
}

/**
 * Processes agent stream and accumulates messages
 * Pure function that handles stream events and updates accumulator state
 */
export async function processAgentStream(
  stream: AsyncIterable<{
    type: string;
    text?: string;
    toolCallId?: string;
    toolName?: string;
    input?: unknown;
    output?: unknown;
  }>,
  initialMessages: ModelMessage[],
  callbacks: StreamHandlerCallbacks
): Promise<ModelMessage[]> {
  const { onMessageUpdate, onThinkingStateChange, onSaveMessages } = callbacks;

  // Initialize message accumulator state
  let accumulatorState = createMessageAccumulatorState(initialMessages);

  // Track streaming text and reasoning within a step
  let accumulatedText = '';
  let accumulatedReasoning = '';

  // Notify thinking state
  onThinkingStateChange?.(true);

  try {
    // Consume the stream
    for await (const part of stream) {
      if (part.type === 'start-step') {
        accumulatedText = '';
        accumulatedReasoning = '';
        accumulatorState = resetStepState(accumulatorState);
      }

      if (part.type === 'reasoning-delta' && part.text) {
        accumulatedReasoning += part.text;
      }

      if (part.type === 'reasoning-end') {
        if (accumulatedReasoning) {
          accumulatorState = addReasoningContent(accumulatorState, accumulatedReasoning);
          onMessageUpdate?.(accumulatorState.messages);
          await onSaveMessages?.(accumulatorState.messages);
        }
      }

      if (part.type === 'text-delta' && part.text) {
        accumulatedText += part.text;
      }

      if (part.type === 'text-end') {
        if (accumulatedText) {
          accumulatorState = addTextContent(accumulatorState, accumulatedText);
          onMessageUpdate?.(accumulatorState.messages);
          await onSaveMessages?.(accumulatorState.messages);
        }
      }

      if (
        part.type === 'tool-call' &&
        part.toolCallId &&
        part.toolName &&
        part.input !== undefined
      ) {
        accumulatorState = addToolCall(
          accumulatorState,
          part.toolCallId,
          part.toolName,
          part.input
        );
        onMessageUpdate?.(accumulatorState.messages);
      }

      if (
        part.type === 'tool-result' &&
        part.toolCallId &&
        part.toolName &&
        part.output !== undefined
      ) {
        accumulatorState = addToolResult(
          accumulatorState,
          part.toolCallId,
          part.toolName,
          part.output as string | Record<string, unknown>
        );
        onMessageUpdate?.(accumulatorState.messages);
      }

      if (part.type === 'finish-step') {
        // Save once at end of step to ensure all tool calls/results are captured atomically
        await onSaveMessages?.(accumulatorState.messages);
      }
    }
  } finally {
    onThinkingStateChange?.(false);
  }

  return accumulatorState.messages;
}
