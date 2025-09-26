import { db } from '@buster/database/connection';
import { updateMessageEntries } from '@buster/database/queries';
import { dashboardFiles, metricFiles, metricFilesToDashboardFiles } from '@buster/database/schema';
import { wrapTraced } from 'braintrust';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import {
  type DashboardYml,
  DashboardYmlSchema,
} from '../../../../../../server-shared/src/dashboards/dashboard.types';
import { cleanupState } from '../../../shared/cleanup-state';
import { createRawToolResultEntry } from '../../../shared/create-raw-llm-tool-result-entry';
import { trackFileAssociations } from '../../file-tracking-helper';
import {
  createModifyDashboardsRawLlmMessageEntry,
  createModifyDashboardsReasoningEntry,
} from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsContext,
  ModifyDashboardsInput,
  ModifyDashboardsOutput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';
import { MODIFY_DASHBOARDS_TOOL_NAME } from './modify-dashboards-tool';

// Type definitions
type DashboardWithMetadata = DashboardYml;

interface FileWithId {
  id: string;
  name: string;
  file_type: string;
  result_message?: string;
  results?: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
  version_number: number;
  content?: DashboardYml;
  metric_ids?: string[]; // IDs of metrics included in this dashboard
}

interface FailedFileModification {
  id: string;
  error: string;
}

type VersionHistory = (typeof dashboardFiles.$inferSelect)['versionHistory'];

// Helper function to get latest version number
function getLatestVersionNumber(versionHistory: VersionHistory | null): number {
  if (!versionHistory || Object.keys(versionHistory).length === 0) {
    return 0;
  }
  // Get all version numbers from the record values, filtering out null/undefined/NaN
  const versionNumbers = Object.values(versionHistory)
    .map((v) => v.version_number)
    .filter((n) => typeof n === 'number' && !Number.isNaN(n));

  return versionNumbers.length > 0 ? Math.max(...versionNumbers) : 0;
}

// Helper function to add dashboard version to history
function addDashboardVersionToHistory(
  versionHistory: VersionHistory | null,
  dashboard: DashboardWithMetadata,
  createdAt: string
): VersionHistory {
  const newVersionNumber = getLatestVersionNumber(versionHistory) + 1;

  // Create new version entry matching the schema
  const newVersionEntry = {
    content: dashboard as Record<string, unknown>,
    updated_at: createdAt,
    version_number: newVersionNumber,
  };

  // Create new version history record
  const updatedHistory = {
    ...(versionHistory || {}),
    [newVersionNumber.toString()]: newVersionEntry,
  };

  return updatedHistory;
}

type ModifyDashboardFilesParams = ModifyDashboardsInput;
type ModifyDashboardFilesOutput = ModifyDashboardsOutput;

// Parse and validate dashboard YAML content
function parseAndValidateYaml(ymlContent: string): {
  success: boolean;
  error?: string;
  data?: DashboardWithMetadata;
} {
  try {
    const parsedYml = yaml.parse(ymlContent);
    const validationResult = DashboardYmlSchema.safeParse(parsedYml);

    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid YAML structure: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }

    // Return the validated dashboard
    const dashboard: DashboardWithMetadata = validationResult.data;

    return { success: true, data: dashboard };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'YAML parsing failed',
    };
  }
}

// Validate that all referenced metric IDs exist in the database
async function validateMetricIds(
  metricIds: string[]
): Promise<{ success: boolean; missingIds?: string[]; error?: string }> {
  if (metricIds.length === 0) {
    return { success: true };
  }

  try {
    const existingMetrics = await db
      .select({ id: metricFiles.id })
      .from(metricFiles)
      .where(inArray(metricFiles.id, metricIds))
      .execute();

    const existingIds = existingMetrics.map((m) => m.id);
    const missingIds = metricIds.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0) {
      return { success: false, missingIds };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate metric IDs',
    };
  }
}

