import { randomUUID } from 'node:crypto';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import {} from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { db } from '../../../../database/src/connection';
import { assetPermissions, metricFiles } from '../../../../database/src/schema';

// Core interfaces matching Rust structs
interface MetricFileParams {
  name: string;
  yml_content: string;
}

interface CreateMetricFilesParams {
  files: MetricFileParams[];
}

interface FailedFileCreation {
  name: string;
  error: string;
}

interface FileWithId {
  id: string;
  name: string;
  file_type: string;
  yml_content: string;
  result_message?: string;
  results?: Record<string, any>[];
  created_at: string;
  updated_at: string;
  version_number: number;
}

interface CreateMetricFilesOutput {
  message: string;
  duration: number;
  files: FileWithId[];
  failed_files: FailedFileCreation[];
}

// Comprehensive YAML schema validation
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
});

// Chart-specific schemas
const barChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('bar'),
  barAndLineAxis: z.object({
    x: z.array(z.string()),
    y: z.array(z.string()),
    category: z.array(z.string()).optional(),
  }),
  barLayout: z.enum(['horizontal', 'vertical']).optional(),
  barGroupType: z.enum(['stack', 'group', 'percentage-stack']).optional(),
});

const lineChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('line'),
  barAndLineAxis: z.object({
    x: z.array(z.string()),
    y: z.array(z.string()),
    category: z.array(z.string()).optional(),
  }),
  barLayout: z.enum(['horizontal', 'vertical']).optional(),
  barGroupType: z.enum(['stack', 'group', 'percentage-stack']).optional(),
});

const tableChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('table'),
  tableColumnOrder: z.array(z.string()).optional(),
});

const metricChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('metric'),
  metricColumnId: z.string(),
  metricValueAggregate: z
    .enum(['sum', 'average', 'median', 'max', 'min', 'count', 'first'])
    .optional(),
  metricHeader: z
    .union([
      z.string(),
      z.object({
        columnId: z.string(),
        useValue: z.boolean(),
        aggregate: z.enum(['sum', 'average', 'median', 'max', 'min', 'count', 'first']).optional(),
      }),
    ])
    .optional(),
  metricSubHeader: z
    .union([
      z.string(),
      z.object({
        columnId: z.string(),
        useValue: z.boolean(),
        aggregate: z.enum(['sum', 'average', 'median', 'max', 'min', 'count', 'first']).optional(),
      }),
    ])
    .optional(),
  metricValueLabel: z.string().optional(),
});

const scatterChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('scatter'),
  scatterAxis: z.object({
    x: z.array(z.string()),
    y: z.array(z.string()),
    category: z.array(z.string()).optional(),
    size: z.array(z.string()).optional(),
  }),
});

const pieChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('pie'),
  pieChartAxis: z.object({
    x: z.array(z.string()),
    y: z.array(z.string()),
  }),
});

const comboChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('combo'),
  comboChartAxis: z.object({
    x: z.array(z.string()),
    y: z.array(z.string()),
  }),
});

const chartConfigSchema = z.discriminatedUnion('selectedChartType', [
  barChartConfigSchema,
  lineChartConfigSchema,
  tableChartConfigSchema,
  metricChartConfigSchema,
  scatterChartConfigSchema,
  pieChartConfigSchema,
  comboChartConfigSchema,
]);

const metricYmlSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  timeFrame: z.string().min(1),
  sql: z.string().min(1),
  chartConfig: chartConfigSchema,
});

type MetricYml = z.infer<typeof metricYmlSchema>;

// Tool implementation
export const createMetricsFileTool = createTool({
  id: 'create-metrics-file',
  description:
    'Creates metric configuration files with YAML content following the metric schema specification. Before using this tool, carefully consider the appropriate visualization type (bar, line, scatter, pie, combo, metric, table) and its specific configuration requirements. Each visualization has unique axis settings, formatting options, and data structure needs that must be thoroughly planned to create effective metrics. **This tool supports creating multiple metrics in a single call; prefer using bulk creation over creating metrics one by one.**',
  inputSchema: z.object({
    files: z
      .array(
        z.object({
          name: z
            .string()
            .describe(
              "The natural language name/title for the metric, exactly matching the 'name' field within the YML content. This name will identify the metric in the UI. Do not include file extensions or use file path characters."
            ),
          yml_content: z
            .string()
            .describe(
              "The YAML content for a single metric, adhering to the comprehensive metric schema. Multiple metrics can be created in one call by providing multiple entries in the 'files' array. **Prefer creating metrics in bulk.**"
            ),
        })
      )
      .min(1)
      .describe(
        'List of file parameters to create. The files will contain YAML content that adheres to the metric schema specification.'
      ),
  }),
  outputSchema: z.object({
    message: z.string(),
    duration: z.number(),
    files: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        file_type: z.string(),
        yml_content: z.string(),
        result_message: z.string().optional(),
        results: z.array(z.record(z.any())).optional(),
        created_at: z.string(),
        updated_at: z.string(),
        version_number: z.number(),
      })
    ),
    failed_files: z.array(
      z.object({
        name: z.string(),
        error: z.string(),
      })
    ),
  }),
  execute: async ({ context, runtimeContext }) => {
    return await createMetricFiles(context as CreateMetricFilesParams, runtimeContext);
  },
});

