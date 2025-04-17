use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::Verification,
    models::{DashboardFile, MetricFile},
    organization::get_user_organization_id,
    pool::get_pg_pool,
    schema::{datasets, metric_files},
    types::{data_metadata::DataMetadata, DashboardYml, MetricYml, VersionHistory},
};
use indexmap::IndexMap;
use query_engine::{data_source_query_routes::query_engine::query_engine, data_types::DataType};
use serde_json::{self};
use serde_yaml;
use tracing::{debug, error};
use uuid::Uuid;

use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;

use serde::{Deserialize, Serialize};

use super::file_types::file::FileWithId;

// Import the types needed for the modification function

/// Validates SQL query using existing query engine by attempting to run it
/// Returns a tuple with a message about the number of records, the results (if ≤ 13 records), and metadata
pub async fn validate_sql(
    sql: &str,
    dataset_id: &Uuid,
) -> Result<(
    String,
    Vec<IndexMap<String, DataType>>,
    Option<DataMetadata>,
)> {
    debug!("Validating SQL query for dataset {}", dataset_id);

    if sql.trim().is_empty() {
        return Err(anyhow!("SQL query cannot be empty"));
    }

    let mut conn = get_pg_pool().get().await?;

    let data_source_id = match datasets::table
        .filter(datasets::id.eq(dataset_id))
        .select(datasets::data_source_id)
        .first::<Uuid>(&mut conn)
        .await
    {
        Ok(data_source_id) => data_source_id,
        Err(e) => return Err(anyhow!("Error getting data source id: {}", e)),
    };

    // Try to execute the query using query_engine
    let query_result = match query_engine(&data_source_id, sql, Some(15)).await {
        Ok(result) => result,
        Err(e) => return Err(anyhow!("SQL validation failed: {}", e)),
    };

    let num_records = query_result.data.len();

    // Create appropriate message based on number of records
    let message = if num_records == 0 {
        "No records were found".to_string()
    } else if num_records > 13 {
        format!("{} records were returned (showing first 13)", num_records)
    } else {
        format!("{} records were returned", num_records)
    };

    // Return at most 13 records
    let return_records = if num_records <= 13 {
        query_result.data.clone()
    } else {
        query_result.data.into_iter().take(13).collect() // Take first 13 records when more than 13
    };

    Ok((message, return_records, Some(query_result.metadata)))
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
# REQUIRED Top-Level Fields: `name`, `description`, `datasetIds`, `timeFrame`, `sql`, `chartConfig`
#
# --- FIELD DETAILS & RULES --- 
# `name`: Human-readable title (e.g., Total Sales). 
#   - RULE: Should NOT contain underscores (`_`). Use spaces instead.
# `description`: Detailed explanation of the metric. 
# `datasetIds`: Array of Dataset UUIDs this metric uses. 
#   - RULE: Use standard YAML array syntax (`- uuid`). 
#   - RULE: UUIDs should NEVER be quoted.
#   - Example: 
#     datasetIds:
#       - 123e4567-e89b-12d3-a456-426614174000
# `timeFrame`: Human-readable time period covered by the query (e.g., Last 30 days). 
# `sql`: The SQL query for the metric.
#   - RULE: MUST use the pipe `|` block scalar style to preserve formatting and newlines.
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
# 3. Metric name or description should not contain `:`
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
    description: Detailed description. Follow quoting rules. Should not contain `:`

  # DATASET IDS
  datasetIds:
    required: true
    type: array
    description: UUIDs of datasets this metric belongs to (NEVER quoted).
    items:
      type: string
      format: uuid
      description: Dataset UUID (unquoted)
    
  # TIME FRAME
  timeFrame:
    required: true
    type: string
    description: Human-readable time period covered by the query. Follow quoting rules. Should not contain `:`

  # SQL QUERY
  ### SQL Best Practices and Constraints** (when creating new metrics)  
  #  - **Constraints**: Only join tables with explicit entity relationships.  
  #  - **SQL Requirements**:  
  #    - Use schema-qualified table names (`<SCHEMA_NAME>.<TABLE_NAME>`).  
  #    - Select specific columns (avoid `SELECT *` or `COUNT(*)`).  
  #    - Use CTEs instead of subqueries, and use snake_case for naming them.  
  #    - Use `DISTINCT` (not `DISTINCT ON`) with matching `GROUP BY`/`SORT BY` clauses.  
  #    - Show entity names rather than just IDs.  
  #    - Handle date conversions appropriately.  
  #    - Order dates in ascending order.
  #    - Reference database identifiers for cross-database queries.  
  #    - Format output for the specified visualization type.  
  #    - Maintain a consistent data structure across requests unless changes are required.  
  #    - Use explicit ordering for custom buckets or categories.
  #    - When grouping metrics by dates, default to monthly granularity for spans over 2 months, yearly for over 3 years, weekly for under 2 months, and daily for under a week, unless the user specifies a different granularity.
  #    - Avoid division by zero errors by using NULLIF() or CASE statements (e.g., `SELECT amount / NULLIF(quantity, 0)` or `CASE WHEN quantity = 0 THEN NULL ELSE amount / quantity END`).
  ###
  sql:
    required: true
    type: string
    description: |
      SQL query using YAML pipe syntax (|)
      The SQL query should be formatted with proper indentation using the YAML pipe (|) syntax.
      This ensures the multi-line SQL is properly parsed while preserving whitespace and newlines.

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
  # BASE CHART CONFIG (common parts required by ALL chart types)
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
        description: Visual settings {columnId: settingsObject}
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
      goalLines:
        type: array
        items:
          $ref: #/definitions/goal_line
      trendlines:
        type: array
        items:
          $ref: #/definitions/trendline
    required:
      - selectedChartType
      - columnLabelFormats

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
            percent # Note: The value is automatically multiplied by 100 and the "%" sign is appended.
          - number
          - date
          - string
      displayName:
        type: string
        description: Custom display name for the column
      numberSeparatorStyle:
        type: string
        description: Style for number separators
      minimumFractionDigits:
        type: integer
        description: Minimum number of fraction digits to display
      maximumFractionDigits:
        type: integer
        description: Maximum number of fraction digits to display
      multiplier:
        type: number
        description: Value to multiply the number by before display
      prefix:
        type: string
      suffix:
        type: string
      replaceMissingDataWith:
        description: Value to display when data is missing, this should be set to null as default.
      compactNumbers:
        type: boolean
        description: Whether to display numbers in compact form (e.g., 1K, 1M)
      currency:
        type: string
        description: Currency code for currency formatting (e.g., USD, EUR)
      dateFormat:
        type: string
        description: Format string for date display (must be compatible with Day.js format strings).
      useRelativeTime:
        type: boolean
        description: Whether to display dates as relative time (e.g., 2 days ago)
      isUtc:
        type: boolean
        description: Whether to interpret dates as UTC
      convertNumberTo:
        type: string
        description: Convert number to a different format
    required:
      - columnType
      - style

  # COLUMN VISUAL SETTINGS
  column_settings:
    type: object
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
                description: Multiple y-axis columns can be specified to create multi-line charts. Each column will be represented as a separate line on the chart.
              category:
                type: array
                items:
                  type: string
                description: Used to create multi-line charts with different lines based on categorical values. Especially useful for time series data that combines numeric values with categorical fields, allowing visualization of trends across different categories over time. Alternative to using multiple y-axis columns.
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
            description: The column ID to use for the metric value
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
            description: Optional aggregation method for the metric value, defaults to sum if not specified
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
/// Returns Ok((MetricFile, MetricYml, String, Vec<IndexMap<String, DataType>))) if successful, or an error message if failed
/// The string is a message about the number of records returned by the SQL query
/// The vector of IndexMap<String, DataType> is the results of the SQL query.  Returns empty vector if more than 13 records or no results.
pub async fn process_metric_file(
    tool_call_id: String,
    file_name: String,
    yml_content: String,
    user_id: &Uuid,
) -> Result<
    (
        MetricFile,
        MetricYml,
        String,
        Vec<IndexMap<String, DataType>>,
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

    let dataset_ids = &metric_yml.dataset_ids;
    if dataset_ids.is_empty() {
        return Err("No dataset IDs provided".to_string());
    }

    // Use the first dataset ID for SQL validation
    let dataset_id = dataset_ids[0];

    // Validate SQL with the selected dataset_id and get results
    let (message, results, metadata) = match validate_sql(&metric_yml.sql, &dataset_id).await {
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
    };

    Ok((metric_file, metric_yml, message, results))
}

/// Process a metric file modification request
/// Returns Ok((MetricFile, MetricYml, Vec<ModificationResult>, String, Vec<IndexMap<String, DataType>>)) if successful, or an error if failed
/// The string is a message about the number of records returned by the SQL query
/// The vector of IndexMap<String, DataType> is the results of the SQL query. Returns empty vector if more than 13 records or no results.
pub async fn process_metric_file_modification(
    mut file: MetricFile,
    modification: &FileModification,
    duration: i64,
) -> Result<(
    MetricFile,
    MetricYml,
    Vec<ModificationResult>,
    String,
    Vec<IndexMap<String, DataType>>,
)> {
    debug!(
        file_id = %file.id,
        file_name = %modification.file_name,
        "Processing metric file modifications"
    );

    let mut results = Vec::new();

    // Convert to YAML string for content modifications
    let current_content = match serde_yaml::to_string(&file.content) {
        Ok(content) => content,
        Err(e) => {
            let error = format!("Failed to serialize metric YAML: {}", e);
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
            match MetricYml::new(modified_content) {
                Ok(new_yml) => {
                    debug!(
                        file_id = %file.id,
                        file_name = %modification.file_name,
                        "Successfully modified and validated metric file"
                    );

                    // Validate SQL and get dataset_id from the first dataset
                    if new_yml.dataset_ids.is_empty() {
                        let error = "Missing required field 'dataset_iids'".to_string();
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

                    let dataset_id = new_yml.dataset_ids[0];
                    match validate_sql(&new_yml.sql, &dataset_id).await {
                        Ok((message, validation_results, _metadata)) => {
                            // Update file record
                            file.content = new_yml.clone();
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

                            Ok((file, new_yml.clone(), results, message, validation_results))
                        }
                        Err(e) => {
                            let error = format!("SQL validation failed: {}", e);
                            error!(
                                file_id = %file.id,
                                file_name = %modification.file_name,
                                error = %error,
                                "SQL validation error"
                            );
                            results.push(ModificationResult {
                                file_id: file.id,
                                file_name: modification.file_name.clone(),
                                success: false,
                                error: Some(error.clone()),
                                modification_type: "sql_validation".to_string(),
                                timestamp: Utc::now(),
                                duration,
                            });
                            Err(anyhow::anyhow!(error))
                        }
                    }
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
    use database::{models::DashboardFile, types::DashboardYml};

    use uuid::Uuid;

    #[tokio::test]
    async fn test_validate_sql_empty() {
        let dataset_id = Uuid::new_v4();
        let result = validate_sql("", &dataset_id).await;
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
        let original_content_no_newline =
            "name: test_metric
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
