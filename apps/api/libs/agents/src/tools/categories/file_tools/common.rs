use anyhow::{anyhow, bail, Result};
use chrono::Utc;
use database::{
    enums::Verification,
    models::{DashboardFile, MetricFile},
    organization::get_user_organization_id,
    pool::get_pg_pool,
    schema::metric_files,
    types::{data_metadata::DataMetadata, DashboardYml, MetricYml, VersionHistory},
};
use indexmap::IndexMap;
use query_engine::{data_source_query_routes::query_engine::query_engine, data_types::DataType};
use serde_json::Value;
use serde_yaml;
use tracing::{debug, error, warn};
use uuid::Uuid;

use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;

use serde::{Deserialize, Serialize};

use super::file_types::file::FileWithId;

// Import dataset_security for permission check
use dataset_security::has_dataset_access;
use dataset_security::has_all_datasets_access;

// Import the types needed for the modification function

use database::models::Dataset;
use database::schema::datasets;
use sql_analyzer::{analyze_query, types::TableKind};

/// Validates SQL query using existing query engine by attempting to run it
/// Returns a tuple with a message, results (if ≤ 13 records), metadata, and validated dataset IDs
pub async fn validate_sql(
    sql: &str,
    data_source_id: &Uuid,
    data_source_dialect: &str,
    user_id: &Uuid,
) -> Result<(
    String,
    Vec<IndexMap<String, DataType>>,
    Option<DataMetadata>,
    Vec<Uuid>,
)> {
    debug!("Validating SQL query for data source {}", data_source_id);

    if sql.trim().is_empty() {
        return Err(anyhow!("SQL query cannot be empty"));
    }

    // Analyze the SQL to extract base table names
    let analysis_result = analyze_query(sql.to_string(), data_source_dialect).await?;

    // Extract base table names
    let table_names: Vec<String> = analysis_result
        .tables
        .into_iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();

    let mut validated_dataset_ids = Vec::new(); // Store IDs of datasets user has access to

    if !table_names.is_empty() {
        let mut conn = get_pg_pool().get().await?;

        // Find corresponding datasets
        let found_datasets = datasets::table
            .filter(datasets::data_source_id.eq(data_source_id))
            .filter(datasets::name.eq_any(&table_names))
            .filter(datasets::deleted_at.is_null())
            .load::<Dataset>(&mut conn)
            .await?;

        let dataset_ids: Vec<Uuid> = found_datasets.iter().map(|ds| ds.id).collect();

        // Check dataset access
        if !dataset_ids.is_empty() {
            if !has_all_datasets_access(user_id, &dataset_ids).await? {
                bail!(
                    "Permission denied: User {} does not have access to one or more datasets required by the query: {:?}",
                    user_id,
                    table_names
                );
            }
            // If access is granted, add these IDs to the validated list
            validated_dataset_ids.extend(dataset_ids);
        } else {
            warn!(
                "Tables {:?} mentioned in query not found as datasets for data source {}",
                table_names, data_source_id
            );
        }
    }

    // Try to execute the query
    let query_result = match query_engine(data_source_id, sql, Some(15)).await {
        Ok(result) => result,
        Err(e) => return Err(anyhow!("SQL validation failed: {}", e)),
    };

    let num_records = query_result.data.len();
    let message = if num_records == 0 {
        "No records were found".to_string()
    } else if num_records > 13 {
        format!("{} records were returned (showing first 13)", num_records)
    } else {
        format!("{} records were returned", num_records)
    };
    let return_records = query_result.data.into_iter().take(13).collect();

    // Return validated IDs along with other results
    Ok((
        message,
        return_records,
        Some(query_result.metadata),
        validated_dataset_ids, 
    ))
}

/// Validates existence of metric IDs in database
/// Returns Result with list of missing IDs if any
pub async fn validate_metric_ids(ids: &[Uuid]) -> Result<Vec<Uuid>> {
    let mut conn = get_pg_pool().get().await?;

    // Query for existing IDs
    let existing_ids = metric_files::table
        .filter(metric_files::id.eq_any(ids))
        .filter(metric_files::deleted_at.is_null())
        .select(metric_files::id)
        .load::<Uuid>(&mut conn)
        .await?;

    // Find missing IDs by comparing with input IDs
    let missing_ids: Vec<Uuid> = ids
        .iter()
        .filter(|id| !existing_ids.contains(id))
        .cloned()
        .collect();

    Ok(missing_ids)
}

