use std::{collections::HashMap, fmt, time::Instant};

use diesel::{BoolExpressionMethods, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use regex::Regex;
use serde_json::{json, Value};
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::{
    database::{
        lib::get_pg_pool,
        models::EntityRelationship,
        schema::{data_sources, datasets::data_source_id, entity_relationship},
    },
    utils::{
        agent_builder::nodes::{
            error_node::ErrorNode,
            prompt_node::{prompt_node, PromptNodeMessage, PromptNodeSettings},
        },
        clients::typesense::StoredValueDocument,
        prompts::generate_sql_prompts::{
            dataset_selector_prompt::{
                dataset_selector_prompt_schema, dataset_selector_system_prompt,
                dataset_selector_user_prompt,
            },
            sql_gen_prompt::{sql_gen_system_prompt, sql_gen_user_prompt},
            sql_gen_thought_prompt::{sql_gen_thought_system_prompt, sql_gen_thought_user_prompt},
        },
        stored_values::search::{search_values_for_dataset, StoredValue},
    },
};

use super::{
    data_analyst_agent::{DatasetWithMetadata, RelevantTerm, Thought, Thoughts},
    run_and_fix_sql_agent::{run_and_fix_sql_agent, RunAndFixSqlAgentOptions},
};

pub enum GenerateSqlAgentError {
    MissingKey,
    ObjectNotJson,
    PromptNodeError,
    NoDatasetSelected,
    MultipleDatasetsSelected,
    DatasetNotFound,
    GenericError,
}

impl fmt::Display for GenerateSqlAgentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingKey => write!(f, "missing_key"),
            Self::ObjectNotJson => write!(f, "object_not_json"),
            Self::PromptNodeError => write!(f, "prompt_node_error"),
            Self::NoDatasetSelected => write!(f, "no_dataset_selected"),
            Self::MultipleDatasetsSelected => write!(f, "multiple_datasets_selected"),
            Self::DatasetNotFound => write!(f, "dataset_not_found"),
            Self::GenericError => write!(f, "generic_error"),
        }
    }
}

#[derive(Clone)]
pub struct GenerateSqlAgentOptions {
    pub sql_gen_action: Value,
    pub datasets: Vec<DatasetWithMetadata>,
    pub thoughts: Thoughts,
    pub terms: Vec<RelevantTerm>,
    pub output_sender: mpsc::Sender<Value>,
    pub message_history: Vec<Value>,
    pub start_time: Instant,
    pub organization_id: Uuid,
    pub relevant_values: Vec<StoredValue>,
}

