import { randomUUID } from 'node:crypto';
import { db } from '@buster/database/connection';
import { updateMessageEntries } from '@buster/database/queries';
import {
  assetPermissions,
  dashboardFiles,
  metricFiles,
  metricFilesToDashboardFiles,
} from '@buster/database/schema';
import { wrapTraced } from 'braintrust';
import { inArray } from 'drizzle-orm';
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
  CREATE_DASHBOARDS_TOOL_NAME,
  type CreateDashboardsContext,
  type CreateDashboardsInput,
  type CreateDashboardsOutput,
  type CreateDashboardsState,
} from './create-dashboards-tool';
import {
  createCreateDashboardsRawLlmMessageEntry,
  createCreateDashboardsReasoningEntry,
} from './helpers/create-dashboards-tool-transform-helper';

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

interface FailedFileCreation {
  name: string;
  error: string;
}

type VersionHistory = (typeof dashboardFiles.$inferSelect)['versionHistory'];

// Helper function to create initial version history
function createInitialDashboardVersionHistory(
  dashboard: DashboardWithMetadata,
  createdAt: string
): VersionHistory {
  return {
    '1': {
      content: dashboard as Record<string, unknown>,
      updated_at: createdAt,
      version_number: 1,
    },
  };
}

type CreateDashboardFilesParams = CreateDashboardsInput;
type CreateDashboardFilesOutput = CreateDashboardsOutput;

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

    const existingIds = existingMetrics.map((m: { id: string }) => m.id);
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

// Process a dashboard file creation request
async function processDashboardFile(
  file: { name: string; yml_content: string },
  dashboardId?: string
): Promise<{
  success: boolean;
  dashboardFile?: FileWithId;
  dashboard?: DashboardWithMetadata;
  error?: string;
}> {
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

  // Use provided dashboard ID from state or generate new one
  const id = dashboardId || randomUUID();

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

  const dashboardFile: FileWithId = {
    id,
    name: dashboard.name,
    file_type: 'dashboard_file',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version_number: 1,
    content: dashboard, // Store the full dashboard object
  };

  return {
    success: true,
    dashboardFile,
    dashboard,
  };
}

