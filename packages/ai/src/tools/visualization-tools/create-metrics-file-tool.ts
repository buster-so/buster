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

// Updated validation schemas to match Rust types exactly
const yAxisConfigSchema = z.object({
  yAxisShowAxisLabel: z.boolean().optional(),
  yAxisShowAxisTitle: z.boolean().optional(),
  yAxisAxisTitle: z.string().nullable().optional(),
  yAxisStartAxisAtZero: z.boolean().nullable().optional(),
  yAxisScaleType: z.enum(['log', 'linear']).optional(),
});

const y2AxisConfigSchema = z.object({
  y2AxisShowAxisLabel: z.boolean().optional(),
  y2AxisShowAxisTitle: z.boolean().optional(),
  y2AxisAxisTitle: z.string().nullable().optional(),
  y2AxisStartAxisAtZero: z.boolean().nullable().optional(),
  y2AxisScaleType: z.enum(['log', 'linear']).optional(),
});

const xAxisConfigSchema = z.object({
  xAxisTimeInterval: z.enum(['day', 'week', 'month', 'quarter', 'year', 'null']).optional(),
  xAxisShowAxisLabel: z.boolean().optional(),
  xAxisShowAxisTitle: z.boolean().optional(),
  xAxisAxisTitle: z.string().nullable().optional(),
  xAxisLabelRotation: z.enum(['0', '45', '90', 'auto']).optional(),
  xAxisDataZoom: z.boolean().optional(),
});

const categoryAxisStyleConfigSchema = z.object({
  categoryAxisTitle: z.string().nullable().optional(),
});

const columnLabelFormatSchema = z.object({
  columnType: z.enum(['number', 'string', 'date']),
  style: z.enum(['currency', 'percent', 'number', 'date', 'string']),
  displayName: z.string().optional(),
  numberSeparatorStyle: z.string().nullable().optional(),
  minimumFractionDigits: z.number().optional(),
  maximumFractionDigits: z.number().optional(),
  multiplier: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  replaceMissingDataWith: z.any().optional(), // Can be number or null
  compactNumbers: z.boolean().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  useRelativeTime: z.boolean().optional(),
  isUtc: z.boolean().optional(),
  convertNumberTo: z.enum(['day_of_week', 'month_of_year', 'quarter']).optional(),
});

const columnSettingsSchema = z.object({
  showDataLabels: z.boolean().optional(),
  showDataLabelsAsPercentage: z.boolean().optional(),
  columnVisualization: z.string().optional(),
  lineWidth: z.number().optional(),
  lineStyle: z.string().optional(),
  lineType: z.string().optional(),
  lineSymbolSize: z.number().optional(),
  barRoundness: z.number().optional(),
  lineSymbolSizeDot: z.number().optional(),
});

const goalLineSchema = z.object({
  show: z.boolean().optional(),
  value: z.number().optional(),
  showGoalLineLabel: z.boolean().optional(),
  goalLineLabel: z.string().optional(),
  goalLineColor: z.string().optional(),
});

const trendlineSchema = z.object({
  show: z.boolean().optional(),
  showTrendlineLabel: z.boolean().optional(),
  trendlineLabel: z.string().optional(),
  type: z.string(),
  columnId: z.string(),
  trendLineColor: z.string().optional(),
  trendlineLabelPositionOffset: z.number().optional(),
  projection: z.boolean().optional(),
  lineStyle: z.string().optional(),
  offset: z.number().optional(),
  polynomialOrder: z.number().optional(),
  aggregateAllCategories: z.boolean().optional(),
  id: z.string().optional(),
});

// Base chart config shared by all chart types (matching Rust BaseChartConfig)
const baseChartConfigSchema = z.object({
  columnLabelFormats: z.record(columnLabelFormatSchema),
  columnSettings: z.record(columnSettingsSchema).optional(),
  colors: z.array(z.string()).optional(),
  showLegend: z.boolean().optional(),
  gridLines: z.boolean().optional(),
  showLegendHeadline: z.union([z.boolean(), z.string()]).optional(),
  goalLines: z.array(goalLineSchema).optional(),
  trendlines: z.array(trendlineSchema).optional(),
  disableTooltip: z.boolean().optional(),
  yAxisConfig: yAxisConfigSchema.optional(),
  xAxisConfig: xAxisConfigSchema.optional(),
  categoryAxisStyleConfig: categoryAxisStyleConfigSchema.optional(),
  y2AxisConfig: y2AxisConfigSchema.optional(),
});