pub async fn generate_sql_agent(options: GenerateSqlAgentOptions) -> Result<Value, ErrorNode> {
    let mut thoughts = options.thoughts;

    // Validate the input
    let input = match options.sql_gen_action.get("data_analyst_ticket") {
        Some(Value::String(input)) => input,
        _ => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::MissingKey.to_string(),
                "Missing or invalid data_analyst_ticket".to_string(),
            ));
        }
    };

    let datasets_enum = options
        .datasets
        .iter()
        .map(|d| d.dataset.database_name.clone())
        .collect::<Vec<String>>();

    let dataset_selector_json_schema = dataset_selector_prompt_schema(&datasets_enum);

    // Assemble the options for the prompt node from the generate sql agent inputs
    let dataset_selector_prompt_settings = PromptNodeSettings {
        messages: create_dataset_selector_messages(
            &input,
            &options.datasets,
            &options.terms,
            &options.relevant_values,
            &options.message_history,
        ),
        json_schema: Some(dataset_selector_json_schema),
        prompt_name: "dataset_selector".to_string(),
        ..Default::default()
    };

    thoughts.title = "Finding where the data is located".to_string();

    send_message(
        "thought".to_string(),
        serde_json::to_value(&thoughts).unwrap(),
        options.output_sender.clone(),
    )
    .await?;

    // Use the LLM to execute the prompt to select the dataset.
    let dataset_selector_response = match prompt_node(dataset_selector_prompt_settings).await {
        Ok(Value::Object(obj)) => obj,
        Ok(_) => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::ObjectNotJson.to_string(),
                "Dataset selector response is not a JSON object".to_string(),
            ))
        }
        Err(e) => {
            return Err(e);
        }
    };

    // Extract the datasets from the response.
    let datasets = match dataset_selector_response.get("datasets") {
        Some(Value::Array(datasets)) => datasets,
        _ => {
            let explanation = match dataset_selector_response.get("explanation") {
                Some(Value::String(explanation)) => explanation,
                _ => &String::from("No Relevant Dataset Found."),
            };

            let duration = Instant::now().duration_since(options.start_time);

            let main_title = format!("Thought for {} seconds", duration.as_secs());

            thoughts.title = main_title;

            thoughts.thoughts.push(Thought {
                type_: "thoughtBlock".to_string(),
                title: "No relevant dataset found".to_string(),
                content: Some(explanation.to_string()),
                code: None,
                error: None,
            });

            send_message(
                "thought_finished".to_string(),
                serde_json::to_value(&thoughts).unwrap(),
                options.output_sender.clone(),
            )
            .await?;

            let final_sql_agent_object = json!({
                "name": "generate_sql",
                "dataset_selection": dataset_selector_response,
                "error": GenerateSqlAgentError::NoDatasetSelected.to_string(),
                "error_message": "Multiple datasets were selected".to_string(),
                "thoughts": thoughts,
            });

            return Ok(final_sql_agent_object);
        }
    };

    let datasets = if datasets.len() == 0 {
        // If no datasets, return the explanation for why. This will be fed into the break out explaining that no datasets were selected.
        let explanation = match dataset_selector_response.get("explanation") {
            Some(Value::String(explanation)) => explanation,
            _ => {
                return Err(ErrorNode::new(
                    GenerateSqlAgentError::MissingKey.to_string(),
                    "No 'explanation' key found in the response".to_string(),
                ));
            }
        };

        let duration = Instant::now().duration_since(options.start_time);

        let main_title = format!("Thought for {} seconds", duration.as_secs());

        thoughts.title = main_title;

        thoughts.thoughts.push(Thought {
            type_: "thoughtBlock".to_string(),
            title: "No relevant dataset found".to_string(),
            content: Some(explanation.to_string()),
            code: None,
            error: None,
        });

        send_message(
            "thought_finished".to_string(),
            serde_json::to_value(&thoughts).unwrap(),
            options.output_sender.clone(),
        )
        .await?;

        let final_sql_agent_object = json!({
            "name": "generate_sql",
            "dataset_selection": dataset_selector_response,
            "error": GenerateSqlAgentError::NoDatasetSelected.to_string(),
            "error_message": "Multiple datasets were selected".to_string(),
            "thoughts": thoughts,
        });

        return Ok(final_sql_agent_object);
    } else if datasets.len() == 1 {
        // If one dataset, return the dataset.
        let dataset = match datasets.get(0) {
            Some(dataset) => dataset,
            _ => {
                return Err(ErrorNode::new(
                    GenerateSqlAgentError::GenericError.to_string(),
                    "Tried to get the single dataset from the response but failed".to_string(),
                ));
            }
        };

        let (dataset, explanation) =
            match extract_dataset_and_explanation(dataset, &options.datasets) {
                Ok(dataset_and_explanation) => dataset_and_explanation,
                Err(e) => return Err(e),
            };

        let title = format!("Use the {} dataset", dataset.dataset.name);

        thoughts.title = title.clone();

        thoughts.thoughts.push(Thought {
            type_: "thoughtBlock".to_string(),
            title,
            content: Some(explanation.clone()),
            code: None,
            error: None,
        });

        send_message(
            "thought".to_string(),
            serde_json::to_value(&thoughts).unwrap(),
            options.output_sender.clone(),
        )
        .await?;

        vec![(dataset, explanation)]
    } else {
        // If multiple datasets, return the error. This will be fed into the break out explaining that multiple datasets were selected.
        let mut datasets_and_explanations = Vec::new();

        for dataset in datasets {
            let (dataset, explanation) =
                match extract_dataset_and_explanation(dataset, &options.datasets) {
                    Ok(dataset_and_explanation) => dataset_and_explanation,
                    Err(e) => return Err(e),
                };

            datasets_and_explanations.push((dataset, explanation));
        }

        datasets_and_explanations
    };

    let dataset_ids = datasets
        .iter()
        .map(|(dataset, _)| dataset.dataset.id)
        .collect::<Vec<Uuid>>();

    // Search for relevant stored values
    let mut stored_values = Vec::new();
    for dataset_id in &dataset_ids {
        match search_values_for_dataset(
            &options.organization_id,
            dataset_id,
            input.to_string(),
        ).await {
            Ok(values) => stored_values.extend(values),
            Err(e) => {
                tracing::error!("Error searching stored values for dataset {}: {:?}", dataset_id, e);
            }
        }
    }

    if !stored_values.is_empty() {
        let values_str = stored_values.iter()
            .map(|v| format!("{}: {}", v.column_name, v.value))
            .collect::<Vec<_>>()
            .join("\n");

        thoughts.thoughts.push(Thought {
            type_: "thoughtBlock".to_string(),
            title: "Found relevant values".to_string(),
            content: Some(values_str),
            code: None,
            error: None,
        });

        send_message(
            "thought".to_string(),
            serde_json::to_value(&thoughts).unwrap(),
            options.output_sender.clone(),
        )
        .await?;
    }

    let data_source_ids = datasets
        .iter()
        .map(|(dataset, _)| dataset.dataset.data_source_id)
        .collect::<Vec<Uuid>>();

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::GenericError.to_string(),
                e.to_string(),
            ))
        }
    };

    let data_source_type = match data_sources::table
        .filter(data_sources::id.eq_any(&data_source_ids))
        .select(data_sources::type_)
        .first::<String>(&mut conn)
        .await
    {
        Ok(data_source_type) => data_source_type,
        Err(e) => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::GenericError.to_string(),
                e.to_string(),
            ))
        }
    };

    let entity_relationships = match entity_relationship::table
        .filter(
            entity_relationship::primary_dataset_id
                .eq_any(&dataset_ids)
                .or(entity_relationship::foreign_dataset_id.eq_any(&dataset_ids)),
        )
        .load::<EntityRelationship>(&mut conn)
        .await
    {
        Ok(entity_relationships) => entity_relationships,
        Err(e) => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::GenericError.to_string(),
                e.to_string(),
            ))
        }
    };

    // Check if datasets can be joined based on entity relationships
    if datasets.len() > 1 {
        let mut can_join = true;
        // Check each pair of datasets
        for i in 0..datasets.len() {
            for j in (i + 1)..datasets.len() {
                let (dataset1, _) = &datasets[i];
                let (dataset2, _) = &datasets[j];

                println!("dataset1: {:?}", dataset1.dataset.id);
                println!("dataset2: {:?}", dataset2.dataset.id);
                println!("entity_relationships: {:?}", entity_relationships);

                // Check if there's a relationship in either direction
                let has_relationship = entity_relationships.iter().any(|er| {
                    er.primary_dataset_id == dataset1.dataset.id
                        && er.foreign_dataset_id == dataset2.dataset.id
                        || er.primary_dataset_id == dataset2.dataset.id
                            && er.foreign_dataset_id == dataset1.dataset.id
                });

                if !has_relationship {
                    can_join = false;
                    break;
                }
            }
            if !can_join {
                break;
            }
        }

        if !can_join {
            let duration = Instant::now().duration_since(options.start_time);

            let main_title = format!("Thought for {} seconds", duration.as_secs());

            thoughts.title = main_title;

            let mut content = "".to_string();

            thoughts.thoughts.push(Thought {
                type_: "thoughtBlock".to_string(),
                title: "Multiple datasets were considered relevant".to_string(),
                content: Some(content),
                code: None,
                error: None,
            });

            send_message(
                "thought_finished".to_string(),
                serde_json::to_value(&thoughts).unwrap(),
                options.output_sender.clone(),
            )
            .await?;

            let final_sql_agent_object = json!({
                "name": "generate_sql",
                "dataset_selection": dataset_selector_response,
                "error": GenerateSqlAgentError::MultipleDatasetsSelected.to_string(),
                "error_message": "Multiple datasets were selected".to_string(),
                "thoughts": thoughts,
            });

            return Ok(final_sql_agent_object);
        }
    }

    let mut terms_string = String::new();
    let mut terms_map: std::collections::HashMap<String, (String, String, Vec<String>)> =
        std::collections::HashMap::new();

    for term in &options.terms {
        for (dataset, _) in &datasets {
            if term.dataset_id == dataset.dataset.id {
                terms_map
                    .entry(term.name.clone())
                    .and_modify(|(_, _, datasets)| datasets.push(dataset.dataset.name.clone()))
                    .or_insert((
                        term.definition.clone(),
                        term.sql_snippet.clone().unwrap_or_default(),
                        vec![dataset.dataset.name.clone()],
                    ));
            }
        }
    }

    for (term_name, (definition, sql_snippet, datasets)) in terms_map {
        terms_string.push_str(&format!("{}: {}", term_name, definition));
        if !sql_snippet.is_empty() {
            terms_string.push_str(&format!("\nSQL Example: {}", sql_snippet));
        }
        terms_string.push_str(&format!("\nRelevant Datasets: {}", datasets.join(", ")));
        terms_string.push_str("\n\n");
    }

    let mut relevant_values_string = String::new();
    let mut column_values: HashMap<Uuid, Vec<String>> = HashMap::new();

    // First collect values by column_id
    for value in &options.relevant_values {
        for (dataset, _) in &datasets {
            if value.dataset_id == dataset.dataset.id {
                column_values
                    .entry(value.column_id.clone())
                    .or_default()
                    .push(value.value.clone());
            }
        }
    }

    // Then format using the actual column names from dataset
    for (column_id, values) in column_values {
        for (dataset, _) in &datasets {
            if let Some(column_name) = dataset.get_column_name(&column_id) {
                relevant_values_string.push_str(&format!(
                    "{}: {}\n",
                    column_name,
                    values.join(", ")
                ));
            }
        }
    }

    let previous_sql = options
        .message_history
        .last()
        .and_then(|msg| msg.get("sql").and_then(|c| c.as_str()).map(String::from));

    let (thought_tx, mut thought_rx) = mpsc::channel::<Value>(100);

    let dataset_ddls = datasets
        .iter()
        .map(|(dataset, _)| {
            format!(
                "{}\n{}",
                dataset.dataset_ddl.clone(),
                dataset.dataset.yml_file.clone().unwrap_or("".to_string())
            )
        })
        .collect::<Vec<String>>()
        .join("\n\n");

    let dataset_explanations = datasets
        .iter()
        .map(|(_, explanation)| explanation.clone())
        .collect::<Vec<String>>()
        .join("\n\n");

    let sql_gen_thought_prompt_settings = PromptNodeSettings {
        messages: create_sql_gen_thought_messages(
            &input,
            &previous_sql,
            &dataset_ddls,
            &data_source_type,
            &terms_string,
            &dataset_explanations,
            &options.message_history,
            &relevant_values_string,
        ),
        prompt_name: "sql_gen_thought".to_string(),
        stream: Some(thought_tx.clone()),
        stream_name: Some("generating_sql_thought".to_string()),
        ..Default::default()
    };

    let mut thoughts_clone = thoughts.clone();
    let output_sender_clone = options.output_sender.clone();

    let process_handle = tokio::spawn(async move {
        let mut current_step = Thought {
            title: String::new(),
            content: Some(String::new()),
            type_: "thoughtBlock".to_string(),
            code: None,
            error: None,
        };
        let all_steps: Vec<Thought> = Vec::new();

        // Keep the title regex as is for title extraction
        let title_regex = Regex::new(r"(\d+)\s*\.\s*\*\*\s*(.*?)\s*\*\*\s*:").unwrap();
        let mut aggregated_text = String::new();
        let mut seen_titles = std::collections::HashSet::new();
        let mut last_processed_pos = 0;
        let mut pending_title: Option<(String, usize)> = None;

        while let Some(chunk) = thought_rx.recv().await {
            let chunk_str = match chunk.get("value") {
                Some(Value::String(s)) => s,
                _ => continue,
            };

            aggregated_text.push_str(chunk_str);

            // Find all title matches
            let matches: Vec<(String, usize, usize)> = title_regex
                .captures_iter(&aggregated_text[last_processed_pos..])
                .map(|cap| {
                    let full_match = cap.get(0).unwrap();
                    let title = cap[2].trim().to_string();
                    (
                        title,
                        full_match.start() + last_processed_pos,
                        full_match.end() + last_processed_pos,
                    )
                })
                .collect();

            // Process only if we have at least 2 titles (so we know where content ends)
            if matches.len() >= 2 {
                let (title, _, content_start) = &matches[0];
                let (_, next_title_start, _) = &matches[1];

                if !seen_titles.contains(title) && title != "Final Decision" {
                    let content = aggregated_text[*content_start..*next_title_start]
                        .trim()
                        .trim_start_matches(':')
                        .trim()
                        .to_string();

                    current_step = Thought {
                        title: title.clone(),
                        content: Some(content),
                        type_: "thoughtBlock".to_string(),
                        code: None,
                        error: None,
                    };

                    seen_titles.insert(title.clone());
                    thoughts_clone.title = title.clone();
                    thoughts_clone.thoughts.push(current_step.clone());

                    if let Err(_) = send_message(
                        "thought".to_string(),
                        serde_json::to_value(&thoughts_clone).unwrap(),
                        output_sender_clone.clone(),
                    )
                    .await
                    {
                        break;
                    }

                    // Update last processed position to start of next title
                    last_processed_pos = *next_title_start;
                }
            }

            // Update pending_title when finding new titles
            if !matches.is_empty() {
                let (title, _, start) = &matches[0];
                pending_title = Some((title.clone(), *start));
            }
        }

        // Process final pending title if exists (using all remaining text)
        if let Some((pending_title_text, pending_content_start)) = pending_title {
            if !seen_titles.contains(&pending_title_text) && pending_title_text != "Final Decision"
            {
                let content = aggregated_text[pending_content_start..]
                    .trim()
                    .trim_start_matches(':')
                    .trim()
                    .to_string();

                current_step = Thought {
                    title: pending_title_text.clone(),
                    content: Some(content),
                    type_: "thoughtBlock".to_string(),
                    code: None,
                    error: None,
                };

                thoughts_clone.title = pending_title_text;
                thoughts_clone.thoughts.push(current_step.clone());

                if let Err(_) = send_message(
                    "thought".to_string(),
                    serde_json::to_value(&thoughts_clone).unwrap(),
                    output_sender_clone.clone(),
                )
                .await
                {
                    // Handle error
                }
            }
        }

        (all_steps, thoughts_clone)
    });

    // Run the main prompt
    let sql_gen_thought_response = match prompt_node(sql_gen_thought_prompt_settings).await {
        Ok(Value::String(thought_process)) => thought_process,
        _ => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::ObjectNotJson.to_string(),
                "SQL response is not a string".to_string(),
            ));
        }
    };

    // Drop the sender to signal no more messages will be sent
    drop(thought_tx);

    // Wait for thought processing to complete
    let (_, updated_thoughts) = match process_handle.await {
        Ok(result) => result,
        Err(e) => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::GenericError.to_string(),
                e.to_string(),
            ))
        }
    };

    thoughts = updated_thoughts;

    let duration = Instant::now().duration_since(options.start_time);

    let main_title = format!("Thought for {} seconds", duration.as_secs());

    thoughts.title = main_title;

    send_message(
        "thought_finished".to_string(),
        serde_json::to_value(&thoughts).unwrap(),
        options.output_sender.clone(),
    )
    .await?;

    // Assemble the options for the prompt node from the generate sql agent inputs
    let sql_gen_prompt_settings = PromptNodeSettings {
        messages: create_sql_gen_messages(
            input,
            &sql_gen_thought_response,
            &dataset_ddls,
            &terms_string,
            &dataset_explanations,
            &options.message_history,
            &relevant_values_string,
            &data_source_type,
        ),
        stream: Some(options.output_sender.clone()),
        stream_name: Some("generating_sql".to_string()),
        prompt_name: "sql_gen".to_string(),
        ..Default::default()
    };

    // Use the LLM to execute the prompt to generate the SQL.
    let sql_gen_response = match prompt_node(sql_gen_prompt_settings).await {
        Ok(Value::String(sql)) => sql,
        Ok(_) => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::ObjectNotJson.to_string(),
                "SQL response is not a string".to_string(),
            ));
        }
        Err(e) => {
            return Err(e);
        }
    };

    let (dataset, _) = datasets[0].clone();
    let dataset_id = dataset.dataset.id;
    let dataset_name = dataset.dataset.name.clone();

    let run_and_fix_sql_agent_options = RunAndFixSqlAgentOptions {
        sql_input: sql_gen_response.clone(),
        dataset_id: dataset_id.clone(),
        dataset: dataset_ddls.clone(),
        output_sender: options.output_sender.clone(),
        thoughts: thoughts.clone(),
        start_time: options.start_time,
    };

    let run_sql_result = match run_and_fix_sql_agent(run_and_fix_sql_agent_options).await {
        Ok(sql_gen_response) => sql_gen_response,
        Err(e) => return Err(e),
    };

    let sql = match run_sql_result.get("sql") {
        Some(sql) => sql,
        _ => &Value::Null,
    };

    let results = match run_sql_result.get("results") {
        Some(results) => results,
        _ => &Value::Null,
    };

    let data_metadata = match run_sql_result.get("data_metadata") {
        Some(data_metadata) => data_metadata,
        _ => &Value::Null,
    };

    let thoughts = match run_sql_result.get("thoughts") {
        Some(thoughts) => thoughts,
        _ => &Value::Null,
    };

    let error = match run_sql_result.get("error") {
        Some(error) => error,
        _ => &Value::Null,
    };

    let final_sql_agent_object = json!({
        "name": "generate_sql",
        "data_analyst_ticket": input,
        "dataset_selection": dataset_selector_response,
        "dataset_id": dataset_id,
        "dataset_name": dataset_name,
        "sql_gen_result": sql_gen_response,
        "results": results,
        "data_metadata": data_metadata,
        "sql": sql,
        "thoughts": thoughts,
        "sql_thoughts": sql_gen_thought_response,
        "error": error,
    });

    Ok(final_sql_agent_object)
}

