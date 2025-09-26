import {
  batchUpdateReport,
  updateMessageEntries,
  updateMetricsToReports,
} from '@buster/database/queries';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import { wrapTraced } from 'braintrust';
import { cleanupState } from '../../../shared/cleanup-state';
import { createRawToolResultEntry } from '../../../shared/create-raw-llm-tool-result-entry';
import { trackFileAssociations } from '../../file-tracking-helper';
import {
  extractAndCacheMetricsWithUserContext,
  extractMetricIds,
} from '../helpers/metric-extraction';
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

// Main create report function - returns success status
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
        error: 'Authentication error',
      };
    }
    if (!organizationId) {
      return {
        message: 'Unable to access your organization. Please check your permissions.',
        error: 'Authorization error',
      };
    }

    // Report has already been created and updated in the delta function
    // Here we just return the final status
    const file = state?.file;

    if (!file || !file.id || file.status === 'failed') {
      return {
        message: `Failed to create report: ${file?.error || 'Unknown error'}`,
        error: file?.error || 'Failed to create report',
      };
    }

    // Generate result message
    const message = `Successfully created report file.`;

    return {
      message,
      file: {
        id: file.id,
        name: file.file_name || params.name,
        version_number: file.version_number,
      },
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

        // Ensure the report that was created during delta has complete content from input
        // IMPORTANT: The input is the source of truth for content, not any streaming updates
        // Delta phase creates report with empty/partial content, execute phase ensures complete content
        console.info('[create-reports] Ensuring report has complete content from input');

        const { name, content } = input;

        // Only update report that was successfully created during delta phase
        const reportId = state.file?.id;

        if (!reportId) {
          // Report wasn't created during delta - mark as failed
          console.warn('[create-reports] Report was not created during delta phase', { name });

          state.file = {
            id: '',
            file_name: name,
            file_type: 'report_file',
            version_number: 1,
            status: 'failed',
            error: 'Report creation failed during streaming',
            file: {
              text: content,
            },
          };
        } else {
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

            const metricIds = extractMetricIds(content);

            console.info('[create-reports] Updating metrics to reports', {
              reportId,
              metricIds,
              userId: context.userId,
            });

            if (metricIds.length > 0) {
              await updateMetricsToReports({
                reportId,
                metricIds,
                userId: context.userId,
              });
            }

            // Track file associations if messageId is available
            if (context.messageId) {
              await trackFileAssociations({
                messageId: context.messageId,
                files: [
                  {
                    id: reportId,
                    version: versionHistory['1'].version_number,
                  },
                ],
              });
            }

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
            // Include content so rawLlmMessage can be created properly
            state.file = {
              id: reportId,
              file_name: name,
              file_type: 'report_file',
              version_number: 1,
              status: 'completed',
              file: {
                text: content,
              },
            };

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
            state.file = {
              id: reportId,
              file_name: name,
              file_type: 'report_file',
              version_number: 1,
              status: 'failed',
              error: errorMessage,
              file: {
                text: content,
              },
            };
          }
        }

        // Get the results (after ensuring all reports are properly created)
        const result = await getReportCreationResults(input, context, state);

        // Update state file with final results
        if (result && typeof result === 'object') {
          const typedResult = result as CreateReportsOutput;

          // Mark file as completed/failed based on result
          if (state.file && state.file.status === 'loading') {
            state.file.status = typedResult.file ? 'completed' : 'failed';
          }

          // Update last entries if we have a messageId
          if (context.messageId) {
            try {
              const finalStatus = typedResult.error ? 'failed' : 'completed';
              const toolCallId = state.toolCallId || `tool-${Date.now()}`;

              // Update state for final status
              if (state.file && (!state.file.status || state.file.status === 'loading')) {
                state.file.status = finalStatus;
              }

              // Check if report should be in responseMessages
              const responseMessages: ChatMessageResponseMessage[] = [];

              // Check if report file exists and hasn't been added to response
              if (state.file && typedResult.file && !state.responseMessageCreated) {
                responseMessages.push({
                  id: state.file.id,
                  type: 'file' as const,
                  file_type: 'report_file' as const,
                  file_name: state.file.file_name || typedResult.file.name,
                  version_number: state.file.version_number || 1,
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
                state.responseMessageCreated = true;
              }

              const reasoningEntry = createCreateReportsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, toolCallId);
              const rawLlmResultEntry = createRawToolResultEntry(
                toolCallId,
                CREATE_REPORTS_TOOL_NAME,
                typedResult
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
                success: !!typedResult.file,
                failed: !!typedResult.error,
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
          fileCreated: !!result?.file,
          failed: !!result?.error,
        });

        cleanupState(state);
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
            // Update state file to failed status with error message
            if (state.file) {
              state.file.status = 'failed';
              state.file.error = state.file.error || errorMessage;
            }

            const reasoningEntry = createCreateReportsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, toolCallId);
            const errorResult: CreateReportsOutput = {
              message: `Failed to create report: ${errorMessage}`,
              error: errorMessage,
            };
            const rawLlmResultEntry = createRawToolResultEntry(
              toolCallId,
              CREATE_REPORTS_TOOL_NAME,
              errorResult
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
          cleanupState(state);
          throw error;
        }

        // Return error information to the agent
        cleanupState(state);
        return {
          message: `Failed to create report: ${errorMessage}`,
          error: state.file?.error || errorMessage,
        } as CreateReportsOutput;
      }
    },
    { name: 'create-reports-execute' }
  );
}
