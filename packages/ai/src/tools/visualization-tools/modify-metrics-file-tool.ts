import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { eq, inArray, sql } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { DataSource } from '../../../../data-source/src/data-source';
import type { Credentials } from '../../../../data-source/src/types/credentials';
import { db } from '../../../../database/src/connection';
import { metricFiles } from '../../../../database/src/schema';
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
  const timeFrameRegex = /(time_frame\s*:\s*)([^\r\n]+)/g;

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

// Comprehensive YAML schema validation (reusing from create tool)
const columnLabelFormatSchema = z.object({
  columnType: z.enum(['number', 'string', 'date']),
  style: z.enum(['currency', 'percent', 'number', 'date', 'string']),
  multiplier: z.number().optional(),
  displayName: z.string().optional(),
  numberSeparatorStyle: z.string().nullable().optional(),
  minimumFractionDigits: z.number().optional(),
  maximumFractionDigits: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  replaceMissingDataWith: z.number().nullable().optional(),
  compactNumbers: z.boolean().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  useRelativeTime: z.boolean().optional(),
  isUtc: z.boolean().optional(),
  convertNumberTo: z.enum(['day_of_week', 'month_of_year', 'quarter']).optional(),
});

const baseChartConfigSchema = z.object({
  selectedChartType: z.enum(['bar', 'line', 'scatter', 'pie', 'combo', 'metric', 'table']),
  columnLabelFormats: z.record(columnLabelFormatSchema),
  columnSettings: z.record(z.any()).optional(),
  colors: z.array(z.string()).optional(),
  showLegend: z.boolean().optional(),
  gridLines: z.boolean().optional(),
  showLegendHeadline: z.union([z.boolean(), z.string()]).optional(),
  goalLines: z.array(z.any()).optional(),
  trendlines: z.array(z.any()).optional(),
  disableTooltip: z.boolean().optional(),
  xAxisConfig: z
    .object({
      xAxisTimeInterval: z.enum(['day', 'week', 'month', 'quarter', 'year', 'null']),
      xAxisShowAxisLabel: z.boolean().optional(),
      xAxisShowAxisTitle: z.boolean().optional(),
      xAxisAxisTitle: z.string().nullable().optional(),
      xAxisLabelRotation: z.enum(['0', '45', '90', 'auto']).optional(),
      xAxisDataZoom: z.boolean().optional(),
    })
    .optional(),
  yAxisConfig: z
    .object({
      yAxisShowAxisLabel: z.boolean().optional(),
      yAxisShowAxisTitle: z.boolean().optional(),
      yAxisAxisTitle: z.string().nullable().optional(),
      yAxisStartAxisAtZero: z.boolean().nullable().optional(),
      yAxisScaleType: z.enum(['log', 'linear']).optional(),
    })
    .optional(),
  y2AxisConfig: z
    .object({
      y2AxisShowAxisLabel: z.boolean().optional(),
      y2AxisShowAxisTitle: z.boolean().optional(),
      y2AxisAxisTitle: z.string().nullable().optional(),
      y2AxisStartAxisAtZero: z.boolean().nullable().optional(),
      y2AxisScaleType: z.enum(['log', 'linear']).optional(),
    })
    .optional(),
  categoryAxisStyleConfig: z
    .object({
      colorColumnId: z.string().optional(),
      groupByColumnId: z.string().optional(),
    })
    .optional(),
});

const tableChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('table'),
  tableColumnOrder: z.array(z.string()).optional(),
});

const metricChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('metric'),
  metricColumnId: z.string(),
});

const barChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('bar'),
});

const lineChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('line'),
});

const scatterChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('scatter'),
});

const pieChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('pie'),
});

const comboChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('combo'),
});

const chartConfigSchema = z.discriminatedUnion('selectedChartType', [
  tableChartConfigSchema,
  metricChartConfigSchema,
  barChartConfigSchema,
  lineChartConfigSchema,
  scatterChartConfigSchema,
  pieChartConfigSchema,
  comboChartConfigSchema,
]);

const metricYmlSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  time_frame: z.string().min(1),
  sql: z.string().min(1),
  chart_config: chartConfigSchema,
});

// Remove duplicate type definition since imported from types
// type MetricYml = z.infer<typeof metricYmlSchema>;

interface SqlValidationResult {
  success: boolean;
  message?: string;
  results?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  error?: string;
}

