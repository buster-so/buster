use serde_json::Value;
use std::fmt;
use tokio::sync::mpsc;

use crate::utils::{
    agent_builder::nodes::{
        error_node::ErrorNode,
        prompt_node::{prompt_node, PromptNodeMessage, PromptNodeSettings},
    },
    charting::types::ChartType,
    prompts::modify_visualization_prompts::build_charts_prompts::{
        bar_line_chart_prompt::{bar_line_chart_system_prompt, bar_line_chart_user_prompt},
        combo_chart_prompt::{combo_chart_system_prompt, combo_chart_user_prompt},
        metric_chart_prompt::{metric_chart_system_prompt, metric_chart_user_prompt},
        pie_chart_prompt::{pie_chart_system_prompt, pie_chart_user_prompt},
        scatter_chart_prompt::{scatter_chart_system_prompt, scatter_chart_user_prompt},
    },
};

pub enum BuildChartsAgentError {
    ObjectNotJson,
    MissingKey,
    PromptNodeError,
}

impl fmt::Display for BuildChartsAgentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingKey => write!(f, "missing_key"),
            Self::ObjectNotJson => write!(f, "object_not_json"),
            Self::PromptNodeError => write!(f, "prompt_node_error"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct BuildChartsAgentOptions {
    pub configure_charts_instruction: String,
    pub chart_config_context: String,
    pub data_metadata: String,
    pub sql: String,
    pub user_message: String,
    pub output_sender: mpsc::Sender<Value>,
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BarLineChartAxisConfig {
    pub x: Vec<String>,
    pub y: Vec<String>,
    pub category: Option<Vec<String>>,
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PieChartAxisConfig {
    pub x: Vec<String>,
    pub y: Vec<String>,
    pub tooltip: Option<Vec<String>>,
    pub pie_display_label_as: Option<String>,
    pub pie_show_inner_label: Option<bool>,
    pub pie_inner_label_aggregate: Option<String>,
    pub pie_inner_label_title: Option<String>,
    pub pie_label_position: Option<String>,
    pub pie_donut_width: Option<f64>,
    pub pie_minimum_slice_percentage: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DerivedMetricTitle {
    pub column_id: String,
    pub use_value: bool,
    pub aggregate: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MetricChartAxisConfig {
    pub metric_column_id: String,
    pub metric_value_aggregate: Option<String>,
    pub metric_header: Option<DerivedMetricTitle>,
    pub metric_sub_header: Option<DerivedMetricTitle>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScatterChartAxisConfig {
    pub x: Vec<String>,
    pub y: Vec<String>,
    pub category: Option<Vec<String>>,
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ComboChartAxisConfig {
    pub x: Vec<String>,
    pub y: Vec<String>,
    pub y2: Option<Vec<String>>,
    pub category: Option<Vec<String>>,
    pub tooltip: Option<Vec<String>>,
}

//TODO: Make these optional bc some may be generated and others not.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BuildChartsAgentResult {
    pub bar_line_chart: Value,
    pub scatter_chart: Value,
    pub pie_chart: Value,
    pub metric_chart: Value,
    pub combo_chart: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum ChartAxisConfig {
    Chart(Value),
    Table,
}

impl BuildChartsAgentResult {
    pub fn get_chart_config(&self, chart_type: ChartType) -> Value {
        match chart_type {
            ChartType::Line => self.bar_line_chart.clone(),
            ChartType::Scatter => self.scatter_chart.clone(),
            ChartType::Pie => self.pie_chart.clone(),
            ChartType::Metric => self.metric_chart.clone(),
            ChartType::Combo => self.combo_chart.clone(),
            ChartType::Bar => self.bar_line_chart.clone(),
            ChartType::Table => Value::Null,
        }
    }
}

pub async fn configure_charts_agent(
    options: BuildChartsAgentOptions,
) -> Result<BuildChartsAgentResult, ErrorNode> {
    // Bar Line Chart Node
    let bar_line_chart_settings = PromptNodeSettings {
        messages: vec![
            PromptNodeMessage {
                role: "system".to_string(),
                content: bar_line_chart_system_prompt(),
            },
            PromptNodeMessage {
                role: "user".to_string(),
                content: bar_line_chart_user_prompt(
                    options.configure_charts_instruction.clone(),
                    options.chart_config_context.clone(),
                    options.sql.clone(),
                    options.data_metadata.clone(),
                    options.user_message.clone(),
                ),
            },
        ],
        prompt_name: "bar_line_chart".to_string(),
        json_mode: true,
        model: "gpt-4o".to_string(),
        ..Default::default()
    };
    let bar_line_future = tokio::spawn(async move { prompt_node(bar_line_chart_settings).await });

    // Scatter Chart Node
    let scatter_chart_settings = PromptNodeSettings {
        messages: vec![
            PromptNodeMessage {
                role: "system".to_string(),
                content: scatter_chart_system_prompt(),
            },
            PromptNodeMessage {
                role: "user".to_string(),
                content: scatter_chart_user_prompt(
                    options.configure_charts_instruction.clone(),
                    options.chart_config_context.clone(),
                    options.sql.clone(),
                    options.data_metadata.clone(),
                    options.user_message.clone(),
                ),
            },
        ],
        prompt_name: "scatter_chart".to_string(),
        json_mode: true,
        model: "gpt-4o".to_string(),
        ..Default::default()
    };
    let scatter_future = tokio::spawn(async move { prompt_node(scatter_chart_settings).await });

    // Pie Chart Node
    let pie_chart_settings = PromptNodeSettings {
        messages: vec![
            PromptNodeMessage {
                role: "system".to_string(),
                content: pie_chart_system_prompt(),
            },
            PromptNodeMessage {
                role: "user".to_string(),
                content: pie_chart_user_prompt(
                    options.configure_charts_instruction.clone(),
                    options.chart_config_context.clone(),
                    options.sql.clone(),
                    options.data_metadata.clone(),
                    options.user_message.clone(),
                ),
            },
        ],
        prompt_name: "pie_chart".to_string(),
        json_mode: true,
        model: "gpt-4o".to_string(),
        ..Default::default()
    };
    let pie_future = tokio::spawn(async move { prompt_node(pie_chart_settings).await });

    // Metric Chart Node
    let metric_chart_settings = PromptNodeSettings {
        messages: vec![
            PromptNodeMessage {
                role: "system".to_string(),
                content: metric_chart_system_prompt(),
            },
            PromptNodeMessage {
                role: "user".to_string(),
                content: metric_chart_user_prompt(
                    options.configure_charts_instruction.clone(),
                    options.chart_config_context.clone(),
                    options.sql.clone(),
                    options.data_metadata.clone(),
                    options.user_message.clone(),
                ),
            },
        ],
        prompt_name: "metric_chart".to_string(),
        json_mode: true,
        model: "gpt-4o".to_string(),
        ..Default::default()
    };
    let metric_future = tokio::spawn(async move { prompt_node(metric_chart_settings).await });

    // Combo Chart Node
    let messages = vec![
        PromptNodeMessage {
            role: "system".to_string(),
            content: combo_chart_system_prompt(),
        },
        PromptNodeMessage {
            role: "user".to_string(),
            content: combo_chart_user_prompt(
                options.configure_charts_instruction.clone(),
                options.chart_config_context.clone(),
                options.sql.clone(),
                options.data_metadata.clone(),
                options.user_message.clone(),
            ),
        },
    ];
    let combo_chart_settings = PromptNodeSettings {
        messages,
        prompt_name: "combo_chart".to_string(),
        json_mode: true,
        model: "gpt-4o".to_string(),
        ..Default::default()
    };
    let combo_future = tokio::spawn(async move { prompt_node(combo_chart_settings).await });

    // Await all chart results individually

    let bar_line_result = match bar_line_future.await {
        Ok(Ok(value)) => Some(value),
        _ => None,
    };

    let scatter_result = match scatter_future.await {
        Ok(Ok(value)) => Some(value),
        _ => None,
    };

    let pie_result = match pie_future.await {
        Ok(Ok(value)) => Some(value),
        _ => None,
    };

    let metric_result = match metric_future.await {
        Ok(Ok(value)) => Some(value),
        _ => None,
    };

    let combo_result = match combo_future.await {
        Ok(Ok(value)) => Some(value),
        _ => None,
    };

    Ok(BuildChartsAgentResult {
        bar_line_chart: bar_line_result.unwrap_or(Value::Null),
        scatter_chart: scatter_result.unwrap_or(Value::Null),
        pie_chart: pie_result.unwrap_or(Value::Null),
        metric_chart: metric_result.unwrap_or(Value::Null),
        combo_chart: combo_result.unwrap_or(Value::Null),
    })
}
