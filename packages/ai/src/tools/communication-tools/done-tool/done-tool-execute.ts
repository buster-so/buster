import {
  updateMessage,
  updateMessageEntries,
  waitForPendingUpdates,
} from '@buster/database/queries';
import { wrapTraced } from 'braintrust';
import { cleanupState } from '../../shared/cleanup-state';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
import {
  DONE_TOOL_NAME,
  type DoneToolContext,
  type DoneToolInput,
  type DoneToolOutput,
  type DoneToolState,
} from './done-tool';
import { createDoneToolRawLlmMessageEntry } from './helpers/done-tool-transform-helper';

// Process done tool execution with todo management
async function processDone(
  state: DoneToolState,
  toolCallId: string,
  messageId: string,
  _context: DoneToolContext,
  input: DoneToolInput
): Promise<DoneToolOutput> {
  const output: DoneToolOutput = {
    success: true,
  };

  // Update state with the full finalResponse from input to ensure completeness
  const updatedState: DoneToolState = {
    ...state,
    finalResponse: input.finalResponse,
  };

  // Create both the tool call and result messages to maintain proper ordering
  const rawLlmMessage = createDoneToolRawLlmMessageEntry(updatedState, toolCallId);
  const rawToolResultEntry = createRawToolResultEntry(toolCallId, DONE_TOOL_NAME, output);

  try {
    // Send both messages together: tool call followed by result
    const rawLlmMessages = rawLlmMessage
      ? [rawLlmMessage, rawToolResultEntry]
      : [rawToolResultEntry];

    await updateMessageEntries({
      messageId,
      rawLlmMessages,
    });

    // Mark the message as completed
    await updateMessage(messageId, {
      isCompleted: true,
    });
  } catch (error) {
    console.error('[done-tool] Error updating message entries:', error);
  }

  return output;
}

// Factory function that creates the execute function with proper context typing
export function createDoneToolExecute(context: DoneToolContext, state: DoneToolState) {
  return wrapTraced(
    async (input: DoneToolInput): Promise<DoneToolOutput> => {
      if (!state.toolCallId) {
        throw new Error('Tool call ID is required');
      }

      const result = await processDone(state, state.toolCallId, context.messageId, context, input);

      // Wait for all pending updates from delta/finish to complete before returning
      await waitForPendingUpdates(context.messageId);

      cleanupState(state);
      return result;
    },
    { name: 'Done Tool' }
  );
}