pub const METRIC_YML_SCHEMA: &str = r##"
# METRIC CONFIGURATION - YML STRUCTURE
# -------------------------------------
# REQUIRED Top-Level Fields: `name`, `description`, `timeFrame`, `sql`, `chartConfig`
#
# --- FIELD DETAILS & RULES --- 
# `name`: Human-readable title (e.g., Total Sales). 
#   - RULE: CANNOT contain underscores (`_`). Use spaces instead.   
# `description`: Detailed explanation of the metric. 
# `timeFrame`: Human-readable time period covered by the query, similar to a filter in a BI tool.
#   - For queries with fixed date filters, use specific date ranges, e.g., "January 1, 2020 - December 31, 2020", "2024", "Q2 2024", "June 1, 2025".
#   - For queries with relative date filters or no date filter, use relative terms, e.g., "Today", "Yesterday", "Last 7 days", "Last 30 days", "Last Quarter", "Last 12 Months", "Year to Date", "All time", etc.
#   - For comparisons, use "Comparison - [Period 1] vs [Period 2]", with each period formatted according to whether it is fixed or relative, e.g., "Comparison - Last 30 days vs Previous 30 days" or "Comparison - June 1, 2025 - June 30, 2025 vs July 1, 2025 - July 31, 2025".
#   Rules:
#     - Must accurately reflect the date/time filter used in the `sql` field. Do not misrepresent the time range.
#     - Use full month names for dates, e.g., "January", not "Jan".
#     - Follow general quoting rules. CANNOT contain ':'.
#   Note: Respond only with the time period, without explanation or additional copy.
# `sql`: The SQL query for the metric.
#   - RULE: MUST use the pipe `|` block scalar style to preserve formatting and newlines.
#   - NOTE: Remember to use fully qualified names: DATABASE_NAME.SCHEMA_NAME.TABLE_NAME for tables and table_alias.column for columns. This applies to all table and column references, including those within Common Table Expressions (CTEs) and when selecting from CTEs.
#   - Example:
#     sql: |
#       SELECT ... 
# `chartConfig`: Visualization settings.
#   - RULE: Must contain `selectedChartType` (bar, line, scatter, pie, combo, metric, table).
#   - RULE: Must contain `columnLabelFormats` defining format for ALL columns in the SQL result.
#   - RULE: Must contain ONE chart-specific config block based on `selectedChartType`:
#     - `barAndLineAxis` (for type: bar, line)
#     - `scatterAxis` (for type: scatter)
#     - `pieChartAxis` (for type: pie)
#     - `comboChartAxis` (for type: combo)
#     - `metricColumnId` (for type: metric)
#     - `tableConfig` (for type: table) - [Optional, if needed beyond basic columns]
#
# --- GENERAL YAML RULES ---
# 1. Use standard YAML syntax (indentation, colons for key-value, `-` for arrays).
# 2. Quoting: Generally avoid quotes for simple strings. Use double quotes (`"...") ONLY if a string contains special characters (like :, {, }, [, ], ,, &, *, #, ?, |, -, <, >, =, !, %, @, `) or needs to preserve leading/trailing whitespace. 
# 3. Metric name, timeframe, or description CANNOT contain `:`
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
    description: Human-readable title (e.g., Total Sales). NO underscores. Follow quoting rules. Should not contain `:`

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
      RULE: Must accurately reflect the date/time filter used in the `sql` field. Do not misrepresent the time range.
      Examples:
      - Fixed Dates: "January 1, 2020 - December 31, 2020", "2024", "Q2 2024", "June 1, 2025"
      - Relative Dates: "Today", "Yesterday", "Last 7 days", "Last 30 days", "Last Quarter", "Last 12 Months", "Year to Date", "All time"
      - Comparisons: Use the format "Comparison: [Period 1] vs [Period 2]". Examples:
        - "Comparison: Last 30 days vs Previous 30 days"
        - "Comparison: June 1, 2025 - June 30, 2025 vs July 1, 2025 - July 31, 2025"
      RULE: Use full month names for dates, e.g., "January", not "Jan".
      RULE: Follow general quoting rules. CANNOT contain ':'.

  # SQL QUERY
  # Describes how the SQL should be formatted within the YAML
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
      - $ref: '#/definitions/base_chart_config'
    oneOf: # Specific block required based on type 
      - $ref: #/definitions/bar_line_chart_config
      - $ref: #/definitions/scatter_chart_config
      - $ref: #/definitions/pie_chart_config
      - $ref: #/definitions/combo_chart_config
      - $ref: #/definitions/metric_chart_config
      - $ref: #/definitions/table_chart_config