fn create_dataset_selector_messages(
    input: &String,
    datasets: &Vec<DatasetWithMetadata>,
    terms: &Vec<RelevantTerm>,
    relevant_values: &Vec<StoredValue>,
    message_history: &Vec<Value>,
) -> Vec<PromptNodeMessage> {
    let mut terms_string = String::new();
    for term in terms {
        let dataset = datasets.iter().find(|d| d.dataset.id == term.dataset_id);

        if let Some(dataset) = dataset {
            if dataset.dataset.id == term.dataset_id {
                terms_string.push_str(&format!("{}: {}", term.name, term.definition));
                if let Some(sql_snippet) = &term.sql_snippet {
                    terms_string.push_str(&format!("\nSQL Example: {}", sql_snippet));
                }
                terms_string.push_str("\n");
            }
        }
    }

    let mut relevant_values_string = String::new();
    let mut dataset_values: HashMap<Uuid, Vec<String>> = HashMap::new();

    // First collect values by dataset_id
    for value in relevant_values {
        dataset_values
            .entry(value.dataset_id.clone())
            .or_default()
            .push(value.value.clone());
    }

    // Then format using the dataset names
    for (dataset_id, values) in dataset_values {
        if let Some(dataset) = datasets.iter().find(|d| d.dataset.id == dataset_id) {
            relevant_values_string.push_str(&format!(
                "{}: {}\n",
                dataset.dataset.name,
                values.join(", ")
            ));
        }
    }

    let mut dataset_schemas = String::new();

    for dataset in datasets {
        dataset_schemas.push_str(&format!("{}", dataset.dataset_ddl));
        dataset_schemas.push_str("\n\n");
    }

    let mut messages = vec![PromptNodeMessage {
        role: "system".to_string(),
        content: dataset_selector_system_prompt(&dataset_schemas),
    }];

    // Add message history
    for message in message_history {
        // Add user message with input
        let input = match message.get("input") {
            Some(Value::String(input)) => input,
            _ => continue,
        };

        let terms = match message.get("terms") {
            Some(Value::String(terms)) => terms,
            _ => &"".to_string(),
        };

        messages.push(PromptNodeMessage {
            role: "user".to_string(),
            content: dataset_selector_user_prompt(input, &terms, &relevant_values_string),
        });

        // Add assistant message with dataset_selection content
        if let Some(dataset_selection) = message.get("dataset_selection") {
            messages.push(PromptNodeMessage {
                role: "assistant".to_string(),
                content: dataset_selection.to_string(),
            });
        }
    }

    // Add the current input as the final user message
    messages.push(PromptNodeMessage {
        role: "user".to_string(),
        content: dataset_selector_user_prompt(input, &terms_string, &relevant_values_string),
    });

    messages
}

