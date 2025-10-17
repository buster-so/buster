import { db } from '@buster/database/connection';
import {
  isReportUpdateQueueClosed,
  reopenReportUpdateQueue,
  updateMessageEntries,
  updateReportWithVersion,
  waitForPendingReportUpdates,
} from '@buster/database/queries';
import { reportFiles } from '@buster/database/schema';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import {
  normalizeEscapedText,
  unescapeJsonString,
} from '../../../../utils/streaming/escape-normalizer';
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../../utils/streaming/optimistic-json-parser';
import { shouldIncrementVersion } from '../helpers/report-version-helper';
import { getCachedSnapshot, updateCachedSnapshot } from '../report-snapshot-cache';
import {
  createModifyReportsRawLlmMessageEntry,
  createModifyReportsReasoningEntry,
} from './helpers/modify-reports-transform-helper';
import type {
  ModifyReportsContext,
  ModifyReportsEditState,
  ModifyReportsInput,
  ModifyReportsState,
} from './modify-reports-tool';

// Define TOOL_KEYS locally since we removed them from the helper
const TOOL_KEYS = {
  id: 'id' as const,
  name: 'name' as const,
  edits: 'edits' as const,
  code_to_replace: 'code_to_replace' as const,
  code: 'code' as const,
  operation: 'operation' as const,
};