required:
  - name
  - datasetIds
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
          $ref: #/definitions/column_label_format
      # Optional base properties below
      columnSettings:
        type: object
        description: |-
          Visual settings applied per column. 
          Keys MUST be LOWERCASE column names from the SQL query results. 
          Example: `total_sales: { showDataLabels: true }`
        additionalProperties:
          $ref: #/definitions/column_settings
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
          $ref: #/definitions/goal_line
      trendlines:
        type: array
        items:
          $ref: #/definitions/trendline
      disableTooltip:
        type: boolean
      # Axis Configurations
      # RULE: By default, only add `xAxisConfig` and ONLY set its `xAxisTimeInterval` property 
      #       when visualizing date/time data on the X-axis (e.g., line, bar, combo charts). 
      #       Do NOT add other `xAxisConfig` properties, `yAxisConfig`, or `y2AxisConfig` 
      #       unless the user explicitly asks for specific axis modifications.
      xAxisConfig:
        description: Controls X-axis properties. For date/time axes, MUST contain `xAxisTimeInterval` (day, week, month, quarter, year). Other properties control label visibility, title, rotation, and zoom. Only add when needed (dates) or requested by user.
        $ref: '#/definitions/x_axis_config'
      yAxisConfig:
        description: Controls Y-axis properties. Only add if the user explicitly requests Y-axis modifications (e.g., hiding labels, changing title). Properties control label visibility, title, rotation, and zoom.
        $ref: '#/definitions/y_axis_config'
      y2AxisConfig:
        description: Controls secondary Y-axis (Y2) properties, primarily for combo charts. Only add if the user explicitly requests Y2-axis modifications. Properties control label visibility, title, rotation, and zoom.
        $ref: '#/definitions/y2_axis_config'
      categoryAxisStyleConfig:
        description: Optional style configuration for the category axis (color/grouping).
        $ref: '#/definitions/category_axis_style_config'
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
  columnLabelFormat:
    type: object
    properties:
      columnType:
        type: string
        description: number, string, date
        enum: [number, string, date]
      style:
        type: string
        enum:
          -
            currency # Note: The "$" sign is automatically prepended.
          -
            percent # Note: "%" sign is appended. For percentage values: 
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
      - $ref: #/definitions/base_chart_config
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
      - $ref: #/definitions/base_chart_config
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
      - $ref: #/definitions/base_chart_config
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
      - $ref: #/definitions/base_chart_config
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
      - $ref: #/definitions/base_chart_config
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
      - $ref: #/definitions/base_chart_config
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
"##;

pub const DASHBOARD_YML_SCHEMA: &str = r##"
# DASHBOARD CONFIGURATION - YML STRUCTURE
# ----------------------------------------
# Required fields:
#
# name: Your Dashboard Title  # Do NOT use quotes for string values
# description: A description of the dashboard, its metrics, and its purpose.  # NO quotes
# rows: 
#   - id: 1               # Required row ID (integer)
#     items:
#       - id: metric-uuid-1  # UUIDv4 of an existing metric, NO quotes
#     columnSizes: [12]   # Required - must sum to exactly 12
#   - id: 2 # REQUIRED
#     items:
#       - id: metric-uuid-2
#       - id: metric-uuid-3
#     columnSizes: 
#       - 6
#       - 6
#
# Rules:
# 1. Each row can have up to 4 items
# 2. Each row must have a unique ID
# 3. columnSizes is required and must specify the width for each item
# 4. Sum of columnSizes in a row must be exactly 12
# 5. Each column size must be at least 3
# 6. All arrays should follow the YML array syntax using `-` and should NOT USE `[]` formatting.
# 7. Don't use comments. The ones in the example are just for explanation
# 8. String values generally should NOT use quotes unless they contain special characters (like :, {, }, [, ], ,, &, *, #, ?, |, -, <, >, =, !, %, @, `) or start/end with whitespace.
# 9. If a string contains special characters or needs to preserve leading/trailing whitespace, enclose it in double quotes (`"`). Example: `name: "Sales & Marketing Dashboard"`
# 10. Avoid special characters in names and descriptions where possible, but if needed, use quotes as described in rule 9. UUIDs should NEVER be quoted.
# ----------------------------------------

