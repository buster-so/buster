use anyhow::{anyhow, Error};
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use std::{fmt, time::Instant};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tokio::{sync::mpsc, task::JoinHandle};
use uuid::Uuid;

use crate::{
    database::{
        lib::get_pg_pool,
        models::{DataSource, Dataset, DatasetColumn, SqlEvaluation},
        schema::sql_evaluations,
    },
    routes::ws::{
        threads_and_messages::threads_router::{ThreadEvent, ThreadRoute},
        ws::{WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::send_ws_message,
    },
    utils::{
        agent_builder::nodes::{
            error_node::ErrorNode,
            merge_node::{merge_node, MergeNodeSettings},
            prompt_node::{prompt_node, PromptNodeMessage, PromptNodeSettings},
        },
        agents::{
            failed_to_fix_sql_agent::{failed_to_fix_sql_agent, FailedToFixSqlAgentOptions},
            metadata_prompts_agent::{metadata_prompts_agent, MetadataPromptsAgentOptions},
            multiple_datasets_response_agent::handle_multiple_datasets_agent,
            sql_evaluation_agent::{sql_evaluation_agent, SqlEvaluationAgentOptions},
        },
        clients::typesense::StoredValueDocument,
        prompts::analyst_chat_prompts::orchestrator_prompt::{
            orchestrator_prompt_schema, orchestrator_system_prompt,
        },
        stored_values::search::{search_values_for_dataset, StoredValue},
        user::user_info::get_user_organization_id,
    },
};

use super::{
    custom_response_agent::{custom_response_agent, CustomResponseAgentOptions},
    generate_sql_agent::{generate_sql_agent, GenerateSqlAgentOptions},
    master_response_agent::{master_response_agent, MasterResponseAgentOptions},
    modify_visualization_agent::{modify_visualization_agent, ModifyVisualizationAgentOptions},
    multiple_datasets_response_agent::MultipleDatasetAgentOptions,
};

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct RelevantTerm {
    pub id: Uuid,
    pub name: String,
    pub definition: String,
    pub sql_snippet: Option<String>,
    pub dataset_id: Uuid,
}

#[derive(Debug, Clone)]
pub struct DatasetWithMetadata {
    pub dataset: Dataset,
    pub columns: Vec<DatasetColumn>,
    pub data_source: DataSource,
    pub dataset_ddl: String,
}

impl DatasetWithMetadata {
    pub fn get_column_name(&self, column_id: &Uuid) -> Option<String> {
        self.columns
            .iter()
            .find(|c| c.id == *column_id)
            .map(|c| c.name.clone())
    }
}

#[derive(Clone)]
pub struct DataAnalystAgentOptions {
    pub input: String,
    pub message_history: Vec<Value>,
    pub output_sender: mpsc::Sender<Value>,
    pub datasets: Vec<DatasetWithMetadata>,
    pub terms: Vec<RelevantTerm>,
    pub relevant_values: Vec<StoredValue>,
    pub thread_id: Uuid,
    pub message_id: Uuid,
    pub user_id: Uuid,
}

pub enum DataAnalystAgentError {
    ObjectNotJson,
    MissingKey,
    PromptNodeError,
    NoResults,
    GenericError,
}

impl fmt::Display for DataAnalystAgentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingKey => write!(f, "missing_key"),
            Self::ObjectNotJson => write!(f, "object_not_json"),
            Self::PromptNodeError => write!(f, "prompt_node_error"),
            Self::NoResults => write!(f, "no_results"),
            Self::GenericError => write!(f, "generic_error"),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Thoughts {
    pub title: String,
    pub thoughts: Vec<Thought>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Thought {
    #[serde(rename = "type")]
    pub type_: String,
    pub title: String,
    pub content: Option<String>,
    pub code: Option<String>,
    pub error: Option<String>,
}

pub async fn data_analyst_agent(options: DataAnalystAgentOptions) -> Result<Value, ErrorNode> {
    let start_time = Instant::now();

    let mut thoughts = Thoughts {
        title: "Understanding Your Request".to_string(),
        thoughts: vec![],
    };

    send_message(
        "thought".to_string(),
        serde_json::to_value(&thoughts).unwrap(),
        options.output_sender.clone(),
    )
    .await?;

    let orchestrator_prompt_settings = PromptNodeSettings {
        messages: create_orchestrator_messages(options.input.clone(), &options.message_history),
        json_schema: Some(orchestrator_prompt_schema()),
        prompt_name: "orchestrator".to_string(),
        ..Default::default()
    };

    let orchestrator_response = match prompt_node(orchestrator_prompt_settings).await {
        Ok(Value::Object(obj)) => obj,
        Ok(_) => {
            return Err(ErrorNode::new(
                DataAnalystAgentError::ObjectNotJson.to_string(),
                "Orchestrator response is not a JSON object".to_string(),
            ));
        }
        Err(e) => {
            return Err(e);
        }
    };

    let actions = match orchestrator_response.get("actions") {
        Some(Value::Array(actions)) => actions,
        _ => {
            return Err(ErrorNode::new(
                DataAnalystAgentError::MissingKey.to_string(),
                "Orchestrator response is missing 'actions'".to_string(),
            ));
        }
    };

    if actions.is_empty() {
        let duration = Instant::now().duration_since(start_time);

        let main_title = format!("Thought for {} seconds", duration.as_secs());

        thoughts.title = main_title;

        send_message(
            "thought_finished".to_string(),
            serde_json::to_value(&thoughts).unwrap(),
            options.output_sender.clone(),
        )
        .await?;

        let custom_response_options = CustomResponseAgentOptions {
            input: options.input.clone(),
            datasets: String::new(),
            orchestrator_output: String::new(),
            output_sender: options.output_sender.clone(),
        };

        let custome_response = match custom_response_agent(custom_response_options).await {
            Ok(response) => response,
            Err(e) => {
                return Err(e);
            }
        };

        let response = match custome_response.get("response") {
            Some(response) => response,
            _ => {
                return Err(ErrorNode::new(
                    DataAnalystAgentError::MissingKey.to_string(),
                    "Custom response is missing 'response'".to_string(),
                ));
            }
        };

        let mut outputs = json!({
            "input": options.input,
            "action_decisions": orchestrator_response,
            "dataset_selection": Value::Null,
            "first_part_of_response": Value::Null,
            "data_metadata": Value::Null,
            "chart_generated": Value::Null,
            "chart_requirements": Value::Null,
            "chart_config": Value::Null,
            "sql": Value::Null,
            "title": Value::Null,
            "description": Value::Null,
            "time_frame": Value::Null,
            "dataset_id": Value::Null,
            "current_chart_config": Value::Null,
            "thoughts": thoughts,
            "steps": Value::Array(vec![]),
            "terms": serde_json::to_value(&options.terms).unwrap(),
        });

        if let Some(previous_message) = get_previous_message(&options.message_history) {
            merge_with_previous_message(&mut outputs, &previous_message);
        }

        outputs["master_response"] = response.clone();
        outputs["messages"] = Value::Array(vec![response.clone()]);
        outputs["created_at"] = Value::String(Utc::now().to_string());

        match send_message(
            "data_analyst_agent_finished".to_string(),
            Value::String("[DONE]".to_string()),
            options.output_sender.clone(),
        )
        .await
        {
            Ok(_) => (),
            Err(e) => {
                return Err(e);
            }
        }

        return Ok(outputs);
    };

    let orchestrator_thoughts = assemble_orchestrator_thoughts(&actions);

    thoughts.thoughts = orchestrator_thoughts;

    if !options.terms.is_empty() {
        let terms_string = options
            .terms
            .iter()
            .map(|term| format!("{}: {}", term.name, term.definition))
            .collect::<Vec<String>>()
            .join("\n\n");

        thoughts.thoughts.push(Thought {
            type_: "thoughtBlock".to_string(),
            title: "Found relevant terms".to_string(),
            content: Some(terms_string),
            code: None,
            error: None,
        });
    }

    send_message(
        "thought".to_string(),
        serde_json::to_value(&thoughts).unwrap(),
        options.output_sender.clone(),
    )
    .await?;

    let mut merge_list: Vec<JoinHandle<Result<Value, ErrorNode>>> = vec![];

    let generate_sql_action = get_generate_sql_action(&actions);
    let modify_visualization_action = get_modify_visualization_action(&actions);
    let chart_requested_but_not_compatible_action =
        get_chart_requested_but_not_compatible_action(&actions);
    let explain_something_general_action = get_explain_something_general_action(&actions);
    let explain_sql_data_action = get_explain_sql_data_action(&actions);
    let cannot_do_requested_action = get_cannot_do_requested_action(&actions);

    if let Some(chart_requested_but_not_compatible_action) =
        chart_requested_but_not_compatible_action
    {
        let data_analyst_ticket =
            match chart_requested_but_not_compatible_action.get("data_analyst_ticket") {
                Some(Value::String(ticket)) => ticket,
                _ => {
                    return Err(ErrorNode::new(
                DataAnalystAgentError::MissingKey.to_string(),
                "Chart requested but not compatible action is missing 'data_analyst_ticket'"
                    .to_string(),
            ));
                }
            };

        let datasets_string = options
            .datasets
            .iter()
            .map(|dataset| dataset.dataset_ddl.clone())
            .collect::<Vec<String>>()
            .join("\n\n");

        let custom_response_options = CustomResponseAgentOptions {
            input: options.input.clone(),
            datasets: datasets_string,
            orchestrator_output: data_analyst_ticket.to_string(),
            output_sender: options.output_sender.clone(),
        };

        let custome_response = match custom_response_agent(custom_response_options).await {
            Ok(response) => response,
            Err(e) => {
                return Err(e);
            }
        };

        let response = match custome_response.get("response") {
            Some(response) => response,
            _ => {
                return Err(ErrorNode::new(
                    DataAnalystAgentError::MissingKey.to_string(),
                    "Custom response is missing 'response'".to_string(),
                ));
            }
        };

        // Create new orchestrator response with only chart_requested_but_not_compatible action
        let orchestrator_response = json!({
            "actions": actions.iter()
                .filter(|action| {
                    action.get("action")
                        .and_then(|a| a.as_str())
                        .map_or(false, |a| a == "chart_requested_but_not_compatible")
                })
                .collect::<Vec<_>>()
        });

        let duration = Instant::now().duration_since(start_time);

        let main_title = format!("Thought for {} seconds", duration.as_secs());

        thoughts.title = main_title;

        send_message(
            "thought_finished".to_string(),
            serde_json::to_value(&thoughts).unwrap(),
            options.output_sender.clone(),
        )
        .await?;

        let mut outputs = json!({
            "input": options.input,
            "action_decisions": orchestrator_response,
            "dataset_selection": Value::Null,
            "first_part_of_response": Value::Null,
            "data_metadata": Value::Null,
            "chart_generated": Value::Null,
            "chart_requirements": Value::Null,
            "chart_config": Value::Null,
            "sql": Value::Null,
            "title": Value::Null,
            "description": Value::Null,
            "time_frame": Value::Null,
            "dataset_id": Value::Null,
            "current_chart_config": Value::Null,
            "thoughts": thoughts,
            "steps": Value::Array(vec![]),
            "terms": serde_json::to_value(&options.terms).unwrap(),
        });

        if let Some(previous_message) = get_previous_message(&options.message_history) {
            merge_with_previous_message(&mut outputs, &previous_message);
        }

        outputs["master_response"] = response.clone();
        outputs["messages"] = Value::Array(vec![response.clone()]);
        outputs["created_at"] = Value::String(Utc::now().to_string());

        match send_message(
            "data_analyst_agent_finished".to_string(),
            Value::String("[DONE]".to_string()),
            options.output_sender.clone(),
        )
        .await
        {
            Ok(_) => (),
            Err(e) => {
                return Err(e);
            }
        }

        return Ok(outputs);
    }
    if explain_something_general_action.is_some()
        || cannot_do_requested_action.is_some()
        || explain_sql_data_action.is_some()
    {
        if modify_visualization_action.is_none() && generate_sql_action.is_none() {
            let explain_something_general_prompt = match explain_something_general_action {
                Some(action) => match action.get("data_analyst_ticket") {
                    Some(Value::String(prompt)) => prompt.clone(),
                    Some(_) => String::new(),
                    None => String::new(),
                },
                None => String::new(),
            };

            let cannot_do_requested_prompt = match cannot_do_requested_action {
                Some(action) => match action.get("data_analyst_ticket") {
                    Some(Value::String(prompt)) => prompt.clone(),
                    Some(_) => String::new(),
                    None => String::new(),
                },
                None => String::new(),
            };

            let explain_sql_data_prompt = match explain_sql_data_action {
                Some(action) => match action.get("data_analyst_ticket") {
                    Some(Value::String(prompt)) => prompt.clone(),
                    Some(_) => String::new(),
                    None => String::new(),
                },
                None => String::new(),
            };

            let prompt = format!(
                "{}\n\n{}\n\n{}",
                cannot_do_requested_prompt,
                explain_something_general_prompt,
                explain_sql_data_prompt
            );

            let datasets_string = options
                .datasets
                .iter()
                .map(|dataset| dataset.dataset_ddl.clone())
                .collect::<Vec<String>>()
                .join("\n\n");

            let custom_response_options = CustomResponseAgentOptions {
                input: options.input.clone(),
                datasets: datasets_string,
                orchestrator_output: prompt,
                output_sender: options.output_sender.clone(),
            };

            let custome_response = match custom_response_agent(custom_response_options).await {
                Ok(response) => response,
                Err(e) => {
                    return Err(e);
                }
            };

            let response = match custome_response.get("response") {
                Some(response) => response,
                _ => {
                    return Err(ErrorNode::new(
                        DataAnalystAgentError::MissingKey.to_string(),
                        "Custom response is missing 'response'".to_string(),
                    ));
                }
            };

            let duration = Instant::now().duration_since(start_time);

            let main_title = format!("Thought for {} seconds", duration.as_secs());

            thoughts.title = main_title;

            send_message(
                "thought_finished".to_string(),
                serde_json::to_value(&thoughts).unwrap(),
                options.output_sender.clone(),
            )
            .await?;

            let mut outputs = json!({
                "input": options.input,
                "action_decisions": orchestrator_response,
                "dataset_selection": Value::Null,
                "first_part_of_response": Value::Null,
                "data_metadata": Value::Null,
                "chart_generated": Value::Null,
                "chart_requirements": Value::Null,
                "chart_config": Value::Null,
                "sql": Value::Null,
                "title": Value::Null,
                "description": Value::Null,
                "time_frame": Value::Null,
                "dataset_id": Value::Null,
                "dataset_name": Value::Null,
                "current_chart_config": Value::Null,
                "thoughts": thoughts,
                "steps": Value::Array(vec![]),
                "terms": serde_json::to_value(&options.terms).unwrap(),
            });

            if let Some(previous_message) = get_previous_message(&options.message_history) {
                merge_with_previous_message(&mut outputs, &previous_message);
            }

            outputs["master_response"] = response.clone();
            outputs["messages"] = Value::Array(vec![response.clone()]);
            outputs["created_at"] = Value::String(Utc::now().to_string());

            match send_message(
                "data_analyst_agent_finished".to_string(),
                Value::String("[DONE]".to_string()),
                options.output_sender.clone(),
            )
            .await
            {
                Ok(_) => (),
                Err(e) => {
                    return Err(e);
                }
            }

            return Ok(outputs);
        }
    }

    // Get generate_sql action if it exists
    if let Some(generate_sql_action) = &generate_sql_action {
        let organization_id = match get_user_organization_id(&options.user_id).await {
            Ok(id) => id,
            Err(e) => {
                return Err(ErrorNode::new(
                    DataAnalystAgentError::GenericError.to_string(),
                    format!("Error getting organization id: {}", e),
                ));
            }
        };

        let generate_sql_options = GenerateSqlAgentOptions {
            sql_gen_action: generate_sql_action.clone(),
            datasets: options.datasets.clone(),
            thoughts: thoughts.clone(),
            terms: options.terms.clone(),
            output_sender: options.output_sender.clone(),
            message_history: options.message_history.clone(),
            start_time,
            organization_id,
            relevant_values: vec![], // We'll get these in generate_sql_agent
        };

        let future = tokio::spawn(async move { generate_sql_agent(generate_sql_options).await });
        merge_list.push(future);
    }

    // Check for chart_requested_but_not_compatible action
    for action in actions {
        if let Some(Value::String(action_name)) = action.get("name") {
            if action_name == "chart_requested_but_not_compatible" {
                let prompt = match action.get("data_analyst_ticket") {
                    Some(Value::String(prompt)) => prompt.clone(),
                    Some(_) => String::new(),
                    None => String::new(),
                };

                let datasets_string = options
                    .datasets
                    .iter()
                    .map(|dataset| dataset.dataset_ddl.clone())
                    .collect::<Vec<String>>()
                    .join("\n\n");

                let custom_response_options = CustomResponseAgentOptions {
                    input: options.input.clone(),
                    datasets: datasets_string,
                    orchestrator_output: prompt,
                    output_sender: options.output_sender.clone(),
                };

                let custome_response = match custom_response_agent(custom_response_options).await {
                    Ok(response) => response,
                    Err(e) => {
                        return Err(e);
                    }
                };

                let response = match custome_response.get("response") {
                    Some(response) => response,
                    _ => {
                        return Err(ErrorNode::new(
                            DataAnalystAgentError::MissingKey.to_string(),
                            "Custom response is missing 'response'".to_string(),
                        ));
                    }
                };

                let duration = Instant::now().duration_since(start_time);

                let main_title = format!("Thought for {} seconds", duration.as_secs());

                thoughts.title = main_title;

                send_message(
                    "thought_finished".to_string(),
                    serde_json::to_value(&thoughts).unwrap(),
                    options.output_sender.clone(),
                )
                .await?;

                let mut outputs = json!({
                    "input": options.input,
                    "action_decisions": orchestrator_response,
                    "dataset_selection": Value::Null,
                    "first_part_of_response": Value::Null,
                    "data_metadata": Value::Null,
                    "chart_generated": Value::Null,
                    "chart_requirements": Value::Null,
                    "chart_config": Value::Null,
                    "sql": Value::Null,
                    "title": Value::Null,
                    "description": Value::Null,
                    "time_frame": Value::Null,
                    "dataset_id": Value::Null,
                    "dataset_name": Value::Null,
                    "current_chart_config": Value::Null,
                    "thoughts": thoughts,
                    "steps": Value::Array(vec![]),
                    "terms": serde_json::to_value(&options.terms).unwrap(),
                });

                if let Some(previous_message) = get_previous_message(&options.message_history) {
                    merge_with_previous_message(&mut outputs, &previous_message);
                }

                outputs["master_response"] = response.clone();
                outputs["messages"] = Value::Array(vec![response.clone()]);
                outputs["created_at"] = Value::String(Utc::now().to_string());

                match send_message(
                    "data_analyst_agent_finished".to_string(),
                    Value::String("[DONE]".to_string()),
                    options.output_sender.clone(),
                )
                .await
                {
                    Ok(_) => (),
                    Err(e) => {
                        return Err(e);
                    }
                }

                return Ok(outputs);
            }
        }
    }

    let sql_gen_merge_node_settings = MergeNodeSettings::new(merge_list);

    // Wait for all the futures during SQL generation to complete and get the results
    let sql_gen_merge_results = match merge_node(sql_gen_merge_node_settings).await {
        Ok(values) => values,
        Err(e) => {
            return Err(e);
        }
    };

    let mut sql_gen_results = json!({});

    for value in sql_gen_merge_results {
        match value.get("name") {
            Some(Value::String(name)) => {
                if name == "generate_sql" {
                    sql_gen_results = value;
                }
            }
            _ => {}
        }
    }

    // Only check for results if generate_sql action was present
    if generate_sql_action.is_some() {
        if let Some(error) = sql_gen_results.get("error") {
            let datasets_string = options
                .datasets
                .iter()
                .map(|dataset| dataset.dataset_ddl.clone())
                .collect::<Vec<String>>()
                .join("\n\n");

            if error == "multiple_datasets_selected" || error == "no_dataset_selected" {
                let dataset_selector_output = match sql_gen_results.get("dataset_selection") {
                    Some(obj) => obj,
                    _ => {
                        return Err(ErrorNode::new(
                            DataAnalystAgentError::MissingKey.to_string(),
                            "No dataset selector output found".to_string(),
                        ));
                    }
                };

                let multiple_datasets_options = MultipleDatasetAgentOptions {
                    input: options.input.clone(),
                    datasets: datasets_string,
                    output_sender: options.output_sender.clone(),
                    dataset_selector_output: dataset_selector_output.clone(),
                };

                let response = match handle_multiple_datasets_agent(multiple_datasets_options).await
                {
                    Ok(response) => response,
                    Err(e) => {
                        return Err(e);
                    }
                };

                let thoughts = match sql_gen_results.get("thoughts") {
                    Some(thoughts) => serde_json::from_value(thoughts.clone()).unwrap(),
                    _ => thoughts,
                };

                let mut outputs = json!({
                    "input": options.input,
                    "action_decisions": orchestrator_response,
                    "dataset_selection": dataset_selector_output,
                    "first_part_of_response": Value::Null,
                    "data_metadata": Value::Null,
                    "chart_generated": Value::Null,
                    "chart_requirements": Value::Null,
                    "chart_config": Value::Null,
                    "sql": Value::Null,
                    "title": Value::Null,
                    "description": Value::Null,
                    "time_frame": Value::Null,
                    "dataset_id": Value::Null,
                    "dataset_name": Value::Null,
                    "current_chart_config": Value::Null,
                    "thoughts": thoughts,
                    "steps": Value::Array(vec![]),
                    "terms": serde_json::to_value(&options.terms).unwrap(),
                });

                if let Some(previous_message) = get_previous_message(&options.message_history) {
                    merge_with_previous_message(&mut outputs, &previous_message);
                }

                let master_response = match response.get("response") {
                    Some(response) => response,
                    _ => {
                        return Err(ErrorNode::new(
                            DataAnalystAgentError::MissingKey.to_string(),
                            "Multiple datasets response is missing 'response'".to_string(),
                        ));
                    }
                };

                outputs["master_response"] = master_response.clone();
                outputs["messages"] = Value::Array(vec![master_response.clone()]);
                outputs["created_at"] = Value::String(Utc::now().to_string());

                match send_message(
                    "data_analyst_agent_finished".to_string(),
                    Value::String("[DONE]".to_string()),
                    options.output_sender.clone(),
                )
                .await
                {
                    Ok(_) => (),
                    Err(e) => {
                        return Err(e);
                    }
                }

                return Ok(outputs);
            }

            if !error.is_null() {
                let dataset_selector_output = match sql_gen_results.get("dataset_selection") {
                    Some(obj) => obj,
                    _ => {
                        return Err(ErrorNode::new(
                            DataAnalystAgentError::MissingKey.to_string(),
                            "No dataset selector output found".to_string(),
                        ));
                    }
                };

                let thoughts = match sql_gen_results.get("thoughts") {
                    Some(thoughts) => serde_json::from_value(thoughts.clone()).unwrap(),
                    _ => thoughts,
                };

                let mut outputs = json!({
                    "input": options.input,
                    "action_decisions": orchestrator_response,
                    "dataset_selection": dataset_selector_output,
                    "first_part_of_response": Value::Null,
                    "data_metadata": Value::Null,
                    "chart_generated": Value::Null,
                    "chart_requirements": Value::Null,
                    "chart_config": Value::Null,
                    "sql": Value::Null,
                    "title": Value::Null,
                    "description": Value::Null,
                    "time_frame": Value::Null,
                    "dataset_id": Value::Null,
                    "dataset_name": Value::Null,
                    "current_chart_config": Value::Null,
                    "thoughts": thoughts,
                    "steps": Value::Array(vec![]),
                    "terms": serde_json::to_value(&options.terms).unwrap(),
                    "error": error,
                });

                if let Some(previous_message) = get_previous_message(&options.message_history) {
                    merge_with_previous_message(&mut outputs, &previous_message);
                }

                let failed_to_fix_sql_options = FailedToFixSqlAgentOptions {
                    input: options.input.clone(),
                    output_sender: options.output_sender.clone(),
                    outputs: outputs.clone(),
                    message_history: options.message_history.clone(),
                };

                let could_not_fix_sql_response =
                    match failed_to_fix_sql_agent(failed_to_fix_sql_options).await {
                        Ok(response) => response,
                        Err(e) => {
                            return Err(e);
                        }
                    };

                outputs["master_response"] = could_not_fix_sql_response.clone();
                outputs["messages"] = Value::Array(vec![could_not_fix_sql_response.clone()]);
                outputs["created_at"] = Value::String(Utc::now().to_string());

                match send_message(
                    "data_analyst_agent_finished".to_string(),
                    Value::String("[DONE]".to_string()),
                    options.output_sender.clone(),
                )
                .await
                {
                    Ok(_) => (),
                    Err(e) => {
                        return Err(e);
                    }
                }

                return Ok(outputs);
            }

            if let Some(sql) = sql_gen_results.get("sql") {
                if sql.is_null() {
                    if let Some(sql_gen_result) = sql_gen_results.get("sql_gen_result") {
                        let dataset_selector_output = match sql_gen_results.get("dataset_selection")
                        {
                            Some(obj) => obj,
                            _ => {
                                return Err(ErrorNode::new(
                                    DataAnalystAgentError::MissingKey.to_string(),
                                    "No dataset selector output found".to_string(),
                                ));
                            }
                        };

                        let thoughts = match sql_gen_results.get("thoughts") {
                            Some(thoughts) => serde_json::from_value(thoughts.clone()).unwrap(),
                            _ => thoughts,
                        };

                        let mut outputs = json!({
                            "input": options.input,
                            "action_decisions": orchestrator_response,
                            "dataset_selection": dataset_selector_output,
                            "first_part_of_response": sql_gen_result,
                            "data_metadata": Value::Null,
                            "chart_generated": Value::Null,
                            "chart_requirements": Value::Null,
                            "chart_config": Value::Null,
                            "sql": Value::Null,
                            "title": Value::Null,
                            "description": Value::Null,
                            "time_frame": Value::Null,
                            "dataset_id": Value::Null,
                            "dataset_name": Value::Null,
                            "current_chart_config": Value::Null,
                            "thoughts": thoughts,
                            "steps": Value::Array(vec![]),
                            "terms": serde_json::to_value(&options.terms).unwrap(),
                            "error": error,
                        });

                        if let Some(previous_message) =
                            get_previous_message(&options.message_history)
                        {
                            merge_with_previous_message(&mut outputs, &previous_message);
                        }

                        match send_message(
                            "custom_response".to_string(),
                            Value::String(sql_gen_result.to_string()),
                            options.output_sender.clone(),
                        )
                        .await
                        {
                            Ok(_) => (),
                            Err(e) => {
                                return Err(e);
                            }
                        }

                        outputs["master_response"] = sql_gen_result.clone();
                        outputs["messages"] = Value::Array(vec![sql_gen_result.clone()]);
                        outputs["created_at"] = Value::String(Utc::now().to_string());

                        match send_message(
                            "data_analyst_agent_finished".to_string(),
                            Value::String("[DONE]".to_string()),
                            options.output_sender.clone(),
                        )
                        .await
                        {
                            Ok(_) => (),
                            Err(e) => {
                                return Err(e);
                            }
                        }

                        return Ok(outputs);
                    }
                }
            }
        }
    }

    let sql_thoughts = match sql_gen_results.get("sql_thoughts") {
        Some(Value::String(thoughts)) => thoughts.clone(),
        _ => String::new(),
    };

    let metadata_prompt_future = if generate_sql_action.is_some() {
        if let Some(sql) = get_sql(&sql_gen_results) {
            let metadata_options = MetadataPromptsAgentOptions {
                user_message: options.input.clone(),
                sql: sql.clone(),
                thoughts: sql_thoughts.clone(),
                output_sender: options.output_sender.clone(),
            };

            Some(tokio::spawn(async move {
                metadata_prompts_agent(metadata_options).await
            }))
        } else {
            None
        }
    } else {
        None
    };

    let data_analyst_ticket = match sql_gen_results.get("data_analyst_ticket") {
        Some(Value::String(data_analyst_ticket)) => Some(data_analyst_ticket.clone()),
        _ => None,
    };

    let sql_evaluation_id = if let (Some(sql), Some(_)) =
        (get_sql(&sql_gen_results), data_analyst_ticket)
    {
        let output_sender = options.output_sender.clone();
        let datasets_string = options
            .datasets
            .iter()
            .map(|dataset| dataset.dataset_ddl.clone())
            .collect::<Vec<String>>()
            .join("\n\n");

        let sql_evaluation_options = SqlEvaluationAgentOptions {
            request: options.input.clone(),
            sql: sql.clone(),
            output_sender: output_sender.clone(),
            datasets: datasets_string,
        };

        let sql_evaluation_id = Uuid::new_v4();
        let message_id = options.message_id.clone();
        let thread_id = options.thread_id.clone();

        tokio::spawn(async move {
            let sql_evaluation = match sql_evaluation_agent(sql_evaluation_options).await {
                Ok(sql_evaluation) => sql_evaluation,
                Err(e) => {
                    return Err(anyhow!("Error evaluating SQL: {}", e.to_string()));
                }
            };

            // Write to the database
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    return Err(anyhow!(
                        "Error getting connection from pool: {}",
                        e.to_string()
                    ));
                }
            };

            let sql_evaluation = SqlEvaluation {
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted_at: None,
                id: sql_evaluation_id,
                evaluation_obj: serde_json::to_value(sql_evaluation.evaluation_obj).unwrap(),
                evaluation_summary: sql_evaluation.evaluation_summary,
                score: sql_evaluation.score,
            };

            match insert_into(sql_evaluations::table)
                .values(&sql_evaluation)
                .execute(&mut conn)
                .await
            {
                Ok(_) => (),
                Err(e) => {
                    return Err(anyhow!(
                        "Error inserting SQL evaluation into database: {}",
                        e.to_string()
                    ));
                }
            };

            let subscription: String = format!("thread:{}", options.thread_id.clone());

            match send_sql_evaluation_to_sub(&subscription, sql_evaluation, message_id, thread_id)
                .await
            {
                Ok(_) => (),
                Err(e) => {
                    return Err(anyhow!(
                        "Error sending SQL evaluation to subscription: {}",
                        e.to_string()
                    ));
                }
            };

            Ok(())
        });

        Some(sql_evaluation_id)
    } else {
        None
    };

    let previous_message = get_previous_message(&options.message_history);

    // Conditional: Did metadata change or no metadadata?
    let metadata_changed = if generate_sql_action.is_some() {
        match &previous_message {
            Some(prev_message) => check_metadata_changed(prev_message, &sql_gen_results),
            None => true,
        }
    } else {
        false
    };

    let sql = match get_sql(&sql_gen_results) {
        Some(sql) => sql,
        None => match &previous_message {
            Some(prev_message) => match prev_message.get("sql") {
                Some(Value::String(sql)) => sql.clone(),
                _ => {
                    return Err(ErrorNode::new(
                        DataAnalystAgentError::MissingKey.to_string(),
                        "No SQL found".to_string(),
                    ))
                }
            },
            None => {
                return Err(ErrorNode::new(
                    DataAnalystAgentError::MissingKey.to_string(),
                    "No SQL found".to_string(),
                ))
            }
        },
    };

    // If metadata changed, run the visualization agent.
    let modify_visualization_results = if metadata_changed {
        let request = if let Some(modify_visualization_action) = modify_visualization_action {
            match modify_visualization_action.get("data_analyst_ticket") {
                Some(Value::String(request)) => request.clone(),
                _ => options.input.clone(),
            }
        } else {
            options.input.clone()
        };

        let data_metadata = match get_data_metadata(&sql_gen_results) {
            Some(data_metadata) => data_metadata,
            None => match &previous_message {
                Some(prev_msg) => match prev_msg.get("data_metadata") {
                    Some(data_metadata) => data_metadata.clone(),
                    None => Value::Null,
                },
                None => Value::Null,
            },
        };

        let modify_visualization_options = ModifyVisualizationAgentOptions {
            previous_message: previous_message.clone(),
            input: Some(request),
            metadata_changed,
            thought_process: Some(sql_thoughts.clone()),
            output_sender: options.output_sender.clone(),
            user_message: options.input.clone(),
            data_metadata,
            sql: sql.clone(),
        };

        let results = match modify_visualization_agent(modify_visualization_options).await {
            Ok(results) => results,
            Err(e) => {
                return Err(e);
            }
        };

        Some(results)
    } else {
        //If not, only run the visualization agent if it existed.
        if let Some(modify_visualization_action) = modify_visualization_action {
            let request = match modify_visualization_action.get("data_analyst_ticket") {
                Some(Value::String(request)) => Some(request.clone()),
                _ => None,
            };

            let data_metadata = match get_data_metadata(&sql_gen_results) {
                Some(data_metadata) => data_metadata,
                None => match &previous_message {
                    Some(prev_msg) => match prev_msg.get("data_metadata") {
                        Some(data_metadata) => data_metadata.clone(),
                        None => Value::Null,
                    },
                    None => Value::Null,
                },
            };

            let modify_visualization_options = ModifyVisualizationAgentOptions {
                previous_message: previous_message.clone(),
                input: request,
                metadata_changed,
                thought_process: Some(sql_thoughts.clone()),
                output_sender: options.output_sender.clone(),
                user_message: options.input.clone(),
                data_metadata,
                sql: sql.clone(),
            };

            let results = match modify_visualization_agent(modify_visualization_options).await {
                Ok(results) => results,
                Err(e) => {
                    return Err(e);
                }
            };

            Some(results)
        } else {
            match &previous_message {
                Some(prev_msg) => match prev_msg.get("chart_config") {
                    Some(chart_config) => Some(chart_config.clone()),
                    None => None,
                },
                None => None,
            }
        }
    };

    let data = if generate_sql_action.is_some() {
        match sql_gen_results.get("results") {
            Some(Value::Array(arr)) => {
                // Check if array is empty or contains only null values
                if arr.is_empty()
                    || arr.iter().all(|row| {
                        row.as_object()
                            .map(|obj| obj.values().all(|v| v.is_null()))
                            .unwrap_or(true)
                    })
                {
                    &Vec::new()
                } else {
                    arr
                }
            }
            _ => {
                return Err(ErrorNode::new(
                    DataAnalystAgentError::MissingKey.to_string(),
                    "No results found".to_string(),
                ))
            }
        }
    } else {
        // Return empty array if SQL generation wasn't run
        &Vec::new()
    };

    let data_metadata_obj = if generate_sql_action.is_some() {
        // Get data metadata from SQL generation results
        match sql_gen_results.get("data_metadata") {
            Some(Value::Object(obj)) => obj,
            _ => {
                return Err(ErrorNode::new(
                    DataAnalystAgentError::MissingKey.to_string(),
                    "No data metadata found in SQL generation results".to_string(),
                ));
            }
        }
    } else {
        // Try to get data metadata from previous message
        match &previous_message {
            Some(prev_msg) => match prev_msg.get("data_metadata") {
                Some(Value::Object(obj)) => obj,
                _ => {
                    return Err(ErrorNode::new(
                        DataAnalystAgentError::MissingKey.to_string(),
                        "No data metadata found in previous message".to_string(),
                    ));
                }
            },
            None => {
                return Err(ErrorNode::new(
                    DataAnalystAgentError::MissingKey.to_string(),
                    "No previous message found to get data metadata".to_string(),
                ));
            }
        }
    };

    let metadata_result = if let Some(future) = metadata_prompt_future {
        match future.await {
            Ok(Ok(result)) => Some(result),
            Ok(Err(e)) => return Err(e),
            Err(e) => {
                return Err(ErrorNode::new(
                    "JoinError".to_string(),
                    format!("Failed to join metadata prompt task: {}", e),
                ))
            }
        }
    } else {
        None
    };

    let (title, description, time_frame) = if let Some(metadata_result) = &metadata_result {
        (
            metadata_result.title.clone(),
            Some(metadata_result.description.clone()),
            Some(metadata_result.time_frame.clone()),
        )
    } else if let Some(prev_msg) = &previous_message {
        (
            prev_msg
                .get("title")
                .and_then(|v| v.as_str())
                .unwrap_or(&options.input)
                .to_string(),
            prev_msg
                .get("description")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            prev_msg
                .get("time_frame")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
        )
    } else {
        (options.input.clone(), None, None)
    };

    let dataset_id = match sql_gen_results.get("dataset_id") {
        Some(Value::String(id)) => Some(id.clone()),
        _ => None,
    };

    let dataset_name = match sql_gen_results.get("dataset_name") {
        Some(Value::String(name)) => Some(name.clone()),
        _ => None,
    };

    let chart_configurations = match &modify_visualization_results {
        Some(results) => match results.get("chart_configurations") {
            Some(obj) => obj.clone(),
            _ => match &previous_message {
                Some(prev_msg) => match prev_msg.get("chart_config") {
                    Some(chart_config) => chart_config.clone(),
                    None => Value::Null,
                },
                None => Value::Null,
            },
        },
        None => match &previous_message {
            Some(prev_msg) => match prev_msg.get("chart_config") {
                Some(chart_config) => chart_config.clone(),
                None => Value::Null,
            },
            None => Value::Null,
        },
    };

    if generate_sql_action.is_some() {
        send_message(
            "fetching_data_finished".to_string(),
            json!({
                "data": data,
                "data_metadata": data_metadata_obj,
                "chart_config": chart_configurations.clone(),
                "title": title.clone(),
                "code": sql.clone(),
                "description": description.clone(),
                "time_frame": time_frame.clone(),
                "dataset_id": dataset_id.clone(),
                "dataset_name": dataset_name.clone(),
            }),
            options.output_sender.clone(),
        )
        .await?;
    } else if let Some(viz_results) = &modify_visualization_results {
        if let Some(previous_message) = &previous_message {
            let duration = Instant::now().duration_since(start_time);

            let main_title = format!("Thought for {} seconds", duration.as_secs());

            thoughts.title = main_title;

            send_message(
                "thought_finished".to_string(),
                serde_json::to_value(&thoughts).unwrap(),
                options.output_sender.clone(),
            )
            .await?;

            if let Some(sql) = previous_message.get("sql") {
                send_message(
                    "sql_same".to_string(),
                    json!({
                        "sql": sql
                    }),
                    options.output_sender.clone(),
                )
                .await?;
            }
        }
    }

    let datasets_string = options
        .datasets
        .iter()
        .map(|dataset| dataset.dataset_ddl.clone())
        .collect::<Vec<String>>()
        .join("\n\n");

    let (dataset_selector_result, first_part_of_response, data_metadata_obj) =
        if generate_sql_action.is_some() {
            // If SQL generation ran, get results from sql_gen_results
            let selector = match sql_gen_results.get("dataset_selection") {
                Some(Value::Object(obj)) => obj,
                _ => {
                    return Err(ErrorNode::new(
                        DataAnalystAgentError::MissingKey.to_string(),
                        "No dataset selector result found".to_string(),
                    ));
                }
            };

            let response = match sql_gen_results.get("sql_gen_result") {
                Some(Value::String(response)) => response,
                _ => {
                    return Err(ErrorNode::new(
                        DataAnalystAgentError::MissingKey.to_string(),
                        "No first part of response found".to_string(),
                    ));
                }
            };

            let metadata = match sql_gen_results.get("data_metadata") {
                Some(Value::Object(obj)) => obj,
                _ => {
                    return Err(ErrorNode::new(
                        DataAnalystAgentError::MissingKey.to_string(),
                        "No data metadata found".to_string(),
                    ));
                }
            };

            (selector, response, metadata)
        } else {
            // If SQL generation didn't run, try to get from previous message
            match &previous_message {
                Some(prev_msg) => {
                    let selector = match prev_msg.get("dataset_selection") {
                        Some(Value::Object(obj)) => obj,
                        _ => {
                            return Err(ErrorNode::new(
                                DataAnalystAgentError::MissingKey.to_string(),
                                "No dataset selector result found in previous message".to_string(),
                            ));
                        }
                    };

                    let response = match prev_msg.get("first_part_of_response") {
                        Some(Value::String(response)) => response,
                        _ => {
                            return Err(ErrorNode::new(
                                DataAnalystAgentError::MissingKey.to_string(),
                                "No first part of response found in previous message".to_string(),
                            ));
                        }
                    };

                    let metadata = match prev_msg.get("data_metadata") {
                        Some(Value::Object(obj)) => obj,
                        _ => {
                            return Err(ErrorNode::new(
                                DataAnalystAgentError::MissingKey.to_string(),
                                "No data metadata found in previous message".to_string(),
                            ));
                        }
                    };

                    (selector, response, metadata)
                }
                None => {
                    return Err(ErrorNode::new(
                        DataAnalystAgentError::MissingKey.to_string(),
                        "No previous message found to get required data".to_string(),
                    ));
                }
            }
        };

    let (chart_generated, chart_requirements) = if let Some(modify_visualization_results) =
        &modify_visualization_results
    {
        let chart_generated =
            match modify_visualization_results.get("modify_visualization_orchestrator") {
                Some(results) => results,
                None => &Value::Null,
            };

        let chart_requirements = match modify_visualization_results.get("chart_configurations") {
            Some(results) => results,
            None => &Value::Null,
        };

        (chart_generated, chart_requirements)
    } else {
        (&Value::Null, &Value::Null)
    };

    let thoughts = match sql_gen_results.get("thoughts") {
        Some(thoughts) => thoughts,
        _ => &serde_json::to_value(thoughts).unwrap(),
    };

    let mut outputs = json!({
        "input": options.input.clone(),
        "action_decisions": orchestrator_response,
        "dataset_selection": dataset_selector_result,
        "first_part_of_response": first_part_of_response,
        "data_metadata": data_metadata_obj,
        "chart_generated": chart_generated,
        "chart_requirements": chart_requirements,
        "chart_config": chart_configurations,
        "sql": get_sql(&sql_gen_results),
        "dataset_id": dataset_id,
        "dataset_name": dataset_name,
        "thoughts": thoughts,
        "terms": serde_json::to_value(&options.terms).unwrap(),
        "steps": Value::Array(vec![]),
        "sql_thoughts": sql_thoughts,
        "sql_evaluation_id": sql_evaluation_id,
    });

    if let Some(previous_message) = get_previous_message(&options.message_history) {
        merge_with_previous_message(&mut outputs, &previous_message);
    };

    let master_response_options = MasterResponseAgentOptions {
        outputs: outputs.clone(),
        message_history: options.message_history.clone(),
        datasets: datasets_string.clone(),
        input: options.input.clone(),
        output_sender: options.output_sender.clone(),
    };

    let master_response_handle =
        tokio::spawn(async move { master_response_agent(master_response_options).await });

    let master_response = match master_response_handle.await {
        Ok(response) => match response {
            Ok(response) => response,
            Err(e) => {
                return Err(e);
            }
        },
        Err(e) => {
            return Err(ErrorNode::new(
                "JoinError".to_string(),
                format!("Failed to join master response task: {}", e),
            ));
        }
    };

    outputs["title"] = Value::String(title);
    outputs["description"] = description.map(|d| Value::String(d)).unwrap_or(Value::Null);
    outputs["time_frame"] = time_frame
        .map(|tf| Value::String(tf))
        .unwrap_or(Value::Null);
    outputs["master_response"] = master_response.clone();
    outputs["messages"] = Value::Array(vec![master_response]);
    outputs["created_at"] = Value::String(Utc::now().to_string());

    match send_message(
        "data_analyst_agent_finished".to_string(),
        Value::String("[DONE]".to_string()),
        options.output_sender.clone(),
    )
    .await
    {
        Ok(_) => (),
        Err(e) => {
            return Err(e);
        }
    }

    Ok(outputs)
}

