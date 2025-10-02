import { type UpdateMessageEntriesParams, updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';
import {
  createDoneToolRawLlmMessageEntry,
  createDoneToolResponseMessage,
} from './helpers/done-tool-transform-helper';

export function createDoneToolFinish(context: DoneToolContext, doneToolState: DoneToolState) {
  return async function doneToolFinish(
    options: { input: DoneToolInput } & ToolCallOptions
  ): Promise<void> {
    doneToolState.toolCallId = options.toolCallId;

    const doneToolResponseEntry = createDoneToolResponseMessage(doneToolState, options.toolCallId);
    const doneToolMessage = createDoneToolRawLlmMessageEntry(doneToolState, options.toolCallId);

    const entries: UpdateMessageEntriesParams = {
      messageId: context.messageId,
    };

    // Only add the final text response here; by now files have been inserted via delta
    if (doneToolResponseEntry) {
      entries.responseMessages = [doneToolResponseEntry];
    }

    if (doneToolMessage) {
      entries.rawLlmMessages = [doneToolMessage];
    }

    try {
      if (entries.responseMessages || entries.rawLlmMessages) {
        const result = await updateMessageEntries(entries);
        if (!result.skipped && result.sequenceNumber >= 0) {
          const current = doneToolState.latestSequenceNumber ?? -1;
          doneToolState.latestSequenceNumber = Math.max(current, result.sequenceNumber);
        }
      }
    } catch (error) {
      console.error('[done-tool] Failed to update done tool raw LLM message:', error);
    }
  };
}