type: object
name: Dashboard Configuration Schema
description: Specifies the structure and constraints of a dashboard config file.
properties:
  name:
    type: string
    description: The title of the dashboard (e.g. Sales & Marketing Dashboard) - do NOT use quotes
  description:
    type: string
    description: A description of the dashboard, its metrics, and its purpose
  rows:
    type: array
    description: Array of row objects, each containing metric items
    items:
      type: object
      properties:
        id:
          type: integer
          description: This is just an integer representing the row number 1 -> n
        items:
          type: array
          description: Array of metrics to display in this row (max 4 items)
          maxItems: 4
          items:
            type: object
            properties:
              id:
                type: string
                description: UUIDv4 identifier of an existing metric
            required:
              - id
        columnSizes:
          type: array
          description: Required array of column sizes (must sum to exactly 12)
          items:
            type: integer
            minimum: 3
            maximum: 12
      required:
        - id
        - items
        - columnSizes
required:
  - name
  - description
  - rows
"##;

/// Process a metric file creation request
/// Returns Ok((MetricFile, MetricYml, String, Vec<IndexMap<String, DataType>>, Vec<Uuid>)) if successful, or an error message if failed
/// The string is a message about the number of records returned by the SQL query
/// The vector of IndexMap<String, DataType> is the results of the SQL query.  Returns empty vector if more than 13 records or no results.
pub async fn process_metric_file(
    tool_call_id: String,
    file_name: String,
    yml_content: String,
    data_source_id: Uuid,
    data_source_dialect: String,
    user_id: &Uuid,
) -> Result<
    (
        MetricFile,
        MetricYml,
        String,
        Vec<IndexMap<String, DataType>>,
        Vec<Uuid>,
    ),
    String,
> {
    // Parse YAML to MetricYml struct
    let metric_yml = match MetricYml::new(yml_content) {
        Ok(yml) => yml,
        Err(e) => return Err(format!("Invalid YAML format: {}", e)),
    };

    // Validate MetricYml structure
    if let Err(e) = metric_yml.validate() {
        return Err(format!("Invalid metric structure: {}", e));
    }

    // Validate SQL and get results + validated dataset IDs
    let (message, results, metadata, validated_dataset_ids) =
        match validate_sql(&metric_yml.sql, &data_source_id, &data_source_dialect, user_id).await {
            Ok(results) => results,
            Err(e) => return Err(format!("Invalid SQL query: {}", e)),
        };

    let organization_id = match get_user_organization_id(user_id).await {
        Ok(Some(org_id)) => org_id,
        Ok(None) => return Err("User does not belong to any organization".to_string()),
        Err(e) => return Err(format!("Error getting organization: {}", e)),
    };

    // Generate deterministic UUID
    let id = match generate_deterministic_uuid(&tool_call_id, &file_name, "metric") {
        Ok(id) => id,
        Err(e) => return Err(format!("Error generating file ID: {}", e)),
    };

    // Create metric file
    let metric_file = MetricFile {
        id,
        name: metric_yml.name.clone(),
        file_name,
        content: metric_yml.clone(),
        verification: Verification::NotRequested,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id,
        created_by: *user_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: VersionHistory::new(1, metric_yml.clone()),
        data_metadata: metadata,
        public_password: None,
        data_source_id,
    };

    Ok((metric_file, metric_yml, message, results, validated_dataset_ids))
}

