import { batchUpdateReport, updateMessageEntries } from '@buster/database';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import { wrapTraced } from 'braintrust';
import { createRawToolResultEntry } from '../../../shared/create-raw-llm-tool-result-entry';
import { extractAndCacheMetricsWithUserContext } from '../helpers/metric-extraction';
import { updateCachedSnapshot } from '../report-snapshot-cache';
import type {
  CreateReportsContext,
  CreateReportsInput,
  CreateReportsOutput,
  CreateReportsState,
} from './create-reports-tool';
import { CREATE_REPORTS_TOOL_NAME } from './create-reports-tool';
import {
  createCreateReportsRawLlmMessageEntry,
  createCreateReportsReasoningEntry,
} from './helpers/create-reports-tool-transform-helper';

// Main create report files function - returns success status
const getReportCreationResults = wrapTraced(
  async (
    params: CreateReportsInput,
    context: CreateReportsContext,
    state?: CreateReportsState
  ): Promise<CreateReportsOutput> => {
    // Get context values
    const userId = context.userId;
    const organizationId = context.organizationId;

    if (!userId) {
      return {
        message: 'Unable to verify your identity. Please log in again.',
        files: [],
        failed_files: [],
      };
    }
    if (!organizationId) {
      return {
        message: 'Unable to access your organization. Please check your permissions.',
        files: [],
        failed_files: [],
      };
    }

    // Reports have already been created and updated in the delta function
    // Here we just return the final status
    const files = state?.files || [];
    const successfulFiles = files.filter((f) => f.id && f.file_name && f.status === 'completed');
    const failedFiles: Array<{ name: string; error: string }> = [];

    // Check for any files that weren't successfully created
    params.files.forEach((inputFile, index) => {
      const stateFile = state?.files?.[index];
      if (!stateFile || !stateFile.id || stateFile.status === 'failed') {
        failedFiles.push({
          name: inputFile.name,
          error: stateFile?.error || 'Failed to create report',
        });
      }
    });

    // Generate result message
    let message: string;
    if (failedFiles.length === 0) {
      message = `Successfully created ${successfulFiles.length} report file${successfulFiles.length !== 1 ? 's' : ''}.`;
    } else if (successfulFiles.length === 0) {
      message = `Failed to create all report files.`;
    } else {
      message = `Successfully created ${successfulFiles.length} report file${successfulFiles.length !== 1 ? 's' : ''}. Failed to create ${failedFiles.length} file${failedFiles.length !== 1 ? 's' : ''}.`;
    }

    return {
      message,
      files: successfulFiles.map((f) => ({
        id: f.id,
        name: f.file_name || '',
        version_number: f.version_number,
      })),
      failed_files: failedFiles,
    };
  },
  { name: 'Get Report Creation Results' }
);

