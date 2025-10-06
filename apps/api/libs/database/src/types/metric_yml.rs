use anyhow::Result;
use diesel::{
    deserialize::{FromSql, FromSqlRow},
    expression::AsExpression,
    pg::Pg,
    serialize::{IsNull, Output, ToSql},
    sql_types::Jsonb,
};
use indexmap::IndexMap;
use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::io::Write;

// Helper function to sanitize string values for YAML
fn sanitize_yaml_string(value: &str) -> String {
    value
        .replace(':', "") // Remove colons
        .replace('\'', "") // Remove single quotes
        .replace('\"', "") // Remove double quotes
        .replace('\n', " ") // Replace newlines with spaces
        .replace('\t', " ") // Replace tabs with spaces
        .replace('%', "Percent") // Replace % with Percent
        .trim() // Trim leading/trailing whitespace
        .to_string()
}

// Helper function to recursively lowercase relevant keys and string values in serde_yaml::Value
fn lowercase_column_identifiers(value: &mut serde_yaml::Value) {
    match value {
        serde_yaml::Value::Mapping(map) => {
            let mut new_map = serde_yaml::Mapping::new();
            for (k, v) in map.iter() {
                // Make a mutable copy to modify
                let mut current_v = v.clone();
                // Recurse first
                lowercase_column_identifiers(&mut current_v);

                if let serde_yaml::Value::String(key_str) = k {
                    // Lowercase keys for maps known to use column names as keys
                    if ["columnLabelFormats", "columnSettings", "tableColumnWidths"]
                        .contains(&key_str.as_str())
                    {
                        if let serde_yaml::Value::Mapping(inner_map) = &mut current_v {
                            let mut lowercase_key_map = serde_yaml::Mapping::new();
                            for (inner_k, inner_v) in inner_map.iter() {
                                if let serde_yaml::Value::String(inner_key_str) = inner_k {
                                    lowercase_key_map.insert(
                                        serde_yaml::Value::String(inner_key_str.to_lowercase()),
                                        inner_v.clone(), // Value already processed by recursion
                                    );
                                } else {
                                    // Keep non-string keys as is
                                    lowercase_key_map.insert(inner_k.clone(), inner_v.clone());
                                }
                            }
                            current_v = serde_yaml::Value::Mapping(lowercase_key_map);
                        }
                    }
                    // Lowercase string values for specific keys holding single column names
                    else if ["metricColumnId", "columnId"].contains(&key_str.as_str()) {
                        if let serde_yaml::Value::String(val_str) = &mut current_v {
                            *val_str = val_str.to_lowercase();
                        }
                    }
                    // Lowercase string elements within arrays for specific keys
                    else if [
                        "x",
                        "y",
                        "y2",
                        "category",
                        "tooltip",
                        "size",
                        "tableColumnOrder",
                        "barSortBy", // Added barSortBy as it likely contains column names
                        "colorBy", // Added colorBy as it contains column names
                    ]
                    .contains(&key_str.as_str())
                    {
                        if let serde_yaml::Value::Sequence(seq) = &mut current_v {
                            for item in seq.iter_mut() {
                                if let serde_yaml::Value::String(s) = item {
                                    *s = s.to_lowercase();
                                }
                            }
                        }
                    }
                }
                // Insert the potentially modified key and value into the new map
                new_map.insert(k.clone(), current_v);
            }
            *value = serde_yaml::Value::Mapping(new_map);
        }
        serde_yaml::Value::Sequence(seq) => {
            for item in seq.iter_mut() {
                lowercase_column_identifiers(item);
            }
        }
        // Handle other types like String, Number, Bool, Null - no action needed here
        _ => {}
    }
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

// --- Axis Configuration Enums ---

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum YAxisScaleType {
    Log,
    Linear,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum XAxisTimeInterval {
    Day,
    Week,
    Month,
    Quarter,
    Year,
}

// Use strings to represent numbers and 'auto' for compatibility with TS/JSON
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum XAxisLabelRotation {
    #[serde(rename = "0")]
    Rotate0,
    #[serde(rename = "45")]
    Rotate45,
    #[serde(rename = "90")]
    Rotate90,
    #[serde(rename = "auto")]
    Auto,
}

// --- Axis Configuration Structs ---

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct YAxisConfig {
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "y_axis_show_axis_label"
    )]
    pub y_axis_show_axis_label: Option<bool>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "y_axis_show_axis_title"
    )]
    pub y_axis_show_axis_title: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "y_axis_axis_title")]
    pub y_axis_axis_title: Option<String>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "y_axis_start_axis_at_zero"
    )]
    pub y_axis_start_axis_at_zero: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "y_axis_scale_type")]
    pub y_axis_scale_type: Option<YAxisScaleType>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Y2AxisConfig {
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "y2_axis_show_axis_label"
    )]
    pub y2_axis_show_axis_label: Option<bool>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "y2_axis_show_axis_title"
    )]
    pub y2_axis_show_axis_title: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "y2_axis_axis_title")]
    pub y2_axis_axis_title: Option<String>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "y2_axis_start_axis_at_zero"
    )]
    pub y2_axis_start_axis_at_zero: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "y2_axis_scale_type")]
    pub y2_axis_scale_type: Option<YAxisScaleType>, // Reuses YAxisScaleType enum
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct XAxisConfig {
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "x_axis_time_interval"
    )]
    pub x_axis_time_interval: Option<XAxisTimeInterval>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "x_axis_show_axis_label"
    )]
    pub x_axis_show_axis_label: Option<bool>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "x_axis_show_axis_title"
    )]
    pub x_axis_show_axis_title: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "x_axis_axis_title")]
    pub x_axis_axis_title: Option<String>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "x_axis_label_rotation"
    )]
    pub x_axis_label_rotation: Option<XAxisLabelRotation>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "x_axis_data_zoom")]
    pub x_axis_data_zoom: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct CategoryAxisStyleConfig {
    #[serde(skip_serializing_if = "Option::is_none", alias = "category_axis_title")]
    pub category_axis_title: Option<String>,
}

