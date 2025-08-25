import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { createModifyReportsReasoningEntry } from './helpers/modify-reports-transform-helper';
import type { ModifyReportsContext, ModifyReportsState } from './modify-reports-tool';

export function modifyReportsStart(context: ModifyReportsContext, state: ModifyReportsState) {
  return async (options: ToolCallOptions) => {
    // Reset state for new tool call to prevent contamination from previous calls
    state.toolCallId = options.toolCallId;
    state.argsText = undefined;
    state.reportId = undefined;
    state.reportName = undefined;
    state.edits = [];
    state.currentContent = undefined;
    state.finalContent = undefined;
    state.version_number = undefined;
    state.startTime = Date.now();
    state.responseMessageCreated = false;
    state.snapshotContent = undefined;

    if (context.messageId) {
      try {
        if (context.messageId && state.toolCallId) {
          // Update database with reasoning entry only - raw LLM message will be created with result later
          try {
            const reasoningEntry = createModifyReportsReasoningEntry(state, options.toolCallId);
            // Skip creating rawLlmMessage here to avoid duplicates - it will be created with the result later

            // Update reasoning entry if it exists
            const updates: Parameters<typeof updateMessageEntries>[0] = {
              messageId: context.messageId,
            };

            if (reasoningEntry) {
              updates.reasoningMessages = [reasoningEntry];
            }

            if (reasoningEntry) {
              await updateMessageEntries(updates);
            }
          } catch (error) {
            console.error('[modify-reports] Error updating entries on start:', error);
          }
        }
      } catch (error) {
        console.error('[modify-reports] Error creating initial database entries:', error);
      }
    }
  };
}
