import { updateMessageEntries } from '@buster/database/queries';
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../utils/streaming/optimistic-json-parser';
import type { CreateTodosContext, CreateTodosInput, CreateTodosState } from './create-todos-step';
import { createTodosReasoningMessage } from './helpers/create-todos-transform-helper';

// Type-safe key extraction from the schema - will cause compile error if field name changes
const TODOS_KEY = 'todos' as const satisfies keyof CreateTodosInput;

/**
 * Factory function that creates a delta handler for streaming TODO updates
 * Uses optimistic JSON parsing to extract partial TODOs from incomplete JSON
 */
export function createTodosStepDelta(todosState: CreateTodosState, context: CreateTodosContext) {
  return async function todosStepDelta(delta: string): Promise<void> {
    // Accumulate the delta to the args
    todosState.args = (todosState.args || '') + delta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(todosState.args);

    // Extract todos from the optimistically parsed values - type-safe key
    const todos = getOptimisticValue<string>(parseResult.extractedValues, TODOS_KEY);

    if (todos !== undefined && todos !== '') {
      // Update the state with the extracted todos
      todosState.todos = todos;

      // Only update reasoning entry during streaming (not raw LLM messages)
      const todosReasoningEntry = createTodosReasoningMessage(todosState);

      try {
        if (todosReasoningEntry) {
          await updateMessageEntries({
            messageId: context.messageId,
            reasoningMessages: [todosReasoningEntry],
            // Don't update rawLlmMessages during streaming
          });
        }
      } catch (error) {
        console.error('[create-todos-step] Failed to update TODO reasoning message:', error);
      }
    }
  };
}
