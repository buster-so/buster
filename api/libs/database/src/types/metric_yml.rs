use anyhow::Result;
use diesel::{
    deserialize::{FromSql, FromSqlRow},
    expression::AsExpression,
    pg::Pg,
    serialize::{IsNull, Output, ToSql},
    sql_types::Jsonb,
};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::Write;
use uuid::Uuid;
use regex::Regex;
use lazy_static::lazy_static;

// Helper function to sanitize string values for YAML
fn sanitize_yaml_string(value: &str) -> String {
    value
        .replace(':', "") // Remove colons
        .replace('\'', "") // Remove single quotes
        .replace('\"', "") // Remove double quotes
        .replace('\n', " ") // Replace newlines with spaces
        .replace('\t', " ") // Replace tabs with spaces
        .trim() // Trim leading/trailing whitespace
        .to_string()
}

lazy_static! {
    // Combined regex for keys whose string values need sanitization
    static ref SANITIZE_KEYS_RE: Regex = Regex::new(
        r#"^(?P<indent>\s*)(?P<key>name|description|timeFrame|displayName|prefix|suffix|goalLineLabel|trendlineLabel|pieInnerLabelTitle|metricValueLabel):\s*(?P<value>.*)$"#
    ).unwrap();
    // Regex to find the start of the colors block and capture indentation
    static ref COLORS_START_RE: Regex = Regex::new(r#"^(\s*)colors:\s*$"#).unwrap();
    // Regex to find unquoted hex color list items and capture indent/marker and color value
    static ref COLOR_LINE_RE: Regex = Regex::new(r#"^(\s*-\s+)(#[0-9a-fA-F]+)\s*$"#).unwrap();
    // Regex to capture the indentation of a line (used for colors block and timeFrame insertion)
    static ref INDENT_RE: Regex = Regex::new(r#"^(\s*)\S"#).unwrap();
    // Regex to find the sql key to determine insertion point for timeFrame
    static ref SQL_KEY_RE: Regex = Regex::new(r#"^(\s*)sql:\s*.*$"#).unwrap();
}

#[derive(Debug, Serialize, Deserialize, Clone, FromSqlRow, AsExpression)]
#[diesel(sql_type = Jsonb)]
#[serde(rename_all = "camelCase")]
pub struct MetricYml {
    pub name: String,
    pub description: Option<String>,
    #[serde(alias = "time_frame")]
    pub time_frame: String,
    pub sql: String,
    #[serde(alias = "chart_config")]
    pub chart_config: ChartConfig,
    #[serde(alias = "dataset_ids")]
    pub dataset_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "selectedChartType")]
#[serde(rename_all = "camelCase")]
pub enum ChartConfig {
    #[serde(rename = "bar")]
    Bar(BarLineChartConfig),
    #[serde(rename = "line")]
    Line(BarLineChartConfig),
    #[serde(rename = "scatter")]
    Scatter(ScatterChartConfig),
    #[serde(rename = "pie")]
    Pie(PieChartConfig),
    #[serde(rename = "combo")]
    Combo(ComboChartConfig),
    #[serde(rename = "metric")]
    Metric(MetricChartConfig),
    #[serde(rename = "table")]
    Table(TableChartConfig),
}


#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(untagged)]
pub enum ShowLegendHeadline {
    Boolean(bool),
    String(String),
}

// Base chart config shared by all chart types
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BaseChartConfig {
    #[serde(alias = "column_label_formats")]
    pub column_label_formats: IndexMap<String, ColumnLabelFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "column_settings")]
    pub column_settings: Option<IndexMap<String, ColumnSettings>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub colors: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_legend")]
    pub show_legend: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "grid_lines")]
    pub grid_lines: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_legend_headline")]
    pub show_legend_headline: Option<ShowLegendHeadline>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "goal_lines")]
    pub goal_lines: Option<Vec<GoalLine>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trendlines: Option<Vec<Trendline>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "disable_tooltip")]
    pub disable_tooltip: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "y_axis_config")]
    pub y_axis_config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "x_axis_config")]
    pub x_axis_config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "category_axis_style_config")]
    pub category_axis_style_config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "y2_axis_config")]
    pub y2_axis_config: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ColumnLabelFormat {
    #[serde(alias = "column_type")]
    pub column_type: String,
    #[serde(alias = "style")]
    pub style: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "display_name")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "number_separator_style")]
    pub number_separator_style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "minimum_fraction_digits")]
    pub minimum_fraction_digits: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "maximum_fraction_digits")]
    pub maximum_fraction_digits: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "multiplier")]
    pub multiplier: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "prefix")]
    pub prefix: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "suffix")]
    pub suffix: Option<String>,
    #[serde(alias = "replace_missing_data_with")]
    pub replace_missing_data_with: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "compact_numbers")]
    pub compact_numbers: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "currency")]
    pub currency: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "date_format")]
    pub date_format: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "use_relative_time")]
    pub use_relative_time: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "is_utc")]
    pub is_utc: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "convert_number_to")]
    pub convert_number_to: Option<String>,
}

