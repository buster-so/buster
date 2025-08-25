import { randomUUID } from 'node:crypto';
import type { Credentials } from '@buster/data-source';
import { createMetadataFromResults, executeMetricQuery } from '@buster/data-source';
import { assetPermissions, db, metricFiles, updateMessageEntries } from '@buster/database';
import {
  type ChartConfigProps,
  type DataMetadata,
  type MetricYml,
  MetricYmlSchema,
} from '@buster/server-shared/metrics';
import { wrapTraced } from 'braintrust';
import * as yaml from 'yaml';
import { z } from 'zod';
import { getDataSourceCredentials } from '../../../../utils/get-data-source';
import {
  createPermissionErrorMessage,
  validateSqlPermissions,
} from '../../../../utils/sql-permissions';
import { createRawToolResultEntry } from '../../../shared/create-raw-llm-tool-result-entry';
import { trackFileAssociations } from '../../file-tracking-helper';
import { validateAndAdjustBarLineAxes } from '../helpers/bar-line-axis-validator';
import { ensureTimeFrameQuoted } from '../helpers/time-frame-helper';
import type {
  CreateMetricsContext,
  CreateMetricsInput,
  CreateMetricsOutput,
  CreateMetricsState,
} from './create-metrics-tool';
import { CREATE_METRICS_TOOL_NAME } from './create-metrics-tool';
import {
  createCreateMetricsRawLlmMessageEntry,
  createCreateMetricsReasoningEntry,
} from './helpers/create-metrics-transform-helper';

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