fn merge_with_previous_message(current: &mut Value, previous: &Value) {
    if let (Value::Object(current_obj), Value::Object(previous_obj)) = (current, previous) {
        // Iterate through previous object's keys
        for (key, previous_value) in previous_obj.iter() {
            match current_obj.get(key) {
                // If current value is null or missing, use previous value
                None | Some(Value::Null) => {
                    current_obj.insert(key.clone(), previous_value.clone());
                }
                // If current value is an empty object and previous value is not empty, use previous value
                Some(Value::Object(curr_obj)) if curr_obj.is_empty() => {
                    if let Some(prev_obj) = previous_value.as_object() {
                        if !prev_obj.is_empty() {
                            current_obj.insert(key.clone(), previous_value.clone());
                        }
                    }
                }
                // If both are objects, recursively merge
                Some(Value::Object(_)) if previous_value.is_object() => {
                    let mut current_nested = current_obj[key].clone();
                    merge_with_previous_message(&mut current_nested, previous_value);
                    current_obj.insert(key.clone(), current_nested);
                }
                // Otherwise keep current value
                _ => {}
            }
        }
    }
}

fn assemble_orchestrator_thoughts(actions: &Vec<Value>) -> Vec<Thought> {
    let mut thoughts = Vec::new();
    for action in actions {
        if let Some(action_obj) = action.as_object() {
            let mut thought = Thought {
                type_: "thoughtBlock".to_string(),
                title: "".to_string(),
                content: None,
                code: None,
                error: None,
            };

            if let Some(title) = action_obj.get("name").and_then(|v| v.as_str()) {
                let title = match title {
                    "generate_sql" => "User requested analysis",
                    "modify_visualization" => "User requested visualization",
                    "cannot_do_requested_action_response" => {
                        "User requested action that cannot be done"
                    }
                    "explain_sql_data" => "User asked me to explain the results",
                    "explain_something_general" => "User had a unique request",
                    "chart_requested_but_not_compatible" => {
                        "User asked for a chart that we don't support"
                    }
                    _ => continue,
                };

                thought.title = title.to_string();
            }

            if let Some(content) = action_obj.get("data_analyst_ticket") {
                thought.content = serde_json::from_value::<String>(content.clone()).ok();
            }

            thoughts.push(thought);
        };
    }

    thoughts
}