impl ColumnLabelFormat {
    /// Creates a new ColumnLabelFormat with appropriate defaults for the given type
    pub fn new_for_type(simple_type: &crate::types::SimpleType) -> Self {
        match simple_type {
            crate::types::SimpleType::Number => Self::new_number(),
            crate::types::SimpleType::String => Self::new_string(),
            crate::types::SimpleType::Date => Self::new_date(),
            crate::types::SimpleType::Boolean => Self::new_boolean(),
            crate::types::SimpleType::Other => Self::new_string(),
        }
    }

    /// Creates a new ColumnLabelFormat for number type
    pub fn new_number() -> Self {
        Self {
            column_type: "number".to_string(),
            style: "number".to_string(),
            display_name: None,
            number_separator_style: Some(",".to_string()),
            minimum_fraction_digits: Some(0),
            maximum_fraction_digits: Some(2),
            multiplier: None,
            prefix: None,
            suffix: None,
            replace_missing_data_with: None,
            compact_numbers: None,
            currency: None,
            date_format: None,
            use_relative_time: None,
            is_utc: None,
            convert_number_to: None,
        }
    }

    /// Creates a new ColumnLabelFormat for string type
    pub fn new_string() -> Self {
        Self {
            column_type: "string".to_string(),
            style: "string".to_string(),
            display_name: None,
            number_separator_style: None,
            minimum_fraction_digits: None,
            maximum_fraction_digits: None,
            multiplier: None,
            prefix: None,
            suffix: None,
            replace_missing_data_with: None,
            compact_numbers: None,
            currency: None,
            date_format: None,
            use_relative_time: None,
            is_utc: None,
            convert_number_to: None,
        }
    }

    /// Creates a new ColumnLabelFormat for date type
    pub fn new_date() -> Self {
        Self {
            column_type: "date".to_string(),
            style: "date".to_string(),
            display_name: None,
            number_separator_style: None,
            minimum_fraction_digits: None,
            maximum_fraction_digits: None,
            multiplier: None,
            prefix: None,
            suffix: None,
            replace_missing_data_with: None,
            compact_numbers: None,
            currency: None,
            date_format: Some("auto".to_string()),
            use_relative_time: None,
            is_utc: Some(false),
            convert_number_to: None,
        }
    }

    /// Creates a new ColumnLabelFormat for boolean type
    pub fn new_boolean() -> Self {
        Self::new_string() // Booleans use string formatting by default
    }

