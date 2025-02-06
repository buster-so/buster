use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{fmt, time::Instant};
use tokio::sync::mpsc;

use crate::utils::{
    agent_builder::nodes::{
        error_node::ErrorNode,
        prompt_node::{prompt_node, PromptNodeMessage, PromptNodeSettings},
    },
    charting::types::ChartType,
    prompts::modify_visualization_prompts::modify_visualization_orchestrator_prompt::{
        modify_visualization_system_prompt, modify_visualization_user_prompt,
    },
};
use crate::utils::{
    agents::{
        configure_charts_agent::{configure_charts_agent, BuildChartsAgentOptions},
        format_labels_agent::{format_labels_agent, FormatLabelsAgentOptions},
    },
    prompts::modify_visualization_prompts::modify_visualization_orchestrator_prompt::modify_visualization_prompt_schema,
};

use super::{
    column_styling_agent::{column_styling_agent, ColumnStylingAgentOptions},
    global_styling_agent::{global_styling_agent, GlobalStylingAgentOptions},
};

#[derive(Clone)]
pub struct ModifyVisualizationAgentOptions {
    pub previous_message: Option<Value>,
    pub input: Option<String>,
    pub thought_process: Option<String>,
    pub metadata_changed: bool,
    pub output_sender: mpsc::Sender<Value>,
    pub user_message: String,
    pub data_metadata: Value,
    pub sql: String,
}

pub enum ModifyVisualizationAgentError {
    ObjectNotJson,
    MissingKey,
    PromptNodeError,
}

impl fmt::Display for ModifyVisualizationAgentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingKey => write!(f, "missing_key"),
            Self::ObjectNotJson => write!(f, "object_not_json"),
            Self::PromptNodeError => write!(f, "prompt_node_error"),
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "name")]
#[serde(rename_all = "snake_case")]
pub enum ModifyVisualizationAction {
    FormatColumns {
        data_analyst_ticket: String,
    },
    StylizeColumns {
        data_analyst_ticket: String,
    },
    ConfigureCharts {
        data_analyst_ticket: String,
        chart_type: ChartType,
    },
    StylizeGlobalSettings {
        data_analyst_ticket: String,
    },
    CannotDo {
        data_analyst_ticket: String,
    },
}

