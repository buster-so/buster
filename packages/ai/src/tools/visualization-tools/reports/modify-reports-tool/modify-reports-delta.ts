import { batchUpdateReport, db, reportFiles, updateMessageEntries } from '@buster/database';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import {
  normalizeEscapedText,
  unescapeJsonString,
} from '../../../../utils/streaming/escape-normalizer';
import {
  OptimisticJsonParser,
  getOptimisticValue,
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
            // We need to provide content for batchUpdateReport, so use the snapshot
            await batchUpdateReport({
              reportId: state.reportId,
              content: state.snapshotContent,
              name: name,
            });
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
            const code = rawCode ? normalizeEscapedText(unescapeJsonString(rawCode)) : '';

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

              // Apply the edit to a COPY of the snapshot and update database in real-time
              // Only process the first edit for now (multiple edits would need careful handling)
              if (index === 0) {
                // IMPORTANT: Work with a copy, never mutate the original snapshot
                let newContent = state.snapshotContent;

                if (operation === 'append') {
                  // For append, add the streaming code to the end of the snapshot copy
                  newContent = state.snapshotContent + code;
                } else if (operation === 'replace' && codeToReplace) {
                  // First, count occurrences of code_to_replace in the original snapshot
                  const matches = state.snapshotContent.split(codeToReplace).length - 1;

                  if (matches === 0) {
                    // Pattern not found, skip update
                    console.warn('[modify-reports-delta] Pattern not found in snapshot', {
                      codeToReplace: codeToReplace.substring(0, 50),
                      reportId: state.reportId,
                    });
                    continue;
                  }
                  if (matches > 1) {
                    // Multiple matches found, skip update to avoid ambiguity
                    console.warn(
                      '[modify-reports-delta] Multiple matches found, skipping replace',
                      {
                        codeToReplace: codeToReplace.substring(0, 50),
                        matchCount: matches,
                        reportId: state.reportId,
                      }
                    );
                    continue;
                  }
                  // Exactly one match found, now check if code has changed
                  if (code === codeToReplace) {
                    // Code hasn't changed yet, skip the database update
                    continue;
                  }
                  // Code has diverged, perform the replacement on a copy
                  newContent = state.snapshotContent.replace(codeToReplace, code);
                }

                // Check if we should increment version (not if report was created in current turn)
                const incrementVersion = await shouldIncrementVersion(
                  state.reportId,
                  context.messageId
                );

                // Calculate new version
                const currentVersion = state.snapshotVersion || 1;
                const newVersion = incrementVersion ? currentVersion + 1 : currentVersion;
                state.version_number = newVersion;

                // Track this modification for this tool invocation
                if (!state.reportsModifiedInMessage) {
                  state.reportsModifiedInMessage = new Set();
                }
                state.reportsModifiedInMessage.add(state.reportId);

                // Update version history
                const now = new Date().toISOString();
                const versionHistory = {
                  ...(state.versionHistory || {}),
                  [newVersion.toString()]: {
                    content: newContent,
                    updated_at: now,
                    version_number: newVersion,
                  },
                };

                // Update the database with the new content and version
                try {
                  await batchUpdateReport({
                    reportId: state.reportId,
                    content: newContent,
                    name: state.reportName || undefined,
                    versionHistory,
                  });

                  // Update cache with the new content for subsequent modifications
                  updateCachedSnapshot(state.reportId, newContent, versionHistory);

                  // Update state with the final content (but keep snapshot immutable)
                  state.finalContent = newContent;
                  state.versionHistory = versionHistory;
                  // DO NOT update state.snapshotContent - it must remain immutable

                  // Create response message if not already created
                  if (!state.responseMessageCreated && context.messageId) {
                    const responseMessages: ChatMessageResponseMessage[] = [
                      {
                        id: state.reportId,
                        type: 'file' as const,
                        file_type: 'report' as const,
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
                    const edit = state.edits[index];
                    if (edit) {
                      edit.status = 'failed';
                      edit.error = error instanceof Error ? error.message : 'Update failed';
                    }
                  }
                }
              }
            }
          }
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
