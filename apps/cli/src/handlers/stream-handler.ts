import type { ModelMessage } from '@buster/ai';
import { debugLogger } from '../utils/debug-logger';
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
  onError?: (error: unknown) => void;
  onAbort?: () => void;
  currentTurnStartIndex?: number;
}

/**
 * Processes agent stream and accumulates messages
 * Pure function that handles stream events and updates accumulator state
 * Only saves messages from currentTurnStartIndex onward to prevent accumulation
 */
export async function processAgentStream(
  stream: AsyncIterable<{
    type: string;
    text?: string;
    toolCallId?: string;
    toolName?: string;
    input?: unknown;
    output?: unknown;
    error?: unknown;
  }>,
  initialMessages: ModelMessage[],
  callbacks: StreamHandlerCallbacks
): Promise<ModelMessage[]> {
  const { onMessageUpdate, onThinkingStateChange, onSaveMessages, onError, onAbort } = callbacks;

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
          // Don't save here - wait for finish-step to ensure tool results are included
        }
      }

      if (part.type === 'text-delta' && part.text) {
        accumulatedText += part.text;
      }

      if (part.type === 'text-end') {
        if (accumulatedText) {
          accumulatorState = addTextContent(accumulatorState, accumulatedText);
          onMessageUpdate?.(accumulatorState.messages);
          // Don't save here - wait for finish-step to ensure tool results are included
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
        // Only save messages from current turn (not full history)
        const messagesToSave =
          callbacks.currentTurnStartIndex !== undefined
            ? accumulatorState.messages.slice(callbacks.currentTurnStartIndex)
            : accumulatorState.messages;

        try {
          await onSaveMessages?.(messagesToSave);
        } catch (error) {
          // Log save error but don't stop stream processing
          debugLogger.error('Error saving messages during finish-step:', error);
          // Notify via error callback
          onError?.(error);
        }
      }

      if (part.type === 'error') {
        // Handle stream-level errors
        onError?.(part.error);
        // Still save messages up to this point (current turn only)
        const messagesToSave =
          callbacks.currentTurnStartIndex !== undefined
            ? accumulatorState.messages.slice(callbacks.currentTurnStartIndex)
            : accumulatorState.messages;

        try {
          await onSaveMessages?.(messagesToSave);
        } catch (saveError) {
          debugLogger.error('Error saving messages during error handling:', saveError);
        }
      }

      if (part.type === 'abort') {
        // Handle abort events
        onAbort?.();
        // Save messages before abort (current turn only)
        const messagesToSave =
          callbacks.currentTurnStartIndex !== undefined
            ? accumulatorState.messages.slice(callbacks.currentTurnStartIndex)
            : accumulatorState.messages;

        try {
          await onSaveMessages?.(messagesToSave);
        } catch (saveError) {
          debugLogger.error('Error saving messages during abort:', saveError);
        }
      }
    }
  } catch (error) {
    // Handle stream iteration errors
    debugLogger.error('Error processing agent stream:', error);

    // Notify error callback
    onError?.(error);

    // Try to save messages up to the point of failure
    try {
      const messagesToSave =
        callbacks.currentTurnStartIndex !== undefined
          ? accumulatorState.messages.slice(callbacks.currentTurnStartIndex)
          : accumulatorState.messages;
      await onSaveMessages?.(messagesToSave);
    } catch (saveError) {
      debugLogger.error('Error saving messages after stream failure:', saveError);
    }

    // Re-throw to propagate error to caller
    throw error;
  } finally {
    onThinkingStateChange?.(false);
  }

  return accumulatorState.messages;
}