fn create_orchestrator_messages(
    input: String,
    message_history: &Vec<Value>,
) -> Vec<PromptNodeMessage> {
    let mut messages = vec![PromptNodeMessage {
        role: "system".to_string(),
        content: orchestrator_system_prompt(),
    }];

    // Add message history
    for message in message_history {
        // Add user message with input
        if let Some(input) = message.get("input").and_then(|v| v.as_str()) {
            messages.push(PromptNodeMessage {
                role: "user".to_string(),
                content: input.to_string(),
            });
        }

        // Build structured assistant message
        let mut assistant_content = String::new();

        // Add action decisions
        if let Some(action_decisions) = message.get("action_decisions") {
            assistant_content.push_str("## ACTION DECISIONS\n");
            assistant_content.push_str(&action_decisions.to_string());
            assistant_content.push_str("\n\n");
        }

        // Add dataset selection
        if let Some(dataset_selection) = message.get("dataset_selection") {
            assistant_content.push_str("## DATASET SELECTION AND REASONING\n");
            assistant_content.push_str(&dataset_selection.to_string());
            assistant_content.push_str("\n\n");
        }

        // Add SQL if present
        if let Some(sql) = message.get("sql") {
            assistant_content.push_str("## SQL RESPONSE GENERATED\n");
            assistant_content.push_str(&sql.to_string());

            if let Some(master_response) = message.get("master_response") {
                assistant_content.push_str(&master_response.to_string());
            };

            assistant_content.push_str("\n\n");
        }

        // Add data metadata
        if let Some(data_metadata) = message.get("data_metadata") {
            assistant_content.push_str("## DATA METADATA RETURNED\n");
            assistant_content.push_str(&data_metadata.to_string());
            assistant_content.push_str("\n\n");
        }

        if let Some(previous_chart_config) = message.get("chart_config") {
            assistant_content.push_str("## CHART GENERATED\n");
            assistant_content.push_str(&previous_chart_config.to_string());
            assistant_content.push_str("\n\n");
        }

        // Add chart generated info
        if let Some(chart_generated) = message.get("modify_visualization_instructions") {
            assistant_content.push_str("## MODIFY VISUALIZATION INSTRUCTIONS\n");
            assistant_content.push_str(&chart_generated.to_string());
            assistant_content.push_str("\n\n");
        }

        if !assistant_content.is_empty() {
            messages.push(PromptNodeMessage {
                role: "assistant".to_string(),
                content: assistant_content,
            });
        }
    }

    // Add final user message with current input
    messages.push(PromptNodeMessage {
        role: "user".to_string(),
        content: input,
    });

    messages
}

