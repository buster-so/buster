import type { DataSource } from '@buster/data-source';
import { db } from '@buster/database';
import { metricFiles } from '@buster/database';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { eq, inArray } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { getWorkflowDataSourceManager } from '../../utils/data-source-manager';
import type { AnalystRuntimeContext } from '../../workflows/analyst-workflow';
import {
  addMetricVersionToHistory,
  getLatestVersionNumber,
  validateMetricYml,
} from './version-history-helpers';
import type { MetricYml, VersionHistory } from './version-history-types';

// TypeScript types matching Rust DataMetadata structure
enum SimpleType {
  Number = 'number',
  String = 'string',
  Date = 'date',
  Boolean = 'boolean',
  Other = 'other',
}

enum ColumnType {
  Int2 = 'int2',
  Int4 = 'int4',
  Int8 = 'int8',
  Float4 = 'float4',
  Float8 = 'float8',
  Varchar = 'varchar',
  Text = 'text',
  Bool = 'bool',
  Date = 'date',
  Timestamp = 'timestamp',
  Timestamptz = 'timestamptz',
  Other = 'other',
}

interface ColumnMetaData {
  name: string;
  min_value: unknown;
  max_value: unknown;
  unique_values: number;
  simple_type: SimpleType;
  type: ColumnType;
}

interface DataMetadata {
  column_count: number;
  row_count: number;
  column_metadata: ColumnMetaData[];
}

/**
 * Analyzes query results to create DataMetadata structure
 */
function createDataMetadata(results: Record<string, unknown>[]): DataMetadata {
  if (!results.length) {
    return {
      column_count: 0,
      row_count: 0,
      column_metadata: [],
    };
  }

  const columnNames = Object.keys(results[0] || {});
  const columnMetadata: ColumnMetaData[] = [];

  for (const columnName of columnNames) {
    const values = results
      .map((row) => row[columnName])
      .filter((v) => v !== null && v !== undefined);

    // Determine column type based on the first non-null value
    let columnType = ColumnType.Other;
    let simpleType = SimpleType.Other;

    if (values.length > 0) {
      const firstValue = values[0];

      if (typeof firstValue === 'number') {
        columnType = Number.isInteger(firstValue) ? ColumnType.Int4 : ColumnType.Float8;
        simpleType = SimpleType.Number;
      } else if (typeof firstValue === 'boolean') {
        columnType = ColumnType.Bool;
        simpleType = SimpleType.Boolean;
      } else if (firstValue instanceof Date) {
        columnType = ColumnType.Timestamp;
        simpleType = SimpleType.Date;
      } else if (typeof firstValue === 'string') {
        // Check if it looks like a date
        if (!Number.isNaN(Date.parse(firstValue))) {
          columnType = ColumnType.Timestamp;
          simpleType = SimpleType.Date;
        } else {
          columnType = ColumnType.Varchar;
          simpleType = SimpleType.String;
        }
      }
    }

    // Calculate min/max values
    let minValue: unknown = null;
    let maxValue: unknown = null;

    if (values.length > 0) {
      if (simpleType === SimpleType.Number) {
        const numValues = values.filter((v) => typeof v === 'number') as number[];
        if (numValues.length > 0) {
          minValue = Math.min(...numValues);
          maxValue = Math.max(...numValues);
        }
      } else if (simpleType === SimpleType.Date) {
        const dateValues = values
          .map((v) => {
            if (v instanceof Date) return v;
            if (typeof v === 'string') {
              const parsed = new Date(v);
              return Number.isNaN(parsed.getTime()) ? null : parsed;
            }
            return null;
          })
          .filter((d) => d !== null) as Date[];

        if (dateValues.length > 0) {
          minValue = new Date(Math.min(...dateValues.map((d) => d.getTime())));
          maxValue = new Date(Math.max(...dateValues.map((d) => d.getTime())));
        }
      } else if (simpleType === SimpleType.String) {
        const strValues = values.filter((v) => typeof v === 'string') as string[];
        if (strValues.length > 0) {
          minValue = strValues.sort()[0];
          maxValue = strValues.sort().reverse()[0];
        }
      }
    }

    // Calculate unique values count
    const uniqueValues = new Set(values).size;

    columnMetadata.push({
      name: columnName,
      min_value: minValue,
      max_value: maxValue,
      unique_values: uniqueValues,
      simple_type: simpleType,
      type: columnType,
    });
  }

  return {
    column_count: columnNames.length,
    row_count: results.length,
    column_metadata: columnMetadata,
  };
}

/**
 * Ensures timeFrame values are properly quoted in YAML content
 * Finds timeFrame: value and wraps the value in quotes if not already quoted
 */