// Replace the basic SQL validation with comprehensive validation
async function validateSql(sqlQuery: string, dataSourceId: string): Promise<SqlValidationResult> {
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

    // Get data source credentials from vault
    let dataSource: DataSource;
    try {
      const credentials = await getDataSourceCredentials(dataSourceId);
      dataSource = new DataSource({
        dataSources: [
          {
            name: `datasource-${dataSourceId}`,
            type: credentials.type,
            credentials: credentials,
          },
        ],
        defaultDataSource: `datasource-${dataSourceId}`,
      });
    } catch (_error) {
      return {
        success: false,
        error: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
      };
    }

    try {
      // Retry configuration for SQL validation
      const MAX_RETRIES = 3;
      const TIMEOUT_MS = 30000; // 30 seconds per attempt
      const RETRY_DELAYS = [1000, 3000, 6000]; // 1s, 3s, 6s

      // Attempt execution with retries
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Execute the SQL query using the DataSource with timeout for validation
          const result = await dataSource.execute({
            sql: sqlQuery,
            options: {
              timeout: TIMEOUT_MS,
            },
          });

          if (result.success) {
            const allResults = result.rows || [];
            // Truncate results to 25 records for validation
            const results = allResults.slice(0, 25);

            const metadata = {
              columns: results.length > 0 ? Object.keys(results[0] || {}) : [],
              rowCount: results.length,
              totalRowCount: allResults.length, // Track original count
              executionTime: 100, // We don't have actual execution time from DataSource
            };

            const message =
              allResults.length === 0
                ? 'Query executed successfully but returned no records'
                : `Query validated successfully and returned ${allResults.length} records${allResults.length > 25 ? ` (showing sample of first 25 of ${allResults.length} total)` : ''}`;

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
                metricName: metric?.name,
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
                metricName: metric?.name,
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
    } finally {
      // Always close the data source connection
      await dataSource.close();
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SQL validation failed',
    };
  }
}

async function getDataSourceCredentials(dataSourceId: string): Promise<Credentials> {
  try {
    // Query the vault to get the credentials
    const secretResult = await db.execute(
      sql`SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ${dataSourceId} LIMIT 1`
    );

    if (!secretResult || secretResult.length === 0) {
      return Promise.reject(
        new Error(
          'Unable to access your data source credentials. Please ensure the data source is properly configured.'
        )
      );
    }

    const secretString = secretResult[0]?.decrypted_secret as string;
    if (!secretString) {
      return Promise.reject(
        new Error(
          'The data source credentials appear to be invalid. Please reconfigure your data source.'
        )
      );
    }

    // Parse the credentials JSON
    const credentials = JSON.parse(secretString) as Credentials;
    return credentials;
  } catch (error) {
    console.error('Error getting data source credentials:', error);
    return Promise.reject(
      new Error(
        'Unable to retrieve data source credentials. Please contact support if this issue persists.'
      )
    );
  }
}

// Parse and validate YAML content
function parseAndValidateYaml(ymlContent: string): {
  success: boolean;
  error?: string;
  data?: MetricYml;
} {
  try {
    // Ensure timeFrame values are properly quoted before parsing
    const fixedYmlContent = ensureTimeFrameQuoted(ymlContent);

    const parsedYml = yaml.parse(fixedYmlContent);
    const validationResult = metricYmlSchema.safeParse(parsedYml);

    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid YAML structure: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }

    // Transform the validated data to match MetricYml type (camelCase)
    const transformedData: MetricYml = {
      name: validationResult.data.name,
      description: validationResult.data.description,
      timeFrame: validationResult.data.time_frame, // Transform snake_case to camelCase
      sql: validationResult.data.sql,
      chartConfig: validationResult.data.chart_config, // Transform snake_case to camelCase
    };

    return { success: true, data: transformedData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'YAML parsing failed',
    };
  }
}

// Process a metric file update with complete new YAML content
async function processMetricFileUpdate(
  existingFile: typeof metricFiles.$inferSelect,
  ymlContent: string,
  dataSourceId: string,
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

  // Parse and validate new YAML content
  const yamlValidation = parseAndValidateYaml(ymlContent);
  if (!yamlValidation.success) {
    const error = `Failed to validate YAML: ${yamlValidation.error}`;
    modificationResults.push({
      file_id: existingFile.id,
      file_name: existingFile.name,
      success: false,
      error,
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
      error,
    };
  }

  const newMetricYml = yamlValidation.data;
  if (!newMetricYml) {
    return {
      success: false,
      modificationResults,
      validationMessage: '',
      validationResults: [],
      validatedDatasetIds: [],
      error: 'Failed to parse metric YAML',
    };
  }

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
  const sqlValidation = await validateSql(newMetricYml.sql, dataSourceId);
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
            result_message: results.find((r) => 'success' in r && r.updatedFile?.id === file.id)
              ?.validationMessage,
            results: results.find((r) => 'success' in r && r.updatedFile?.id === file.id)
              ?.validationResults,
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
        id: z.string().uuid('Must be a valid UUID'),
        name: z.string().min(1, 'Name cannot be empty'),
        yml_content: z.string().min(1, 'YAML content cannot be empty'),
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
  description:
    'Updates existing metric configuration files with new YAML content. Provide the complete YAML content for each metric, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple metrics simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each metric, you need its UUID and the complete updated YAML content. Prefer modifying metrics in bulk using this tool rather than one by one.',
  inputSchema,
  outputSchema,
  execute: async ({ context, runtimeContext }) => {
    return await modifyMetricFiles(context as UpdateFilesParams, runtimeContext);
  },
});

export default modifyMetrics;