    /// Generate column formats from data metadata
    pub fn generate_formats_from_metadata(
        metadata: &crate::types::DataMetadata,
    ) -> indexmap::IndexMap<String, Self> {
        let mut formats = indexmap::IndexMap::new();

        for column in &metadata.column_metadata {
            let format = Self::new_for_type(&column.simple_type);
            formats.insert(column.name.clone(), format);
        }

        formats
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ColumnSettings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_data_labels")]
    pub show_data_labels: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_data_labels_as_percentage")]
    pub show_data_labels_as_percentage: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "column_visualization")]
    pub column_visualization: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_width")]
    pub line_width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_style")]
    pub line_style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_type")]
    pub line_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_symbol_size")]
    pub line_symbol_size: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_roundness")]
    pub bar_roundness: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_symbol_size_dot")]
    pub line_symbol_size_dot: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GoalLine {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show")]
    pub show: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "value")]
    pub value: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_goal_line_label")]
    pub show_goal_line_label: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "goal_line_label")]
    pub goal_line_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "goal_line_color")]
    pub goal_line_color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Trendline {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show")]
    pub show: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_trendline_label")]
    pub show_trendline_label: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "trendline_label")]
    pub trendline_label: Option<String>,
    #[serde(alias = "type")]
    pub r#type: String,
    #[serde(alias = "column_id")]
    pub column_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "trend_line_color")]
    pub trend_line_color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BarLineChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "bar_and_line_axis")]
    pub bar_and_line_axis: BarAndLineAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_layout")]
    pub bar_layout: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_sort_by")]
    pub bar_sort_by: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_group_type")]
    pub bar_group_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_show_total_at_top")]
    pub bar_show_total_at_top: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_group_type")]
    pub line_group_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BarAndLineAxis {
    #[serde(alias = "x")]
    pub x: Vec<String>,
    #[serde(alias = "y")]
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "category")]
    pub category: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "tooltip")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScatterChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "scatter_axis")]
    pub scatter_axis: ScatterAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "scatter_dot_size")]
    pub scatter_dot_size: Option<Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScatterAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PieChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "pie_chart_axis")]
    pub pie_chart_axis: PieChartAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_display_label_as")]
    pub pie_display_label_as: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_show_inner_label")]
    pub pie_show_inner_label: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_inner_label_aggregate")]
    pub pie_inner_label_aggregate: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_inner_label_title")]
    pub pie_inner_label_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_label_position")]
    pub pie_label_position: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_donut_width")]
    pub pie_donut_width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_minimum_slice_percentage")]
    pub pie_minimum_slice_percentage: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PieChartAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ComboChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "combo_chart_axis")]
    pub combo_chart_axis: ComboChartAxis,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ComboChartAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y2: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MetricChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "metric_column_id")]
    pub metric_column_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "metric_value_aggregate")]
    pub metric_value_aggregate: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "metric_header")]
    pub metric_header: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "metric_sub_header")]
    pub metric_sub_header: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "metric_value_label")]
    pub metric_value_label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_column_order")]
    pub table_column_order: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_column_widths")]
    pub table_column_widths: Option<std::collections::HashMap<String, f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_header_background_color")]
    pub table_header_background_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_header_font_color")]
    pub table_header_font_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_column_font_color")]
    pub table_column_font_color: Option<String>,
}

