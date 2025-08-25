import { randomUUID } from 'node:crypto';
import {
  assetPermissions,
  db,
  reportFiles,
  updateMessageEntries,
  updateReportContent,
} from '@buster/database';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
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
  files: 'files' as const,
  name: 'name' as const,
  content: 'content' as const,
} satisfies {
  files: keyof CreateReportsInput;
  name: keyof CreateReportsInput['files'][number];
  content: keyof CreateReportsInput['files'][number];
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
        // Track which reports need to be created
        const reportsToCreate: Array<{
          id: string;
          name: string;
          index: number;
        }> = [];

        // Track which reports need content updates
        const contentUpdates: Array<{
          reportId: string;
          content: string;
        }> = [];

        // Update state files with streamed data
        const updatedFiles: CreateReportStateFile[] = [];

        filesArray.forEach((file, index) => {
          if (file && typeof file === 'object') {
            const fileObj = file as Record<string, unknown>;
            const name = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.name,
              ''
            );
            const rawContent = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.content,
              ''
            );
            // Unescape JSON string sequences, then normalize any double-escaped characters
            const content = rawContent ? normalizeEscapedText(unescapeJsonString(rawContent)) : '';

            // Only add files that have at least a name
            if (name) {
              // Check if this file already exists in state to preserve its ID
              const existingFile = state.files?.[index];

              let reportId: string;

              if (existingFile?.id) {
                // Report already exists, use its ID
                reportId = existingFile.id;
              } else {
                // New report, generate ID and mark for creation
                reportId = randomUUID();
                reportsToCreate.push({ id: reportId, name, index });
              }

              updatedFiles.push({
                id: reportId,
                file_name: name,
                file_type: 'report',
                version_number: 1,
                file: content
                  ? {
                      text: content,
                    }
                  : undefined,
                status: 'loading',
              });

              // Track that we created/modified this report in this message
              if (!state.reportsModifiedInMessage) {
                state.reportsModifiedInMessage = new Set();
              }
              state.reportsModifiedInMessage.add(reportId);

              // If we have content and a report ID, update the content
              if (content && reportId) {
                contentUpdates.push({ reportId, content });
              }
            }
          }
        });

        state.files = updatedFiles;

        // Create new reports in the database if needed
        if (reportsToCreate.length > 0 && context.userId && context.organizationId) {
          try {
            await db.transaction(async (tx) => {
              // Insert report files
              const reportRecords = reportsToCreate.map((report) => {
                const now = new Date().toISOString();
                return {
                  id: report.id,
                  name: report.name,
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
              });
              await tx.insert(reportFiles).values(reportRecords);

              // Insert asset permissions
              const assetPermissionRecords = reportRecords.map((record) => ({
                identityId: context.userId,
                identityType: 'user' as const,
                assetId: record.id,
                assetType: 'report_file' as const,
                role: 'owner' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deletedAt: null,
                createdBy: context.userId,
                updatedBy: context.userId,
              }));
              await tx.insert(assetPermissions).values(assetPermissionRecords);
            });

            console.info('[create-reports] Created reports in database', {
              count: reportsToCreate.length,
              reportIds: reportsToCreate.map((r) => r.id),
            });

            // Note: Response messages are only created in execute phase after checking for metrics
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Database creation failed';
            console.error('[create-reports] Error creating reports in database:', {
              error: errorMessage,
              reportCount: reportsToCreate.length,
              stack: error instanceof Error ? error.stack : undefined,
            });

            // Mark all reports as failed with error message
            reportsToCreate.forEach(({ id }) => {
              const stateFile = state.files?.find((f) => f.id === id);
              if (stateFile) {
                stateFile.status = 'failed';
                stateFile.error = `Failed to create report in database: ${errorMessage}`;
              }
            });
          }
        }

        // Update report content for all reports that have content
        if (contentUpdates.length > 0) {
          for (const update of contentUpdates) {
            try {
              await updateReportContent({
                reportId: update.reportId,
                content: update.content,
              });

              // Keep the file status as 'loading' during streaming
              // Status will be updated to 'completed' in the execute phase
              const stateFile = state.files?.find((f) => f.id === update.reportId);
              if (stateFile) {
                // Ensure status remains 'loading' during delta phase
                stateFile.status = 'loading';
              }

              // Note: Response messages should only be created in execute phase
              // after all processing is complete
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Content update failed';
              console.error('[create-reports] Error updating report content:', {
                reportId: update.reportId,
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined,
              });

              // Keep file as loading during delta phase even on error
              // The execute phase will handle final status
              const stateFile = state.files?.find((f) => f.id === update.reportId);
              if (stateFile) {
                stateFile.status = 'loading';
                stateFile.error = `Failed to update report content: ${errorMessage}`;
              }
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