export function createCreateReportsExecute(
  context: CreateReportsContext,
  state: CreateReportsState
) {
  return wrapTraced(
    async (input: CreateReportsInput): Promise<CreateReportsOutput> => {
      const startTime = Date.now();

      try {
        // Create initial database entries (moved from start.ts)
        if (context.messageId && !state.initialEntriesCreated) {
          try {
            const toolCallId = state.toolCallId || `tool-${Date.now()}`;
            const reasoningEntry = createCreateReportsReasoningEntry(state, toolCallId);
            // Skip creating rawLlmMessage here to avoid duplicates - it will be created with the result later

            const updates: Parameters<typeof updateMessageEntries>[0] = {
              messageId: context.messageId,
            };

            if (reasoningEntry) {
              updates.reasoningMessages = [reasoningEntry];
            }

            if (reasoningEntry) {
              await updateMessageEntries(updates);
              state.initialEntriesCreated = true;
            }
          } catch (error) {
            console.error('[create-reports] Error creating initial database entries:', error);
          }
        }

        // Ensure all reports that were created during delta have complete content from input
        // IMPORTANT: The input is the source of truth for content, not any streaming updates
        // Delta phase creates reports with empty/partial content, execute phase ensures complete content
        console.info('[create-reports] Ensuring all reports have complete content from input');

        for (let i = 0; i < input.files.length; i++) {
          const inputFile = input.files[i];
          if (!inputFile) continue;

          const { name, content } = inputFile;

          // Only update reports that were successfully created during delta phase
          const reportId = state.files?.[i]?.id;

          if (!reportId) {
            // Report wasn't created during delta - mark as failed
            console.warn('[create-reports] Report was not created during delta phase', { name });

            if (!state.files) {
              state.files = [];
            }
            state.files[i] = {
              id: '',
              file_name: name,
              file_type: 'report',
              version_number: 1,
              status: 'failed',
              error: 'Report creation failed during streaming',
            };
            continue;
          }

          try {
            // Create initial version history for the report
            const now = new Date().toISOString();
            const versionHistory = {
              '1': {
                content,
                updated_at: now,
                version_number: 1,
              },
            };

            // Update the report with complete content from input (source of truth)
            await batchUpdateReport({
              reportId,
              content,
              name,
              versionHistory,
            });

            // Update cache with the newly created report content
            updateCachedSnapshot(reportId, content, versionHistory);

            // Cache any metrics in the report content
            if (context.userId) {
              extractAndCacheMetricsWithUserContext(content, reportId, context.userId).catch(
                (error) => {
                  console.error('[create-reports] Failed to cache metrics for report', {
                    reportId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  });
                }
              );
            }

            // Update state to reflect successful update
            if (!state.files) {
              state.files = [];
            }
            if (!state.files[i]) {
              state.files[i] = {
                id: reportId,
                file_name: name,
                file_type: 'report',
                version_number: 1,
                status: 'completed',
              };
            } else {
              const stateFile = state.files[i];
              if (stateFile) {
                stateFile.status = 'completed';
              }
            }

            console.info('[create-reports] Successfully updated report with complete content', {
              reportId,
              name,
              contentLength: content.length,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update report';
            console.error('[create-reports] Error updating report content:', {
              reportId,
              name,
              error: errorMessage,
            });

            // Update state to reflect failure
            if (!state.files) {
              state.files = [];
            }
            if (!state.files[i]) {
              state.files[i] = {
                id: reportId,
                file_name: name,
                file_type: 'report',
                version_number: 1,
                status: 'failed',
                error: errorMessage,
              };
            } else {
              const stateFile = state.files[i];
              if (stateFile) {
                stateFile.status = 'failed';
                stateFile.error = errorMessage;
              }
            }
          }
        }

        // Get the results (after ensuring all reports are properly created)
        const result = await getReportCreationResults(input, context, state);

        // Update state files with final results
        if (result && typeof result === 'object') {
          const typedResult = result as CreateReportsOutput;
          // Ensure state.files is initialized for safe mutations below
          state.files = state.files ?? [];

          // Mark any remaining files as completed/failed based on result
          if (state.files) {
            state.files.forEach((stateFile) => {
              if (stateFile.status === 'loading') {
                // Check if this file is in the success list
                const isSuccess = typedResult.files?.some((f) => f.id === stateFile.id);
                stateFile.status = isSuccess ? 'completed' : 'failed';
              }
            });
          }

          // Update last entries if we have a messageId
          if (context.messageId) {
            try {
              const finalStatus = typedResult.failed_files?.length ? 'failed' : 'completed';
              const toolCallId = state.toolCallId || `tool-${Date.now()}`;

              // Update state for final status
              if (state.files) {
                state.files.forEach((f) => {
                  if (!f.status || f.status === 'loading') {
                    f.status = finalStatus === 'failed' ? 'failed' : 'completed';
                  }
                });
              }

              // Check which reports contain metrics to determine if they should be in responseMessages
              const responseMessages: ChatMessageResponseMessage[] = [];

              // Check each report file for metrics
              if (state.files && typedResult.files) {
                for (const resultFile of typedResult.files) {
                  // Skip if response message was already created during delta
                  if (state.responseMessagesCreated?.has(resultFile.id)) {
                    continue;
                  }

                  // Find the corresponding state file
                  const stateFile = state.files.find((f) => f.id === resultFile.id);
                  if (stateFile) {
                    responseMessages.push({
                      id: stateFile.id,
                      type: 'file' as const,
                      file_type: 'report' as const,
                      file_name: stateFile.file_name || resultFile.name,
                      version_number: stateFile.version_number || 1,
                      filter_version_id: null,
                      metadata: [
                        {
                          status: 'completed' as const,
                          message: 'Report created successfully',
                          timestamp: Date.now(),
                        },
                      ],
                    });

                    // Track that we've created a response message for this report
                    if (!state.responseMessagesCreated) {
                      state.responseMessagesCreated = new Set<string>();
                    }
                    state.responseMessagesCreated.add(resultFile.id);
                  }
                }
              }

              const reasoningEntry = createCreateReportsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, toolCallId);
              const rawLlmResultEntry = createRawToolResultEntry(
                toolCallId,
                CREATE_REPORTS_TOOL_NAME,
                {
                  files: state.files,
                }
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

              // Only add responseMessages if there are reports with metrics
              if (responseMessages.length > 0) {
                updates.responseMessages = responseMessages;
              }

              if (reasoningEntry || rawLlmMessage || responseMessages.length > 0) {
                await updateMessageEntries(updates);
              }

              console.info('[create-reports] Updated last entries with final results', {
                messageId: context.messageId,
                successCount: typedResult.files?.length || 0,
                failedCount: typedResult.failed_files?.length || 0,
                reportsWithMetrics: responseMessages.length,
              });
            } catch (error) {
              console.error('[create-reports] Error updating final entries:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[create-reports] Execution completed', {
          executionTime: `${executionTime}ms`,
          filesCreated: result?.files?.length || 0,
          filesFailed: result?.failed_files?.length || 0,
        });

        return result as CreateReportsOutput;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const isAuthError =
          errorMessage.toLowerCase().includes('auth') ||
          errorMessage.toLowerCase().includes('permission');
        const isDatabaseError =
          errorMessage.toLowerCase().includes('database') ||
          errorMessage.toLowerCase().includes('connection');

        console.error('[create-reports] Execution failed', {
          error: errorMessage,
          errorType: isAuthError ? 'auth' : isDatabaseError ? 'database' : 'general',
          executionTime: `${executionTime}ms`,
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Update last entries with failure status if possible
        if (context.messageId) {
          try {
            const toolCallId = state.toolCallId || `tool-${Date.now()}`;
            // Update state files to failed status with error message
            if (state.files) {
              state.files.forEach((f) => {
                f.status = 'failed';
                f.error = f.error || errorMessage;
              });
            }

            const reasoningEntry = createCreateReportsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, toolCallId);
            const rawLlmResultEntry = createRawToolResultEntry(
              toolCallId,
              CREATE_REPORTS_TOOL_NAME,
              {
                files: state.files,
              }
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
            console.error('[create-reports] Error updating entries on failure:', updateError);
          }
        }

        // Only throw for critical errors (auth, database connection)
        // For other errors, return them in the response
        if (isAuthError || isDatabaseError) {
          throw error;
        }

        // Return error information to the agent
        const failedFiles: Array<{ name: string; error: string }> = [];
        input.files.forEach((inputFile, index) => {
          const stateFile = state.files?.[index];
          failedFiles.push({
            name: inputFile.name,
            error: stateFile?.error || errorMessage,
          });
        });

        return {
          message: `Failed to create reports: ${errorMessage}`,
          files: [],
          failed_files: failedFiles,
        } as CreateReportsOutput;
      }
    },
    { name: 'create-reports-execute' }
  );
}