impl MetricYml {
    pub fn new(yml_content: String) -> Result<Self> {
        let mut processed_lines = Vec::new();
        let mut in_colors_block = false;
        let mut colors_indent: Option<usize> = None;
        let mut time_frame_found = false;
        let mut sql_line_index: Option<usize> = None;
        let mut sql_line_indent: Option<String> = None;

        for (index, line) in yml_content.lines().enumerate() {
            // Store SQL line info for potential timeFrame insertion
            if sql_line_index.is_none() {
                 if let Some(caps) = SQL_KEY_RE.captures(line) {
                    sql_line_index = Some(index);
                    sql_line_indent = Some(caps.get(1).map_or("", |m| m.as_str()).to_string());
                }
            }

            let current_indent = INDENT_RE.captures(line).map_or(0, |caps| {
                caps.get(1).map_or(0, |m| m.as_str().len())
            });

            // --- Colors Block Logic ---
            if in_colors_block && colors_indent.map_or(false, |indent| current_indent <= indent) {
                in_colors_block = false;
                colors_indent = None;
            }
            if !in_colors_block { // Only check for start if not already in block
                if let Some(caps) = COLORS_START_RE.captures(line) {
                    in_colors_block = true;
                    colors_indent = Some(caps.get(1).map_or(0, |m| m.as_str().len()));
                    processed_lines.push(line.to_string());
                    continue;
                }
            }
            if in_colors_block {
                if let Some(caps) = COLOR_LINE_RE.captures(line) {
                    let marker_part = caps.get(1).map_or("", |m| m.as_str());
                    let color_part = caps.get(2).map_or("", |m| m.as_str());
                    processed_lines.push(format!("{}'{}'", marker_part, color_part));
                    continue;
                } else {
                     processed_lines.push(line.to_string()); // Add line within color block as is if not a hex item
                     continue;
                }
            }
            // --- End Colors Block Logic ---

            // --- String Sanitization & timeFrame Check ---
             if let Some(caps) = SANITIZE_KEYS_RE.captures(line) {
                let indent = caps.name("indent").map_or("", |m| m.as_str());
                let key = caps.name("key").map_or("", |m| m.as_str());
                let value = caps.name("value").map_or("", |m| m.as_str());

                if key == "timeFrame" {
                    time_frame_found = true;
                }

                let sanitized_value = sanitize_yaml_string(value);
                // Reconstruct line, potentially quoting if value was empty after sanitizing?
                // For now, just place the sanitized value. YAML might handle empty strings okay.
                // If the value needs quotes (e.g., contains special chars AFTER sanitization, though unlikely now)
                // we might need more complex logic. Let's assume simple value placement is fine.
                processed_lines.push(format!("{}{}: {}", indent, key, sanitized_value));
            } else {
                // Add lines that don't match any processing rules
                processed_lines.push(line.to_string());
            }
        }

        // Insert default timeFrame if not found
        if !time_frame_found {
            if let Some(index) = sql_line_index {
                 // Use the indent captured from the sql line
                let indent = sql_line_indent.unwrap_or_else(|| "  ".to_string()); // Default indent if sql indent capture failed
                processed_lines.insert(index, format!("{}timeFrame: 'all_time'", indent));
            } else {
                // Fallback: append if sql key wasn't found (shouldn't happen for valid metric)
                // Or maybe error out?
                 eprintln!("Warning: sql key not found in metric YAML, cannot insert default timeFrame correctly.");
                 // Append at end with default indent - might break YAML structure
                 processed_lines.push("  timeFrame: 'all_time'".to_string()); 
            }
        }

        let processed_yml_content = processed_lines.join("\n");

        // Parse the processed YAML content
        let file: MetricYml = match serde_yaml::from_str(&processed_yml_content) {
            Ok(file) => file,
            Err(e) => {
                let error_message = format!("Error parsing YAML: {}", e);

                let yaml_error_str = e.to_string();
                let detailed_error =
                    if yaml_error_str.contains("at line") && yaml_error_str.contains("column") {
                        format!("Error parsing YAML at {}", yaml_error_str)
                    } else {
                        error_message
                    };

                return Err(anyhow::anyhow!(detailed_error));
            }
        };

        match file.validate() {
            Ok(_) => Ok(file),
            Err(e) => Err(anyhow::anyhow!("Error validating metric: {}", e)),
        }
    }

    pub fn validate(&self) -> Result<()> {
        Ok(())
    }
}

impl FromSql<Jsonb, Pg> for MetricYml {
    fn from_sql(bytes: diesel::pg::PgValue) -> diesel::deserialize::Result<Self> {
        let value = <serde_json::Value as FromSql<Jsonb, Pg>>::from_sql(bytes)?;
        Ok(serde_json::from_value(value)?)
    }
}

impl ToSql<Jsonb, Pg> for MetricYml {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> diesel::serialize::Result {
        out.write_all(&[1])?;
        out.write_all(&serde_json::to_vec(self)?)?;
        Ok(IsNull::No)
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::types::{ColumnMetaData, ColumnType, DataMetadata, SimpleType};

    use super::*;

    fn normalize_whitespace(s: &str) -> String {
        s.split_whitespace().collect::<Vec<&str>>().join(" ")
    }