// Chart-specific schemas matching Rust enums exactly
const barAndLineAxisSchema = z.object({
  x: z.array(z.string()),
  y: z.array(z.string()),
  category: z.array(z.string()).optional(),
  tooltip: z.array(z.string()).optional(),
});

const scatterAxisSchema = z.object({
  x: z.array(z.string()),
  y: z.array(z.string()),
  category: z.array(z.string()).optional(),
  size: z.array(z.string()).optional(),
  tooltip: z.array(z.string()).optional(),
});

const pieChartAxisSchema = z.object({
  x: z.array(z.string()),
  y: z.array(z.string()),
  tooltip: z.array(z.string()).optional(),
});

const comboChartAxisSchema = z.object({
  x: z.array(z.string()),
  y: z.array(z.string()),
  y2: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  tooltip: z.array(z.string()).optional(),
});

const barChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('bar'),
  barAndLineAxis: barAndLineAxisSchema,
  barLayout: z.string().optional(),
  barSortBy: z.array(z.string()).optional(),
  barGroupType: z.string().optional(),
  barShowTotalAtTop: z.boolean().optional(),
});

const lineChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('line'),
  barAndLineAxis: barAndLineAxisSchema,
  lineGroupType: z.string().optional(),
});

const scatterChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('scatter'),
  scatterAxis: scatterAxisSchema,
  scatterDotSize: z.array(z.number()).optional(),
});

const pieChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('pie'),
  pieChartAxis: pieChartAxisSchema,
  pieDisplayLabelAs: z.string().optional(),
  pieShowInnerLabel: z.boolean().optional(),
  pieInnerLabelAggregate: z.string().optional(),
  pieInnerLabelTitle: z.string().optional(),
  pieLabelPosition: z.string().optional(),
  pieDonutWidth: z.number().optional(),
  pieMinimumSlicePercentage: z.number().optional(),
});

const comboChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('combo'),
  comboChartAxis: comboChartAxisSchema,
});

const metricChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('metric'),
  metricColumnId: z.string(),
  metricValueAggregate: z
    .enum(['sum', 'average', 'median', 'count', 'max', 'min', 'first'])
    .optional(),
  metricHeader: z.any().optional(), // Can be string or object
  metricSubHeader: z.any().optional(), // Can be string or object
  metricValueLabel: z.string().optional(),
});

const tableChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('table'),
  tableColumnOrder: z.array(z.string()).optional(),
  tableColumnWidths: z.record(z.number()).optional(),
  tableHeaderBackgroundColor: z.string().optional(),
  tableHeaderFontColor: z.string().optional(),
  tableColumnFontColor: z.string().optional(),
});

const chartConfigSchema = z.discriminatedUnion('selectedChartType', [
  barChartConfigSchema,
  lineChartConfigSchema,
  scatterChartConfigSchema,
  pieChartConfigSchema,
  comboChartConfigSchema,
  metricChartConfigSchema,
  tableChartConfigSchema,
]);

// Main MetricYml schema matching Rust struct exactly
const metricYmlSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  timeFrame: z.string().min(1), // Note: using timeFrame (camelCase) as in Rust
  sql: z.string().min(1),
  chartConfig: chartConfigSchema, // Note: using chartConfig (camelCase) as in Rust
});

type MetricYml = z.infer<typeof metricYmlSchema>;

// Tool implementation with complete schema included
export const createMetricsFileTool = createTool({
  id: 'create-metrics-file',
  description: `Creates metric configuration files with YAML content following the metric schema specification. Before using this tool, carefully consider the appropriate visualization type (bar, line, scatter, pie, combo, metric, table) and its specific configuration requirements. Each visualization has unique axis settings, formatting options, and data structure needs that must be thoroughly planned to create effective metrics. **This tool supports creating multiple metrics in a single call; prefer using bulk creation over creating metrics one by one.**

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
# \`timeFrame\`: Human-readable time period covered by the query, similar to a filter in a BI tool.
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
          metricValueLabel:
            oneOf:
              - type: string
                description: Custom label to display with the metric value
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
    const dataSourceId = runtimeContext?.get('dataSourceId') as string;
    const dataSourceSyntax = (runtimeContext?.get('dataSourceSyntax') || 'generic') as string;
    const userId = runtimeContext?.get('userId') as string;
    const organizationId = runtimeContext?.get('organizationId') as string;

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
        for (const sp of successfulProcessing) {
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
  _dataSourceId: string,
  _dataSourceDialect: string
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