/// Process a dashboard file modification request
/// Returns Ok((DashboardFile, DashboardYml, Vec<ModificationResult>, String, Vec<IndexMap<String, DataType>>)) if successful, or an error if failed
/// The string is a message about validation results
/// The vector of IndexMap<String, DataType> is the results of any validation. Returns empty vector if no validation results.
pub async fn process_dashboard_file_modification(
    mut file: DashboardFile,
    modification: &FileModification,
    duration: i64,
) -> Result<(
    DashboardFile,
    DashboardYml,
    Vec<ModificationResult>,
    String,
    Vec<IndexMap<String, DataType>>,
)> {
    debug!(
        file_id = %file.id,
        file_name = %modification.file_name,
        "Processing dashboard file modifications"
    );

    let mut results = Vec::new();

    // Convert to YAML string for content modifications
    let current_content = match serde_yaml::to_string(&file.content) {
        Ok(content) => content,
        Err(e) => {
            let error = format!("Failed to serialize dashboard YAML: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "YAML serialization error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                error: Some(error.clone()),
                modification_type: "serialization".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            return Err(anyhow::anyhow!(error));
        }
    };

    // Apply modifications and track results
    match apply_modifications_to_content(
        &current_content,
        &modification.modifications,
        &modification.file_name,
    ) {
        Ok(modified_content) => {
            // Create and validate new YML object
            match DashboardYml::new(modified_content) {
                Ok(new_yml) => {
                    debug!(
                        file_id = %file.id,
                        file_name = %modification.file_name,
                        "Successfully modified and validated dashboard file"
                    );

                    // Collect and validate metric IDs from rows
                    let metric_ids: Vec<Uuid> = new_yml
                        .rows
                        .iter()
                        .flat_map(|row| row.items.iter())
                        .map(|item| item.id)
                        .collect();

                    if !metric_ids.is_empty() {
                        match validate_metric_ids(&metric_ids).await {
                            Ok(missing_ids) if !missing_ids.is_empty() => {
                                let error = format!("Invalid metric references: {:?}", missing_ids);
                                error!(
                                    file_id = %file.id,
                                    file_name = %modification.file_name,
                                    error = %error,
                                    "Metric validation error"
                                );
                                results.push(ModificationResult {
                                    file_id: file.id,
                                    file_name: modification.file_name.clone(),
                                    success: false,
                                    error: Some(error.clone()),
                                    modification_type: "validation".to_string(),
                                    timestamp: Utc::now(),
                                    duration,
                                });
                                return Err(anyhow::anyhow!(error));
                            }
                            Err(e) => {
                                let error = format!("Failed to validate metrics: {}", e);
                                error!(
                                    file_id = %file.id,
                                    file_name = %modification.file_name,
                                    error = %error,
                                    "Metric validation error"
                                );
                                results.push(ModificationResult {
                                    file_id: file.id,
                                    file_name: modification.file_name.clone(),
                                    success: false,
                                    error: Some(error.clone()),
                                    modification_type: "validation".to_string(),
                                    timestamp: Utc::now(),
                                    duration,
                                });
                                return Err(anyhow::anyhow!(error));
                            }
                            Ok(_) => {
                                // All metrics exist, continue with update
                            }
                        }
                    }

                    // Update file record
                    file.content = new_yml.clone();
                    file.updated_at = Utc::now();
                    // Also update the file name to match the YAML name
                    file.name = new_yml.name.clone();

                    // Track successful modification
                    results.push(ModificationResult {
                        file_id: file.id,
                        file_name: modification.file_name.clone(),
                        success: true,
                        error: None,
                        modification_type: "content".to_string(),
                        timestamp: Utc::now(),
                        duration,
                    });

                    // Return successful result with empty validation results
                    // since dashboards don't have SQL to validate like metrics do
                    Ok((
                        file,
                        new_yml.clone(),
                        results,
                        "Dashboard validation successful".to_string(),
                        Vec::new(),
                    ))
                }
                Err(e) => {
                    let error = format!("Failed to validate modified YAML: {}", e);
                    error!(
                        file_id = %file.id,
                        file_name = %modification.file_name,
                        error = %error,
                        "YAML validation error"
                    );
                    results.push(ModificationResult {
                        file_id: file.id,
                        file_name: modification.file_name.clone(),
                        success: false,
                        error: Some(error.clone()),
                        modification_type: "validation".to_string(),
                        timestamp: Utc::now(),
                        duration,
                    });
                    Err(anyhow::anyhow!(error))
                }
            }
        }
        Err(e) => {
            let error = e.to_string();
            let mod_type = if error.contains("multiple locations") {
                "multiple_matches"
            } else {
                "modification"
            };

            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "Modification application error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                error: Some(error.clone()),
                modification_type: mod_type.to_string(),
                timestamp: Utc::now(),
                duration,
            });
            Err(anyhow::anyhow!(error))
        }
    }
}