impl ModifyVisualizationAction {
    pub fn get_data_analyst_ticket(&self) -> String {
        match self {
            ModifyVisualizationAction::FormatColumns {
                data_analyst_ticket,
                ..
            } => data_analyst_ticket.clone(),
            ModifyVisualizationAction::StylizeColumns {
                data_analyst_ticket,
                ..
            } => data_analyst_ticket.clone(),
            ModifyVisualizationAction::ConfigureCharts {
                data_analyst_ticket,
                ..
            } => data_analyst_ticket.clone(),
            ModifyVisualizationAction::StylizeGlobalSettings {
                data_analyst_ticket,
                ..
            } => data_analyst_ticket.clone(),
            ModifyVisualizationAction::CannotDo {
                data_analyst_ticket,
                ..
            } => data_analyst_ticket.clone(),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct ModifyVisalizationOrchestratorResponse {
    pub actions: Vec<ModifyVisualizationAction>,
}

pub async fn modify_visualization_agent(
    options: ModifyVisualizationAgentOptions,
) -> Result<Value, ErrorNode> {
    let start_time = Instant::now();

    send_message(
        "visualization_started".to_string(),
        "\n\n<buster-timestamp status='inProgress' id='e43b601f-3c6f-4520-b2cd-0b084d7a81b9' title='Building your visualization...' milliseconds=''></buster-timestamp>\n\n".to_string(),
        options.output_sender.clone(),
    )
    .await?;

    let previous_message_data_metadata_context = match &options.previous_message {
        Some(message) => message
            .get("data_metadata")
            .map(|v| v.to_string())
            .unwrap_or_default(),
        None => String::new(),
    };

    let json_chart_config_context = match &options.previous_message {
        Some(message) => message.get("chart_config").unwrap_or(&Value::Null),
        None => &Value::Null,
    };

    let previous_message_chart_config_context = match &options.previous_message {
        Some(message) => message
            .get("chart_config")
            .map(|v| v.to_string())
            .unwrap_or_default(),
        None => String::new(),
    };

    let final_thought = options.thought_process.as_ref().and_then(|thought| {
        let re = regex::Regex::new(r"\*\*\s*Final\s*Decision\s*\*\*\s*:").unwrap();
        re.find(thought)
            .map(|m| thought[m.end()..].trim().to_string())
    });

    // Run visualization orchestrator if input exists
    let visualization_actions = if let Some(input) = options.input {
        let orchestrator_settings = PromptNodeSettings {
            messages: vec![
                PromptNodeMessage {
                    role: "system".to_string(),
                    content: modify_visualization_system_prompt(),
                },
                PromptNodeMessage {
                    role: "user".to_string(),
                    content: modify_visualization_user_prompt(
                        if options.data_metadata.is_null() {
                            previous_message_data_metadata_context.clone()
                        } else {
                            options.data_metadata.to_string()
                        },
                        previous_message_chart_config_context.clone(),
                        previous_message_data_metadata_context.clone(),
                        input,
                        final_thought.clone().unwrap_or("".to_string()),
                    ),
                },
            ],
            prompt_name: "visualization_orchestrator".to_string(),
            json_schema: Some(modify_visualization_prompt_schema()),
            ..Default::default()
        };

        let orchestrator_response = match prompt_node(orchestrator_settings).await {
            Ok(obj) => obj,
            Err(e) => return Err(e),
        };

        let orchestrator_response: ModifyVisalizationOrchestratorResponse =
            match serde_json::from_value(orchestrator_response) {
                Ok(response) => response,
                Err(e) => {
                    return Err(ErrorNode::new(
                        ModifyVisualizationAgentError::PromptNodeError.to_string(),
                        e.to_string(),
                    ));
                }
            };

        Some(orchestrator_response.actions)
    } else {
        None
    };

    // Extract all the actions that we are expecting.  If they aren't there, just return None and they will be skipped or forced later.

    let (
        configure_charts_action,
        format_labels_action,
        stylize_global_settings_action,
        stylize_columns_action,
        cannot_do_action,
    ) = if let Some(visualization_actions) = &visualization_actions {
        let configure_charts_action = extract_action(&visualization_actions, |action| {
            matches!(action, ModifyVisualizationAction::ConfigureCharts { .. })
        });

        let format_labels_action = extract_action(&visualization_actions, |action| {
            matches!(action, ModifyVisualizationAction::FormatColumns { .. })
        });

        let stylize_global_settings_action = extract_action(&visualization_actions, |action| {
            matches!(
                action,
                ModifyVisualizationAction::StylizeGlobalSettings { .. }
            )
        });

        let stylize_columns_action = extract_action(&visualization_actions, |action| {
            matches!(action, ModifyVisualizationAction::StylizeColumns { .. })
        });

        let cannot_do_action = extract_action(&visualization_actions, |action| {
            matches!(action, ModifyVisualizationAction::CannotDo { .. })
        });

        (
            configure_charts_action,
            format_labels_action,
            stylize_global_settings_action,
            stylize_columns_action,
            cannot_do_action,
        )
    } else {
        (None, None, None, None, None)
    };

    // We need to get the chart type if its been configured.
    let chart_type = if let Some(configure_charts_action) = &configure_charts_action {
        match configure_charts_action {
            ModifyVisualizationAction::ConfigureCharts { chart_type, .. } => chart_type.clone(),
            _ => match json_chart_config_context.get("selectedChartType") {
                Some(Value::String(chart_type)) => ChartType::from_string(&chart_type),
                _ => ChartType::Table,
            },
        }
    } else {
        match json_chart_config_context.get("selectedChartType") {
            Some(Value::String(chart_type)) => ChartType::from_string(&chart_type),
            _ => ChartType::Table,
        }
    };

    // Check to see if we need to format labels.
    // This happens if the LLM decides to format labels or if the metadata has changed.
    let format_labels_future = if format_labels_action.is_some() || options.metadata_changed {
        // Extract the data analyst ticket from the format_labels_action or just feed the user message
        let format_labels_instruction = match format_labels_action {
            Some(ModifyVisualizationAction::FormatColumns {
                data_analyst_ticket,
            }) => data_analyst_ticket,
            _ => options.user_message.clone(),
        };

        let data_metadata = options.data_metadata.clone();
        let output_sender = options.output_sender.clone();
        let previous_chart_config = previous_message_chart_config_context.clone();
        let sql = options.sql.clone();

        Some(tokio::spawn(async move {
            // Single call to format_labels_agent with all columns
            let format_labels_options = FormatLabelsAgentOptions {
                format_label_instruction: format_labels_instruction,
                chart_config: previous_chart_config.clone(),
                sql_statement: sql.clone(),
                data_metadata: data_metadata.to_string(),
                output_sender,
            };

            format_labels_agent(format_labels_options).await
        }))
    } else {
        None
    };

    // Check to see if we need to configure charts.
    // This happens if the LLM decides to configure charts or if the metadata has changed.
    // Here, the LLM also decides which chart should be displayed.

    let configure_charts_future = if configure_charts_action.is_some() || options.metadata_changed {
        let configure_charts_instruction = match configure_charts_action {
            Some(ModifyVisualizationAction::ConfigureCharts {
                ref data_analyst_ticket,
                chart_type: _,
            }) => data_analyst_ticket.clone(),
            _ => final_thought
                .clone()
                .unwrap_or(options.user_message.clone()),
        };

        let build_charts_options = BuildChartsAgentOptions {
            configure_charts_instruction,
            chart_config_context: previous_message_chart_config_context.clone(),
            data_metadata: options.data_metadata.to_string(),
            output_sender: options.output_sender.clone(),
            sql: options.sql.clone(),
            user_message: options.user_message.clone(),
        };
        Some(tokio::spawn(async move {
            configure_charts_agent(build_charts_options).await
        }))
    } else {
        None
    };

    // Check to see if a global styling action is present.
    // We only run this if the user specifically asks for it.
    // Otherwise we just default to their global styling settings.

    let global_styling_future = if let Some(stylize_global_settings_action) =
        &stylize_global_settings_action
    {
        let global_styling_options = GlobalStylingAgentOptions {
            global_styling_instruction: stylize_global_settings_action.get_data_analyst_ticket(),
            chart_config: previous_message_chart_config_context.clone(),
            sql_statement: options.sql.clone(),
            data_metadata: options.data_metadata.to_string(),
        };

        Some(tokio::spawn(async move {
            global_styling_agent(global_styling_options).await
        }))
    } else {
        None
    };

    let stylize_columns_future =
        if stylize_columns_action.is_some() || chart_type == ChartType::Combo {
            let column_styling_instruction =
                if let Some(stylize_columns_action) = &stylize_columns_action {
                    stylize_columns_action.get_data_analyst_ticket()
                } else if let Some(configure_charts_action) = &configure_charts_action {
                    configure_charts_action.get_data_analyst_ticket()
                } else {
                    options.user_message.clone()
                };

            let stylize_columns_options = ColumnStylingAgentOptions {
                column_styling_instruction,
                chart_config: previous_message_chart_config_context.clone(),
                sql_statement: options.sql.clone(),
                data_metadata: options.data_metadata.to_string(),
            };

            Some(tokio::spawn(async move {
                column_styling_agent(stylize_columns_options).await
            }))
        } else {
            None
        };

    // Wait for all futures concurrently
    let (
        format_labels_result,
        configure_charts_result,
        mut global_styling_result,
        stylize_columns_result,
    ) = tokio::join!(
        async {
            if let Some(future) = format_labels_future {
                future.await.ok().and_then(|r| r.ok())
            } else {
                None
            }
        },
        async {
            if let Some(future) = configure_charts_future {
                future.await.ok().and_then(|r| r.ok())
            } else {
                None
            }
        },
        async {
            if let Some(future) = global_styling_future {
                future.await.ok().and_then(|r| r.ok())
            } else {
                None
            }
        },
        async {
            if let Some(future) = stylize_columns_future {
                future.await.ok().and_then(|r| r.ok())
            } else {
                None
            }
        }
    );

    let time_unit = match configure_charts_result.clone() {
        Some(mut result) => {
            // Try to get and remove from bar_line_chart first
            if let Some(Value::String(time_unit)) = result.bar_line_chart.as_object_mut().and_then(|obj| obj.remove("x_axis_time_unit")) {
                time_unit
            } else {
                // If not found in bar_line_chart, try combo_chart
                if let Some(Value::String(time_unit)) = result.combo_chart.as_object_mut().and_then(|obj| obj.remove("x_axis_time_unit")) {
                    time_unit
                } else {
                    String::new()
                }
            }
        },
        None => String::new(),
    };

    if !time_unit.is_empty() {
        global_styling_result = Some(json!({
            "xAxisTimeInterval": time_unit
        }));
    }

    // Transform format_labels_result into columnLabelFormats
    let column_label_formats = match format_labels_result {
        Some(result) => result,
        None => Value::Null,
    };

    let global_styling_result = match global_styling_result {
        Some(result) => result,
        None => Value::Null,
    };

    let stylize_columns_result = match stylize_columns_result {
        Some(result) => result,
        None => Value::Null,
    };

    let chart_configurations = match &configure_charts_result {
        Some(result) => match serde_json::to_value(result) {
            Ok(chart_configurations) => Some(chart_configurations),
            Err(e) => {
                return Err(ErrorNode::new(
                    ModifyVisualizationAgentError::PromptNodeError.to_string(),
                    e.to_string(),
                ));
            }
        },
        None => None,
    };

    let chart_configurations = build_chart_configurations(
        chart_type.clone(),
        chart_configurations.clone(),
        Some(json_chart_config_context.clone()),
        Some(column_label_formats.clone()),
    );

    let chart_configurations =
        push_global_styling_diffs(chart_configurations, global_styling_result.clone());

    let chart_configurations =
        push_column_styling_diffs(chart_configurations, stylize_columns_result.clone());

    let response = json!({
        "name": "modify_visualization",
        "modify_visualization_instruction": options.user_message,
        "modify_visualization_orchestrator": visualization_actions,
        "selected_visualization": chart_type.clone(),
        "chart_configurations": chart_configurations,
        "column_label_formats": column_label_formats,
    });

    let end_time = Instant::now();
    let duration = end_time.duration_since(start_time);

    let chart_type_response = if cannot_do_action.is_some() && configure_charts_result.is_none() {
        "Unable to build chart".to_string()
    } else {
        match chart_type {
            ChartType::Table => "Plotted data on a table".to_string(),
            _ => format!("Plotted data on a {} chart", chart_type.to_string()),
        }
    };

    send_message(
        "visualization_completed".to_string(),
        format!(
            "\n\n<buster-timestamp status='complete' id='e43b601f-3c6f-4520-b2cd-0b084d7a81b9' title='{}' milliseconds='{}'></buster-timestamp>\n\n",
            chart_type_response,
            duration.as_millis()
        ),
        options.output_sender.clone(),
    )
    .await?;

    Ok(response)
}

async fn send_message(
    name: String,
    value: String,
    output_sender: mpsc::Sender<Value>,
) -> Result<(), ErrorNode> {
    match output_sender
        .send(json!({
            "name": name,
            "value": value
        }))
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            return Err(ErrorNode::new(
                e.to_string(),
                "Failed to send message".to_string(),
            ));
        }
    }
}

fn extract_action<F>(
    actions: &Vec<ModifyVisualizationAction>,
    is_match: F,
) -> Option<ModifyVisualizationAction>
where
    F: Fn(&ModifyVisualizationAction) -> bool,
{
    actions.iter().find(|action| is_match(action)).cloned()
}

// The styling prompts should only generate diffs where changes need to be made.
// We need to push these diffs to the chart config.

fn push_global_styling_diffs(chart_config: Value, global_styling_diffs: Value) -> Value {
    let mut chart_config = chart_config;

    let axis_fields = vec![
        "scatterAxis",
        "pieChartAxis",
        "barAndLineAxis",
        "comboChartAxis",
        "columnSettings",
        "columnLabelFormats",
        "metricHeader",
        "metricColumnId",
        "metricSubHeader",
    ];

    if let Some(diffs) = global_styling_diffs.as_object() {
        for (key, value) in diffs {
            if !axis_fields.contains(&key.as_str()) {
                chart_config[key] = value.clone();
            }
        }
    }

    chart_config
}

// Column styling diffs are going to be in the columnLabelFormats Object.
// We need to iterate through each column and push the diffs to the chart config.

fn push_column_styling_diffs(chart_config: Value, column_styling_diffs: Value) -> Value {
    let mut chart_config = chart_config;

    // Ensure columnSettings exists
    if chart_config["columnSettings"].is_null() {
        chart_config["columnSettings"] = json!({});
    }

    if let Some(diffs) = column_styling_diffs.as_object() {
        for (column_name, column_props) in diffs {
            if let Some(props) = column_props.as_object() {
                // Create new column if it doesn't exist
                if !chart_config["columnSettings"].get(column_name).is_some() {
                    chart_config["columnSettings"][column_name] = json!({});
                }

                for (prop_key, prop_value) in props {
                    chart_config["columnSettings"][column_name][prop_key] = prop_value.clone();
                }
            }
        }
    }

    chart_config
}

// Wew need to piece everything together and build the chart_configurations.
// We also need to maintain context from the previous chart config.
// We will diff this against the previous chart config to get the diffs.

fn build_chart_configurations(
    chart_type: ChartType,
    chart_config: Option<Value>,
    previous_chart_config: Option<Value>,
    column_label_formats: Option<Value>,
) -> Value {
    let mut chart_configurations = json!({
        "selectedChartType": "",
        "selectedView": "",
        "barAndLineAxis": {},
        "scatterAxis": {},
        "comboChartAxis": {},
        "pieChartAxis": {},
        "columnLabelFormats": {},
        "columnSettings": {},
    });

    chart_configurations["selectedChartType"] = json!(chart_type);
    chart_configurations["selectedView"] = json!(if chart_type == ChartType::Table {
        "table"
    } else {
        "chart"
    });

    // Safely access chart_config fields if they exist
    if let Some(config) = chart_config {
        if !config.is_null() {
            chart_configurations["barAndLineAxis"] =
                config.get("barLineChart").unwrap_or(&json!({})).clone();
            chart_configurations["scatterAxis"] =
                config.get("scatterChart").unwrap_or(&json!({})).clone();
            chart_configurations["comboChartAxis"] =
                config.get("comboChart").unwrap_or(&json!({})).clone();
            chart_configurations["pieChartAxis"] =
                config.get("pieChart").unwrap_or(&json!({})).clone();

            // Flatten metricChart contents into root
            if let Some(metric_chart) = config.get("metricChart") {
                if let Some(metric_obj) = metric_chart.as_object() {
                    for (key, value) in metric_obj {
                        chart_configurations[key] = value.clone();
                    }
                }
            }
        }
    }

    if let Some(column_label_formats) = column_label_formats {
        if !column_label_formats.is_null() {
            chart_configurations["columnLabelFormats"] = column_label_formats;
        }
    }

    if let Some(previous_chart_config) = previous_chart_config {
        if !previous_chart_config.is_null() {
            chart_configurations =
                diff_against_previous_chart_config(chart_configurations, previous_chart_config);
        }
    }

    chart_configurations
}

fn diff_against_previous_chart_config(chart_config: Value, previous_chart_config: Value) -> Value {
    let mut result = previous_chart_config.clone();

    // Fields that should be completely replaced (not carried over)
    let replace_fields = vec![
        "barAndLineAxis",
        "scatterAxis",
        "comboChartAxis",
        "pieChartAxis",
        "columnLabelFormats",
        "metricHeader",
        "metricColumnId",
        "metricSubHeader",
    ];

    // First, preserve all fields from previous config
    if let Some(current) = chart_config.as_object() {
        for (key, value) in current {
            // Always update these fields from current config
            if replace_fields.contains(&key.as_str()) {
                result[key] = value.clone();
                continue;
            }

            // For other fields, only update if they contain non-empty values
            match value {
                Value::Object(obj) if !obj.is_empty() => result[key] = value.clone(),
                Value::Array(arr) if !arr.is_empty() => result[key] = value.clone(),
                Value::Null => continue,          // Skip null values
                _ => result[key] = value.clone(), // Update primitives
            }
        }
    }
    // Special handling for columnSettings - merge at property level
    if let Some(current_settings) = chart_config.get("columnSettings") {
        if let Some(current_settings) = current_settings.as_object() {
            if !current_settings.is_empty() {
                if let Some(result_settings) = result
                    .get_mut("columnSettings")
                    .and_then(Value::as_object_mut)
                {
                    for (column, settings) in current_settings {
                        if let Some(obj) = settings.as_object() {
                            if !obj.is_empty() {
                                result_settings.insert(column.clone(), settings.clone());
                            }
                        }
                    }
                }
            }
        }
    }

    result
}
