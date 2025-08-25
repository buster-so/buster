import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createModifyReportsRawLlmMessageEntry,
  createModifyReportsReasoningEntry,
} from './helpers/modify-reports-transform-helper';
import type {
  ModifyReportsContext,
  ModifyReportsInput,
  ModifyReportsState,
} from './modify-reports-tool';

export function createModifyReportsFinish(
  context: ModifyReportsContext,
  state: ModifyReportsState
) {
  return async (options: { input: ModifyReportsInput } & ToolCallOptions) => {
    const input = options.input;

    // Process final input
    if (input) {
      const { id, name, edits } = input;

      // Update report metadata
      state.reportId = id;
      state.reportName = name;

      // Ensure all edits are in state with their final content
      if (edits && edits.length > 0) {
        // Initialize state edits if needed
        if (!state.edits) {
          state.edits = [];
        }

        // Update or add all edits with final values
        for (let i = 0; i < edits.length; i++) {
          const edit = edits[i];
          if (edit) {
            // Use explicit operation if provided, otherwise infer from code_to_replace
            const operation =
              edit.operation || (edit.code_to_replace === '' ? 'append' : 'replace');

            if (state.edits[i]) {
              // Update existing edit with final values
              state.edits[i] = {
                operation,
                code_to_replace: edit.code_to_replace,
                code: edit.code,
                status: 'loading',
              };
            } else {
              // Add new edit (shouldn't happen if delta worked correctly)
              state.edits.push({
                operation,
                code_to_replace: edit.code_to_replace,
                code: edit.code,
                status: 'loading',
              });
            }
          }
        }
      }
    }

    // Update database with final state
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createModifyReportsReasoningEntry(state, state.toolCallId);
        const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, state.toolCallId);

        const updates: Parameters<typeof updateMessageEntries>[0] = {
          messageId: context.messageId,
        };

        if (reasoningEntry) {
          updates.reasoningMessages = [reasoningEntry];
        }

        if (rawLlmMessage) {
          updates.rawLlmMessages = [rawLlmMessage];
        }

        if (reasoningEntry || rawLlmMessage) {
          await updateMessageEntries(updates);
        }

        console.info('[modify-reports] Finished input processing', {
          messageId: context.messageId,
          reportId: state.reportId,
          editCount: state.edits?.length || 0,
        });
      } catch (error) {
        console.error('[modify-reports] Error updating entries on finish:', error);
      }
    }
  };
}