export function createModifyReportsDelta(context: ModifyReportsContext, state: ModifyReportsState) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    if (state.reportId && isReportUpdateQueueClosed(state.reportId)) {
      return;
    }

    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Try to parse the accumulated JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText || '');

    if (parseResult.parsed) {
      // Extract values from parsed result
      const id = getOptimisticValue<string>(parseResult.extractedValues, TOOL_KEYS.id, '');
      const name = getOptimisticValue<string>(parseResult.extractedValues, TOOL_KEYS.name, '');
      const editsArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        TOOL_KEYS.edits,
        []
      );
      if (id && state.firstDelta) {
        state.firstDelta = false;
        reopenReportUpdateQueue(id);
      }

      // Validate that we have a complete UUID before processing
      // UUID format: 8-4-4-4-12 characters (36 total with hyphens)
      const isValidUUID = (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      // Update report metadata and fetch snapshot when COMPLETE ID is first received
      if (id && !state.reportId && isValidUUID(id)) {
        state.reportId = id;

        // Check cache first, then fetch from DB if needed
        try {
          // Try to get from cache first
          const cached = getCachedSnapshot(id);

          if (cached) {
            // Use cached snapshot
            state.snapshotContent = cached.content;
            state.lastSavedContent = cached.content; // Initialize with current content

            type VersionHistoryEntry = {
              content: string;
              updated_at: string;
              version_number: number;
            };

            const versionHistory = cached.versionHistory as Record<
              string,
              VersionHistoryEntry
            > | null;
            state.versionHistory = versionHistory || undefined;

            // Extract current version number from version history
            if (state.versionHistory) {
              const versionNumbers = Object.values(state.versionHistory).map(
                (v) => v.version_number
              );
              state.snapshotVersion = versionNumbers.length > 0 ? Math.max(...versionNumbers) : 1;
            } else {
              state.snapshotVersion = 1;
            }

            console.info('[modify-reports-delta] Using cached snapshot', {
              reportId: id,
              version: state.snapshotVersion,
            });
          } else {
            // Cache miss - fetch from database
            const existingReport = await db
              .select({
                content: reportFiles.content,
                versionHistory: reportFiles.versionHistory,
              })
              .from(reportFiles)
              .where(and(eq(reportFiles.id, id), isNull(reportFiles.deletedAt)))
              .limit(1);

            if (existingReport.length > 0 && existingReport[0]) {
              state.snapshotContent = existingReport[0].content;
              state.lastSavedContent = existingReport[0].content; // Initialize with current content

              type VersionHistoryEntry = {
                content: string;
                updated_at: string;
                version_number: number;
              };

              const versionHistory = existingReport[0].versionHistory as Record<
                string,
                VersionHistoryEntry
              > | null;
              state.versionHistory = versionHistory || undefined;

              // Extract current version number from version history
              if (state.versionHistory) {
                const versionNumbers = Object.values(state.versionHistory).map(
                  (v) => v.version_number
                );
                state.snapshotVersion = versionNumbers.length > 0 ? Math.max(...versionNumbers) : 1;
              } else {
                state.snapshotVersion = 1;
              }

              // Update cache for next time
              updateCachedSnapshot(id, existingReport[0].content, versionHistory);

              console.info('[modify-reports-delta] Fetched report snapshot from DB', {
                reportId: id,
                version: state.snapshotVersion,
              });
            } else {
              console.error('[modify-reports-delta] Report not found', { reportId: id });
            }
          }
        } catch (error) {
          console.error('[modify-reports-delta] Error fetching report snapshot:', error);
        }
      }

      // Update report name immediately when available
      if (name && state.reportName !== name) {
        state.reportName = name;

        // If we have a snapshot and report ID, update the name in the database
        if (state.snapshotContent !== undefined && state.reportId) {
          try {
            // We need to provide content for updateReportWithVersion, so use the snapshot
            await updateReportWithVersion({
              reportId: state.reportId,
              content: state.snapshotContent,
              name: name,
            });
            // Wait for the name update to fully complete in the queue
            await waitForPendingReportUpdates(state.reportId);
            console.info('[modify-reports-delta] Updated report name', {
              reportId: state.reportId,
              name,
            });
          } catch (error) {
            console.error('[modify-reports-delta] Error updating report name:', error);
          }
        }
      }

      // Process edits with streaming - only if we have a valid UUID and snapshot
      if (
        editsArray &&
        Array.isArray(editsArray) &&
        state.reportId &&
        isValidUUID(state.reportId) &&
        state.snapshotContent !== undefined
      ) {
        // Initialize state edits if needed
        if (!state.edits) {
          state.edits = [];
        }

        // Process each edit and apply to database in real-time
        for (let index = 0; index < editsArray.length; index++) {
          const edit = editsArray[index];
          if (edit && typeof edit === 'object') {
            const editObj = edit as Record<string, unknown>;
            const editMap = new Map(Object.entries(editObj));

            const operationValue = getOptimisticValue<string>(editMap, TOOL_KEYS.operation, '');
            const codeToReplace = getOptimisticValue<string>(
              editMap,
              TOOL_KEYS.code_to_replace,
              ''
            );
            const rawCode = getOptimisticValue<string>(editMap, TOOL_KEYS.code, '');
            // Unescape JSON string sequences, then normalize any double-escaped characters
            // Note: We preserve the code even if it's empty string, as that might be intentional
            const code =
              rawCode !== undefined
                ? normalizeEscapedText(unescapeJsonString(rawCode || ''))
                : undefined;

            if (code !== undefined) {
              // Use explicit operation if provided, otherwise infer from code_to_replace
              const operation =
                operationValue === 'append' || operationValue === 'replace'
                  ? operationValue
                  : codeToReplace === ''
                    ? 'append'
                    : 'replace';

              // Update state edit
              if (!state.edits[index]) {
                state.edits[index] = {
                  operation,
                  code_to_replace: codeToReplace || '',
                  code,
                  status: 'loading',
                };
              } else {
                // Update existing edit
                const existingEdit = state.edits[index];
                if (existingEdit) {
                  existingEdit.operation = operation;
                  existingEdit.code_to_replace = codeToReplace || '';
                  existingEdit.code = code;
                }
              }

              // Don't process individual edits here - we'll apply all edits at once below
            }
          }
        }

        // Queue the entire processing operation to ensure sequential execution
        if (state.edits && state.edits.length > 0 && state.snapshotContent !== undefined) {
          // Initialize the promise chain if this is the first processing
          if (!state.lastProcessing) {
            state.lastProcessing = Promise.resolve();
          }

          // Chain this processing to happen after the previous one completes
          state.lastProcessing = state.lastProcessing
            .then(async () => {
              // Apply ALL edits sequentially starting from the immutable snapshot
              // Start fresh from snapshot every time
              let currentContent = state.snapshotContent; // We checked it's defined above

              // Apply each edit in sequence
              for (const edit of state.edits || []) {
                // Skip if edit is null/undefined, but allow empty strings for code
                if (!edit || edit.code === undefined || edit.code === null) continue;

                const operation = edit.operation;
                const codeToReplace = edit.code_to_replace || '';
                const code = edit.code;

                if (operation === 'append') {
                  currentContent = (currentContent || '') + code;
                } else if (operation === 'replace' && codeToReplace) {
                  // Check if the pattern exists
                  if (!currentContent || !currentContent.includes(codeToReplace)) {
                    console.warn('[modify-reports-delta] Pattern not found during final apply', {
                      codeToReplace: codeToReplace.substring(0, 50),
                      reportId: state.reportId,
                    });
                    edit.status = 'failed';
                    edit.error = 'Pattern not found';
                    continue;
                  }
                  // Apply the replacement
                  currentContent = (currentContent || '').replace(codeToReplace, code);
                }

                edit.status = 'completed';
              }

              // Only update if content actually changed from what we last saved
              if (currentContent !== state.lastSavedContent) {
                // Check if we should increment version (not if report was created in current turn)
                const incrementVersion = await shouldIncrementVersion(
                  state.reportId || '',
                  context.messageId
                );

                // Calculate new version
                const currentVersion = state.snapshotVersion || 1;
                const newVersion = incrementVersion ? currentVersion + 1 : currentVersion;
                state.version_number = newVersion;

                // Track this modification for this tool invocation
                state.reportModifiedInMessage = true;

                // Update version history with the final content after all edits
                const now = new Date().toISOString();
                const versionHistory = {
                  ...(state.versionHistory || {}),
                  [newVersion.toString()]: {
                    content: currentContent || '',
                    updated_at: now,
                    version_number: newVersion,
                  },
                };

                // Update the database with the result of all edits
                try {
                  // We're already inside a check for state.reportId being defined
                  if (!state.reportId) {
                    throw new Error('Report ID is unexpectedly undefined');
                  }

                  // Perform the database write
                  await updateReportWithVersion({
                    reportId: state.reportId,
                    content: currentContent || '',
                    name: state.reportName || undefined,
                    versionHistory,
                  });

                  // Wait for the database update to fully complete in the queue
                  await waitForPendingReportUpdates(state.reportId);

                  console.info('[modify-reports-delta] Database write completed', {
                    reportId: state.reportId,
                    version: newVersion,
                  });

                  // Keep lastUpdate in sync for backward compatibility (already set via processing chain)

                  // No cache update during delta - execute will handle write-through

                  // Update state with the final content (but keep snapshot immutable)
                  state.finalContent = currentContent || '';
                  state.lastSavedContent = currentContent || ''; // Track what we just saved
                  state.versionHistory = versionHistory;
                  // DO NOT update state.snapshotContent - it must remain immutable

                  // Create response message if not already created
                  if (!state.responseMessageCreated && context.messageId) {
                    const responseMessages: ChatMessageResponseMessage[] = [
                      {
                        id: state.reportId,
                        type: 'file' as const,
                        file_type: 'report_file' as const,
                        file_name: state.reportName || 'Untitled Report',
                        version_number: newVersion,
                        filter_version_id: null,
                        metadata: [
                          {
                            status: 'completed' as const,
                            message: 'Report modified successfully',
                            timestamp: Date.now(),
                          },
                        ],
                      },
                    ];

                    await updateMessageEntries({
                      messageId: context.messageId,
                      responseMessages,
                    });

                    state.responseMessageCreated = true;
                    console.info(
                      '[modify-reports-delta] Created response message during streaming'
                    );
                  }
                } catch (error) {
                  console.error('[modify-reports-delta] Error updating report content:', error);
                  if (state.edits) {
                    state.edits.forEach((edit) => {
                      if (edit) {
                        edit.status = 'failed';
                        edit.error = error instanceof Error ? error.message : 'Update failed';
                      }
                    });
                  }
                  // Re-throw to be caught by the outer catch
                  throw error;
                }
              }
            })
            .catch((error) => {
              // Log error but don't break the chain - allow subsequent processing to continue
              console.error('[modify-reports-delta] Processing failed:', error);
              // Don't re-throw - let the chain continue for resilience
            });

          // Clean up the processing entry once this completes
          state.lastProcessing.finally(() => {
            // Only remove if this is still the current processing
            // This cleanup is handled by the execute function
          });
        }
      }
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createModifyReportsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, options.toolCallId);

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
        console.error('[modify-reports] Error updating entries during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