// Process a dashboard file modification request
async function processDashboardFile(file: { id: string; yml_content: string }): Promise<{
  success: boolean;
  dashboardFile?: FileWithId;
  dashboard?: DashboardWithMetadata;
  existingFile?: typeof dashboardFiles.$inferSelect;
  error?: string;
}> {
  // Get the dashboard file from database
  const dashboardFileRecord = await db
    .select()
    .from(dashboardFiles)
    .where(eq(dashboardFiles.id, file.id))
    .execute();

  if (dashboardFileRecord.length === 0) {
    return {
      success: false,
      error:
        'The dashboard you are trying to modify does not exist. Please check the dashboard ID.',
    };
  }

  const existingFile = dashboardFileRecord[0];
  if (!existingFile) {
    return {
      success: false,
      error: 'Unable to retrieve the dashboard file. Please try again.',
    };
  }

  // Parse and validate YAML
  const yamlValidation = parseAndValidateYaml(file.yml_content);
  if (!yamlValidation.success) {
    return {
      success: false,
      error: yamlValidation.error || 'The dashboard configuration format is incorrect.',
    };
  }

  const dashboard = yamlValidation.data;
  if (!dashboard) {
    return {
      success: false,
      error: 'Failed to parse dashboard YAML data.',
    };
  }

  // Collect all metric IDs from rows if they exist
  const metricIds: string[] = dashboard.rows
    ? dashboard.rows.flatMap((row) => row.items).map((item) => item.id)
    : [];

  // Validate metric IDs if any exist
  if (metricIds.length > 0) {
    const metricValidation = await validateMetricIds(metricIds);
    if (!metricValidation.success) {
      if (metricValidation.missingIds) {
        return {
          success: false,
          error:
            'Some metrics referenced in the dashboard do not exist. Please create the metrics first before adding them to a dashboard.',
        };
      }
      return {
        success: false,
        error: 'Unable to verify the metrics. Please try again or contact support.',
      };
    }
  }

  // Get the latest version number
  const currentVersionHistory = existingFile.versionHistory as VersionHistory | null;
  const latestVersion = getLatestVersionNumber(currentVersionHistory) + 1;

  const dashboardFile: FileWithId = {
    id: file.id,
    name: dashboard.name,
    file_type: 'dashboard_file',
    created_at: existingFile.createdAt,
    updated_at: new Date().toISOString(),
    version_number: latestVersion,
    content: dashboard, // Store the full dashboard object
  };

  return {
    success: true,
    dashboardFile,
    dashboard,
    existingFile,
  };
}