fn get_previous_message(message_history: &Vec<Value>) -> Option<Value> {
    if message_history.is_empty() {
        return None;
    }

    // Remove last message by getting all but the last element
    let previous_messages = &message_history[..message_history.len() - 1];

    // Return the new last message if it exists
    previous_messages.last().cloned()
}

fn check_metadata_changed(previous_message: &Value, current_message: &Value) -> bool {
    // Get data_metadata objects first
    let prev_metadata = match previous_message.get("data_metadata") {
        Some(Value::Object(m)) => m,
        _ => return true,
    };

    let curr_metadata = match current_message.get("data_metadata") {
        Some(Value::Object(m)) => m,
        _ => return true,
    };

    // Now check column counts
    let prev_count = match prev_metadata.get("column_count").and_then(|n| n.as_u64()) {
        Some(n) => n,
        _ => return true,
    };

    let curr_count = match curr_metadata.get("column_count").and_then(|n| n.as_u64()) {
        Some(n) => n,
        _ => return true,
    };

    if prev_count != curr_count {
        return true;
    }

    // Check columns
    let prev_columns = match prev_metadata
        .get("column_metadata")
        .and_then(|c| c.as_array())
    {
        Some(cols) => cols,
        _ => return true,
    };

    let curr_columns = match curr_metadata
        .get("column_metadata")
        .and_then(|c| c.as_array())
    {
        Some(cols) => cols,
        _ => return true,
    };

    // Check if columns were added or removed
    if prev_columns.len() != curr_columns.len() {
        return true;
    }

    // Create sets of column names for comparison
    let prev_names: std::collections::HashSet<_> = prev_columns
        .iter()
        .filter_map(|col| col.get("name").and_then(|n| n.as_str()))
        .collect();

    // Check if each current column exists in previous columns
    for curr_col in curr_columns {
        if let Some(name) = curr_col.get("name").and_then(|n| n.as_str()) {
            if !prev_names.contains(name) {
                return true;
            }
        }
    }

    false
}

