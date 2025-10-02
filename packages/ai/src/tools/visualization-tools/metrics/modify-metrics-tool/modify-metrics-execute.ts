import { createPermissionErrorMessage, validateSqlPermissions } from '@buster/access-controls';
import type { Credentials } from '@buster/data-source';
import { createMetadataFromResults, executeMetricQuery } from '@buster/data-source';
import { db } from '@buster/database/connection';
import { updateMessageEntries } from '@buster/database/queries';
import { metricFiles } from '@buster/database/schema';
import {
  type ChartConfigProps,
  type DataMetadata,
  type MetricYml,
  MetricYmlSchema,
} from '@buster/server-shared/metrics';
import { wrapTraced } from 'braintrust';
import { eq, inArray } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { getDataSourceCredentials } from '../../../../utils/get-data-source';
import { cleanupState } from '../../../shared/cleanup-state';
import { createRawToolResultEntry } from '../../../shared/create-raw-llm-tool-result-entry';
import { truncateQueryResults } from '../../../shared/smart-truncate';
import { trackFileAssociations } from '../../file-tracking-helper';
import { validateAndAdjustBarLineAxes } from '../helpers/bar-line-axis-validator';
import { compileSqlWithDefaults } from '../helpers/metric-sql-token-compiler';
import { ensureTimeFrameQuoted } from '../helpers/time-frame-helper';
import {
  createModifyMetricsRawLlmMessageEntry,
  createModifyMetricsReasoningEntry,
} from './helpers/modify-metrics-tool-transform-helper';
import type {
  ModifyMetricsContext,
  ModifyMetricsInput,
  ModifyMetricsOutput,
  ModifyMetricsState,
} from './modify-metrics-tool';
import { MODIFY_METRICS_TOOL_NAME } from './modify-metrics-tool';

interface FileWithId {
  id: string;
  name: string;
  file_type: string;
  result_message?: string;
  results?: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
  version_number: number;
}

interface FailedFileModification {
  id: string;
  error: string;
}

interface MetricFileResult {
  success: boolean;
  error?: string;
  metricFile?: FileWithId;
  metricYml?: MetricYml;
  message?: string;
  results?: Record<string, unknown>[];
}

type VersionHistory = (typeof metricFiles.$inferSelect)['versionHistory'];

// Helper function to add version to history
function addMetricVersionToHistory(
  currentHistory: VersionHistory | null,
  metric: MetricYml,
  updatedAt: string
): VersionHistory {
  const history = currentHistory || {};
  const versions = Object.keys(history)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const nextVersion = versions.length > 0 ? Math.max(...versions) + 1 : 1;

  return {
    ...history,
    [nextVersion.toString()]: {
      content: metric,
      updated_at: updatedAt,
      version_number: nextVersion,
    },
  };
}

// Helper function to get latest version number
function getLatestVersionNumber(versionHistory: VersionHistory | null): number {
  if (!versionHistory) return 1;
  const versions = Object.keys(versionHistory)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  return versions.length > 0 ? Math.max(...versions) : 1;
}

interface ValidationResult {
  success: boolean;
  error?: string;
  message?: string;
  results?: Record<string, unknown>[];
  metadata?: DataMetadata;
}

