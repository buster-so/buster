import { randomUUID } from 'node:crypto';
import { updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../../utils/streaming/optimistic-json-parser';
import {
  createModifyMetricsRawLlmMessageEntry,
  createModifyMetricsReasoningEntry,
} from './helpers/modify-metrics-tool-transform-helper';
import type {
  ModifyMetricStateFile,
  ModifyMetricsContext,
  ModifyMetricsInput,
  ModifyMetricsState,
} from './modify-metrics-tool';

// Define TOOL_KEYS locally
const TOOL_KEYS = {
  files: 'files' as const,
  id: 'id' as const,
  yml_content: 'yml_content' as const,
} satisfies {
  files: keyof ModifyMetricsInput;
  id: keyof ModifyMetricsInput['files'][number];
  yml_content: keyof ModifyMetricsInput['files'][number];
};

export function createModifyMetricsDelta(context: ModifyMetricsContext, state: ModifyMetricsState) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Try to parse the accumulated JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText || '');

    // Extract files array using getOptimisticValue
    const filesArray = getOptimisticValue<unknown[]>(
      parseResult.extractedValues,
      TOOL_KEYS.files,
      undefined
    );

    if (filesArray && Array.isArray(filesArray)) {
      // Update state files with streamed data
      const updatedFiles: ModifyMetricStateFile[] = [];

      filesArray.forEach((file) => {
        if (file && typeof file === 'object') {
          const fileObj = file as Record<string, unknown>;

          // Extract values directly from the file object
          const id = fileObj[TOOL_KEYS.id] as string | undefined;
          const ymlContent = fileObj[TOOL_KEYS.yml_content] as string | undefined;

          // Only add files that have at least an ID
          if (id) {
            // Find existing file by ID to preserve data
            const existingFile = state.files?.find((f) => f?.id === id);

            updatedFiles.push({
              id: id,
              file_name: existingFile?.file_name,
              file_type: 'metric_file',
              version_number: existingFile?.version_number || 1,
              file: ymlContent
                ? {
                    text: ymlContent,
                  }
                : existingFile?.file,
              yml_content: ymlContent || existingFile?.yml_content,
              status: 'loading',
            });
          }
        }
      });

      // Only update state.files if we have new files
      if (updatedFiles.length > 0) {
        state.files = updatedFiles;
      }
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createModifyMetricsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createModifyMetricsRawLlmMessageEntry(state, options.toolCallId);

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
        console.error('[modify-metrics] Error updating entries during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