fn create_sql_gen_messages(
    input: &String,
    thought_process: &String,
    dataset: &String,
    terms: &String,
    explanation: &String,
    message_history: &Vec<Value>,
    relevant_values: &String,
    data_source_type: &String,
) -> Vec<PromptNodeMessage> {
    let mut messages = vec![PromptNodeMessage {
        role: "system".to_string(),
        content: sql_gen_system_prompt(dataset, explanation, terms, relevant_values, data_source_type),
    }];

    // Add message history
    for message in message_history {
        // Add user message with input
        let input = match message.get("input") {
            Some(Value::String(input)) => input,
            _ => continue,
        };

        let thought_process = match message.get("sql_thoughts") {
            Some(Value::String(thought_process)) => thought_process,
            _ => &"".to_string(),
        };

        let sql_response = match message.get("first_part_of_response") {
            Some(Value::String(sql_response)) => sql_response,
            _ => &"".to_string(),
        };

        messages.push(PromptNodeMessage {
            role: "user".to_string(),
            content: sql_gen_user_prompt(input.to_string(), thought_process.to_string()),
        });

        messages.push(PromptNodeMessage {
            role: "assistant".to_string(),
            content: sql_response.to_string(),
        });
    }

    // Add the current input as the final user message
    messages.push(PromptNodeMessage {
        role: "user".to_string(),
        content: sql_gen_user_prompt(input.to_string(), thought_process.to_string()),
    });

    messages
}

