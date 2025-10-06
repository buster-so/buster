import { randomUUID } from 'node:crypto';
import { db } from '@buster/database/connection';
import {
  isReportUpdateQueueClosed,
  updateMessageEntries,
  updateReportContent,
  updateReportWithVersion,
} from '@buster/database/queries';
import { assetPermissions, reportFiles } from '@buster/database/schema';
import type { ToolCallOptions } from 'ai';
import {
  normalizeEscapedText,
  unescapeJsonString,
} from '../../../../utils/streaming/escape-normalizer';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../../utils/streaming/optimistic-json-parser';
import type {
  CreateReportStateFile,
  CreateReportsContext,
  CreateReportsInput,
  CreateReportsState,
} from './create-reports-tool';
import {
  createCreateReportsRawLlmMessageEntry,
  createCreateReportsReasoningEntry,
} from './helpers/create-reports-tool-transform-helper';

// Define TOOL_KEYS locally since we removed them from the helper
const TOOL_KEYS = {
  name: 'name' as const,
  content: 'content' as const,
} satisfies {
  name: keyof CreateReportsInput;
  content: keyof CreateReportsInput;
};

type VersionHistory = (typeof reportFiles.$inferSelect)['versionHistory'];

// Helper function to create initial version history
function createInitialReportVersionHistory(content: string, createdAt: string): VersionHistory {
  return {
    '1': {
      content,
      updated_at: createdAt,
      version_number: 1,
    },
  };
}

// Removed helper function - response messages should only be created in execute phase

export function createCreateReportsDelta(context: CreateReportsContext, state: CreateReportsState) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    if (state.file?.id && isReportUpdateQueueClosed(state.file.id)) {
      return;
    }
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Try to parse the accumulated JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText || '');

    if (parseResult.parsed) {
      // Extract name and content from parsed result
      const name = getOptimisticValue<string>(parseResult.extractedValues, TOOL_KEYS.name, '');
      const rawContent = getOptimisticValue<string>(
        parseResult.extractedValues,
        TOOL_KEYS.content,
        ''
      );
      // Unescape JSON string sequences, then normalize any double-escaped characters
      const content = rawContent ? normalizeEscapedText(unescapeJsonString(rawContent)) : '';

      // Only process if we have at least a name
      if (name) {
        // Check if report already exists in state to preserve its ID
        const existingFile = state.file;

        let reportId: string;
        let needsCreation = false;

        if (existingFile?.id) {
          // Report already exists, use its ID
          reportId = existingFile.id;
        } else {
          // New report, generate ID and mark for creation
          reportId = randomUUID();
          needsCreation = true;
        }

        // Update state with the single report
        state.file = {
          id: reportId,
          file_name: name,
          file_type: 'report_file',
          version_number: 1,
          file: content
            ? {
                text: content,
              }
            : undefined,
          status: 'loading',
        };

        // Track that we created/modified this report in this message
        state.reportModifiedInMessage = true;

        // Create new report in the database if needed
        if (needsCreation && context.userId && context.organizationId) {
          try {
            await db.transaction(async (tx) => {
              // Insert report file
              const now = new Date().toISOString();
              const reportRecord = {
                id: reportId,
                name: name,
                content: '', // Start with empty content, will be updated via streaming
                organizationId: context.organizationId,
                createdBy: context.userId,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                publiclyAccessible: false,
                publiclyEnabledBy: null,
                publicExpiryDate: null,
                versionHistory: createInitialReportVersionHistory('', now),
                publicPassword: null,
                workspaceSharing: 'none' as const,
                workspaceSharingEnabledBy: null,
                workspaceSharingEnabledAt: null,
              };
              await tx.insert(reportFiles).values(reportRecord);

              // Insert asset permission
              const assetPermissionRecord = {
                identityId: context.userId,
                identityType: 'user' as const,
                assetId: reportId,
                assetType: 'report_file' as const,
                role: 'owner' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deletedAt: null,
                createdBy: context.userId,
                updatedBy: context.userId,
              };
              await tx.insert(assetPermissions).values(assetPermissionRecord);
            });

            console.info('[create-reports] Created report in database', {
              reportId,
              name,
            });

            // Note: Response messages are only created in execute phase after checking for metrics
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Database creation failed';
            console.error('[create-reports] Error creating report in database:', {
              error: errorMessage,
              reportId,
              stack: error instanceof Error ? error.stack : undefined,
            });

            // Mark report as failed with error message
            if (state.file) {
              state.file.status = 'failed';
              state.file.error = `Failed to create report in database: ${errorMessage}`;
            }
          }
        }

        // Update report content if we have content
        if (content && reportId) {
          try {
            const now = new Date().toISOString();
            const versionHistory = {
              '1': {
                content,
                updated_at: now,
                version_number: 1,
              },
            };
            await updateReportWithVersion({
              reportId,
              content,
              name,
              versionHistory,
            });

            // Keep the file status as 'loading' during streaming
            // Status will be updated to 'completed' in the execute phase
            if (state.file) {
              // Ensure status remains 'loading' during delta phase
              state.file.status = 'loading';
            }

            // Note: Response messages should only be created in execute phase
            // after all processing is complete
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Content update failed';
            console.error('[create-reports] Error updating report content:', {
              reportId: reportId,
              error: errorMessage,
              stack: error instanceof Error ? error.stack : undefined,
            });

            // Keep file as loading during delta phase even on error
            // The execute phase will handle final status
            if (state.file) {
              state.file.status = 'loading';
              state.file.error = `Failed to update report content: ${errorMessage}`;
            }
          }
        }
      }
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createCreateReportsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, options.toolCallId);

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
        console.error('[create-reports] Error updating entries during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