function generateResultMessage(
  modifiedFiles: FileWithId[],
  failedFiles: FailedFileModification[]
): string {
  if (failedFiles.length === 0) {
    return `Successfully modified ${modifiedFiles.length} dashboard ${modifiedFiles.length === 1 ? 'file' : 'files'}.`;
  }

  const successMsg =
    modifiedFiles.length > 0
      ? `Successfully modified ${modifiedFiles.length} dashboard ${modifiedFiles.length === 1 ? 'file' : 'files'}. `
      : '';

  const failures = failedFiles.map(
    (failure) =>
      `Failed to modify dashboard '${failure.id}': ${failure.error}.\n\nPlease check the dashboard configuration and try again. This error could be due to:\n- Invalid metric UUIDs (please check that the metrics exist)\n- Invalid configuration in the dashboard file\n- Row configuration errors (column sizes must sum to 12)\n- The dashboard file does not exist`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to modify ${failures.length} dashboard files:\n${failures.join('\n')}`;
}

// Main modify dashboard files function
const modifyDashboardFiles = wrapTraced(
  async (
    params: ModifyDashboardFilesParams,
    context: ModifyDashboardsContext,
    _state?: ModifyDashboardsState
  ): Promise<ModifyDashboardFilesOutput> => {
    // Get context values
    const userId = context.userId;
    const organizationId = context.organizationId;
    const messageId = context.messageId;

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

    const files: FileWithId[] = [];
    const failedFiles: FailedFileModification[] = [];

    // Process files concurrently
    const processResults = await Promise.allSettled(
      params.files.map(async (file) => {
        const result = await processDashboardFile(file);
        return { fileId: file.id, result };
      })
    );

    const successfulProcessing: Array<{
      dashboardFile: FileWithId;
      dashboard: DashboardWithMetadata;
      existingFile: typeof dashboardFiles.$inferSelect;
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileId, result } = processResult.value;
        if (result.success && result.dashboardFile && result.dashboard && result.existingFile) {
          successfulProcessing.push({
            dashboardFile: result.dashboardFile,
            dashboard: result.dashboard,
            existingFile: result.existingFile,
          });
        } else {
          failedFiles.push({
            id: fileId,
            error: result.error || 'Unknown error',
          });
        }
      } else {
        failedFiles.push({
          id: 'unknown',
          error: processResult.reason?.message || 'Processing failed',
        });
      }
    }

    // Database operations
    if (successfulProcessing.length > 0) {
      try {
        await db.transaction(async (tx: typeof db) => {
          // Update dashboard files
          for (const sp of successfulProcessing) {
            // Add new version to history
            const updatedVersionHistory = addDashboardVersionToHistory(
              sp.existingFile.versionHistory as VersionHistory | null,
              sp.dashboard,
              new Date().toISOString()
            );

            await tx
              .update(dashboardFiles)
              .set({
                content: sp.dashboard as Record<string, unknown>,
                updatedAt: sp.dashboardFile.updated_at,
                versionHistory: updatedVersionHistory,
                name: sp.dashboard.name,
              })
              .where(eq(dashboardFiles.id, sp.dashboardFile.id))
              .execute();

            // Update metric associations
            const newMetricIds = sp.dashboard.rows
              ? sp.dashboard.rows.flatMap((row) => row.items).map((item) => item.id)
              : [];

            const existingAssociations = await tx
              .select({ metricFileId: metricFilesToDashboardFiles.metricFileId })
              .from(metricFilesToDashboardFiles)
              .where(
                and(
                  eq(metricFilesToDashboardFiles.dashboardFileId, sp.dashboardFile.id),
                  isNull(metricFilesToDashboardFiles.deletedAt)
                )
              )
              .execute();

            const existingMetricIds = existingAssociations.map((a) => a.metricFileId);

            // Add new associations
            const addedMetricIds = newMetricIds.filter(
              (id: string) => !existingMetricIds.includes(id)
            );
            for (const metricId of addedMetricIds) {
              await tx
                .insert(metricFilesToDashboardFiles)
                .values({
                  metricFileId: metricId,
                  dashboardFileId: sp.dashboardFile.id,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                  createdBy: userId,
                })
                .onConflictDoUpdate({
                  target: [
                    metricFilesToDashboardFiles.metricFileId,
                    metricFilesToDashboardFiles.dashboardFileId,
                  ],
                  set: {
                    deletedAt: null,
                    updatedAt: new Date().toISOString(),
                  },
                })
                .execute();
            }

            // Remove old associations
            const removedMetricIds = existingMetricIds.filter(
              (id: string) => !newMetricIds.includes(id)
            );
            if (removedMetricIds.length > 0) {
              await tx
                .update(metricFilesToDashboardFiles)
                .set({
                  deletedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
                .where(
                  and(
                    eq(metricFilesToDashboardFiles.dashboardFileId, sp.dashboardFile.id),
                    inArray(metricFilesToDashboardFiles.metricFileId, removedMetricIds),
                    isNull(metricFilesToDashboardFiles.deletedAt)
                  )
                )
                .execute();
            }
          }
        });

        // Add successful files to output
        for (const sp of successfulProcessing) {
          // Extract metric IDs from the dashboard
          const metricIds: string[] = sp.dashboard.rows
            ? sp.dashboard.rows.flatMap((row) => row.items).map((item) => item.id)
            : [];

          files.push({
            id: sp.dashboardFile.id,
            name: sp.dashboardFile.name,
            file_type: sp.dashboardFile.file_type,
            result_message: sp.dashboardFile.result_message || '',
            results: sp.dashboardFile.results || [],
            created_at: sp.dashboardFile.created_at,
            updated_at: sp.dashboardFile.updated_at,
            version_number: sp.dashboardFile.version_number,
            metric_ids: metricIds, // Include metric IDs in the output
          });
        }
      } catch (error) {
        // Add all successful processing to failed if database operation fails
        for (const sp of successfulProcessing) {
          failedFiles.push({
            id: sp.dashboardFile.id,
            error: `Failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }
    }

    // Track file associations if messageId is available
    if (messageId && files.length > 0) {
      await trackFileAssociations({
        messageId,
        files: files.map((file) => ({
          id: file.id,
          version: file.version_number,
        })),
      });
    }

    const message = generateResultMessage(files, failedFiles);

    return {
      message,
      files,
      failed_files: failedFiles,
    };
  },
  { name: 'Modify Dashboard Files' }
);