fn create_sql_gen_thought_messages(
    input: &String,
    sql: &Option<String>,
    dataset: &String,
    data_source_type: &String,
    terms: &String,
    explanation: &String,
    message_history: &Vec<Value>,
    relevant_values: &String,
) -> Vec<PromptNodeMessage> {
    let mut messages = vec![PromptNodeMessage {
        role: "system".to_string(),
        content: sql_gen_thought_system_prompt(
            dataset,
            explanation,
            terms,
            relevant_values,
            data_source_type,
        ),
    }];

    // Add message history
    for message in message_history {
        // Add user message with input
        let input = match message.get("input") {
            Some(Value::String(input)) => input,
            _ => continue,
        };

        let thought_process = match message.get("sql_thoughts") {
            Some(Value::String(thought_process)) => thought_process,
            _ => &"".to_string(),
        };

        let sql_response = match message.get("first_part_of_response") {
            Some(Value::String(sql_response)) => Some(sql_response.to_string()),
            _ => None,
        };

        // Add user message with input
        messages.push(PromptNodeMessage {
            role: "user".to_string(),
            content: sql_gen_thought_user_prompt(input.to_string(), sql_response),
        });

        // Add assistant message with first_part_of_response content

        messages.push(PromptNodeMessage {
            role: "assistant".to_string(),
            content: thought_process.to_string(),
        });
    }

    // Add the current input as the final user message
    messages.push(PromptNodeMessage {
        role: "user".to_string(),
        content: sql_gen_thought_user_prompt(input.to_string(), sql.clone()),
    });

    messages
}

fn extract_dataset_and_explanation(
    selected_dataset: &Value,
    datasets: &Vec<DatasetWithMetadata>,
) -> Result<(DatasetWithMetadata, String), ErrorNode> {
    let dataset_name = match selected_dataset.get("dataset") {
        Some(Value::String(dataset)) => dataset.clone(),
        _ => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::MissingKey.to_string(),
                "No 'dataset' key found in the response".to_string(),
            ));
        }
    };

    let dataset_explanation = match selected_dataset.get("explanation") {
        Some(Value::String(explanation)) => explanation,
        _ => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::MissingKey.to_string(),
                "No 'explanation' key found in the response".to_string(),
            ));
        }
    };

    let dataset = match datasets
        .iter()
        .find(|d| d.dataset.database_name == dataset_name)
    {
        Some(dataset) => dataset.clone(),
        None => {
            return Err(ErrorNode::new(
                GenerateSqlAgentError::DatasetNotFound.to_string(),
                format!("Dataset not found: {}", dataset_name),
            ));
        }
    };

    Ok((dataset, dataset_explanation.to_string()))
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