    #[test]
    fn test_metric_yml_bar_serialization() -> Result<()> {
        let yml_content = "title: \"Average Time to Close by Rep\"\nsql: |\n  SELECT\n    rep_id,\n    AVG(time_to_close) AS average_time_to_close\n  FROM deal_metrics\n  GROUP BY rep_id\n  ORDER BY average_time_to_close DESC\nchart_config:\n  selected_chart_type: \"bar\"\n  selected_view: \"standard\"\n  bar_and_line_axis:\n    x: [\"rep_id\"]\n    y: [\"average_time_to_close\"]\n    category: [\"rep_id\"]\n  bar_layout: \"vertical\"\n  bar_group_type: \"group\"\n  column_label_formats: {}\n  colors: [\"#1f77b4\", \"#ff7f0e\", \"#2ca02c\", \"#d62728\"]\n  show_legend: false\n  grid_lines: true\n  column_settings: {}\ndata_metadata:\n  - name: \"rep_id\"\n    data_type: \"string\"\n  - name: \"average_time_to_close\"\n    data_type: \"number\"";

        let metric = MetricYml::new(yml_content.to_string())?;

        assert_eq!(metric.name, "Average Time to Close by Rep");

        let expected_sql = normalize_whitespace("SELECT rep_id, AVG(time_to_close) AS average_time_to_close FROM deal_metrics GROUP BY rep_id ORDER BY average_time_to_close DESC");
        let actual_sql = normalize_whitespace(&metric.sql);
        assert_eq!(actual_sql, expected_sql);

        match metric.chart_config {
            ChartConfig::Bar(config) => {
                assert!(config.base.column_label_formats.is_empty());
                assert_eq!(config.bar_and_line_axis.x, vec![String::from("rep_id")]);
                assert_eq!(
                    config.bar_and_line_axis.y,
                    vec![String::from("average_time_to_close")]
                );
                assert_eq!(
                    config.bar_and_line_axis.category,
                    Some(vec![String::from("rep_id")])
                );
                assert_eq!(config.bar_layout.unwrap(), "vertical");
                assert_eq!(config.bar_group_type.unwrap(), "group");
                assert_eq!(
                    config.base.colors.unwrap(),
                    vec!["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]
                );
                assert_eq!(config.base.show_legend.unwrap(), false);
                assert_eq!(config.base.grid_lines.unwrap(), true);
            }
            _ => panic!("Expected Bar chart type"),
        }

        Ok(())
    }

    #[test]
    fn test_column_label_format_constructors() {
        let number_format = ColumnLabelFormat::new_number();
        assert_eq!(number_format.column_type, "number");
        assert_eq!(number_format.style, "number");
        assert_eq!(number_format.number_separator_style, Some(",".to_string()));
        assert_eq!(number_format.minimum_fraction_digits, Some(0));
        assert_eq!(number_format.maximum_fraction_digits, Some(2));

        let string_format = ColumnLabelFormat::new_string();
        assert_eq!(string_format.column_type, "string");
        assert_eq!(string_format.style, "string");

        let date_format = ColumnLabelFormat::new_date();
        assert_eq!(date_format.column_type, "date");
        assert_eq!(date_format.style, "date");
        assert_eq!(date_format.date_format, Some("auto".to_string()));
        assert_eq!(date_format.is_utc, Some(false));

        let boolean_format = ColumnLabelFormat::new_boolean();
        assert_eq!(boolean_format.column_type, "string");
        assert_eq!(boolean_format.style, "string");
    }

    #[test]
    fn test_generate_formats_from_metadata() {
        let metadata = DataMetadata {
            column_count: 3,
            row_count: 10,
            column_metadata: vec![
                ColumnMetaData {
                    name: "id".to_string(),
                    min_value: json!(1),
                    max_value: json!(100),
                    unique_values: 10,
                    simple_type: SimpleType::Number,
                    column_type: ColumnType::Int4,
                },
                ColumnMetaData {
                    name: "name".to_string(),
                    min_value: json!("A"),
                    max_value: json!("Z"),
                    unique_values: 5,
                    simple_type: SimpleType::String,
                    column_type: ColumnType::Varchar,
                },
                ColumnMetaData {
                    name: "created_at".to_string(),
                    min_value: json!("2023-01-01T00:00:00"),
                    max_value: json!("2023-12-31T23:59:59"),
                    unique_values: 10,
                    simple_type: SimpleType::Date,
                    column_type: ColumnType::Timestamp,
                },
            ],
        };

        let formats = ColumnLabelFormat::generate_formats_from_metadata(&metadata);

        assert_eq!(formats.len(), 3);

        let id_format = formats.get("id").unwrap();
        assert_eq!(id_format.column_type, "number");

        let name_format = formats.get("name").unwrap();
        assert_eq!(name_format.column_type, "string");

        let date_format = formats.get("created_at").unwrap();
        assert_eq!(date_format.column_type, "date");
        assert_eq!(date_format.style, "date");
    }
}