async function validateSql(
  sqlQuery: string,
  dataSourceId: string,
  userId: string,
  dataSourceSyntax?: string
): Promise<ValidationResult> {
  try {
    if (!sqlQuery.trim()) {
      return { success: false, error: 'SQL query cannot be empty' };
    }

    // Basic SQL validation
    if (!sqlQuery.toLowerCase().includes('select')) {
      return { success: false, error: 'SQL query must contain SELECT statement' };
    }

    if (!sqlQuery.toLowerCase().includes('from')) {
      return { success: false, error: 'SQL query must contain FROM clause' };
    }

    // Validate permissions before attempting to get data source
    const permissionResult = await validateSqlPermissions(sqlQuery, userId, dataSourceSyntax);
    if (!permissionResult.isAuthorized) {
      return {
        success: false,
        error: createPermissionErrorMessage(permissionResult.unauthorizedTables),
      };
    }

    // Get data source credentials
    let credentials: Credentials;
    try {
      credentials = await getDataSourceCredentials(dataSourceId);
    } catch (_error) {
      return {
        success: false,
        error: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
      };
    }

    // Execute query using the new utility
    try {
      const result = await executeMetricQuery(dataSourceId, sqlQuery, credentials, {
        maxRows: 50, // Reduced validation limit - just enough to validate schema
        timeout: 120000, // 2 minutes
        retryDelays: [1000, 3000, 6000], // 1s, 3s, 6s
      });

      // Apply smart truncation to results before display
      const truncatedData = truncateQueryResults(result.data);

      // Take first 25 records for display in validation
      const displayResults = truncatedData.slice(0, 25);

      let message: string;
      if (result.data.length === 0) {
        message = 'Query executed successfully but returned no records';
      } else if (result.hasMoreRecords) {
        message = `Query validated successfully. Results were limited to 50 rows for validation (query may return more rows when executed)${displayResults.length < result.data.length ? ` - showing first 25 of ${result.data.length} fetched` : ''}`;
      } else {
        message = `Query validated successfully and returned ${result.data.length} records${result.data.length > 25 ? ' (showing sample of first 25)' : ''}`;
      }

      return {
        success: true,
        message,
        results: displayResults,
        metadata: result.dataMetadata,
      };
    } catch (error) {
      console.error('[modify-metrics] SQL validation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SQL validation failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SQL validation failed',
    };
  }
}

async function processMetricFile(
  file: { id: string; yml_content: string },
  existingFile: typeof metricFiles.$inferSelect,
  dataSourceId: string,
  dataSourceDialect: string,
  userId: string
): Promise<MetricFileResult> {
  try {
    // Ensure timeFrame values are properly quoted before parsing
    const fixedYmlContent = ensureTimeFrameQuoted(file.yml_content);

    // Parse and validate YAML
    const metricYml = yaml.parse(fixedYmlContent);

    const validatedMetricYml = MetricYmlSchema.parse(metricYml);

    // Validate and adjust bar/line chart axes
    let finalChartConfig: ChartConfigProps;
    try {
      finalChartConfig = validateAndAdjustBarLineAxes(validatedMetricYml.chartConfig);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid bar/line chart axis configuration',
      };
    }

    // Create the final metric YML with the adjusted chart config
    const finalMetricYml: MetricYml = {
      ...validatedMetricYml,
      chartConfig: finalChartConfig,
    };

    // Check if SQL has changed to avoid unnecessary validation
    const existingContent = existingFile.content as MetricYml | null;
    const sqlChanged = existingContent?.sql !== finalMetricYml.sql;
    const filtersChanged =
      JSON.stringify(existingContent?.filters ?? null) !==
      JSON.stringify(finalMetricYml.filters ?? null);

    // If SQL hasn't changed and we have metadata, skip validation
    if (!sqlChanged && !filtersChanged && existingFile.dataMetadata) {
      const metricFile: FileWithId = {
        id: existingFile.id,
        name: finalMetricYml.name,
        file_type: 'metric_file',
        result_message: 'SQL unchanged, validation skipped',
        results: [],
        created_at: existingFile.createdAt,
        updated_at: new Date().toISOString(),
        version_number: getLatestVersionNumber(existingFile.versionHistory as VersionHistory) + 1,
      };

      return {
        success: true,
        metricFile,
        metricYml: finalMetricYml,
        message: 'SQL unchanged, validation skipped',
        results: [],
      };
    }

    // Validate SQL if it has changed or if metadata is missing
    const compiledSql = compileSqlWithDefaults(finalMetricYml);

    const sqlValidationResult = await validateSql(
      compiledSql,
      dataSourceId,
      userId,
      dataSourceDialect
    );

    if (!sqlValidationResult.success) {
      return {
        success: false,
        error: `The SQL query has an issue: ${sqlValidationResult.error}. Please check your query syntax.`,
      };
    }

    // Create metric file object
    const metricFile: FileWithId = {
      id: existingFile.id,
      name: finalMetricYml.name,
      file_type: 'metric_file',
      result_message: sqlValidationResult.message || '',
      results: sqlValidationResult.results || [],
      created_at: existingFile.createdAt,
      updated_at: new Date().toISOString(),
      version_number: getLatestVersionNumber(existingFile.versionHistory as VersionHistory) + 1,
    };

    return {
      success: true,
      metricFile,
      metricYml: finalMetricYml,
      message: sqlValidationResult.message || '',
      results: sqlValidationResult.results || [],
    };
  } catch (error) {
    let errorMessage = 'Unknown error';

    if (error instanceof z.ZodError) {
      // Return the actual Zod validation errors for better debugging
      const issues = error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? ` at path '${issue.path.join('.')}'` : '';
          return `${issue.message}${path}`;
        })
        .join('; ');
      errorMessage = `The metric configuration is invalid: ${issues}`;
    } else if (error instanceof Error) {
      if (error.message.includes('YAMLParseError')) {
        errorMessage = 'The YAML format is incorrect. Please check the syntax and indentation.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

function generateResultMessage(
  modifiedFiles: FileWithId[],
  failedFiles: FailedFileModification[]
): string {
  if (failedFiles.length === 0) {
    return `Successfully modified ${modifiedFiles.length} metric files.`;
  }

  const successMsg =
    modifiedFiles.length > 0 ? `Successfully modified ${modifiedFiles.length} metric files. ` : '';

  const failures = failedFiles.map(
    (failure) =>
      `Failed to modify metric with ID '${failure.id}': ${failure.error}.\n\nPlease recreate the metric from scratch rather than attempting to modify. This error could be due to:\n- Using a dataset that doesn't exist (please reevaluate the available datasets in the chat conversation)\n- Invalid configuration in the metric file\n- Special characters in the metric name or SQL query\n- Syntax errors in the SQL query`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to modify ${failures.length} metric files:\n${failures.join('\n')}`;
}

// Main modify metric files function
const modifyMetricFiles = wrapTraced(
  async (
    params: ModifyMetricsInput,
    context: ModifyMetricsContext
  ): Promise<ModifyMetricsOutput> => {
    // Get context values
    const dataSourceId = context.dataSourceId;
    const userId = context.userId;
    const organizationId = context.organizationId;
    const messageId = context.messageId;
    const dataSourceSyntax = context.dataSourceSyntax;

    if (!dataSourceId) {
      return {
        message: 'Data source ID not found in runtime context',
        files: [],
        failed_files: [],
      };
    }
    if (!userId) {
      return {
        message: 'User ID not found in runtime context',
        files: [],
        failed_files: [],
      };
    }
    if (!organizationId) {
      return {
        message: 'Organization ID not found in runtime context',
        files: [],
        failed_files: [],
      };
    }

    const files: FileWithId[] = [];
    const failedFiles: FailedFileModification[] = [];

    // Extract file IDs
    const metricIds = params.files.map((f) => f.id);
    const fileMap = new Map(params.files.map((f) => [f.id, f]));

    // Fetch existing metric files
    const existingFiles = await db
      .select()
      .from(metricFiles)
      .where(inArray(metricFiles.id, metricIds))
      .execute();

    if (existingFiles.length === 0) {
      return {
        message: 'No metric files found with the provided IDs',
        files: [],
        failed_files: [],
      };
    }

    // Process files concurrently
    const processResults = await Promise.allSettled(
      existingFiles.map(async (existingFile) => {
        const fileUpdate = fileMap.get(existingFile.id);
        if (!fileUpdate) {
          return {
            fileName: existingFile.name,
            fileId: existingFile.id,
            result: {
              success: false,
              error: 'File update not found in request',
            } as MetricFileResult,
          };
        }
        const result = await processMetricFile(
          fileUpdate,
          existingFile,
          dataSourceId,
          dataSourceSyntax || 'generic',
          userId
        );
        return { fileName: existingFile.name, fileId: existingFile.id, result };
      })
    );

    const successfulProcessing: Array<{
      fileName: string;
      fileId: string;
      existingFile: typeof metricFiles.$inferSelect;
      metricFile: FileWithId;
      metricYml: MetricYml;
      message: string;
      results: Record<string, unknown>[];
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileName, fileId, result } = processResult.value;
        if (
          result.success &&
          result.metricFile &&
          result.metricYml &&
          result.message &&
          result.results
        ) {
          const existingFile = existingFiles.find((f) => f.id === fileId);
          if (existingFile) {
            successfulProcessing.push({
              fileName,
              fileId,
              existingFile,
              metricFile: result.metricFile,
              metricYml: result.metricYml,
              message: result.message,
              results: result.results,
            });
          }
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
          // Update metric files
          for (const sp of successfulProcessing) {
            // Get current version history
            const currentVersionHistory = sp.existingFile.versionHistory as VersionHistory | null;

            // Add new version to history
            const updatedVersionHistory = addMetricVersionToHistory(
              currentVersionHistory,
              sp.metricYml,
              sp.metricFile.updated_at
            );

            await tx
              .update(metricFiles)
              .set({
                name: sp.metricYml.name,
                content: sp.metricYml,
                updatedAt: sp.metricFile.updated_at,
                dataMetadata: sp.results
                  ? createMetadataFromResults(sp.results)
                  : sp.existingFile.dataMetadata,
                versionHistory: updatedVersionHistory,
              })
              .where(eq(metricFiles.id, sp.fileId))
              .execute();
          }
        });

        // Add successful files to output
        for (const sp of successfulProcessing) {
          files.push({
            id: sp.metricFile.id,
            name: sp.metricFile.name,
            file_type: sp.metricFile.file_type,
            result_message: sp.metricFile.result_message || '',
            results: sp.metricFile.results || [],
            created_at: sp.metricFile.created_at,
            updated_at: sp.metricFile.updated_at,
            version_number: sp.metricFile.version_number,
          });
        }
      } catch (error) {
        // Add all successful processing to failed if database operation fails
        for (const sp of successfulProcessing) {
          failedFiles.push({
            id: sp.fileId,
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
  { name: 'Modify Metric Files' }
);

export function createModifyMetricsExecute(
  context: ModifyMetricsContext,
  state: ModifyMetricsState
) {
  return wrapTraced(
    async (input: ModifyMetricsInput): Promise<ModifyMetricsOutput> => {
      const startTime = Date.now();

      try {
        // Call the main function directly
        const result = await modifyMetricFiles(input, context);

        // Update state files with final results (IDs, versions, status)
        if (result && typeof result === 'object') {
          const typedResult = result as ModifyMetricsOutput;
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
                // Store error in yml_content field temporarily
                stateFile.yml_content = failedFile.error;
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

              const reasoningEntry = createModifyMetricsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createModifyMetricsRawLlmMessageEntry(state, toolCallId);
              const rawLlmResultEntry = createRawToolResultEntry(
                toolCallId,
                MODIFY_METRICS_TOOL_NAME,
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

              console.info('[modify-metrics] Updated last entries with final results', {
                messageId: context.messageId,
                successCount: typedResult.files?.length || 0,
                failedCount: typedResult.failed_files?.length || 0,
              });
            } catch (error) {
              console.error('[modify-metrics] Error updating final entries:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[modify-metrics] Execution completed', {
          executionTime: `${executionTime}ms`,
          filesModified: result?.files?.length || 0,
          filesFailed: result?.failed_files?.length || 0,
        });

        cleanupState(state);
        return result as ModifyMetricsOutput;
      } catch (error) {
        console.error('[modify-metrics] Execution error:', error);

        // Create error response
        // Update state for errors
        if (state.files) {
          state.files.forEach((f) => {
            f.status = 'failed';
          });
        }

        // Try to update database with error state
        if (context.messageId && state.toolCallId) {
          try {
            const reasoningEntry = createModifyMetricsReasoningEntry(state, state.toolCallId);
            const rawLlmMessage = createModifyMetricsRawLlmMessageEntry(state, state.toolCallId);
            const rawLlmResultEntry = createRawToolResultEntry(
              state.toolCallId,
              MODIFY_METRICS_TOOL_NAME,
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
          } catch (dbError) {
            console.error('[modify-metrics] Error updating database with error state:', dbError);
          }
        }

        cleanupState(state);
        throw error;
      }
    },
    { name: 'modify-metrics-execute' }
  );
}