// --- Base Chart Config ---

// Base chart config shared by all chart types
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BaseChartConfig {
    // Keys of this map are column names, need lowercasing.
    #[serde(alias = "column_label_formats")]
    pub column_label_formats: IndexMap<String, ColumnLabelFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    // Keys of this map are column names, need lowercasing.
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
    // Updated Axis Configs using defined structs (now optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "y_axis_config", flatten)]
    pub y_axis_config: Option<YAxisConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "x_axis_config", flatten)]
    pub x_axis_config: Option<XAxisConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "category_axis_style_config", flatten)]
    pub category_axis_style_config: Option<CategoryAxisStyleConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "y2_axis_config", flatten)]
    pub y2_axis_config: Option<Y2AxisConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum NumberSeparatorStyle {
    #[serde(rename = ",")]
    Comma,
    None,
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
            replace_missing_data_with: Some(json!(0)),
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
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "trendline_label_position_offset")]
    pub trendline_label_position_offset: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "projection")]
    pub projection: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_style")]
    pub line_style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "offset")]
    pub offset: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "polynomial_order")]
    pub polynomial_order: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "aggregate_all_categories")]
    pub aggregate_all_categories: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "id")]
    pub id: Option<String>,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "color_by")]
    pub color_by: Option<Vec<String>>,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "color_by")]
    pub color_by: Option<Vec<String>>,
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
pub enum MetricValueAggregate {
    Sum,
    Average,
    Median,
    Count,
    Max,
    Min,
    First,
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

            let current_indent = INDENT_RE
                .captures(line)
                .map_or(0, |caps| caps.get(1).map_or(0, |m| m.as_str().len()));