interface FailedFileCreation {
  name: string;
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

// Helper function to create initial version history
function createInitialMetricVersionHistory(metric: MetricYml, createdAt: string): VersionHistory {
  return {
    '1': {
      content: metric,
      updated_at: createdAt,
      version_number: 1,
    },
  };
}

interface ValidationResult {
  success: boolean;
  error?: string;
  message?: string;
  results?: Record<string, unknown>[];
  metadata?: DataMetadata;
}

async function processMetricFile(
  file: { name: string; yml_content: string },
  dataSourceId: string,
  dataSourceDialect: string,
  userId: string,
  metricId?: string
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

    // Use provided metric ID from state or generate new one
    const id = metricId || randomUUID();

    // Validate SQL by running it
    const sqlValidationResult = await validateSql(
      finalMetricYml.sql,
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
    const now = new Date().toISOString();
    const metricFile: FileWithId = {
      id,
      name: finalMetricYml.name,
      file_type: 'metric',
      result_message: sqlValidationResult.message || '',
      results: sqlValidationResult.results || [],
      created_at: now,
      updated_at: now,
      version_number: 1,
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
        maxRows: 1000, // Validation limit
        timeout: 120000, // 2 minutes
        retryDelays: [1000, 3000, 6000], // 1s, 3s, 6s
      });

      // Truncate results to 25 records for display in validation
      const displayResults = result.data.slice(0, 25);

      let message: string;
      if (result.data.length === 0) {
        message = 'Query executed successfully but returned no records';
      } else if (result.hasMoreRecords) {
        message = `Query validated successfully. Results were limited to 1000 rows for memory protection (query may return more rows when executed)${displayResults.length < result.data.length ? ` - showing first 25 of ${result.data.length} fetched` : ''}`;
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
      console.error('[create-metrics] SQL validation failed:', error);
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

function generateResultMessage(
  createdFiles: FileWithId[],
  failedFiles: FailedFileCreation[]
): string {
  if (failedFiles.length === 0) {
    return `Successfully created ${createdFiles.length} metric files.`;
  }

  const successMsg =
    createdFiles.length > 0 ? `Successfully created ${createdFiles.length} metric files. ` : '';

  const failures = failedFiles.map(
    (failure) =>
      `Failed to create '${failure.name}': ${failure.error}.\n\nPlease recreate the metric from scratch rather than attempting to modify. This error could be due to:\n- Using a dataset that doesn't exist (please reevaluate the available datasets in the chat conversation)\n- Invalid configuration in the metric file\n- Special characters in the metric name or SQL query\n- Syntax errors in the SQL query`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to create ${failures.length} metric files:\n${failures.join('\n')}`;
}

// Main create metric files function
const createMetricFiles = wrapTraced(
  async (
    params: CreateMetricsInput,
    context: CreateMetricsContext,
    state?: CreateMetricsState
  ): Promise<CreateMetricsOutput> => {
    // Get context values
    const userId = context.userId;
    const organizationId = context.organizationId;
    const messageId = context.messageId;
    const dataSourceId = context.dataSourceId;
    const dataSourceSyntax = context.dataSourceSyntax || 'generic';

    if (!dataSourceId) {
      return {
        message: 'Unable to identify the data source. Please refresh and try again.',
        files: [],
        failed_files: [],
      };
    }
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

    // Process files concurrently, passing metric IDs from state
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
        // Get metric ID from state if available
        const metricId = state?.files?.[index]?.id;
        const result = await processMetricFile(
          file as { name: string; yml_content: string },
          dataSourceId,
          dataSourceSyntax,
          userId,
          typeof metricId === 'string' ? metricId : undefined
        );
        return { fileName: file.name, result };
      })
    );

    const successfulProcessing: Array<{
      fileName: string;
      metricFile: FileWithId;
      metricYml: MetricYml;
      message: string;
      results: Record<string, unknown>[];
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileName, result } = processResult.value;
        if (
          result.success &&
          result.metricFile &&
          result.metricYml &&
          result.message &&
          result.results
        ) {
          successfulProcessing.push({
            fileName,
            metricFile: result.metricFile,
            metricYml: result.metricYml,
            message: result.message,
            results: result.results,
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
          // Insert metric files
          const metricRecords = successfulProcessing.map((sp) => ({
            id: sp.metricFile.id,
            name: sp.metricFile.name,
            fileName: sp.fileName,
            content: sp.metricYml,
            verification: 'notRequested' as const,
            evaluationObj: null,
            evaluationSummary: null,
            evaluationScore: null,
            organizationId,
            createdBy: userId,
            createdAt: sp.metricFile.created_at,
            updatedAt: sp.metricFile.updated_at,
            deletedAt: null,
            publiclyAccessible: false,
            publiclyEnabledBy: null,
            publicExpiryDate: null,
            versionHistory: createInitialMetricVersionHistory(
              sp.metricYml,
              sp.metricFile.created_at
            ),
            dataMetadata: sp.results ? createMetadataFromResults(sp.results) : null,
            publicPassword: null,
            dataSourceId,
          }));
          await tx.insert(metricFiles).values(metricRecords);

          // Insert asset permissions
          const assetPermissionRecords = metricRecords.map((record) => ({
            identityId: userId,
            identityType: 'user' as const,
            assetId: record.id,
            assetType: 'metric_file' as const,
            role: 'owner' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            createdBy: userId,
            updatedBy: userId,
          }));
          await tx.insert(assetPermissions).values(assetPermissionRecords);
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
            name: sp.metricFile.name,
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
  { name: 'Create Metric Files' }
);

export function createCreateMetricsExecute(
  context: CreateMetricsContext,
  state: CreateMetricsState
) {
  return wrapTraced(
    async (input: CreateMetricsInput): Promise<CreateMetricsOutput> => {
      const startTime = Date.now();

      try {
        // Call the main function directly, passing state for metric IDs
        const result = await createMetricFiles(input, context, state);

        // Update state files with final results (IDs, versions, status)
        if (result && typeof result === 'object') {
          const typedResult = result as CreateMetricsOutput;
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

              const reasoningEntry = createCreateMetricsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createCreateMetricsRawLlmMessageEntry(state, toolCallId);
              const rawLlmResultEntry = createRawToolResultEntry(
                toolCallId,
                CREATE_METRICS_TOOL_NAME,
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

              console.info('[create-metrics] Updated last entries with final results', {
                messageId: context.messageId,
                successCount: typedResult.files?.length || 0,
                failedCount: typedResult.failed_files?.length || 0,
              });
            } catch (error) {
              console.error('[create-metrics] Error updating final entries:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[create-metrics] Execution completed', {
          executionTime: `${executionTime}ms`,
          filesCreated: result?.files?.length || 0,
          filesFailed: result?.failed_files?.length || 0,
        });

        return result as CreateMetricsOutput;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error('[create-metrics] Execution failed', {
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

            const reasoningEntry = createCreateMetricsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createCreateMetricsRawLlmMessageEntry(state, toolCallId);
            const rawLlmResultEntry = createRawToolResultEntry(
              toolCallId,
              CREATE_METRICS_TOOL_NAME,
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
            console.error('[create-metrics] Error updating entries on failure:', updateError);
          }
        }

        throw error;
      }
    },
    { name: 'create-metrics-execute' }
  );
}
