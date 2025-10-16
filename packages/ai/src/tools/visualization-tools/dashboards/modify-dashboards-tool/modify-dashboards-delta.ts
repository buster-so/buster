import { updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../../utils/streaming/optimistic-json-parser';
import {
  createModifyDashboardsRawLlmMessageEntry,
  createModifyDashboardsReasoningEntry,
} from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardStateFile,
  ModifyDashboardsContext,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

// Define TOOL_KEYS locally since we removed them from the helper
const TOOL_KEYS = {
  files: 'files' as const,
  id: 'id' as const,
  yml_content: 'yml_content' as const,
};

export function createModifyDashboardsDelta(
  context: ModifyDashboardsContext,
  state: ModifyDashboardsState
) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Try to parse the accumulated JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText || '');

    if (parseResult.parsed) {
      // Extract files array from parsed result
      const filesArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        TOOL_KEYS.files,
        []
      );

      if (filesArray && Array.isArray(filesArray)) {
        // Update state files with streamed data
        const updatedFiles: ModifyDashboardStateFile[] = [];

        filesArray.forEach((file, index) => {
          if (file && typeof file === 'object') {
            const fileObj = file as Record<string, unknown>;
            const id = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.id,
              ''
            );
            const ymlContent = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.yml_content,
              ''
            );

            // Only add files that have at least an id
            if (id) {
              // Check if this file already exists in state to preserve its metadata
              const existingFile = state.files?.[index];

              updatedFiles.push({
                id,
                file_name: existingFile?.file_name,
                file_type: 'dashboard_file',
                version_number: existingFile?.version_number || 1,
                file: ymlContent
                  ? {
                      text: ymlContent,
                    }
                  : undefined,
                status: 'loading',
              });
            }
          }
        });

        state.files = updatedFiles;
      }
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createModifyDashboardsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createModifyDashboardsRawLlmMessageEntry(state, options.toolCallId);

        // Update both entries together if they exist
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
      } catch (error) {
        console.error('[modify-dashboards] Error updating entries during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
