import { db } from '@buster/database/connection';
import {
  closeReportUpdateQueue,
  updateMessageEntries,
  updateMetricsToReports,
  waitForPendingReportUpdates,
} from '@buster/database/queries';
import { updateReportWithVersion } from '@buster/database/queries';
import { reportFiles } from '@buster/database/schema';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import { wrapTraced } from 'braintrust';
import { and, eq, isNull } from 'drizzle-orm';
import { cleanupState } from '../../../shared/cleanup-state';
import { createRawToolResultEntry } from '../../../shared/create-raw-llm-tool-result-entry';
import { trackFileAssociations } from '../../file-tracking-helper';
import {
  extractAndCacheMetricsWithUserContext,
  extractMetricIds,
} from '../helpers/metric-extraction';
import { shouldIncrementVersion, updateVersionHistory } from '../helpers/report-version-helper';
import { getCachedSnapshot, updateCachedSnapshot } from '../report-snapshot-cache';
import {
  createModifyReportsRawLlmMessageEntry,
  createModifyReportsReasoningEntry,
} from './helpers/modify-reports-transform-helper';
import type {
  ModifyReportsContext,
  ModifyReportsInput,
  ModifyReportsOutput,
  ModifyReportsState,
} from './modify-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from './modify-reports-tool';

// Apply a single edit operation to content in memory
function applyEditToContent(
  content: string,
  edit: { operation?: 'replace' | 'append'; code_to_replace: string; code: string }
): {
  success: boolean;
  content?: string;
  error?: string;
} {
  try {
    const operation = edit.operation || (edit.code_to_replace === '' ? 'append' : 'replace');

    if (operation === 'append') {
      // Append mode
      return {
        success: true,
        content: content + edit.code,
      };
    }
    // Replace mode
    if (!content.includes(edit.code_to_replace)) {
      return {
        success: false,
        error: `Text not found: "${edit.code_to_replace.substring(0, 50)}${edit.code_to_replace.length > 50 ? '...' : ''}"`,
      };
    }
    const newContent = content.replace(edit.code_to_replace, edit.code);
    return {
      success: true,
      content: newContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Edit operation failed',
    };
  }
}

type VersionHistoryEntry = {
  content: string;
  updated_at: string;
  version_number: number;
};

type VersionHistory = Record<string, VersionHistoryEntry>;