fn get_data_metadata(current_message: &Value) -> Option<Value> {
    // Extract metadata from the current message
    if let Some(Value::Object(metadata)) = current_message.get("data_metadata") {
        Some(Value::Object(metadata.clone()))
    } else {
        None
    }
}

fn get_sql(results: &Value) -> Option<String> {
    // Extract SQL from generate_sql_agent results
    results
        .get("sql")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
}

fn get_generate_sql_action(actions: &Vec<Value>) -> Option<Value> {
    let sql_gen = actions
        .iter()
        .find(|action| action.get("name") == Some(&Value::String("generate_sql".to_string())));

    sql_gen.cloned()
}

fn get_modify_visualization_action(actions: &Vec<Value>) -> Option<Value> {
    let modify_visualization = actions.iter().find(|action| {
        action.get("name") == Some(&Value::String("modify_visualization".to_string()))
    });

    modify_visualization.cloned()
}

fn get_explain_something_general_action(actions: &Vec<Value>) -> Option<Value> {
    let explain_something_general = actions.iter().find(|action| {
        action.get("name") == Some(&Value::String("explain_something_general".to_string()))
    });

    explain_something_general.cloned()
}

fn get_explain_sql_data_action(actions: &Vec<Value>) -> Option<Value> {
    let explain_sql_data = actions
        .iter()
        .find(|action| action.get("name") == Some(&Value::String("explain_sql_data".to_string())));

    explain_sql_data.cloned()
}