            // --- Colors Block Logic ---
            if in_colors_block && colors_indent.map_or(false, |indent| current_indent <= indent) {
                in_colors_block = false;
                colors_indent = None;
            }
            if !in_colors_block {
                // Only check for start if not already in block
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
                processed_lines.push(format!("{}{}: {}", indent, key, sanitized_value));
            } else {
                // Add lines that don't match any processing rules (like the sql block)
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

        // Parse into generic serde_yaml::Value first
        let mut yaml_value: serde_yaml::Value = match serde_yaml::from_str(&processed_yml_content) {
            Ok(value) => value,
            Err(e) => {
                // Keep existing error handling for initial parse
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

        // Recursively lowercase the relevant identifiers
        lowercase_column_identifiers(&mut yaml_value);

        // Now deserialize the modified value into the specific struct
        let file: MetricYml = match serde_yaml::from_value(yaml_value) {
            Ok(file) => file,
            Err(e) => {
                // Add error context for the second deserialization step
                return Err(anyhow::anyhow!(
                    "Error deserializing processed YAML into MetricYml: {}",
                    e
                ));
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
        // Use raw string literal for multi-line YAML
        let yml_content = r#"name: "Average Time to Close by Rep"
sql: |
  SELECT
    rep_id,
    AVG(time_to_close) AS average_time_to_close
  FROM deal_metrics
  GROUP BY rep_id
  ORDER BY average_time_to_close DESC
timeFrame: "last_quarter" # Explicit timeFrame
chart_config:
  selectedChartType: "bar"
  barAndLineAxis:
    x: ["REP_ID"]
    y: ["AVERAGE_TIME_TO_CLOSE"]
    category: ["REP_ID"]
  barLayout: "vertical"
  barGroupType: "group"
  columnLabelFormats: 
    REP_ID: 
      columnType: string
      style: string
    AVERAGE_TIME_TO_CLOSE:
      columnType: number
      style: currency
      currency: USD
  colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'] # Quoted colors
  showLegend: false
  gridLines: true
  columnSettings: 
    AVERAGE_TIME_TO_CLOSE:
       showDataLabels: true
datasetIds: ["00000000-0000-0000-0000-000000000001"]
"#;

        let metric = MetricYml::new(yml_content.to_string())?;

        assert_eq!(metric.name, "Average Time to Close by Rep");
        assert_eq!(metric.time_frame, "last_quarter"); // Verify timeFrame parsing

        let expected_sql = normalize_whitespace("SELECT rep_id, AVG(time_to_close) AS average_time_to_close FROM deal_metrics GROUP BY rep_id ORDER BY average_time_to_close DESC");
        let actual_sql = normalize_whitespace(&metric.sql);
        assert_eq!(actual_sql, expected_sql);

        match metric.chart_config {
            ChartConfig::Bar(config) => {
                // Check columnLabelFormats keys and content
                assert!(config.base.column_label_formats.contains_key("rep_id"));
                assert!(config
                    .base
                    .column_label_formats
                    .contains_key("average_time_to_close"));
                assert!(!config.base.column_label_formats.contains_key("REP_ID")); // Verify key is lowercase
                let rep_format = config.base.column_label_formats.get("rep_id").unwrap();
                assert_eq!(rep_format.column_type, "string");
                let avg_format = config
                    .base
                    .column_label_formats
                    .get("average_time_to_close")
                    .unwrap();
                assert_eq!(avg_format.style, "currency");
                assert_eq!(avg_format.currency, Some("USD".to_string()));

                // Check axis elements are lowercase
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
                // Check colors were quoted correctly during initial processing
                assert_eq!(
                    config.base.colors.unwrap(),
                    vec!["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]
                );
                assert_eq!(config.base.show_legend.unwrap(), false);
                assert_eq!(config.base.grid_lines.unwrap(), true);

                // Check columnSettings key is lowercase
                assert!(config.base.column_settings.is_some());
                let settings = config.base.column_settings.as_ref().unwrap();
                assert!(settings.contains_key("average_time_to_close"));
                assert!(!settings.contains_key("AVERAGE_TIME_TO_CLOSE"));
                let avg_settings = settings.get("average_time_to_close").unwrap();
                assert_eq!(avg_settings.show_data_labels, Some(true));
            }
            _ => panic!("Expected Bar chart type"),
        }

        Ok(())
    }

    #[test]
    fn test_lowercase_trendline_column_id() -> Result<()> {
        // Use raw string literal
        let yml_content = r#"
name: Trend Test
sql: SELECT date, VALUE FROM data
timeFrame: all_time
datasetIds: ["00000000-0000-0000-0000-000000000001"]
chartConfig:
  selectedChartType: line
  columnLabelFormats:
    date: { columnType: date, style: date }
    VALUE: { columnType: number, style: number }
  barAndLineAxis:
    x: [date]
    y: [VALUE]
  trendlines:
    - columnId: VALUE # Uppercase ID
      type: linear
"#;
        let metric = MetricYml::new(yml_content.to_string())?;
        match metric.chart_config {
            ChartConfig::Line(config) => {
                assert!(config.base.trendlines.is_some());
                let trendlines = config.base.trendlines.as_ref().unwrap();
                assert_eq!(trendlines.len(), 1);
                assert_eq!(trendlines[0].column_id, "value"); // Verify lowercase
                assert_eq!(trendlines[0].r#type, "linear");
            }
            _ => panic!("Expected Line chart"),
        }
        Ok(())
    }

    #[test]
    fn test_lowercase_metric_column_id() -> Result<()> {
        // Use raw string literal
        let yml_content = r#"
name: Metric ID Test
sql: SELECT COUNT(*) AS TOTAL_COUNT FROM data
timeFrame: all_time
datasetIds: ["00000000-0000-0000-0000-000000000001"]
chartConfig:
  selectedChartType: metric
  columnLabelFormats:
    TOTAL_COUNT: { columnType: number, style: number }
  metricColumnId: TOTAL_COUNT # Uppercase ID
"#;
        let metric = MetricYml::new(yml_content.to_string())?;
        match metric.chart_config {
            ChartConfig::Metric(config) => {
                assert_eq!(config.metric_column_id, "total_count"); // Verify lowercase
            }
            _ => panic!("Expected Metric chart"),
        }
        Ok(())
    }

    #[test]
    fn test_lowercase_table_config_columns() -> Result<()> {
        // Use raw string literal
        let yml_content = r#"
name: Table Columns Test
sql: SELECT COL_A, COL_B FROM data
timeFrame: all_time
datasetIds: ["00000000-0000-0000-0000-000000000001"]
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    COL_A: { columnType: string, style: string }
    COL_B: { columnType: number, style: number }
  tableColumnOrder: [COL_A, COL_B] # Uppercase IDs
  tableColumnWidths:
    COL_A: 150 # Uppercase Key
    COL_B: 100 # Uppercase Key
"#;
        let metric = MetricYml::new(yml_content.to_string())?;
        match metric.chart_config {
            ChartConfig::Table(config) => {
                assert!(config.table_column_order.is_some());
                assert_eq!(config.table_column_order.unwrap(), vec!["col_a", "col_b"]); // Verify lowercase

                assert!(config.table_column_widths.is_some());
                let widths = config.table_column_widths.as_ref().unwrap();
                assert!(widths.contains_key("col_a")); // Verify lowercase key
                assert!(widths.contains_key("col_b")); // Verify lowercase key
                assert!(!widths.contains_key("COL_A"));
                assert_eq!(widths.get("col_a").unwrap(), &150.0);
            }
            _ => panic!("Expected Table chart"),
        }
        Ok(())
    }

    #[test]
    fn test_default_timeframe_insertion_and_lowercase() -> Result<()> {
        // Use raw string literal
        let yml_content = r#"
name: Default Timeframe Test
# No timeFrame specified
sql: SELECT DATE_COL, VALUE_COL FROM data
datasetIds: ["00000000-0000-0000-0000-000000000001"]
chartConfig:
  selectedChartType: line
  columnLabelFormats:
    DATE_COL: { columnType: date, style: date }
    VALUE_COL: { columnType: number, style: number }
  barAndLineAxis:
    x: [DATE_COL]
    y: [VALUE_COL]
"#;
        let metric = MetricYml::new(yml_content.to_string())?;

        // Check default timeframe was inserted
        assert_eq!(metric.time_frame, "all_time");

        // Check column names were lowercased despite timeframe insertion
        match metric.chart_config {
            ChartConfig::Line(config) => {
                assert!(config.base.column_label_formats.contains_key("date_col"));
                assert!(config.base.column_label_formats.contains_key("value_col"));
                assert_eq!(config.bar_and_line_axis.x, vec!["date_col"]);
                assert_eq!(config.bar_and_line_axis.y, vec!["value_col"]);
            }
            _ => panic!("Expected Line chart"),
        }

        Ok(())
    }

    #[test]
    fn test_mixed_case_sanitization_and_lowercase() -> Result<()> {
        // Use raw string literal
        let yml_content = r#"
name: Mixed Case Test: Needs 'Sanitization' and LOWERCASE
sql: SELECT Category, "Total Sales" FROM sales_data
timeFrame: all_time
datasetIds: ["00000000-0000-0000-0000-000000000001"]
chartConfig:
  selectedChartType: bar
  columnLabelFormats:
    Category: { columnType: string, style: string, displayName: 'Product Category:' }
    "Total Sales": { columnType: number, style: currency, currency: USD }
  barAndLineAxis:
    x: [Category]
    y: ["Total Sales"]
"#;
        let metric = MetricYml::new(yml_content.to_string())?;

        // Check name was sanitized
        assert_eq!(
            metric.name,
            "Mixed Case Test Needs Sanitization and LOWERCASE"
        );

        // Check column names were lowercased
        match metric.chart_config {
            ChartConfig::Bar(config) => {
                assert!(config.base.column_label_formats.contains_key("category"));
                assert!(config.base.column_label_formats.contains_key("total sales")); // Note: Sanitization happens before lowercasing structural keys

                let cat_format = config.base.column_label_formats.get("category").unwrap();
                assert_eq!(
                    cat_format.display_name,
                    Some("Product Category".to_string())
                ); // Check displayName sanitization

                assert_eq!(config.bar_and_line_axis.x, vec!["category"]);
                assert_eq!(config.bar_and_line_axis.y, vec!["total sales"]);
            }
            _ => panic!("Expected Bar chart"),
        }
        Ok(())
    }

    // ... existing tests ...
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