// Process all edit operations sequentially in memory
async function processEditOperations(
  reportId: string,
  reportName: string,
  edits: Array<{ operation?: 'replace' | 'append'; code_to_replace: string; code: string }>,
  messageId?: string,
  snapshotContent?: string,
  versionHistory?: VersionHistory,
  state?: ModifyReportsState
): Promise<{
  success: boolean;
  finalContent?: string;
  errors: string[];
  version?: number;
  versionHistory?: VersionHistory;
  incrementVersion?: boolean;
}> {
  // If we have snapshot content from state, use it as source of truth
  // Otherwise fetch from database (for cases where delta didn't run)
  let baseContent: string;
  let baseVersionHistory: VersionHistory | null;

  if (snapshotContent !== undefined) {
    // Use the immutable snapshot from state
    baseContent = snapshotContent;
    baseVersionHistory = versionHistory || null;
  } else {
    // Check cache first (write-through cache from delta)
    const cached = getCachedSnapshot(reportId);

    if (cached) {
      console.info('[modify-reports-execute] Using cached snapshot', {
        reportId,
      });
      baseContent = cached.content;
      baseVersionHistory = cached.versionHistory as VersionHistory | null;
    } else {
      // Fallback: Get current report content and version history from DB
      const existingReport = await db
        .select({
          content: reportFiles.content,
          versionHistory: reportFiles.versionHistory,
        })
        .from(reportFiles)
        .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)))
        .limit(1);

      if (!existingReport.length) {
        return {
          success: false,
          errors: ['Report not found'],
        };
      }

      const report = existingReport[0];
      if (!report) {
        return {
          success: false,
          errors: ['Report not found'],
        };
      }

      baseContent = report.content;
      baseVersionHistory = report.versionHistory as VersionHistory | null;
    }
  }

  let currentContent = baseContent;
  const errors: string[] = [];
  let allSuccess = true;

  // Apply all edits in memory
  for (const [index, edit] of edits.entries()) {
    const result = applyEditToContent(currentContent, edit);

    if (result.success && result.content) {
      currentContent = result.content;
    } else {
      allSuccess = false;
      const operation = edit.operation || (edit.code_to_replace === '' ? 'append' : 'replace');
      const errorMsg = `Edit ${index + 1} (${operation}): ${result.error || 'Unknown error'}`;
      errors.push(errorMsg);
      // Stop processing on first failure for consistency
      break;
    }
  }

  if (!allSuccess || currentContent === baseContent) {
    return {
      success: allSuccess,
      finalContent: currentContent,
      errors,
    };
  }

  // Determine if we should increment version
  const incrementVersion = await shouldIncrementVersion(reportId, messageId);
  const { versionHistory: newVersionHistory, newVersionNumber } = updateVersionHistory(
    baseVersionHistory,
    currentContent,
    incrementVersion
  );

  // Write all changes to database in one operation
  try {
    // Wait for the last delta processing to complete before doing final update
    if (state?.lastProcessing) {
      console.info('[modify-reports-execute] Waiting for last delta processing to complete');
      try {
        // Wait for the last processing in the chain to complete
        await state.lastProcessing;
        console.info(
          '[modify-reports-execute] Last delta processing completed, proceeding with final update'
        );
      } catch (error) {
        console.warn(
          '[modify-reports-execute] Error waiting for last delta processing, proceeding with final update:',
          error
        );
      }
    }

    await updateReportWithVersion(
      {
        reportId,
        content: currentContent,
        name: reportName,
        versionHistory: newVersionHistory,
      },
      {
        isFinal: true,
      }
    );

    // Wait for the database update to fully complete in the queue
    await waitForPendingReportUpdates(reportId);

    // Update cache with the modified content for future operations
    updateCachedSnapshot(reportId, currentContent, newVersionHistory);

    const metricIds = extractMetricIds(currentContent);

    console.info('[modify-reports] Updating metrics to reports', {
      reportId,
      metricIds,
    });

    if (metricIds.length > 0) {
      await updateMetricsToReports({
        reportId,
        metricIds,
      });
    }

    if (messageId) {
      await trackFileAssociations({
        messageId,
        files: [
          {
            id: reportId,
            version: newVersionNumber,
          },
        ],
      });
    }

    return {
      success: true,
      finalContent: currentContent,
      errors: [],
      version: newVersionNumber,
      versionHistory: newVersionHistory,
      incrementVersion, // Include this so we know if version was incremented
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
    console.error('[modify-reports] Error updating report:', {
      reportId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      finalContent: currentContent,
      errors: [`Database update failed: ${errorMessage}`],
    };
  }
}

// Main modify reports function
const modifyReportsFile = wrapTraced(
  async (
    params: ModifyReportsInput,
    context: ModifyReportsContext,
    snapshotContent?: string,
    versionHistory?: VersionHistory,
    state?: ModifyReportsState
  ): Promise<ModifyReportsOutput> => {
    // Get context values
    const userId = context.userId;
    const organizationId = context.organizationId;
    const messageId = context.messageId;

    if (!userId) {
      return {
        success: false,
        message: 'Unable to verify your identity. Please log in again.',
        file: {
          id: params.id,
          name: params.name,
          content: '',
          version_number: 0,
          updated_at: new Date().toISOString(),
        },
        error: 'User authentication required',
      };
    }

    if (!organizationId) {
      return {
        success: false,
        message: 'Unable to access your organization. Please check your permissions.',
        file: {
          id: params.id,
          name: params.name,
          content: '',
          version_number: 0,
          updated_at: new Date().toISOString(),
        },
        error: 'Organization access required',
      };
    }

    // Validate report ID
    if (!params.id) {
      return {
        success: false,
        message: 'Report ID is required for editing.',
        file: {
          id: '',
          name: params.name,
          content: '',
          version_number: 0,
          updated_at: new Date().toISOString(),
        },
        error: 'Missing report ID',
      };
    }

    // Process all edit operations using snapshot as source of truth
    const editResult = await processEditOperations(
      params.id,
      params.name,
      params.edits,
      messageId,
      snapshotContent, // Pass immutable snapshot
      versionHistory, // Pass snapshot version history
      state // Pass state to access lastUpdate
    );

    // Track file associations if this is a new version (not part of same turn)
    if (messageId && editResult.success && editResult.finalContent && editResult.incrementVersion) {
      await trackFileAssociations({
        messageId,
        files: [
          {
            id: params.id,
            version: editResult.version || 2,
          },
        ],
      });
    }

    // Cache any metrics in the modified report content
    if (editResult.success && editResult.finalContent && userId) {
      extractAndCacheMetricsWithUserContext(editResult.finalContent, params.id, userId).catch(
        (error) => {
          console.error('[modify-reports] Failed to cache metrics for report', {
            reportId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      );
    }

    const now = new Date().toISOString();

    if (editResult.success && editResult.finalContent) {
      return {
        success: true,
        message: `Successfully applied ${params.edits.length} edit(s) to report: ${params.name}`,
        file: {
          id: params.id,
          name: params.name,
          content: editResult.finalContent,
          version_number: editResult.version || 2,
          updated_at: now,
        },
      };
    }
    if (editResult.finalContent) {
      // Partial success
      return {
        success: false,
        message: `Partially applied edits to report: ${params.name}. Some operations failed.`,
        file: {
          id: params.id,
          name: params.name,
          content: editResult.finalContent,
          version_number: editResult.version || 2,
          updated_at: now,
        },
        error: editResult.errors.join('; '),
      };
    }
    // Complete failure
    return {
      success: false,
      message: `Failed to edit report: ${params.name}`,
      file: {
        id: params.id,
        name: params.name,
        content: '',
        version_number: 0,
        updated_at: now,
      },
      error: editResult.errors.join('; ') || 'All edit operations failed',
    };
  },
  { name: 'Modify Reports File' }
);

export function createModifyReportsExecute(
  context: ModifyReportsContext,
  state: ModifyReportsState
) {
  return wrapTraced(
    async (input: ModifyReportsInput): Promise<ModifyReportsOutput> => {
      if (input.id) {
        closeReportUpdateQueue(input.id);
      }
      const startTime = Date.now();

      try {
        // Always process using the complete input as source of truth
        // Execute should be the final authority, not delta
        console.info('[modify-reports] Processing modifications from complete input');
        const result = await modifyReportsFile(
          input,
          context,
          state.snapshotContent, // Pass immutable snapshot from state
          state.versionHistory, // Pass snapshot version history from state
          state // Pass state to access lastUpdate
        );

        if (!result) {
          throw new Error('Failed to process report modifications');
        }

        // Extract results
        const { success, file } = result;
        const { content: finalContent, version_number: versionNumber } = file;

        // Update state with final content
        state.finalContent = finalContent;
        state.version_number = versionNumber;

        // Update final status in state edits
        if (state.edits) {
          const finalStatus = success ? 'completed' : 'failed';
          state.edits.forEach((edit) => {
            edit.status = finalStatus;
          });
        }

        // Update message entries
        if (context.messageId) {
          try {
            const toolCallId = state.toolCallId || `tool-${Date.now()}`;

            // Create response message for modified report
            const responseMessages: ChatMessageResponseMessage[] = [];

            // Always create/update response message with final content from execute
            // Execute is the source of truth, even if delta created one already
            if (success && finalContent) {
              responseMessages.push({
                id: input.id,
                type: 'file' as const,
                file_type: 'report_file' as const,
                file_name: input.name,
                version_number: versionNumber,
                filter_version_id: null,
                metadata: [
                  {
                    status: 'completed' as const,
                    message: 'Report modified successfully',
                    timestamp: Date.now(),
                  },
                ],
              });
              state.responseMessageCreated = true;
            }

            const reasoningEntry = createModifyReportsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, toolCallId);
            const rawLlmResultEntry = createRawToolResultEntry(
              toolCallId,
              MODIFY_REPORTS_TOOL_NAME,
              result
            );

            const updates: Parameters<typeof updateMessageEntries>[0] = {
              messageId: context.messageId,
            };

            if (reasoningEntry) {
              updates.reasoningMessages = [reasoningEntry];
            }

            if (rawLlmMessage) {
              updates.rawLlmMessages = [rawLlmMessage, rawLlmResultEntry];
            }

            // Only add responseMessages if there are any
            if (responseMessages.length > 0) {
              updates.responseMessages = responseMessages;
            }

            if (reasoningEntry || rawLlmMessage || responseMessages.length > 0) {
              await updateMessageEntries(updates);
            }

            console.info('[modify-reports] Updated message entries with final results', {
              messageId: context.messageId,
              success,
              responseMessageCreated: responseMessages.length > 0,
            });
          } catch (error) {
            console.error('[modify-reports] Error updating message entries:', error);
            // Don't throw - return the result anyway
          }
        }

        // Track file associations if this is a new version (not part of same turn)
        if (context.messageId && success && state.version_number && state.version_number > 1) {
          try {
            await trackFileAssociations({
              messageId: context.messageId,
              files: [
                {
                  id: input.id,
                  version: versionNumber,
                },
              ],
            });
          } catch (error) {
            console.error('[modify-reports] Error tracking file associations:', error);
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[modify-reports] Execution completed', {
          executionTime: `${executionTime}ms`,
          success,
        });

        // Return the result directly
        cleanupState(state);
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const isAuthError =
          errorMessage.toLowerCase().includes('auth') ||
          errorMessage.toLowerCase().includes('permission');
        const isDatabaseError =
          errorMessage.toLowerCase().includes('database') ||
          errorMessage.toLowerCase().includes('connection');

        console.error('[modify-reports] Execution failed', {
          error: errorMessage,
          errorType: isAuthError ? 'auth' : isDatabaseError ? 'database' : 'general',
          executionTime: `${executionTime}ms`,
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Update message entries with failure status
        if (context.messageId) {
          try {
            const toolCallId = state.toolCallId || `tool-${Date.now()}`;

            // Mark all edits as failed with error message
            if (state.edits) {
              state.edits.forEach((edit) => {
                edit.status = 'failed';
                edit.error = edit.error || errorMessage;
              });
            }

            const reasoningEntry = createModifyReportsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, toolCallId);
            const failureOutput: ModifyReportsOutput = {
              success: false,
              message: 'Execution failed',
              file: {
                id: state.reportId || input.id || '',
                name: state.reportName || input.name || 'Untitled Report',
                content: state.finalContent || '',
                version_number: state.version_number || 0,
                updated_at: new Date().toISOString(),
              },
              error: error instanceof Error ? error.message : 'Unknown error',
            };

            const rawLlmResultEntry = createRawToolResultEntry(
              toolCallId,
              MODIFY_REPORTS_TOOL_NAME,
              failureOutput
            );

            const updates: Parameters<typeof updateMessageEntries>[0] = {
              messageId: context.messageId,
            };

            if (reasoningEntry) {
              updates.reasoningMessages = [reasoningEntry];
            }

            if (rawLlmMessage) {
              updates.rawLlmMessages = [rawLlmMessage, rawLlmResultEntry];
            }

            if (reasoningEntry || rawLlmMessage) {
              await updateMessageEntries(updates);
            }
          } catch (updateError) {
            console.error('[modify-reports] Error updating entries on failure:', updateError);
          }
        }

        // Only throw for critical errors (auth, database connection)
        // For other errors, return them in the response
        if (isAuthError || isDatabaseError) {
          cleanupState(state);
          throw error;
        }

        // Return error information to the agent
        cleanupState(state);
        return {
          success: false,
          message: `Failed to modify report: ${errorMessage}`,
          file: {
            id: input.id || '',
            name: input.name || 'Unknown',
            content: state.finalContent || '',
            version_number: state.version_number || 0,
            updated_at: new Date().toISOString(),
          },
          error: errorMessage,
        } as ModifyReportsOutput;
      }
    },
    { name: 'modify-reports-execute' }
  );
}