function ensureTimeFrameQuoted(ymlContent: string): string {
  // Regex to match timeFrame field with its value
  // Captures: timeFrame + whitespace + : + whitespace + value (until end of line)
  const timeFrameRegex = /(timeFrame\s*:\s*)([^\r\n]+)/g;

  return ymlContent.replace(timeFrameRegex, (match, prefix, value) => {
    // Trim whitespace from the value
    const trimmedValue = value.trim();

    // Check if value is already properly quoted (starts and ends with same quote type)
    const isAlreadyQuoted =
      (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
      (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"));

    if (isAlreadyQuoted) {
      // Already quoted, return as is
      return match;
    }

    // Not quoted, wrap in double quotes
    return `${prefix}"${trimmedValue}"`;
  });
}

// Core interfaces matching Rust structs
interface FileUpdate {
  id: string;
  yml_content: string;
}

interface UpdateFilesParams {
  files: FileUpdate[];
}

interface FailedFileModification {
  file_name: string;
  error: string;
}

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

interface ModifyFilesOutput {
  message: string;
  duration: number;
  files: FileWithId[];
  failed_files: FailedFileModification[];
}
interface ModificationResult {
  file_id: string;
  file_name: string;
  success: boolean;
  error?: string;
  modification_type: string;
  timestamp: string;
  duration: number;
}

// Zod schema for validating result metadata from DataSource
const resultMetadataSchema = z
  .object({
    totalRowCount: z.number().optional(),
    limited: z.boolean().optional(),
    maxRows: z.number().optional(),
  })
  .optional();

type ResultMetadata = z.infer<typeof resultMetadataSchema>;

interface QueryMetadata {
  rowCount: number;
  totalRowCount: number;
  executionTime: number;
  limited: boolean;
  maxRows?: number;
}

interface SqlValidationResult {
  success: boolean;
  message?: string;
  results?: Record<string, unknown>[];
  metadata?: QueryMetadata;
  error?: string;
}

// Replace the basic SQL validation with comprehensive validation
async function validateSql(
  sqlQuery: string,
  dataSourceId: string,
  workflowId: string
): Promise<SqlValidationResult> {
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

    // Get data source from workflow manager (reuses existing connections)
    const manager = getWorkflowDataSourceManager(workflowId);
    let dataSource: DataSource;

    try {
      dataSource = await manager.getDataSource(dataSourceId);
    } catch (_error) {
      return {
        success: false,
        error: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
      };
    }

    // Retry configuration for SQL validation
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 30000; // 30 seconds per attempt
    const RETRY_DELAYS = [1000, 3000, 6000]; // 1s, 3s, 6s

    // Attempt execution with retries
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Execute the SQL query using the DataSource with row limit and timeout for validation
        const result = await dataSource.execute({
          sql: sqlQuery,
          options: {
            maxRows: 1000, // Limit to 1000 rows for validation to protect memory
            timeout: TIMEOUT_MS,
          },
        });

        if (result.success) {
          const allResults = result.rows || [];
          // Truncate results to 25 records for display in validation
          const results = allResults.slice(0, 25);

          // Validate metadata with Zod schema for runtime safety
          const validatedMetadata = resultMetadataSchema.safeParse(result.metadata);
          const parsedMetadata: ResultMetadata = validatedMetadata.success
            ? validatedMetadata.data
            : undefined;

          const metadata: QueryMetadata = {
            rowCount: results.length,
            totalRowCount: parsedMetadata?.totalRowCount ?? allResults.length,
            executionTime: result.executionTime || 100,
            limited: parsedMetadata?.limited ?? false,
            maxRows: parsedMetadata?.maxRows ?? 5000,
          };

          let message: string;
          if (allResults.length === 0) {
            message = 'Query executed successfully but returned no records';
          } else if (result.metadata?.limited) {
            message = `Query validated successfully. Results were limited to ${result.metadata.maxRows} rows for memory protection (query may return more rows when executed)${results.length < allResults.length ? ` - showing first 25 of ${allResults.length} fetched` : ''}`;
          } else {
            message = `Query validated successfully and returned ${allResults.length} records${allResults.length > 25 ? ' (showing sample of first 25)' : ''}`;
          }

          return {
            success: true,
            message,
            results,
            metadata,
          };
        }

        // Check if error is timeout-related
        const errorMessage = result.error?.message || 'Query execution failed';
        const isTimeout =
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('timed out');

        if (isTimeout && attempt < MAX_RETRIES) {
          // Wait before retry
          const delay = RETRY_DELAYS[attempt] || 6000;
          console.warn(
            `[modify-metrics] SQL validation timeout on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
            {
              sqlPreview: `${sqlQuery.substring(0, 100)}...`,
              attempt: attempt + 1,
              nextDelay: delay,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        // Not a timeout or no more retries
        return {
          success: false,
          error: errorMessage,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'SQL validation failed';
        const isTimeout =
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('timed out');

        if (isTimeout && attempt < MAX_RETRIES) {
          // Wait before retry
          const delay = RETRY_DELAYS[attempt] || 6000;
          console.warn(
            `[modify-metrics] SQL validation timeout (exception) on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
            {
              sqlPreview: `${sqlQuery.substring(0, 100)}...`,
              attempt: attempt + 1,
              nextDelay: delay,
              error: errorMessage,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        // Not a timeout or no more retries
        return {
          success: false,
          error: errorMessage,
        };
      }
    }

    // Should not reach here, but just in case
    return {
      success: false,
      error: 'Max retries exceeded for SQL validation',
    };
    // Note: We don't close the data source here anymore - it's managed by the workflow manager
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SQL validation failed',
    };
  }
}

// Process a metric file update with complete new YAML content
async function processMetricFileUpdate(
  existingFile: typeof metricFiles.$inferSelect,
  ymlContent: string,
  dataSourceId: string,
  workflowId: string,
  duration: number
): Promise<{
  success: boolean;
  updatedFile?: typeof metricFiles.$inferSelect;
  metricYml?: MetricYml;
  modificationResults: ModificationResult[];
  validationMessage: string;
  validationResults: Record<string, unknown>[];
  validatedDatasetIds: string[];
  error?: string;
}> {
  const modificationResults: ModificationResult[] = [];
  const timestamp = new Date().toISOString();

  try {
    // Ensure timeFrame values are properly quoted before parsing
    const fixedYmlContent = ensureTimeFrameQuoted(ymlContent);

    // Parse and validate YAML
    const parsedYml = yaml.parse(fixedYmlContent);
    const metricYml = validateMetricYml(parsedYml);

    const newMetricYml = metricYml;

    // Check if SQL has changed to avoid unnecessary validation
    const existingContent = existingFile.content as MetricYml | null;
    const sqlChanged = existingContent?.sql !== newMetricYml.sql;

    // If SQL hasn't changed, we can skip validation
    if (!sqlChanged && existingFile.dataMetadata) {
      modificationResults.push({
        file_id: existingFile.id,
        file_name: newMetricYml.name,
        success: true,
        modification_type: 'content',
        timestamp,
        duration,
      });

      return {
        success: true,
        updatedFile: {
          ...existingFile,
          content: newMetricYml,
          name: newMetricYml.name,
          updatedAt: new Date().toISOString(),
          // Keep existing metadata since SQL hasn't changed
        },
        metricYml: newMetricYml,
        modificationResults,
        validationMessage: 'SQL unchanged, validation skipped',
        validationResults: [],
        validatedDatasetIds: [],
      };
    }

    // Validate SQL if it has changed or if metadata is missing
    const sqlValidation = await validateSql(newMetricYml.sql, dataSourceId, workflowId);
    if (!sqlValidation.success) {
      const error = `SQL validation failed: ${sqlValidation.error}`;
      modificationResults.push({
        file_id: existingFile.id,
        file_name: newMetricYml.name,
        success: false,
        error,
        modification_type: 'sql_validation',
        timestamp,
        duration,
      });
      return {
        success: false,
        modificationResults,
        validationMessage: '',
        validationResults: [],
        validatedDatasetIds: [],
        error,
      };
    }

    // Track successful update
    modificationResults.push({
      file_id: existingFile.id,
      file_name: newMetricYml.name,
      success: true,
      modification_type: 'content',
      timestamp,
      duration,
    });

    return {
      success: true,
      updatedFile: {
        ...existingFile,
        content: newMetricYml,
        name: newMetricYml.name,
        updatedAt: new Date().toISOString(),
        dataMetadata: sqlValidation.results ? createDataMetadata(sqlValidation.results) : null,
      },
      metricYml: newMetricYml,
      modificationResults,
      validationMessage: sqlChanged
        ? sqlValidation.message || 'SQL validation completed'
        : 'Metadata missing, validation completed',
      validationResults: sqlValidation.results || [],
      validatedDatasetIds: [],
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

    const errorMessage2 = errorMessage;
    modificationResults.push({
      file_id: existingFile.id,
      file_name: existingFile.name,
      success: false,
      error: errorMessage2,
      modification_type: 'validation',
      timestamp,
      duration,
    });
    return {
      success: false,
      modificationResults,
      validationMessage: '',
      validationResults: [],
      validatedDatasetIds: [],
      error: errorMessage2,
    };
  }
}

// Main modify metrics function
const modifyMetricFiles = wrapTraced(
  async (
    params: UpdateFilesParams,
    runtimeContext: RuntimeContext<AnalystRuntimeContext>
  ): Promise<ModifyFilesOutput> => {
    const startTime = Date.now();

    // Get runtime context values
    const dataSourceId = runtimeContext.get('dataSourceId');
    const userId = runtimeContext.get('userId');
    const organizationId = runtimeContext.get('organizationId');
    const workflowStartTime = runtimeContext?.get('workflowStartTime') as number | undefined;

    // Generate a unique workflow ID using start time and data source
    const workflowId = workflowStartTime
      ? `workflow-${workflowStartTime}-${dataSourceId}`
      : `workflow-${Date.now()}-${dataSourceId}`;

    if (!dataSourceId) {
      return {
        message: 'Data source ID not found in runtime context',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }
    if (!userId) {
      return {
        message: 'User ID not found in runtime context',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }
    if (!organizationId) {
      return {
        message: 'Organization ID not found in runtime context',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }

    const files: FileWithId[] = [];
    const failedFiles: FailedFileModification[] = [];

    // Extract file IDs
    const metricIds = params.files.map((f) => f.id);
    const fileMap = new Map(params.files.map((f) => [f.id, f]));

    try {
      // Fetch existing metric files
      const existingFiles = await db
        .select()
        .from(metricFiles)
        .where(inArray(metricFiles.id, metricIds))
        .execute();

      if (existingFiles.length === 0) {
        return {
          message: 'No metric files found with the provided IDs',
          duration: Date.now() - startTime,
          files: [],
          failed_files: [],
        };
      }

      // Process updates concurrently
      const updatePromises = existingFiles.map(async (existingFile) => {
        const fileUpdate = fileMap.get(existingFile.id);
        if (!fileUpdate) {
          return {
            fileName: existingFile.name,
            error: 'File update not found in request',
          };
        }

        try {
          const result = await processMetricFileUpdate(
            existingFile,
            fileUpdate.yml_content,
            dataSourceId,
            workflowId,
            Date.now() - startTime
          );

          if (!result.success) {
            return {
              fileName: existingFile.name,
              error: result.error || 'Unknown error',
            };
          }

          return {
            fileName: existingFile.name,
            success: true,
            updatedFile: result.updatedFile,
            metricYml: result.metricYml,
            validationMessage: result.validationMessage,
            validationResults: result.validationResults,
          };
        } catch (error) {
          return {
            fileName: existingFile.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const results = await Promise.all(updatePromises);

      // Separate successful and failed updates
      const successfulUpdates: Array<{
        file: typeof metricFiles.$inferSelect;
        metricYml: MetricYml;
      }> = [];

      for (const result of results) {
        if ('success' in result && result.success && result.updatedFile && result.metricYml) {
          successfulUpdates.push({
            file: result.updatedFile,
            metricYml: result.metricYml,
          });
        } else {
          failedFiles.push({
            file_name: 'fileName' in result ? result.fileName : 'Unknown file',
            error: `Failed to modify '${result.fileName}': ${result.error}.

Please attempt to modify the metric again. This error could be due to:
- Using a dataset that doesn't exist (please reevaluate the available datasets in the chat conversation)
- Invalid configuration in the metric file
- Special characters in the metric name or SQL query
- Syntax errors in the SQL query`,
          });
        }
      }

      // Update successful files in database
      if (successfulUpdates.length > 0) {
        // Process each successful update
        for (const { file, metricYml } of successfulUpdates) {
          // Get current version history
          const currentVersionHistory = file.versionHistory as VersionHistory | null;

          // Add new version to history
          const updatedVersionHistory = addMetricVersionToHistory(
            currentVersionHistory,
            metricYml,
            new Date().toISOString()
          );

          // Get the latest version number
          const latestVersion = getLatestVersionNumber(updatedVersionHistory);

          await db
            .update(metricFiles)
            .set({
              content: metricYml,
              name: metricYml.name,
              updatedAt: new Date().toISOString(),
              dataMetadata: file.dataMetadata,
              versionHistory: updatedVersionHistory,
            })
            .where(eq(metricFiles.id, file.id))
            .execute();

          // Add to successful files output
          files.push({
            id: file.id,
            name: metricYml.name,
            file_type: 'metric',
            result_message:
              results.find((r) => 'success' in r && r.updatedFile?.id === file.id)
                ?.validationMessage || '',
            results:
              results.find((r) => 'success' in r && r.updatedFile?.id === file.id)
                ?.validationResults || [],
            created_at: file.createdAt,
            updated_at: file.updatedAt,
            version_number: latestVersion,
          });
        }
      }
    } catch (error) {
      return {
        message: `Failed to modify metric files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }

    // Generate result message
    const successCount = files.length;
    const failureCount = failedFiles.length;

    let message: string;
    if (successCount > 0 && failureCount === 0) {
      message = `Successfully modified ${successCount} metric file${successCount === 1 ? '' : 's'}.`;
    } else if (successCount === 0 && failureCount > 0) {
      message = `Failed to modify ${failureCount} metric file${failureCount === 1 ? '' : 's'}.`;
    } else if (successCount > 0 && failureCount > 0) {
      message = `Successfully modified ${successCount} metric file${successCount === 1 ? '' : 's'}, ${failureCount} failed.`;
    } else {
      message = 'No metric files were processed.';
    }

    return {
      message,
      duration: Date.now() - startTime,
      files,
      failed_files: failedFiles,
    };
  },
  { name: 'modify-metric-files' }
);

// Input/Output schemas
const inputSchema = z.object({
  files: z
    .array(
      z.object({
        id: z.string().describe('The UUID of the metric file to modify'),
        name: z.string().describe('The name of the metric file to modify'),
        yml_content: z
          .string()
          .describe('The complete YAML content for the metric, replacing the entire existing file'),
      })
    )
    .min(1, 'At least one file must be provided'),
});

const outputSchema = z.object({
  message: z.string(),
  duration: z.number(),
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      file_type: z.string(),
      result_message: z.string().optional(),
      results: z.array(z.record(z.any())).optional(),
      created_at: z.string(),
      updated_at: z.string(),
      version_number: z.number(),
    })
  ),
  failed_files: z.array(
    z.object({
      file_name: z.string(),
      error: z.string(),
    })
  ),
});

// Export the tool
export const modifyMetrics = createTool({
  id: 'modify-metrics-file',
  description: `Updates existing metric configuration files with new YAML content. Provide the complete YAML content for each metric, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple metrics simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each metric, you need its UUID and the complete updated YAML content. **Prefer modifying metrics in bulk using this tool rather than one by one.**

Only utilize the required/default fields unless the user specifically requests that optional fields be added.

## COMPLETE METRIC YAML SCHEMA SPECIFICATION

\`\`\`
# METRIC CONFIGURATION - YML STRUCTURE
# -------------------------------------
# REQUIRED Top-Level Fields: \`name\`, \`description\`, \`timeFrame\`, \`sql\`, \`chartConfig\`
#
# --- FIELD DETAILS & RULES --- 
# \`name\`: Human-readable title (e.g., Total Sales). 
#   - RULE: CANNOT contain underscores (\`_\`). Use spaces instead.   
# \`description\`: Detailed explanation of the metric. 
# \`timeFrame\`: Human-readable time period covered by the query, similar to a filter in a BI tool. MUST BE A VALID STRING. 
#   - If doing 2024 as an example, you must do "2024" can't parse as a number.
#   - For queries with fixed date filters, use specific date ranges, e.g., "January 1, 2020 - December 31, 2020", "2024", "Q2 2024", "June 1, 2025".
#   - For queries with relative date filters or no date filter, use relative terms, e.g., "Today", "Yesterday", "Last 7 days", "Last 30 days", "Last Quarter", "Last 12 Months", "Year to Date", "All time", etc.
#   - For comparisons, use "Comparison - [Period 1] vs [Period 2]", with each period formatted according to whether it is fixed or relative, e.g., "Comparison - Last 30 days vs Previous 30 days" or "Comparison - June 1, 2025 - June 30, 2025 vs July 1, 2025 - July 31, 2025".
#   Rules:
#     - Must accurately reflect the date/time filter used in the \`sql\` field. Do not misrepresent the time range.
#     - Use full month names for dates, e.g., "January", not "Jan".
#     - Follow general quoting rules. CANNOT contain ':'.
#   Note: Respond only with the time period, without explanation or additional copy.
# \`sql\`: The SQL query for the metric.
#   - RULE: MUST use the pipe \`|\` block scalar style to preserve formatting and newlines.
#   - NOTE: Remember to use fully qualified names: DATABASE_NAME.SCHEMA_NAME.TABLE_NAME for tables and table_alias.column for columns. This applies to all table and column references, including those within Common Table Expressions (CTEs) and when selecting from CTEs.
#   - Example:
#     sql: |
#       SELECT ... 
# \`chartConfig\`: Visualization settings.
#   - RULE: Must contain \`selectedChartType\` (bar, line, scatter, pie, combo, metric, table).
#   - RULE: Must contain \`columnLabelFormats\` defining format for ALL columns in the SQL result.
#   - RULE: Must contain ONE chart-specific config block based on \`selectedChartType\`:
#     - \`barAndLineAxis\` (for type: bar, line)
#     - \`scatterAxis\` (for type: scatter)
#     - \`pieChartAxis\` (for type: pie)
#     - \`comboChartAxis\` (for type: combo)
#     - \`metricColumnId\` (for type: metric)
#     - \`tableConfig\` (for type: table) - [Optional, if needed beyond basic columns]
#
# --- GENERAL YAML RULES ---
# 1. Use standard YAML syntax (indentation, colons for key-value, \`-\` for arrays).
# 2. Quoting: Generally avoid quotes for simple strings. Use double quotes (\`"..."\`) ONLY if a string contains special characters (like :, {, }, [, ], ,, &, *, #, ?, |, -, <, >, =, !, %, @, \`) or needs to preserve leading/trailing whitespace. 
# 3. Metric name, timeframe, or description CANNOT contain \`:\`
# -------------------------------------

# --- FORMAL SCHEMA --- (Used for validation, reflects rules above)
type: object
name: Metric Configuration Schema
description: Metric definition with SQL query and visualization settings

properties:
  # NAME
  name:
    required: true
    type: string
    description: Human-readable title (e.g., Total Sales). NO underscores. Follow quoting rules. Should not contain \`:\`

  # DESCRIPTION
  description:
    required: true
    type: string
    description: |
      A natural language description of the metric, essentially rephrasing the 'name' field as a question or statement. 
      Example: If name is "Total Sales", description could be "What are the total sales?".
      RULE: Should NOT describe the chart type, axes, or any visualization aspects.
      RULE: Follow general quoting rules. 
      RULE: Should not contain ':'.

  # TIME FRAME
  timeFrame:
    required: true
    type: string
    description: |
      Human-readable time period covered by the SQL query, similar to a filter in a BI tool.
      RULE: Must accurately reflect the date/time filter used in the \`sql\` field. Do not misrepresent the time range.
      Examples:
      - Fixed Dates: "January 1, 2020 - December 31, 2020", "2024", "Q2 2024", "June 1, 2025"
      - Relative Dates: "Today", "Yesterday", "Last 7 days", "Last 30 days", "Last Quarter", "Last 12 Months", "Year to Date", "All time"
      - Comparisons: Use the format "Comparison: [Period 1] vs [Period 2]". Examples:
        - "Comparison: Last 30 days vs Previous 30 days"
        - "Comparison: June 1, 2025 - June 30, 2025 vs July 1, 2025 - July 31, 2025"
      RULE: Use full month names for dates, e.g., "January", not "Jan".
      RULE: Follow general quoting rules. CANNOT contain ':'.

  # SQL QUERY
  sql:
    required: true
    type: string
    description: |
      SQL query using YAML pipe syntax (|).
      The SQL query should be formatted with proper indentation using the YAML pipe (|) syntax.
      This ensures the multi-line SQL is properly parsed while preserving whitespace and newlines.
      IMPORTANT: Remember to use fully qualified names: DATABASE_NAME.SCHEMA_NAME.TABLE_NAME for tables and table_alias.column for columns. This rule is critical for all table and column references, including those within Common Table Expressions (CTEs) and when selecting from CTEs.
      Example:
        sql: |
          SELECT column1, column2
          FROM my_table
          WHERE condition;

  # CHART CONFIGURATION
  chartConfig:
    required: true
    description: Visualization settings (must include selectedChartType, columnLabelFormats, and ONE chart-specific block)
    allOf: # Base requirements for ALL chart types
      - \$ref: '#/definitions/base_chart_config'
    oneOf: # Specific block required based on type 
      - \$ref: #/definitions/bar_line_chart_config
      - \$ref: #/definitions/scatter_chart_config
      - \$ref: #/definitions/pie_chart_config
      - \$ref: #/definitions/combo_chart_config
      - \$ref: #/definitions/metric_chart_config
      - \$ref: #/definitions/table_chart_config

required:
  - name
  - timeFrame
  - sql
  - chartConfig

definitions:
  # BASE CHART CONFIG (common parts used by ALL chart types)
  base_chart_config:
    type: object
    properties:
      selectedChartType:
        type: string
        description: Chart type (bar, line, scatter, pie, combo, metric, table)
        enum: [bar, line, scatter, pie, combo, metric, table]
      columnLabelFormats:
        type: object
        description: REQUIRED formatting for ALL columns returned by the SQL query.
        additionalProperties:
          \$ref: #/definitions/column_label_format
      # Optional base properties below
      columnSettings:
        type: object
        description: |-
          Visual settings applied per column. 
          Keys MUST be LOWERCASE column names from the SQL query results. 
          Example: \`total_sales: { showDataLabels: true }\`
        additionalProperties:
          \$ref: #/definitions/column_settings
      colors:
        type: array
        items:
          type: string
        description: |
          Default color palette. 
          RULE: Hex color codes (e.g., #FF0000) MUST be enclosed in quotes (e.g., "#FF0000" or '#FF0000') because '#' signifies a comment otherwise. Double quotes are preferred for consistency.
          Use this parameter when the user asks about customizing chart colors, unless specified otherwise.
      showLegend:
        type: boolean
      gridLines:
        type: boolean
      showLegendHeadline:
        oneOf:
          - type: boolean
          - type: string
      goalLines:
        type: array
        items:
          \$ref: #/definitions/goal_line
      trendlines:
        type: array
        items:
          \$ref: #/definitions/trendline
      disableTooltip:
        type: boolean
      # Axis Configurations
      # RULE: By default, only add \`xAxisConfig\` and ONLY set its \`xAxisTimeInterval\` property 
      #       when visualizing date/time data on the X-axis (e.g., line, bar, combo charts). 
      #       Do NOT add other \`xAxisConfig\` properties, \`yAxisConfig\`, or \`y2AxisConfig\` 
      #       unless the user explicitly asks for specific axis modifications.
      xAxisConfig:
        description: Controls X-axis properties. For date/time axes, MUST contain \`xAxisTimeInterval\` (day, week, month, quarter, year). Other properties control label visibility, title, rotation, and zoom. Only add when needed (dates) or requested by user.
        \$ref: '#/definitions/x_axis_config'
      yAxisConfig:
        description: Controls Y-axis properties. Only add if the user explicitly requests Y-axis modifications (e.g., hiding labels, changing title). Properties control label visibility, title, rotation, and zoom.
        \$ref: '#/definitions/y_axis_config'
      y2AxisConfig:
        description: Controls secondary Y-axis (Y2) properties, primarily for combo charts. Only add if the user explicitly requests Y2-axis modifications. Properties control label visibility, title, rotation, and zoom.
        \$ref: '#/definitions/y2_axis_config'
      categoryAxisStyleConfig:
        description: Optional style configuration for the category axis (color/grouping).
        \$ref: '#/definitions/category_axis_style_config'
    required:
      - selectedChartType
      - columnLabelFormats

  # AXIS CONFIGURATIONS
  x_axis_config:
    type: object
    properties:
      xAxisTimeInterval:
        type: string
        enum: [day, week, month, quarter, year, 'null']
        description: REQUIRED time interval for grouping date/time values on the X-axis (e.g., for line/combo charts). MUST be set if the X-axis represents time. Default: null.
      xAxisShowAxisLabel:
        type: boolean
        description: Show X-axis labels. Default: true.
      xAxisShowAxisTitle:
        type: boolean
        description: Show X-axis title. Default: true.
      xAxisAxisTitle:
        type: [string, 'null']
        description: X-axis title. Default: null (auto-generates from column names).
      xAxisLabelRotation:
        type: string # Representing numbers or 'auto'
        enum: ["0", "45", "90", auto]
        description: Label rotation. Default: auto.
      xAxisDataZoom:
        type: boolean
        description: Enable data zoom on X-axis. Default: false (User only).
    additionalProperties: false
    required:
      - xAxisTimeInterval

  y_axis_config:
    type: object
    properties:
      yAxisShowAxisLabel:
        type: boolean
        description: Show Y-axis labels. Default: true.
      yAxisShowAxisTitle:
        type: boolean
        description: Show Y-axis title. Default: true.
      yAxisAxisTitle:
        type: [string, 'null']
        description: Y-axis title. Default: null (uses first plotted column name).
      yAxisStartAxisAtZero:
        type: [boolean, 'null']
        description: Start Y-axis at zero. Default: true.
      yAxisScaleType:
        type: string
        enum: [log, linear]
        description: Scale type for Y-axis. Default: linear.
    additionalProperties: false

  y2_axis_config:
    type: object
    description: Secondary Y-axis configuration (for combo charts).
    properties:
      y2AxisShowAxisLabel:
        type: boolean
        description: Show Y2-axis labels. Default: true.
      y2AxisShowAxisTitle:
        type: boolean
        description: Show Y2-axis title. Default: true.
      y2AxisAxisTitle:
        type: [string, 'null']
        description: Y2-axis title. Default: null (uses first plotted column name).
      y2AxisStartAxisAtZero:
        type: [boolean, 'null']
        description: Start Y2-axis at zero. Default: true.
      y2AxisScaleType:
        type: string
        enum: [log, linear]
        description: Scale type for Y2-axis. Default: linear.
    additionalProperties: false

  category_axis_style_config:
    type: object
    description: Style configuration for the category axis (color/grouping).
    properties:
      categoryAxisTitle:
        type: [string, 'null']
        description: Title for the category axis.
    additionalProperties: false

  # COLUMN FORMATTING
  column_label_format:
    type: object
    properties:
      columnType:
        type: string
        description: number, string, date
        enum: [number, string, date]
      style:
        type: string
        enum:
          - currency # Note: The "$" sign is automatically prepended.
          - percent # Note: "%" sign is appended. For percentage values: 
            # - If the value comes directly from a database column, use multiplier: 1
            # - If the value is calculated in your SQL query and not already multiplied by 100, use multiplier: 100
          - number
          - date # Note: For date columns, consider setting xAxisTimeInterval in xAxisConfig to control date grouping (day, week, month, quarter, year)
          - string
      multiplier:
        type: number
        description: Value to multiply the number by before display. Default value is 1. For percentages, the multiplier depends on how the data is sourced: if the value comes directly from a database column, use multiplier: 1; if the value is calculated in your SQL query and not already multiplied by 100, use multiplier: 100.
      displayName:
        type: string
        description: Custom display name for the column
      numberSeparatorStyle:
        type: string
        description: Style for number separators. Your option is ',' or a null value.  Not null wrapped in quotes, a null value.
      minimumFractionDigits:
        type: integer
        description: Minimum number of fraction digits to display
      maximumFractionDigits:
        type: integer
        description: Maximum number of fraction digits to display
      prefix:
        type: string
      suffix:
        type: string
      replaceMissingDataWith:
        type: number
        description: Value to display when data is missing, needs to be set to 0. Should only be set on number columns. All others should be set to null.
      compactNumbers:
        type: boolean
        description: Whether to display numbers in compact form (e.g., 1K, 1M)
      currency:
        type: string
        description: Currency code for currency formatting (e.g., USD, EUR)
      dateFormat:
        type: string
        description: |
          Format string for date display (must be compatible with Day.js format strings). 
          RULE: Choose format based on xAxisTimeInterval:
            - year: 'YYYY' (e.g., 2025)
            - quarter: '[Q]Q YYYY' (e.g., Q1 2025)
            - month: 'MMM YYYY' (e.g., Jan 2025) or 'MMMM' (e.g., January) if context is clear.
            - week/day: 'MMM D, YYYY' (e.g., Jan 25, 2025) or 'MMM D' (e.g., Jan 25) if context is clear.
      useRelativeTime:
        type: boolean
        description: Whether to display dates as relative time (e.g., 2 days ago)
      isUtc:
        type: boolean
        description: Whether to interpret dates as UTC
      convertNumberTo:
        type: string
        description: Optional. Convert numeric values to time units or date parts.  This is a necessity for time series data when numbers are passed instead of the date.
        enum:
          - day_of_week
          - month_of_year
          - quarter

    required:
      - columnType
      - style
      - replaceMissingDataWith
      - numberSeparatorStyle

  # COLUMN VISUAL SETTINGS
  column_settings:
    type: object
    description: Optional visual settings per LOWERCASE column name.
    properties:
      showDataLabels:
        type: boolean
      columnVisualization:
        type: string
        enum:
          - bar
          - line
          - dot
      lineWidth:
        type: number
      lineStyle:
        type: string
        enum:
          - area
          - line
      lineType:
        type: string
        enum:
          - normal
          - smooth
          - step

  # CHART-SPECIFIC CONFIGURATIONS
  bar_line_chart_config:
    allOf:
      - \$ref: #/definitions/base_chart_config
      - type: object
        properties:
          selectedChartType:
            enum:
              - bar
              - line
          barAndLineAxis:
            type: object
            properties:
              x:
                type: array
                items:
                  type: string
              y:
                type: array
                items:
                  type: string
                description: LOWERCASE column name from SQL for X-axis.
              category:
                type: array
                items:
                  type: string
                description: LOWERCASE column name from SQL for category grouping.
            required:
              - x
              - y
          barLayout:
            type: string
            enum:
              - horizontal
              - vertical
          barGroupType:
            type: string
            enum:
              - stack
              - group
              - percentage-stack
        required:
          - selectedChartType
          - barAndLineAxis

  scatter_chart_config:
    allOf:
      - \$ref: #/definitions/base_chart_config
      - type: object
        properties:
          selectedChartType:
            enum:
              - scatter
          scatterAxis:
            type: object
            properties:
              x:
                type: array
                items:
                  type: string
              y:
                type: array
                items:
                  type: string
              category:
                type: array
                items:
                  type: string
              size:
                type: array
                items:
                  type: string
            required:
              - x
              - y
        required:
          - selectedChartType
          - scatterAxis

  pie_chart_config:
    allOf:
      - \$ref: #/definitions/base_chart_config
      - type: object
        properties:
          selectedChartType:
            enum:
              - pie
          pieChartAxis:
            type: object
            properties:
              x:
                type: array
                items:
                  type: string
              y:
                type: array
                items:
                  type: string
            required:
              - x
              - y
        required:
          - selectedChartType
          - pieChartAxis

  combo_chart_config:
    allOf:
      - \$ref: #/definitions/base_chart_config
      - type: object
        properties:
          selectedChartType:
            enum:
              - combo
          comboChartAxis:
            type: object
            properties:
              x:
                type: array
                items:
                  type: string
              y:
                type: array
                items:
                  type: string
            required:
              - x
              - y
        required:
          - selectedChartType
          - comboChartAxis

  metric_chart_config:
    allOf:
      - \$ref: #/definitions/base_chart_config
      - type: object
        properties:
          selectedChartType:
            enum:
              - metric
          metricColumnId:
            type: string
            description: LOWERCASE column name from SQL for the main metric value.
          metricValueAggregate:
            type: string
            enum:
              - sum
              - average
              - median
              - max
              - min
              - count
              - first
            description: Aggregate function for metric value
          metricHeader:
            oneOf:
              - type: string
                description: Simple string title for the metric header
              - type: object
                properties:
                  columnId:
                    type: string
                    description: Which column to use for the header
                  useValue:
                    type: boolean
                    description: Whether to display the key or the value in the chart
                  aggregate:
                    type: string
                    enum:
                      - sum
                      - average
                      - median
                      - max
                      - min
                      - count
                      - first
                    description: Optional aggregation method, defaults to sum
                required:
                  - columnId
                  - useValue
                description: Configuration for a derived metric header
          metricSubHeader:
            oneOf:
              - type: string
                description: Simple string title for the metric sub-header
              - type: object
                properties:
                  columnId:
                    type: string
                    description: Which column to use for the sub-header
                  useValue:
                    type: boolean
                    description: Whether to display the key or the value in the chart
                  aggregate:
                    type: string
                    enum:
                      - sum
                      - average
                      - median
                      - max
                      - min
                      - count
                      - first
                    description: Optional aggregation method, defaults to sum
                required:
                  - columnId
                  - useValue
                description: Configuration for a derived metric sub-header
        required:
          - selectedChartType
          - metricColumnId

  table_chart_config:
    allOf:
      - \$ref: #/definitions/base_chart_config
      - type: object
        properties:
          selectedChartType:
            enum:
              - table
          tableColumnOrder:
            type: array
            items:
              type: string
        required:
          - selectedChartType
          # No additional required fields for table chart

  # HELPER OBJECTS
  goal_line:
    type: object
    properties:
      show:
        type: boolean
      value:
        type: number
      goalLineLabel:
        type: string

  trendline:
    type: object
    properties:
      type:
        type: string
        enum:
          - average
          - linear_regression
          - min
          - max
          - median
      columnId:
        type: string
    required:
      - type
      - columnId
\`\`\`

**CRITICAL:** This is the complete schema specification. Follow it exactly - every property, enum value, and requirement listed above must be respected. Pay special attention to:

1. **Required properties** for each chart type
2. **Enum values** for each field (e.g., selectedChartType, columnType, style)
3. **Column name casing** (must be lowercase in axis configurations)
4. **Complete columnLabelFormats** for every SQL result column
5. **Proper YAML syntax** with pipe (|) for SQL blocks
6. **Chart-specific axis configurations** (barAndLineAxis, scatterAxis, etc.)
7. **Date formatting rules** that match xAxisTimeInterval settings`,
  inputSchema,
  outputSchema,
  execute: async ({ context, runtimeContext }) => {
    return await modifyMetricFiles(context as UpdateFilesParams, runtimeContext);
  },
});

export default modifyMetrics;