const createMetricFiles = wrapTraced(
  async (
    params: CreateMetricFilesParams,
    runtimeContext: RuntimeContext
  ): Promise<CreateMetricFilesOutput> => {
    const startTime = Date.now();
    const { files } = params;

    const createdFiles: FileWithId[] = [];
    const failedFiles: FailedFileCreation[] = [];

    // Extract context values
    const dataSourceId = runtimeContext?.get('dataSourceId');
    const dataSourceSyntax = runtimeContext?.get('dataSourceSyntax') || 'generic';
    const userId = runtimeContext?.get('userId');
    const organizationId = runtimeContext?.get('organizationId');

    if (!dataSourceId) {
      throw new Error('Data source ID not found in runtime context');
    }
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    if (!organizationId) {
      throw new Error('Organization ID not found in runtime context');
    }

    // Process files concurrently
    const processResults = await Promise.allSettled(
      files.map(async (file) => {
        const result = await processMetricFile(
          file.name,
          file.yml_content,
          dataSourceId,
          dataSourceSyntax,
          userId,
          organizationId
        );
        return { fileName: file.name, result };
      })
    );

    const successfulProcessing: Array<{
      metricFile: any;
      metricYml: MetricYml;
      message: string;
      results: Record<string, any>[];
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileName, result } = processResult.value;
        if (result.success) {
          successfulProcessing.push({
            metricFile: result.metricFile,
            metricYml: result.metricYml!,
            message: result.message!,
            results: result.results!,
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
        await db.transaction(async (tx) => {
          // Insert metric files
          const metricRecords = successfulProcessing.map((sp) => sp.metricFile);
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

        // Prepare successful files output
        for (let i = 0; i < successfulProcessing.length; i++) {
          const sp = successfulProcessing[i];
          createdFiles.push({
            id: sp.metricFile.id,
            name: sp.metricFile.name,
            file_type: 'metric',
            yml_content: yaml.stringify(sp.metricYml),
            result_message: sp.message,
            results: sp.results,
            created_at: sp.metricFile.createdAt,
            updated_at: sp.metricFile.updatedAt,
            version_number: 1,
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

    const duration = Date.now() - startTime;

    const message = generateResultMessage(createdFiles, failedFiles);

    return {
      message,
      duration,
      files: createdFiles,
      failed_files: failedFiles,
    };
  },
  { name: 'create-metrics-file' }
);

async function processMetricFile(
  fileName: string,
  ymlContent: string,
  dataSourceId: string,
  dataSourceDialect: string,
  userId: string,
  organizationId: string
): Promise<{
  success: boolean;
  metricFile?: any;
  metricYml?: MetricYml;
  message?: string;
  results?: Record<string, any>[];
  error?: string;
}> {
  try {
    // Parse and validate YAML
    const parsedYml = yaml.parse(ymlContent);
    const metricYml = metricYmlSchema.parse(parsedYml);

    // Generate deterministic UUID (simplified version)
    const metricId = randomUUID();

    // Validate SQL by running it
    const sqlValidationResult = await validateSql(metricYml.sql, dataSourceId, dataSourceDialect);

    if (!sqlValidationResult.success) {
      return {
        success: false,
        error: `Invalid SQL query: ${sqlValidationResult.error}`,
      };
    }

    // Create metric file object
    const now = new Date().toISOString();
    const metricFile = {
      id: metricId,
      name: metricYml.name,
      fileName: fileName,
      content: metricYml,
      verification: 'notRequested' as const,
      evaluationObj: null,
      evaluationSummary: null,
      evaluationScore: null,
      organizationId: organizationId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      publiclyAccessible: false,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      versionHistory: { version: 1, history: [metricYml] },
      dataMetadata: sqlValidationResult.metadata,
      publicPassword: null,
      dataSourceId: dataSourceId,
    };

    return {
      success: true,
      metricFile,
      metricYml,
      message: sqlValidationResult.message,
      results: sqlValidationResult.results,
    };
  } catch (error) {
    let errorMessage = 'Unknown error';

    if (error instanceof z.ZodError) {
      errorMessage = `Invalid YAML structure: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error instanceof Error) {
      if (error.message.includes('YAMLParseError')) {
        errorMessage = `Invalid YAML format: ${error.message}`;
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
  dataSourceDialect: string
): Promise<{
  success: boolean;
  message?: string;
  results?: Record<string, any>[];
  metadata?: any;
  error?: string;
}> {
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

    // TODO: Execute SQL query against the data source to validate it
    // For now, simulate successful validation
    const mockResults: Record<string, any>[] = [];
    const mockMetadata = {
      columns: [],
      rowCount: 0,
      executionTime: 100,
    };

    const message =
      mockResults.length === 0
        ? 'No records were found'
        : `${mockResults.length} records were returned`;

    return {
      success: true,
      message,
      results: mockResults,
      metadata: mockMetadata,
    };
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
