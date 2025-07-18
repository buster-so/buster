import { randomUUID } from 'node:crypto';
import type { DataSource } from '@buster/data-source';
import { assetPermissions, db, metricFiles } from '@buster/database';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { inArray } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { getWorkflowDataSourceManager } from '../../utils/data-source-manager';
import { createPermissionErrorMessage, validateSqlPermissions } from '../../utils/sql-permissions';
import type { AnalystRuntimeContext } from '../../workflows/analyst-workflow';
import { validateAndAdjustBarLineAxes } from './bar-line-axis-validator';
import { trackFileAssociations } from './file-tracking-helper';
import { createInitialMetricVersionHistory, validateMetricYml } from './version-history-helpers';
import type { MetricYml } from './version-history-types';

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
        // Check if it's a numeric string first
        if (!Number.isNaN(Number(firstValue))) {
          columnType = Number.isInteger(Number(firstValue)) ? ColumnType.Int4 : ColumnType.Float8;
          simpleType = SimpleType.Number;
        } else if (
          !Number.isNaN(Date.parse(firstValue)) &&
          // Additional check to avoid parsing simple numbers as dates
          (firstValue.includes('-') || firstValue.includes('/') || firstValue.includes(':'))
        ) {
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
        const numValues = values
          .map((v) => {
            if (typeof v === 'number') return v;
            if (typeof v === 'string' && !Number.isNaN(Number(v))) return Number(v);
            return null;
          })
          .filter((v) => v !== null) as number[];
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
      name: columnName.toLowerCase(),
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
interface MetricFileParams {
  name: string;
  yml_content: string;
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

interface ValidationResult {
  success: boolean;
  message?: string;
  results?: Record<string, unknown>[];
  metadata?: QueryMetadata;
  error?: string;
}

interface MetricFileResult {
  success: boolean;
  metricFile?: FileWithId;
  metricYml?: MetricYml;
  message?: string;
  results?: Record<string, unknown>[];
  error?: string;
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
  result_message?: string;
  results?: Record<string, unknown>[];
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

// Tool implementation with complete schema included
export const createMetrics = createTool({
  id: 'create-metrics-file',
  description: `Creates metric configuration files with YAML content following the metric schema specification. Before using this tool, carefully consider the appropriate visualization type (bar, line, scatter, pie, combo, metric, table) and its specific configuration requirements. Each visualization has unique axis settings, formatting options, and data structure needs that must be thoroughly planned to create effective metrics. **This tool supports creating multiple metrics in a single call; prefer using bulk creation over creating metrics one by one.**

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
              y2: 
                type: array
                items:
                  type: string
            required:
              - x
              - y
              - y2
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
    return await createMetricFiles(
      context as CreateMetricFilesParams,
      runtimeContext as RuntimeContext<AnalystRuntimeContext>
    );
  },
});

const createMetricFiles = wrapTraced(
  async (
    params: CreateMetricFilesParams,
    runtimeContext: RuntimeContext<AnalystRuntimeContext>
  ): Promise<CreateMetricFilesOutput> => {
    const startTime = Date.now();
    const { files } = params;

    const createdFiles: FileWithId[] = [];
    const failedFiles: FailedFileCreation[] = [];

    // Extract context values
    const dataSourceId = runtimeContext?.get('dataSourceId') as string;
    const dataSourceSyntax = (runtimeContext?.get('dataSourceSyntax') || 'generic') as string;
    const userId = runtimeContext?.get('userId') as string;
    const organizationId = runtimeContext?.get('organizationId') as string;
    const workflowStartTime = runtimeContext?.get('workflowStartTime') as number | undefined;
    const messageId = runtimeContext?.get('messageId') as string | undefined;

    // Generate a unique workflow ID using start time and data source
    const workflowId = workflowStartTime
      ? `workflow-${workflowStartTime}-${dataSourceId}`
      : `workflow-${Date.now()}-${dataSourceId}`;

    if (!dataSourceId) {
      return {
        message: 'Unable to identify the data source. Please refresh and try again.',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }
    if (!userId) {
      return {
        message: 'Unable to verify your identity. Please log in again.',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }
    if (!organizationId) {
      return {
        message: 'Unable to access your organization. Please check your permissions.',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
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
          organizationId,
          workflowId
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
            dataMetadata: sp.results ? createDataMetadata(sp.results) : null,
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

        // Critical save verification - ensure records were actually saved
        if (successfulProcessing.length > 0) {
          try {
            const savedMetricIds = successfulProcessing.map((sp) => sp.metricFile.id);
            const verificationResult = await db
              .select({ id: metricFiles.id })
              .from(metricFiles)
              .where(inArray(metricFiles.id, savedMetricIds))
              .limit(savedMetricIds.length);

            if (verificationResult.length !== savedMetricIds.length) {
              console.error('[Critical Save Verification] Mismatch in saved records:', {
                expected: savedMetricIds.length,
                actual: verificationResult.length,
                messageId,
                workflowId,
              });

              // Mark files as failed if verification doesn't match
              const savedIds = new Set(verificationResult.map((r) => r.id));
              for (const sp of successfulProcessing) {
                if (!savedIds.has(sp.metricFile.id)) {
                  failedFiles.push({
                    name: sp.metricFile.name,
                    error: 'Critical save verification failed - record not found after save',
                  });
                }
              }
            }
          } catch (verifyError) {
            console.error('[Critical Save Verification] Error during verification:', verifyError);
            // Don't fail the entire operation, but log the issue
          }
        }

        // Prepare successful files output
        for (const sp of successfulProcessing) {
          createdFiles.push({
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

    const duration = Date.now() - startTime;

    const message = generateResultMessage(createdFiles, failedFiles);

    // Track file associations if we have a messageId and created files
    if (messageId && createdFiles.length > 0) {
      await trackFileAssociations({
        messageId,
        files: createdFiles.map((file) => ({
          id: file.id,
          version: file.version_number,
        })),
      });
    }

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
  _fileName: string,
  ymlContent: string,
  dataSourceId: string,
  dataSourceDialect: string,
  userId: string,
  _organizationId: string,
  workflowId: string
): Promise<MetricFileResult> {
  try {
    // Ensure timeFrame values are properly quoted before parsing
    const fixedYmlContent = ensureTimeFrameQuoted(ymlContent);

    // Parse and validate YAML
    const parsedYml = yaml.parse(fixedYmlContent);
    const metricYml = validateMetricYml(parsedYml);

    // Validate and adjust bar/line chart axes
    const axisValidation = validateAndAdjustBarLineAxes(metricYml);
    if (!axisValidation.isValid) {
      return {
        success: false,
        error: axisValidation.error || 'Invalid bar/line chart axis configuration',
      };
    }

    // Use adjusted YAML if axes were swapped
    const finalMetricYml =
      axisValidation.shouldSwapAxes && axisValidation.adjustedYml
        ? axisValidation.adjustedYml
        : metricYml;

    // Generate deterministic UUID (simplified version)
    const metricId = randomUUID();

    // Validate SQL by running it
    const sqlValidationResult = await validateSql(
      finalMetricYml.sql,
      dataSourceId,
      workflowId,
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
      id: metricId,
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
  workflowId: string,
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
    const TIMEOUT_MS = 120000; // 120 seconds (2 minutes) per attempt for Snowflake queue handling
    const RETRY_DELAYS = [1000, 3000, 6000]; // 1s, 3s, 6s

    // Attempt execution with retries
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Execute the SQL query using the DataSource with row limit and timeout for validation
        // Use maxRows to limit results without modifying the SQL query (preserves Snowflake caching)
        const result = await dataSource.execute({
          sql: sqlQuery,
          options: {
            maxRows: 1000, // Additional safety limit at adapter level
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
            `[create-metrics] SQL validation timeout on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
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
            `[create-metrics] SQL validation timeout (exception) on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
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

/**
 * Optimistic parsing function for streaming create-metrics-file tool arguments
 * Extracts the files array as it's being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<{ files: Array<{ name: string; yml_content: string }> }> | null {
  // Validate input type
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    // First try to parse as complete JSON
    const parsed = JSON.parse(accumulatedText);
    return {
      files: parsed.files || undefined,
    };
  } catch (error) {
    // Only catch JSON parse errors - let other errors bubble up
    if (error instanceof SyntaxError) {
      // If JSON is incomplete, try to extract and reconstruct the files array
      const filesMatch = accumulatedText.match(/"files"\s*:\s*\[(.*)/s);
      if (filesMatch && filesMatch[1] !== undefined) {
        const arrayContent = filesMatch[1];

        try {
          // Try to parse the array content by adding closing bracket
          const testArray = `[${arrayContent}]`;
          const parsed = JSON.parse(testArray);
          return { files: parsed };
        } catch {
          // If that fails, try to extract file objects (both complete and incomplete)
          const files: Array<{ name: string; yml_content: string }> = [];

          // First, try to match complete file objects
          const completeFileMatches = arrayContent.matchAll(
            /\{\s*"name"\s*:\s*"([^"]*?)"\s*,\s*"yml_content"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g
          );

          for (const match of completeFileMatches) {
            if (match[1] !== undefined && match[2] !== undefined) {
              let ymlContent = match[2]
                .replace(/\\"/g, '"')
                .replace(/\\n/g, '\n')
                .replace(/\\\\/g, '\\');

              // Ensure timeFrame is properly quoted
              ymlContent = ensureTimeFrameQuoted(ymlContent);

              files.push({
                name: match[1],
                yml_content: ymlContent,
              });
            }
          }

          // If no complete files found, try to extract partial file objects
          if (files.length === 0) {
            // Try to match incomplete file objects that have at least name and partial yml_content
            const incompleteFileMatch = arrayContent.match(
              /\{\s*"name"\s*:\s*"([^"]*?)"\s*,\s*"yml_content"\s*:\s*"((?:[^"\\]|\\.)*)/
            );

            if (
              incompleteFileMatch &&
              incompleteFileMatch[1] !== undefined &&
              incompleteFileMatch[2] !== undefined
            ) {
              const name = incompleteFileMatch[1];
              let ymlContent = incompleteFileMatch[2]
                .replace(/\\"/g, '"')
                .replace(/\\n/g, '\n')
                .replace(/\\\\/g, '\\');

              // Ensure timeFrame is properly quoted
              ymlContent = ensureTimeFrameQuoted(ymlContent);

              files.push({
                name,
                yml_content: ymlContent,
              });
            }
          }

          return { files };
        }
      }

      // Check if we at least have the start of the files field
      const partialMatch = accumulatedText.match(/"files"\s*:\s*\[/);
      if (partialMatch) {
        return { files: [] };
      }

      return null;
    }

    // Unexpected error - re-throw with context
    throw new Error(
      `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