/// Generates a deterministic UUID based on tool call ID, file name, and file type
pub fn generate_deterministic_uuid(
    tool_call_id: &str,
    file_name: &str,
    file_type: &str,
) -> Result<Uuid> {
    // Use a fixed namespace for the application
    let namespace_uuid = Uuid::NAMESPACE_OID;

    // Combine inputs to create a unique name
    let name = format!("{}:{}:{}", tool_call_id, file_name, file_type);

    // Generate v5 UUID (SHA1 based)
    Ok(Uuid::new_v5(&namespace_uuid, name.as_bytes()))
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Modification {
    /// The content to be replaced in the file
    pub content_to_replace: String,
    /// The new content that will replace the existing content
    pub new_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileModification {
    /// UUID of the file to modify
    pub id: Uuid,
    /// Name of the file to modify
    pub file_name: String,
    /// List of modifications to apply to the file
    pub modifications: Vec<Modification>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModifyFilesParams {
    /// List of files to modify with their corresponding modifications
    pub files: Vec<FileModification>,
}

/// Represents the output of a file modification tool call
#[derive(Debug, Serialize, Deserialize)]
pub struct ModifyFilesOutput {
    pub message: String,
    pub duration: i64,
    pub files: Vec<FileWithId>,
    pub failed_files: Vec<FailedFileModification>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FailedFileModification {
    pub file_name: String,
    pub error: String,
}

#[derive(Debug)]
pub struct FileModificationBatch<T> {
    pub files: Vec<T>,
    pub failed_modifications: Vec<(String, String)>,
    pub modification_results: Vec<ModificationResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModificationResult {
    pub file_id: Uuid,
    pub file_name: String,
    pub success: bool,
    pub error: Option<String>,
    pub modification_type: String,
    pub timestamp: chrono::DateTime<Utc>,
    pub duration: i64,
}

pub fn apply_modifications_to_content(
    content: &str,
    modifications: &[Modification],
    file_name: &str,
) -> Result<String> {
    let mut modified_content = content.to_string();

    for modification in modifications {
        // If content_to_replace is empty, append the new content to the end of the file
        if modification.content_to_replace.is_empty() {
            // Add a newline at the end if the content doesn't end with one
            if !modified_content.ends_with('\n') {
                modified_content.push('\n');
            }
            // Append the new content
            modified_content.push_str(&modification.new_content);
            continue;
        }

        // Check if the content to replace exists in the file
        if !modified_content.contains(&modification.content_to_replace) {
            return Err(anyhow::anyhow!(
                "Content to replace not found in file '{}': '{}'",
                file_name,
                modification.content_to_replace
            ));
        }

        // Check if it appears multiple times by searching for all occurrences
        let matches: Vec<_> = modified_content
            .match_indices(&modification.content_to_replace)
            .collect();
        if matches.len() > 1 {
            return Err(anyhow::anyhow!(
                "Content to replace found in multiple locations ({} occurrences) in file '{}'. Please provide more specific content to ensure only one match: '{}'",
                matches.len(),
                file_name,
                modification.content_to_replace
            ));
        }

        // Only one match found, safe to replace
        modified_content =
            modified_content.replace(&modification.content_to_replace, &modification.new_content);
    }

    Ok(modified_content)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use database::models::DashboardFile;
    use database::types::DashboardYml;

    use uuid::Uuid;

    #[tokio::test]
    async fn test_validate_sql_empty() {
        let dataset_id = Uuid::new_v4();
        let result = validate_sql("", &dataset_id, "sql", &Uuid::new_v4()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("cannot be empty"));
    }

    #[test]
    fn test_apply_modifications_multiple_matches() {
        // Content with repeated text
        let content = "name: Test Dashboard
description: Test description
Test Dashboard is a dashboard for testing";

        // Modification that would affect two places
        let modifications = vec![Modification {
            content_to_replace: "Test Dashboard".to_string(),
            new_content: "Updated Dashboard".to_string(),
        }];

        // Try to apply the modification
        let result = apply_modifications_to_content(&content, &modifications, "test.yml");

        // Verify it fails with the expected error
        assert!(result.is_err());
        let err_msg = result.unwrap_err().to_string();
        assert!(err_msg.contains("multiple locations"));
        assert!(err_msg.contains("2 occurrences"));
    }

    #[test]
    fn test_apply_modifications_empty_content_to_replace() {
        let original_content = "name: test_metric
type: counter
description: A test metric";

        // Test appending content when content_to_replace is empty
        let mods = vec![Modification {
            content_to_replace: "".to_string(),
            new_content: "additional_field: true".to_string(),
        }];
        let result = apply_modifications_to_content(original_content, &mods, "test.yml").unwrap();
        assert_eq!(
            result,
            "name: test_metric
type: counter
description: A test metric
additional_field: true"
        );

        // Test appending content when original content doesn't end with newline
        let original_content_no_newline = "name: test_metric
type: counter
description: A test metric";
        let result =
            apply_modifications_to_content(original_content_no_newline, &mods, "test.yml").unwrap();
        assert_eq!(
            result,
            "name: test_metric
type: counter
description: A test metric
additional_field: true"
        );
    }

    // Note: We'll need integration tests with a real database for testing actual SQL validation
    // Unit tests can only cover basic cases like empty SQL

    #[tokio::test]
    async fn test_process_dashboard_file_modification() {
        // Create a sample dashboard file content
        let dashboard_content = r#"
name: Test Dashboard
description: A test dashboard
rows:
  - id: 1
    items:
      - id: 550e8400-e29b-41d4-a716-446655440000
    column_sizes: [12]
"#;

        // Create a dashboard yml object
        let dashboard_yml = match DashboardYml::new(dashboard_content.to_string()) {
            Ok(yml) => yml,
            Err(e) => panic!("Failed to create dashboard yml: {}", e),
        };

        let dashboard_id = Uuid::new_v4();

        // Create a proper version history structure
        let version_history = VersionHistory::new(1, dashboard_yml.clone());

        // Create a dashboard file with the required fields
        let dashboard_file = DashboardFile {
            id: dashboard_id,
            name: dashboard_yml.name.clone(),
            file_name: "test_dashboard.yml".to_string(),
            content: dashboard_yml,
            filter: None,
            organization_id: Uuid::new_v4(),
            created_by: Uuid::new_v4(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            version_history,
            public_password: None,
        };

        // Create a file modification
        let modification = FileModification {
            id: dashboard_id,
            file_name: "test_dashboard.yml".to_string(),
            modifications: vec![Modification {
                content_to_replace: "Test Dashboard".to_string(),
                new_content: "Updated Dashboard".to_string(),
            }],
        };

        // We need to mock the validation of metric IDs since we can't access the database
        // This is a simplified version just for testing the modification process
        // In a real test, we would mock the database connection

        // Process the modification - we'll use a simplified version that doesn't validate metrics
        let result = apply_dashboard_modification_test(dashboard_file, &modification, 100);

        // Verify the result
        assert!(
            result.is_ok(),
            "Modification should succeed: {:?}",
            result.err()
        );

        if let Ok((modified_file, modified_yml, results)) = result {
            // Print debug info
            println!("Modified file name: '{}'", modified_file.name);
            println!("Modified yml name: '{}'", modified_yml.name);

            // Check file was updated
            assert_eq!(modified_file.name, "Updated Dashboard");
            assert_eq!(modified_yml.name, "Updated Dashboard");

            // Check results were tracked
            assert_eq!(results.len(), 1);
            assert!(results[0].success);
            assert_eq!(results[0].modification_type, "content");
        }
    }

    // Helper function for testing dashboard modifications without database access
    fn apply_dashboard_modification_test(
        mut file: DashboardFile,
        modification: &FileModification,
        duration: i64,
    ) -> Result<(DashboardFile, DashboardYml, Vec<ModificationResult>)> {
        let mut results = Vec::new();

        // Convert to YAML string for content modifications
        let current_content = match serde_yaml::to_string(&file.content) {
            Ok(content) => content,
            Err(e) => {
                let error = format!("Failed to serialize dashboard YAML: {}", e);
                results.push(ModificationResult {
                    file_id: file.id,
                    file_name: modification.file_name.clone(),
                    success: false,
                    error: Some(error.clone()),
                    modification_type: "serialization".to_string(),
                    timestamp: Utc::now(),
                    duration,
                });
                return Err(anyhow::anyhow!(error));
            }
        };

        // Apply modifications and track results
        match apply_modifications_to_content(
            &current_content,
            &modification.modifications,
            &modification.file_name,
        ) {
            Ok(modified_content) => {
                // Create and validate new YML object
                match DashboardYml::new(modified_content) {
                    Ok(new_yml) => {
                        // Update file record with new content
                        file.content = new_yml.clone();
                        // Also update the file name to match the YAML name
                        file.name = new_yml.name.clone();
                        file.updated_at = Utc::now();

                        // Track successful modification
                        results.push(ModificationResult {
                            file_id: file.id,
                            file_name: modification.file_name.clone(),
                            success: true,
                            error: None,
                            modification_type: "content".to_string(),
                            timestamp: Utc::now(),
                            duration,
                        });

                        Ok((file, new_yml, results))
                    }
                    Err(e) => {
                        let error = format!("Failed to validate modified YAML: {}", e);
                        results.push(ModificationResult {
                            file_id: file.id,
                            file_name: modification.file_name.clone(),
                            success: false,
                            error: Some(error.clone()),
                            modification_type: "validation".to_string(),
                            timestamp: Utc::now(),
                            duration,
                        });
                        Err(anyhow::anyhow!(error))
                    }
                }
            }
            Err(e) => {
                let error = e.to_string();
                let mod_type = if error.contains("multiple locations") {
                    "multiple_matches"
                } else {
                    "modification"
                };

                results.push(ModificationResult {
                    file_id: file.id,
                    file_name: modification.file_name.clone(),
                    success: false,
                    error: Some(error.clone()),
                    modification_type: mod_type.to_string(),
                    timestamp: Utc::now(),
                    duration,
                });
                Err(anyhow::anyhow!(error))
            }
        }
    }

    #[tokio::test]
    async fn test_process_dashboard_file_modification_multiple_matches() {
        // Create a sample dashboard file content with repeated text
        let dashboard_content = r#"
name: Test Dashboard
description: A test dashboard about Test Dashboard
rows:
  - id: 1
    items:
      - id: 550e8400-e29b-41d4-a716-446655440000
    column_sizes: [12]
"#;

        // Create a dashboard yml object
        let dashboard_yml = match DashboardYml::new(dashboard_content.to_string()) {
            Ok(yml) => yml,
            Err(e) => panic!("Failed to create dashboard yml: {}", e),
        };

        let dashboard_id = Uuid::new_v4();

        // Create a proper version history structure
        let version_history = VersionHistory::new(1, dashboard_yml.clone());

        // Create a dashboard file with the required fields
        let dashboard_file = DashboardFile {
            id: dashboard_id,
            name: dashboard_yml.name.clone(),
            file_name: "test_dashboard.yml".to_string(),
            content: dashboard_yml,
            filter: None,
            organization_id: Uuid::new_v4(),
            created_by: Uuid::new_v4(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            version_history,
            public_password: None,
        };

        // Create a file modification that would match in multiple places
        let modification = FileModification {
            id: dashboard_id,
            file_name: "test_dashboard.yml".to_string(),
            modifications: vec![Modification {
                content_to_replace: "Test Dashboard".to_string(),
                new_content: "Updated Dashboard".to_string(),
            }],
        };

        // Process the modification - we'll use our simplified test helper function
        let result = apply_dashboard_modification_test(dashboard_file, &modification, 100);

        // Verify the result shows an error about multiple matches
        assert!(result.is_err());
        let err = result.unwrap_err();
        let err_str = err.to_string();
        assert!(err_str.contains("multiple locations"));
        assert!(err_str.contains("occurrences"));
    }
}

async fn process_metric_file_update(
    mut file: MetricFile,
    yml_content: String,
    duration: i64,
    user_id: &Uuid,
    data_source_id: &Uuid,
) -> Result<(
    MetricFile,
    MetricYml,
    Vec<ModificationResult>,
    String, // message
    Vec<IndexMap<String, DataType>>, // results
    Vec<Uuid>, // validated_dataset_ids <--- Add this
)> {
    // Parse YAML to MetricYml struct
    let new_yml = match MetricYml::new(yml_content) {
        Ok(yml) => yml,
        Err(e) => {
            let error = format!("Invalid YAML format: {}", e);
            return Err(anyhow::anyhow!(error));
        }
    };

    // Validate MetricYml structure
    if let Err(e) = new_yml.validate() {
        let error = format!("Invalid metric structure: {}", e);
        return Err(anyhow::anyhow!(error));
    }

    let mut results = Vec::new();

    // Check if SQL or metadata has changed
    if file.content.sql != new_yml.sql {
        // SQL changed or metadata missing, perform validation
        match validate_sql(&new_yml.sql, data_source_id, "sql", user_id).await {
            Ok((message, validation_results, metadata, validated_ids)) => {
                // Update file record
                file.content = new_yml.clone();
                file.name = new_yml.name.clone();
                file.updated_at = Utc::now();
                file.data_metadata = metadata;

                // Track successful update
                results.push(ModificationResult {
                    file_id: file.id,
                    file_name: file.file_name.clone(),
                    success: true,
                    error: None,
                    modification_type: "content".to_string(),
                    timestamp: Utc::now(),
                    duration,
                });

                Ok((file, new_yml, results, message, validation_results, validated_ids))
            }
            Err(e) => {
                let error = format!("Invalid SQL query: {}", e);
                results.push(ModificationResult {
                    file_id: file.id,
                    file_name: file.file_name.clone(),
                    success: false,
                    error: Some(error.clone()),
                    modification_type: "validation".to_string(),
                    timestamp: Utc::now(),
                    duration,
                });
                Err(anyhow::anyhow!(error))
            }
        }
    } else {
        // No changes, return original file and empty results
        Ok((file, new_yml, results, "No changes detected".to_string(), Vec::new(), Vec::new()))
    }
}