function generateResultMessage(
  createdFiles: FileWithId[],
  failedFiles: FailedFileCreation[]
): string {
  if (failedFiles.length === 0) {
    return `Successfully created ${createdFiles.length} dashboard files.`;
  }

  const successMsg =
    createdFiles.length > 0 ? `Successfully created ${createdFiles.length} dashboard files. ` : '';

  const failures = failedFiles.map(
    (failure) =>
      `Failed to create '${failure.name}': ${failure.error}.\n\nPlease recreate the dashboard from scratch rather than attempting to modify. This error could be due to:\n- Invalid metric UUIDs (please check that the metrics exist)\n- Invalid configuration in the dashboard file\n- Row configuration errors (column sizes must sum to 12)\n- Special characters in the dashboard name or description`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to create ${failures.length} dashboard files:\n${failures.join('\n')}`;
}

// Main create dashboard files function
const createDashboardFiles = wrapTraced(
  async (
    params: CreateDashboardFilesParams,
    context: CreateDashboardsContext,
    state?: CreateDashboardsState
  ): Promise<CreateDashboardFilesOutput> => {
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
    const failedFiles: FailedFileCreation[] = [];

    // Process files concurrently, passing dashboard IDs from state
    const processResults = await Promise.allSettled(
      params.files.map(async (file, index) => {
        // Ensure file has required properties
        if (!file.name || !file.yml_content) {
          return {
            fileName: file.name || 'unknown',
            result: {
              success: false,
              error: 'Missing required file properties',
            },
          };
        }
        // Get dashboard ID from state if available
        const dashboardId = state?.files?.[index]?.id;
        const result = await processDashboardFile(
          file as { name: string; yml_content: string },
          typeof dashboardId === 'string' ? dashboardId : undefined
        );
        return { fileName: file.name, result };
      })
    );

    const successfulProcessing: Array<{
      dashboardFile: FileWithId;
      dashboard: DashboardWithMetadata;
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileName, result } = processResult.value;
        if (result.success && result.dashboardFile && result.dashboard) {
          successfulProcessing.push({
            dashboardFile: result.dashboardFile,
            dashboard: result.dashboard,
          });
        } else {
          failedFiles.push({
            name: fileName,
            error: result.error || 'Unknown error',
          });
        }
      } else {
        failedFiles.push({
          name: 'unknown',
          error: processResult.reason?.message || 'Processing failed',
        });
      }
    }

    // Database operations
    if (successfulProcessing.length > 0) {
      try {
        await db.transaction(async (tx: typeof db) => {
          // Insert dashboard files
          const dashboardRecords = successfulProcessing.map((sp, index) => {
            const originalFile = params.files[index];
            if (!originalFile) {
              // This should never happen, but handle gracefully
              return {
                id: sp.dashboardFile.id,
                name: sp.dashboardFile.name,
                fileName: sp.dashboardFile.name,
                content: sp.dashboardFile.content, // This now contains the full DashboardYml
                filter: null,
                organizationId,
                createdBy: userId,
                createdAt: sp.dashboardFile.created_at,
                updatedAt: sp.dashboardFile.updated_at,
                deletedAt: null,
                publiclyAccessible: false,
                publiclyEnabledBy: null,
                publicExpiryDate: null,
                versionHistory: createInitialDashboardVersionHistory(
                  sp.dashboard,
                  sp.dashboardFile.created_at
                ),
                publicPassword: null,
              };
            }
            return {
              id: sp.dashboardFile.id,
              name: sp.dashboardFile.name,
              fileName: originalFile.name,
              content: sp.dashboardFile.content, // This now contains the full DashboardYml
              filter: null,
              organizationId,
              createdBy: userId,
              createdAt: sp.dashboardFile.created_at,
              updatedAt: sp.dashboardFile.updated_at,
              deletedAt: null,
              publiclyAccessible: false,
              publiclyEnabledBy: null,
              publicExpiryDate: null,
              versionHistory: createInitialDashboardVersionHistory(
                sp.dashboard,
                sp.dashboardFile.created_at
              ),
              publicPassword: null,
            };
          });
          await tx.insert(dashboardFiles).values(dashboardRecords);

          // Insert asset permissions
          const assetPermissionRecords = dashboardRecords.map((record) => ({
            identityId: userId,
            identityType: 'user' as const,
            assetId: record.id,
            assetType: 'dashboard_file' as const,
            role: 'owner' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            createdBy: userId,
            updatedBy: userId,
          }));
          await tx.insert(assetPermissions).values(assetPermissionRecords);

          // Create associations between metrics and dashboards
          for (const sp of successfulProcessing) {
            const metricIds: string[] = sp.dashboard.rows
              ? sp.dashboard.rows.flatMap((row) => row.items).map((item) => item.id)
              : [];

            if (metricIds.length > 0) {
              const metricDashboardAssociations = metricIds.map((metricId: string) => ({
                metricFileId: metricId,
                dashboardFileId: sp.dashboardFile.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deletedAt: null,
                createdBy: userId,
              }));

              // Insert associations with conflict handling
              for (const association of metricDashboardAssociations) {
                try {
                  await tx.insert(metricFilesToDashboardFiles).values(association);
                } catch (error) {
                  // Log warning but don't fail the whole operation
                  console.warn(`Failed to create metric-dashboard association: ${error}`);
                }
              }
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
            name: sp.dashboardFile.name,
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
  { name: 'Create Dashboard Files' }
);

export function createCreateDashboardsExecute(
  context: CreateDashboardsContext,
  state: CreateDashboardsState
) {
  return wrapTraced(
    async (input: CreateDashboardsInput): Promise<CreateDashboardsOutput> => {
      const startTime = Date.now();

      try {
        // Call the main function directly, passing state for dashboard IDs
        const result = await createDashboardFiles(
          input as CreateDashboardFilesParams,
          context,
          state
        );

        // Update state files with final results (IDs, versions, status)
        if (result && typeof result === 'object') {
          const typedResult = result as CreateDashboardsOutput;
          // Ensure state.files is initialized for safe mutations below
          state.files = state.files ?? [];

          // Update successful files
          if (typedResult.files && Array.isArray(typedResult.files)) {
            typedResult.files.forEach((file) => {
              const stateFile = (state.files ?? []).find((f) => f.file_name === file.name);
              if (stateFile) {
                stateFile.id = file.id;
                stateFile.version_number = file.version_number;
                stateFile.status = 'completed';
              }
            });
          }

          // Update failed files
          if (typedResult.failed_files && Array.isArray(typedResult.failed_files)) {
            typedResult.failed_files.forEach((failedFile) => {
              const stateFile = (state.files ?? []).find((f) => f.file_name === failedFile.name);
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

              const reasoningEntry = createCreateDashboardsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createCreateDashboardsRawLlmMessageEntry(state, toolCallId);
              const rawLlmResultEntry = createRawToolResultEntry(
                toolCallId,
                CREATE_DASHBOARDS_TOOL_NAME,
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

              console.info('[create-dashboards] Updated last entries with final results', {
                messageId: context.messageId,
                successCount: typedResult.files?.length || 0,
                failedCount: typedResult.failed_files?.length || 0,
              });
            } catch (error) {
              console.error('[create-dashboards] Error updating final entries:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[create-dashboards] Execution completed', {
          executionTime: `${executionTime}ms`,
          filesCreated: result?.files?.length || 0,
          filesFailed: result?.failed_files?.length || 0,
        });

        cleanupState(state);
        return result as CreateDashboardsOutput;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error('[create-dashboards] Execution failed', {
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

            const reasoningEntry = createCreateDashboardsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createCreateDashboardsRawLlmMessageEntry(state, toolCallId);
            const rawLlmResultEntry = createRawToolResultEntry(
              toolCallId,
              CREATE_DASHBOARDS_TOOL_NAME,
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
            console.error('[create-dashboards] Error updating entries on failure:', updateError);
          }
        }

        cleanupState(state);
        throw error;
      }
    },
    { name: 'create-dashboards-execute' }
  );
}
