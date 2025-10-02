import { updateChat, updateMessage, updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import type { UpdateMessageEntriesParams } from '../../../../../database/src/queries/messages/update-message-entries';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
import { DONE_TOOL_NAME, type DoneToolContext, type DoneToolState } from './done-tool';
// Selection logic moved to delta for optimistic insertion; keeping types but disabling extraction
// import {
//   type ExtractedFile,
//   createFileResponseMessages,
//   extractAllFilesForChatUpdate,
//   extractFilesFromToolCalls,
// } from './helpers/done-tool-file-selection';
import {
  createDoneToolRawLlmMessageEntry,
  createDoneToolResponseMessage,
} from './helpers/done-tool-transform-helper';

// Factory function that creates a type-safe callback for the specific agent context
export function createDoneToolStart(context: DoneToolContext, doneToolState: DoneToolState) {
  return async function doneToolStart(options: ToolCallOptions): Promise<void> {
    // Reset state for new tool call to prevent contamination from previous calls
    doneToolState.toolCallId = options.toolCallId;
    doneToolState.args = undefined;
    doneToolState.finalResponse = undefined;
    doneToolState.addedAssetIds = [];
    doneToolState.addedAssets = [];
    doneToolState.isFinalizing = false;
    doneToolState.latestSequenceNumber = undefined;
    doneToolState.finalSequenceNumber = undefined;

    // Selection logic moved to delta; skip extracting files here
    if (options.messages) {
      console.info(
        '[done-tool-start] Skipping file selection; handled in delta for optimistic insertion',
        {
          messageCount: options.messages?.length,
          toolCallId: options.toolCallId,
        }
      );
    }

    // Do not create the done text response here; wait until assets are inserted via delta
    const doneToolMessage = createDoneToolRawLlmMessageEntry(doneToolState, options.toolCallId);

    // Create the tool result immediately with success: true
    // This ensures it's always present even if the stream terminates early
    const rawToolResultEntry = createRawToolResultEntry(options.toolCallId, DONE_TOOL_NAME, {
      success: true,
    });

    const entries: UpdateMessageEntriesParams = {
      messageId: context.messageId,
    };

    // Intentionally skip adding responseMessages here to ensure file messages (from delta)
    // are inserted before the final text message

    // Include both the tool call and tool result in raw LLM messages
    // Since it's an upsert, sending both together ensures completeness
    const rawLlmMessages = [];
    if (doneToolMessage) {
      rawLlmMessages.push(doneToolMessage);
    }
    rawLlmMessages.push(rawToolResultEntry);

    if (rawLlmMessages.length > 0) {
      entries.rawLlmMessages = rawLlmMessages;
    }

    try {
      if (entries.responseMessages || entries.rawLlmMessages) {
        const result = await updateMessageEntries(entries);
        if (!result.skipped && result.sequenceNumber >= 0) {
          doneToolState.latestSequenceNumber = result.sequenceNumber;
        }
      }
    } catch (error) {
      console.error('[done-tool] Failed to update done tool raw LLM message:', error);
    }
  };
}
