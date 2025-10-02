import * as databaseQueries from '@buster/database/queries';
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
import {
  createDoneToolRawLlmMessageEntry,
  createDoneToolResponseMessage,
} from './helpers/done-tool-transform-helper';

// Process done tool execution with todo management
async function processDone(
  state: DoneToolState,
  toolCallId: string,
  messageId: string,
  _context: DoneToolContext,
  input: DoneToolInput,
  updateOptions?: Parameters<typeof updateMessageEntries>[1]
): Promise<{ output: DoneToolOutput; sequenceNumber?: number; skipped?: boolean }> {
  const output: DoneToolOutput = {
    success: true,
  };

  // Update state with the full finalResponse from input to ensure completeness
  const updatedState: DoneToolState = {
    ...state,
    finalResponse: input.finalResponse,
  };

  // Create the response message with complete data
  const doneToolResponseEntry = createDoneToolResponseMessage(updatedState, toolCallId);

  // Create both the tool call and result messages to maintain proper ordering
  const rawLlmMessage = createDoneToolRawLlmMessageEntry(updatedState, toolCallId);
  const rawToolResultEntry = createRawToolResultEntry(toolCallId, DONE_TOOL_NAME, output);

  try {
    // Send both messages together: tool call followed by result
    const rawLlmMessages = rawLlmMessage
      ? [rawLlmMessage, rawToolResultEntry]
      : [rawToolResultEntry];

    const updateResult = await updateMessageEntries(
      {
        messageId,
        rawLlmMessages,
        // Include the response message with the complete finalResponse
        responseMessages: doneToolResponseEntry ? [doneToolResponseEntry] : undefined,
      },
      updateOptions
    );

    // Mark the message as completed
    await updateMessage(messageId, {
      isCompleted: true,
    });

    return {
      output,
      ...(updateResult.sequenceNumber !== undefined && {
        sequenceNumber: updateResult.sequenceNumber,
      }),
      ...(updateResult.skipped !== undefined && { skipped: updateResult.skipped }),
    };
  } catch (error) {
    console.error('[done-tool] Error updating message entries:', error);
    return {
      output,
    };
  }
}

// Factory function that creates the execute function with proper context typing
const updateMessage = databaseQueries.updateMessage;
const updateMessageEntries = databaseQueries.updateMessageEntries;
const waitForPendingUpdates =
  databaseQueries.waitForPendingUpdates ?? (async (_messageId: string) => {});

export function createDoneToolExecute(context: DoneToolContext, state: DoneToolState) {
  return wrapTraced(
    async (input: DoneToolInput): Promise<DoneToolOutput> => {
      if (!state.toolCallId) {
        throw new Error('Tool call ID is required');
      }

      state.isFinalizing = true;
      // CRITICAL: Wait for ALL pending updates from delta/finish to complete FIRST
      // This ensures execute's update is always the last one in the queue
      if (typeof state.latestSequenceNumber === 'number') {
        await waitForPendingUpdates(context.messageId, {
          upToSequence: state.latestSequenceNumber,
        });
      } else {
        await waitForPendingUpdates(context.messageId);
      }

      // Now do the final authoritative update with the complete input
      const { output, sequenceNumber, skipped } = await processDone(
        state,
        state.toolCallId,
        context.messageId,
        context,
        input,
        { isFinal: true }
      );

      if (!skipped && typeof sequenceNumber === 'number') {
        const current = state.latestSequenceNumber ?? -1;
        state.latestSequenceNumber = Math.max(current, sequenceNumber);
        state.finalSequenceNumber = sequenceNumber;
      }

      if (typeof state.finalSequenceNumber === 'number') {
        await waitForPendingUpdates(context.messageId, {
          upToSequence: state.finalSequenceNumber,
        });
      } else {
        await waitForPendingUpdates(context.messageId);
      }

      cleanupState(state);
      return output;
    },
    { name: 'Done Tool' }
  );
}