export function createModifyDashboardsExecute(
  context: ModifyDashboardsContext,
  state: ModifyDashboardsState
) {
  return wrapTraced(
    async (input: ModifyDashboardsInput): Promise<ModifyDashboardsOutput> => {
      const startTime = Date.now();

      try {
        // Call the main function directly, passing state for dashboard IDs
        const result = await modifyDashboardFiles(
          input as ModifyDashboardFilesParams,
          context,
          state
        );

        // Update state files with final results (IDs, versions, status)
        if (result && typeof result === 'object') {
          const typedResult = result as ModifyDashboardsOutput;
          // Ensure state.files is initialized for safe mutations below
          state.files = state.files ?? [];

          // Update successful files
          if (typedResult.files && Array.isArray(typedResult.files)) {
            typedResult.files.forEach((file) => {
              const stateFile = (state.files ?? []).find((f) => f.id === file.id);
              if (stateFile) {
                stateFile.file_name = file.name;
                stateFile.version_number = file.version_number;
                stateFile.status = 'completed';
              }
            });
          }

          // Update failed files
          if (typedResult.failed_files && Array.isArray(typedResult.failed_files)) {
            typedResult.failed_files.forEach((failedFile) => {
              const stateFile = (state.files ?? []).find((f) => f.id === failedFile.id);
              if (stateFile) {
                stateFile.status = 'failed';
                // Add error to the state file if needed (not part of the current schema)
              }
            });
          }

          // Update last entries if we have a messageId (no need for explicit entry IDs)
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

              const reasoningEntry = createModifyDashboardsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createModifyDashboardsRawLlmMessageEntry(state, toolCallId);
              const rawLlmResultEntry = createRawToolResultEntry(
                toolCallId,
                MODIFY_DASHBOARDS_TOOL_NAME,
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

              console.info('[modify-dashboards] Updated last entries with final results', {
                messageId: context.messageId,
                successCount: typedResult.files?.length || 0,
                failedCount: typedResult.failed_files?.length || 0,
              });
            } catch (error) {
              console.error('[modify-dashboards] Error updating final entries:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[modify-dashboards] Execution completed', {
          executionTime: `${executionTime}ms`,
          filesModified: result?.files?.length || 0,
          filesFailed: result?.failed_files?.length || 0,
        });

        cleanupState(state);
        return result as ModifyDashboardsOutput;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error('[modify-dashboards] Execution failed', {
          error,
          executionTime: `${executionTime}ms`,
        });

        // Update last entries with failure status if possible
        if (context.messageId) {
          try {
            const toolCallId = state.toolCallId || `tool-${Date.now()}`;
            // Update state files to failed status
            if (state.files) {
              state.files.forEach((f) => {
                f.status = 'failed';
              });
            }

            const reasoningEntry = createModifyDashboardsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createModifyDashboardsRawLlmMessageEntry(state, toolCallId);
            const rawLlmResultEntry = createRawToolResultEntry(
              toolCallId,
              MODIFY_DASHBOARDS_TOOL_NAME,
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
            console.error('[modify-dashboards] Error updating entries on failure:', updateError);
          }
        }

        cleanupState(state);
        throw error;
      }
    },
    { name: 'modify-dashboards-execute' }
  );
}