fn get_cannot_do_requested_action(actions: &Vec<Value>) -> Option<Value> {
    let cannot_do_requested = actions.iter().find(|action| {
        action.get("name")
            == Some(&Value::String(
                "cannot_do_requested_action_response".to_string(),
            ))
    });

    cannot_do_requested.cloned()
}

fn get_chart_requested_but_not_compatible_action(actions: &Vec<Value>) -> Option<Value> {
    let chart_requested_but_not_compatible = actions.iter().find(|action| {
        action.get("name")
            == Some(&Value::String(
                "chart_requested_but_not_compatible".to_string(),
            ))
    });

    chart_requested_but_not_compatible.cloned()
}

async fn send_message(
    name: String,
    value: Value,
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

async fn send_sql_evaluation_to_sub(
    subscription: &String,
    evaluation: SqlEvaluation,
    message_id: Uuid,
    thread_id: Uuid,
) -> Result<(), Error> {
    let evaluation_json = json!({
        "evaluation_summary": evaluation.evaluation_summary,
        "evaluation_score": evaluation.score,
        "message_id": message_id,
        "thread_id": thread_id,
    });

    let thread_ws_response = WsResponseMessage::new_no_user(
        WsRoutes::Threads(ThreadRoute::Post),
        WsEvent::Threads(ThreadEvent::SqlEvaluation),
        Some(evaluation_json),
        None,
        WsSendMethod::All,
    );

    match send_ws_message(&subscription, &thread_ws_response).await {
        Ok(_) => (),
        Err(e) => return Err(e),
    }

    Ok(())
}
