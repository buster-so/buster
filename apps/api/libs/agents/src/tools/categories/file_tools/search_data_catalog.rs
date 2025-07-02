use std::collections::HashMap;
use std::{env, sync::Arc, time::Instant};
use database::enums::DataSourceType;

use anyhow::{Context, Result};
use async_trait::async_trait;
use braintrust::{get_prompt_system_message, BraintrustClient};
use database::{
    pool::get_pg_pool,
    schema::data_sources,
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use futures::stream::{self, StreamExt};
use litellm::{AgentMessage, ChatCompletionRequest, EmbeddingRequest, LiteLLMClient, Metadata, ResponseFormat};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{debug, error, info, warn};
use uuid::Uuid;
use dataset_security::{get_permissioned_datasets, PermissionedDataset};
use stored_values;

// Import SemanticLayerSpec
use semantic_layer::models::Model;

use crate::{agent::Agent, tools::ToolExecutor};

// NEW: Structure to represent found values with their source information
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub struct FoundValueInfo {
    pub value: String,
    pub database_name: String,
    pub schema_name: String,
    pub table_name: String,
    pub column_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogParams {
    specific_queries: Option<Vec<String>>,
    exploratory_topics: Option<Vec<String>>,
    value_search_terms: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogOutput {
    pub message: String,
    pub specific_queries: Option<Vec<String>>,
    pub exploratory_topics: Option<Vec<String>>,
    pub duration: i64,
    pub results: Vec<DatasetSearchResult>,
    pub data_source_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub struct DatasetSearchResult {
    pub id: Uuid,
    pub name: Option<String>,
    pub yml_content: Option<String>,
}

/// Represents a searchable dimension in a model
#[derive(Debug, Clone)]
struct SearchableDimension {
    model_name: String,
    dimension_name: String,
    dimension_path: Vec<String>, // Path to locate this dimension in the YAML
}

// NEW: Helper function to generate embeddings for search terms
async fn generate_embedding_for_text(text: &str) -> Result<Vec<f32>> {
    let litellm_client = LiteLLMClient::new(None, None);
    
    let embedding_request = EmbeddingRequest {
        model: "text-embedding-3-small".to_string(),
        input: vec![text.to_string()], // Single input as a vector
        dimensions: Some(1536),
        encoding_format: Some("float".to_string()),
        user: None,
    };
    
    let embedding_response = litellm_client
        .generate_embeddings(embedding_request)
        .await?;
    
    if embedding_response.data.is_empty() {
        return Err(anyhow::anyhow!("No embeddings returned from API"));
    }
    
    Ok(embedding_response.data[0].embedding.clone())
}

// Helper function to identify time-based terms that might cause issues
fn is_time_period_term(term: &str) -> bool {
    let term_lower = term.to_lowercase();
    
    // List of time periods that might cause embedding search issues
    let time_terms = [
        "today", "yesterday", "tomorrow",
        "last week", "last month", "last year", "last quarter",
        "this week", "this month", "this year", "this quarter",
        "q1", "q2", "q3", "q4",
        "january", "february", "march", "april", "may", "june", 
        "july", "august", "september", "october", "november", "december",
        "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"
    ];
    
    time_terms.iter().any(|&t| term_lower.contains(t))
}

// NEW: Convert StoredValueResult to FoundValueInfo
fn to_found_value_info(result: stored_values::search::StoredValueResult, _score: f64) -> FoundValueInfo {
    FoundValueInfo {
        value: result.value,
        database_name: result.database_name,
        schema_name: result.schema_name,
        table_name: result.table_name,
        column_name: result.column_name,
    }
}

pub struct SearchDataCatalogTool {
    agent: Arc<Agent>,
}

impl SearchDataCatalogTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }

    #[allow(dead_code)]
    async fn is_enabled(&self) -> bool {
        true
    }

    async fn get_datasets(user_id: &Uuid) -> Result<Vec<PermissionedDataset>> {
        debug!("Fetching permissioned datasets for agent tool for user {}", user_id);
        let datasets_result = get_permissioned_datasets(user_id, 0, 10000).await;

        match datasets_result {
            Ok(datasets) => {
                let filtered_datasets: Vec<PermissionedDataset> = datasets
                    .into_iter()
                    .filter(|d| d.yml_content.is_some())
                    .collect();

                debug!(
                    count = filtered_datasets.len(),
                    user_id = %user_id,
                    "Successfully loaded and filtered permissioned datasets for agent tool"
                );
                Ok(filtered_datasets)
            }
            Err(e) => {
                error!(user_id = %user_id, "Failed to load permissioned datasets for agent tool: {}", e);
                Err(anyhow::anyhow!("Error fetching permissioned datasets: {}", e))
            }
        }
    }

    // NEW: Helper function to truncate previous search_data_catalog results
    async fn truncate_previous_search_results(&self) -> Result<()> {
        // Truncate previous search_data_catalog results to keep conversation manageable
        self.agent.truncate_previous_tool_results("search_data_catalog", "[REMOVED BC OF SIZE]").await
    }
}

#[async_trait]
impl ToolExecutor for SearchDataCatalogTool {
    type Output = SearchDataCatalogOutput;
    type Params = SearchDataCatalogParams;

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        let start_time = Instant::now();
        let user_id = self.agent.get_user_id();
        
        // Truncate previous search results to keep conversation manageable
        if let Err(e) = self.truncate_previous_search_results().await {
            warn!("Failed to truncate previous search results: {}", e);
        }

        let specific_queries = params.specific_queries.clone().unwrap_or_default();
        let exploratory_topics = params.exploratory_topics.clone().unwrap_or_default();
        
        // Get the user prompt for extracting value search terms
        let user_prompt_value = self.agent.get_state_value("user_prompt").await;
        let user_prompt_str = match user_prompt_value {
            Some(Value::String(prompt)) => prompt,
            _ => {
                warn!("User prompt not found in agent state for value extraction.");
                "User query context not available.".to_string()
            }
        };
        
        debug!(
            specific_queries_count = specific_queries.len(),
            exploratory_topics_count = exploratory_topics.len(),
            "Starting simplified search to return all datasets with value injection"
        );

        // Get all datasets
        let all_datasets = Self::get_datasets(&user_id).await?;

        // Check if datasets were fetched and are not empty
        if all_datasets.is_empty() {
            info!("No datasets found for the organization or user.");
            self.agent.set_state_value(String::from("data_source_id"), Value::Null).await;
            return Ok(SearchDataCatalogOutput {
                message: "No datasets available to search. Have you deployed datasets? If you believe this is an error, please contact support.".to_string(),
                specific_queries: params.specific_queries,
                exploratory_topics: params.exploratory_topics,
                duration: start_time.elapsed().as_millis() as i64,
                results: vec![],
                data_source_id: None,
            });
        }

        // Extract and cache the data_source_id from the first dataset
        let target_data_source_id = all_datasets[0].data_source_id;
        debug!(data_source_id = %target_data_source_id, "Extracted data source ID");
        
        // Cache the data_source_id in agent state
        self.agent.set_state_value(
            "data_source_id".to_string(),
            Value::String(target_data_source_id.to_string())
        ).await;

        // Spawn concurrent task to fetch data source syntax
        let agent_clone = self.agent.clone();
        let syntax_future = tokio::spawn(async move {
            let result: Result<String> = async {
                let mut conn = get_pg_pool().get().await
                    .context("Failed to get DB connection for data source type lookup")?;

                let source_type = data_sources::table
                    .filter(data_sources::id.eq(target_data_source_id))
                    .select(data_sources::type_)
                    .first::<DataSourceType>(&mut conn)
                    .await
                    .context(format!("Failed to find data source type for ID: {}", target_data_source_id))?;

                let syntax_string = source_type.to_string();
                Ok(syntax_string)
            }.await;

            match result {
                Ok(syntax) => {
                    debug!(data_source_id = %target_data_source_id, syntax = %syntax, "Determined data source syntax concurrently");
                    agent_clone.set_state_value(
                        "data_source_syntax".to_string(),
                        Value::String(syntax)
                    ).await;
                },
                Err(e) => {
                    warn!(data_source_id = %target_data_source_id, error = %e, "Failed to determine data source syntax concurrently, setting state to null");
                    agent_clone.set_state_value(
                        "data_source_syntax".to_string(),
                        Value::Null
                    ).await;
                }
            }
        });

        // --- VALUE SEARCH (keep the embedding-based search and injection) ---
        
        // Extract value search terms
        let value_search_terms = params.value_search_terms.clone().unwrap_or_default();
        
        // Filter terms before generating embeddings
        let valid_value_search_terms: Vec<String> = value_search_terms
            .into_iter()
            .filter(|term| term.len() >= 2 && !is_time_period_term(term))
            .collect();

        // Generate embeddings for all valid terms concurrently using batching
        let term_embeddings: HashMap<String, Vec<f32>> = if !valid_value_search_terms.is_empty() {
            let embedding_terms = valid_value_search_terms.clone();
            let embedding_batch_future = tokio::spawn(async move {
                generate_embeddings_batch(embedding_terms).await
            });

            match embedding_batch_future.await? {
                Ok(results) => results.into_iter().collect(),
                Err(e) => {
                    error!(error = %e, "Batch embedding generation failed");
                    HashMap::new()
                }
            }
        } else {
            HashMap::new()
        };

        debug!(count = term_embeddings.len(), "Generated embeddings for value search terms via batch");

        // Begin value searches concurrently using pre-generated embeddings
        let mut value_search_futures = Vec::new();
        if !term_embeddings.is_empty() {
            for (term, embedding) in term_embeddings.iter() {
                let term_clone = term.clone();
                let embedding_clone = embedding.clone();
                let data_source_id_clone = target_data_source_id;

                let future = tokio::spawn(async move {
                    let results = stored_values::search::search_values_by_embedding(
                        data_source_id_clone,
                        &embedding_clone,
                        20, // Limit to 20 values per term
                    ).await;
                    
                    (term_clone, results)
                });
                
                value_search_futures.push(future);
            }
        }
        
        // Await value searches to complete
        let value_search_results_vec: Vec<(String, Result<Vec<stored_values::search::StoredValueResult>>)> = 
            futures::future::join_all(value_search_futures)
                .await
                .into_iter()
                .filter_map(|r| r.ok())
                .collect();
        
        // Process the value search results
        let mut found_values_by_term = HashMap::new();
        for (term, result) in value_search_results_vec {
            match result {
                Ok(values) => {
                    let found_values: Vec<FoundValueInfo> = values.into_iter()
                        .map(|val| {
                            to_found_value_info(val, 0.0)
                        })
                        .collect();
                    
                    let term_str = term.clone();
                    let values_count = found_values.len();
                    found_values_by_term.insert(term, found_values);
                    debug!(term = %term_str, count = values_count, "Found values for search term");
                }
                Err(e) => {
                    error!(term = %term, error = %e, "Error searching for values");
                    found_values_by_term.insert(term, vec![]);
                }
            }
        }
        
        // Flatten all found values into a single list
        let all_found_values: Vec<FoundValueInfo> = found_values_by_term.values()
            .flat_map(|values| values.clone())
            .collect();
        
        debug!(value_count = all_found_values.len(), "Total found values across all terms after search");

        // --- RETURN ALL DATASETS (no filtering/ranking) ---
        
        // Convert all datasets to search results
        let all_search_results: Vec<DatasetSearchResult> = all_datasets
            .into_iter()
            .map(|dataset| DatasetSearchResult {
                id: dataset.id,
                name: Some(dataset.name),
                yml_content: dataset.yml_content,
            })
            .collect();

        // Update YML content with search results (keep the value injection)
        let mut updated_results = Vec::new();
        
        for result in &all_search_results {
            let mut updated_result = result.clone();
            
            if let Some(yml_content) = &result.yml_content {
                // Inject pre-found values into YML
                match inject_prefound_values_into_yml(
                    yml_content,
                    &all_found_values,
                ).await {
                    Ok(updated_yml) => {
                        debug!(
                            dataset_id = %result.id,
                            "Successfully updated YML with relevant values for searchable dimensions"
                        );
                        updated_result.yml_content = Some(updated_yml);
                    },
                    Err(e) => {
                        warn!(
                            dataset_id = %result.id,
                            error = %e,
                            "Failed to update YML with relevant values"
                        );
                    }
                }
            }
            
            updated_results.push(updated_result);
        }

        // Wait for syntax future to complete
        if let Err(e) = syntax_future.await {
            warn!(error = %e, "Syntax fetching task failed to join");
        }

        // Set state flags
        self.agent
            .set_state_value(
                String::from("data_context"),
                Value::Bool(!updated_results.is_empty()),
            )
            .await;

        self.agent
            .set_state_value(String::from("searched_data_catalog"), Value::Bool(true))
            .await;

        let duration = start_time.elapsed().as_millis();

        let message = if updated_results.is_empty() {
            "No datasets found.".to_string()
        } else {
            format!("Loaded {} datasets with injected values for searchable dimensions.", updated_results.len())
        };

        Ok(SearchDataCatalogOutput {
            message,
            specific_queries: params.specific_queries,
            exploratory_topics: params.exploratory_topics,
            duration: duration as i64,
            results: updated_results,
            data_source_id: Some(target_data_source_id),
        })
    }

    fn get_name(&self) -> String {
        "search_data_catalog".to_string()
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": "search_data_catalog",
          "description": get_search_data_catalog_description().await,
          "parameters": {
            "type": "object",
            "properties": {
              "specific_queries": {
                "type": "array",
                "description": "Optional list of specific, high-intent search queries targeting data assets based on identified Objects, Properties, Events, Metrics, Filters, and anticipated needs (e.g., required joins, identifiers). Use for focused requests.",
                "items": {
                  "type": "string",
                  "description": "A concise, full-sentence, natural language query describing the specific search intent, e.g., 'Find datasets with Customer orders including Order ID, Order Date, Total Amount, and linked Customer Name and Email.'"
                },
              },
              "exploratory_topics": {
                 "type": "array",
                 "description": "Optional list of broader topics for exploration when the user's request is vague or seeks related concepts. Aims to discover potentially relevant datasets based on thematic connections.",
                 "items": {
                   "type": "string",
                   "description": "A concise topic phrase describing a general area of interest, e.g., 'Customer churn factors', 'Website traffic analysis', 'Product performance metrics'."
                 },
               },
               "value_search_terms": {
                 "type": "array",
                 "description": "Optional list of specific, concrete, meaningful values (e.g., 'Red Bull', 'California', 'John Smith', 'Premium Tier') extracted directly from the user query. These are used for semantic value search within columns. **CRITICAL**: Exclude general concepts ('revenue'), time periods ('last month'), generic identifiers (UUIDs, numerical IDs like 'cust_12345'), and non-semantic composite values (e.g., avoid 'item 987abc', prefer 'item' if meaningful or omit). Focus on distinct proper nouns, categories, or status names.",
                 "items": {
                   "type": "string",
                   "description": "A specific value or entity likely to appear in database columns."
                 },
               },
            },
            "additionalProperties": false
          }
        })
    }
}

async fn get_search_data_catalog_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Loads all available datasets with fresh value injection for searchable dimensions based on the provided search terms. Returns comprehensive dataset information with injected relevant values to assist with analysis and planning.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "865efb24-4355-4abb-aaf7-260af0f06794").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!(
                "Failed to get prompt system message for tool description: {}",
                e
            );
            "Loads all available datasets with fresh value injection for searchable dimensions based on the provided search terms. Returns comprehensive dataset information with injected relevant values to assist with analysis and planning. Previous search results are automatically truncated to keep conversations manageable.".to_string()
        }
    }
}

// NEW: Helper function to generate embeddings for multiple texts in a batch
async fn generate_embeddings_batch(texts: Vec<String>) -> Result<Vec<(String, Vec<f32>)>> {
    if texts.is_empty() {
        return Ok(vec![]);
    }
    
    let litellm_client = LiteLLMClient::new(None, None);
    
    let embedding_request = EmbeddingRequest {
        model: "text-embedding-3-small".to_string(),
        input: texts.clone(),
        dimensions: Some(1536),
        encoding_format: Some("float".to_string()),
        user: None,
    };
    
    debug!(count = texts.len(), "Generating embeddings in batch");
    
    let embedding_response = litellm_client
        .generate_embeddings(embedding_request)
        .await
        .context("Failed to generate embeddings batch")?;
        
    if embedding_response.data.len() != texts.len() {
        warn!(
            "Mismatch between input text count ({}) and returned embedding count ({})",
            texts.len(),
            embedding_response.data.len()
        );
    }

    let mut results = Vec::with_capacity(texts.len());
    for (index, text) in texts.into_iter().enumerate() {
        if let Some(embedding_data) = embedding_response.data.get(index) {
            results.push((text, embedding_data.embedding.clone()));
        } else {
            error!(term = %text, index = index, "Could not find corresponding embedding in batch response");
        }
    }
    
    Ok(results)
}

// Helper function to process a serde_yaml::Value representing a single model (old-style)
// for searchable dimensions.
fn process_model_value_for_searchable_dimensions(
    model_val: &serde_yaml::Value,
    model_name_from_val: &str,
) -> Vec<SearchableDimension> {
    let mut dimensions = Vec::new();
    if let Some(dims_val) = model_val.get("dimensions").and_then(|d| d.as_sequence()) {
        for dim_val in dims_val {
            if dim_val.get("searchable").and_then(|s| s.as_bool()).unwrap_or(false) {
                let dimension_name = dim_val.get("name")
                    .and_then(|n| n.as_str())
                    .unwrap_or("unknown_dimension")
                    .to_string();
                dimensions.push(SearchableDimension {
                    model_name: model_name_from_val.to_string(),
                    dimension_name: dimension_name.clone(),
                    dimension_path: vec!["models".to_string(), model_name_from_val.to_string(), "dimensions".to_string(), dimension_name],
                });
            }
        }
    }
    dimensions
}

/// Parse YAML content to find models with searchable dimensions
fn extract_searchable_dimensions(yml_content: &str) -> Result<Vec<SearchableDimension>> {
    let mut searchable_dimensions = Vec::new();

    // Try parsing with Model (new spec for a single model file)
    match serde_yaml::from_str::<Model>(yml_content) {
        Ok(model_spec) => {
            debug!("Successfully parsed yml_content with Model for extract_searchable_dimensions (single new-spec model)");
            for dimension in model_spec.dimensions {
                if dimension.searchable {
                    searchable_dimensions.push(SearchableDimension {
                        model_name: model_spec.name.clone(),
                        dimension_name: dimension.name.clone(),
                        dimension_path: vec!["models".to_string(), model_spec.name.clone(), "dimensions".to_string(), dimension.name.clone()],
                    });
                }
            }
        }
        Err(e_spec_root) => {
            debug!(
                "Failed to parse yml_content directly as Model (error: {}), trying generic serde_yaml::Value for extract_searchable_dimensions. YML might be a list or old format.",
                e_spec_root
            );
            let yaml_val: serde_yaml::Value = serde_yaml::from_str(yml_content)
                .context("Failed to parse dataset YAML content as generic Value after Model parse failed")?;

            if let Some(models_list) = yaml_val.get("models").and_then(|m| m.as_sequence()) {
                debug!("Found 'models' list in YAML for extract_searchable_dimensions; processing list items.");
                for model_item_val in models_list {
                    if let Ok(model_in_list) = serde_yaml::from_value::<Model>(model_item_val.clone()) {
                        for dimension in model_in_list.dimensions {
                            if dimension.searchable {
                                searchable_dimensions.push(SearchableDimension {
                                    model_name: model_in_list.name.clone(),
                                    dimension_name: dimension.name.clone(),
                                    dimension_path: vec!["models".to_string(), model_in_list.name.clone(), "dimensions".to_string(), dimension.name.clone()],
                                });
                            }
                        }
                    } else {
                        if let Some(model_name_in_list) = model_item_val.get("name").and_then(|n| n.as_str()) {
                            searchable_dimensions.extend(process_model_value_for_searchable_dimensions(model_item_val, model_name_in_list));
                        } else {
                            warn!("Skipping item in 'models' list for searchable_dimensions due to missing name: {:?}", model_item_val);
                        }
                    }
                }
            } else {
                debug!("No 'models' list found in YAML, treating root as a single (possibly old-style) model for extract_searchable_dimensions");
                if let Some(model_name_at_root) = yaml_val.get("name").and_then(|n| n.as_str()){
                     searchable_dimensions.extend(process_model_value_for_searchable_dimensions(&yaml_val, model_name_at_root));
                } else {
                    warn!("Could not extract searchable dimensions from root YAML object as it has no 'models' list and no 'name' at root: {:?}", yaml_val);
                }
            }
        }
    }
    if searchable_dimensions.is_empty() && !yml_content.trim().is_empty() {
        debug!("extract_searchable_dimensions: No searchable dimensions found in non-empty YML content.");
    }
    Ok(searchable_dimensions)
}

// Helper function to process a serde_yaml::Value representing a single model (old-style)
// for database information.
fn process_model_value_for_database_info(
    model_val: &serde_yaml::Value,
    model_name_from_val: &str,
    database_info_map: &mut HashMap<String, HashMap<String, HashMap<String, Vec<String>>>>
) {
    let table_name = model_name_from_val.to_string();

    let database_name = model_val
        .get("database")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown_db")
        .to_string();

    let schema_name = model_val
        .get("schema")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown_schema")
        .to_string();

    let mut columns = Vec::new();
    if let Some(dimensions) = model_val.get("dimensions").and_then(|d| d.as_sequence()) {
        for dim in dimensions {
            if let Some(dim_name) = dim.get("name").and_then(|n| n.as_str()) {
                columns.push(dim_name.to_string());
                if let Some(expr) = dim.get("expr").and_then(|e| e.as_str()) {
                    if expr != dim_name {
                        columns.push(expr.to_string());
                    }
                }
            }
        }
    }
    if let Some(measures) = model_val.get("measures").and_then(|m| m.as_sequence()) {
        for measure in measures {
            if let Some(measure_name) = measure.get("name").and_then(|n| n.as_str()) {
                columns.push(measure_name.to_string());
                if let Some(expr) = measure.get("expr").and_then(|e| e.as_str()) {
                     if expr != measure_name {
                        columns.push(expr.to_string());
                    }
                }
            }
        }
    }
    if let Some(metrics) = model_val.get("metrics").and_then(|m| m.as_sequence()) {
        for metric in metrics {
            if let Some(metric_name) = metric.get("name").and_then(|n| n.as_str()) {
                columns.push(metric_name.to_string());
            }
        }
    }
    database_info_map
        .entry(database_name)
        .or_default()
        .entry(schema_name)
        .or_default()
        .insert(table_name, columns);
}

/// Extract database structure from YAML content based on actual model structure
fn extract_database_info_from_yaml(yml_content: &str) -> Result<HashMap<String, HashMap<String, HashMap<String, Vec<String>>>>> {
    let mut database_info: HashMap<String, HashMap<String, HashMap<String, Vec<String>>>> = HashMap::new();

    // Try parsing with Model (new spec for a single model file)
    match serde_yaml::from_str::<Model>(yml_content) {
        Ok(model_spec) => {
            debug!("Successfully parsed yml_content with Model for extract_database_info_from_yaml (single new-spec model)");
            let db_name = model_spec.database.as_deref().unwrap_or("unknown_db").to_string();
            let sch_name = model_spec.schema.as_deref().unwrap_or("unknown_schema").to_string();
            let tbl_name = model_spec.name.clone();

            let mut columns = Vec::new();
            for dim in model_spec.dimensions { columns.push(dim.name); }
            for measure in model_spec.measures { columns.push(measure.name); }
            for metric in model_spec.metrics { columns.push(metric.name); }

            database_info
                .entry(db_name)
                .or_default()
                .entry(sch_name)
                .or_default()
                .insert(tbl_name, columns);
        }
        Err(e_spec_root) => {
            debug!(
                "Failed to parse yml_content directly as Model (error: {}), trying generic serde_yaml::Value for extract_database_info_from_yaml. YML might be a list or old format.",
                e_spec_root
            );
            let yaml_val: serde_yaml::Value = serde_yaml::from_str(yml_content)
                .context("Failed to parse dataset YAML content as generic Value after Model parse failed (extract_database_info)")?;

            if let Some(models_list) = yaml_val.get("models").and_then(|m| m.as_sequence()) {
                debug!("Found 'models' list in YAML for extract_database_info_from_yaml; processing list items.");
                for model_item_val in models_list {
                    if let Ok(model_in_list) = serde_yaml::from_value::<Model>(model_item_val.clone()) {
                        let db_name = model_in_list.database.as_deref().unwrap_or("unknown_db").to_string();
                        let sch_name = model_in_list.schema.as_deref().unwrap_or("unknown_schema").to_string();
                        let tbl_name = model_in_list.name.clone();
                        let mut columns_in_list_item = Vec::new();
                        for dim in model_in_list.dimensions { columns_in_list_item.push(dim.name); }
                        for measure in model_in_list.measures { columns_in_list_item.push(measure.name); }
                        for metric in model_in_list.metrics { columns_in_list_item.push(metric.name); }
                        database_info.entry(db_name).or_default().entry(sch_name).or_default().insert(tbl_name, columns_in_list_item);
                    } else {
                        if let Some(model_name_in_list) = model_item_val.get("name").and_then(|n| n.as_str()) {
                            process_model_value_for_database_info(model_item_val, model_name_in_list, &mut database_info);
                        } else {
                             warn!("Skipping item in 'models' list for database_info due to missing name: {:?}", model_item_val);
                        }
                    }
                }
            } else {
                debug!("No 'models' list found, treating YAML root as a single (possibly old-style) model for extract_database_info_from_yaml");
                 if let Some(model_name_at_root) = yaml_val.get("name").and_then(|n| n.as_str()){
                    process_model_value_for_database_info(&yaml_val, model_name_at_root, &mut database_info);
                } else {
                    warn!("Could not extract database info from root YAML object as it has no 'models' list and no 'name' at root: {:?}", yaml_val);
                }
            }
        }
    }
    if database_info.is_empty() && !yml_content.trim().is_empty() {
        debug!("extract_database_info_from_yaml: No database info extracted from non-empty YML content.");
    }
    Ok(database_info)
}

// Helper function to inject values into a single model represented by serde_yaml::Value
fn inject_values_into_single_model_yaml(
    model_yaml: &mut serde_yaml::Value,
    current_model_name: &str,
    database_info: &HashMap<String, HashMap<String, HashMap<String, Vec<String>>>>,
    searchable_dimensions: &[SearchableDimension],
    all_found_values: &[FoundValueInfo],
) {
    // Find the database and schema for this specific current_model_name using the comprehensive database_info
    let mut model_db_details: Option<(&str, &str)> = None;

    for (db_name_key, schemas) in database_info {
        for (schema_name_key, tables) in schemas {
            if tables.contains_key(current_model_name) {
                model_db_details = Some((db_name_key, schema_name_key));
                break;
            }
        }
        if model_db_details.is_some() { break; }
    }

    let (model_database_name, model_schema_name) = if let Some(details) = model_db_details {
        details
    } else {
         warn!(model=%current_model_name, "inject_values_into_single_model_yaml: Could not find database/schema info for model. Skipping value injection for its dimensions."
        );
        return;
    };

    if let Some(dimensions_yaml_seq) = model_yaml.get_mut("dimensions").and_then(|d| d.as_sequence_mut()) {
        for dim_yaml_value in dimensions_yaml_seq {
            let dim_name_opt = dim_yaml_value.get("name").and_then(|n| n.as_str());

            if let Some(dim_name_str) = dim_name_opt {
                let is_searchable = searchable_dimensions.iter().any(|sd| {
                    sd.model_name == current_model_name && sd.dimension_name == dim_name_str
                });

                if !is_searchable {
                    continue;
                }

                let relevant_values_for_dim: Vec<String> = all_found_values
                    .iter()
                    .filter(|found_val| {
                        found_val.database_name.eq_ignore_ascii_case(model_database_name)
                            && found_val.schema_name.eq_ignore_ascii_case(model_schema_name)
                            && found_val.table_name.eq_ignore_ascii_case(current_model_name)
                            && found_val.column_name.eq_ignore_ascii_case(dim_name_str)
                    })
                    .map(|found_val| found_val.value.clone())
                    .collect::<std::collections::HashSet<_>>()
                    .into_iter()
                    .take(20)
                    .collect();

                if !relevant_values_for_dim.is_empty() {
                    debug!(
                        model = %current_model_name,
                        dimension = %dim_name_str,
                        values_count = relevant_values_for_dim.len(),
                        "Injecting relevant_values into YAML dimension"
                    );
                    if let Some(dim_map) = dim_yaml_value.as_mapping_mut() {
                        dim_map.insert(
                            serde_yaml::Value::String("relevant_values".to_string()),
                            serde_yaml::Value::Sequence(
                                relevant_values_for_dim.iter()
                                    .map(|v| serde_yaml::Value::String(v.clone()))
                                    .collect()
                            ),
                        );
                    }
                }
            }
        }
    }
}

/// Injects relevant values from a pre-compiled list into the YML of a dataset.
async fn inject_prefound_values_into_yml(
    yml_content: &str,
    all_found_values: &[FoundValueInfo],
) -> Result<String> {
    if yml_content.trim().is_empty() {
        debug!("inject_prefound_values_into_yml: YML content is empty, returning as is.");
        return Ok(String::new());
    }
    
    let mut root_yaml_val: serde_yaml::Value = serde_yaml::from_str(yml_content)
        .context("Failed to parse dataset YAML for injecting values")?;

    let database_info = match extract_database_info_from_yaml(yml_content) {
        Ok(info) => info,
        Err(e) => {
            warn!(error = %e, "inject_prefound_values_into_yml: Failed to extract comprehensive database info from YAML, attempting to proceed without it for value injection structure but matches might fail.");
            HashMap::new()
        }
    };

    let searchable_dimensions = match extract_searchable_dimensions(yml_content) {
        Ok(dims) => dims,
        Err(e) => {
             warn!(error = %e, "inject_prefound_values_into_yml: Failed to extract comprehensive searchable dimensions from YAML, skipping value injection.");
            return Ok(yml_content.to_string());
        }
    };

    if searchable_dimensions.is_empty() {
        debug!("inject_prefound_values_into_yml: No searchable dimensions found in YAML content based on comprehensive extraction. Returning original YML.");
        return Ok(yml_content.to_string());
    }
     if all_found_values.is_empty() {
        debug!("inject_prefound_values_into_yml: No pre-found values provided. Returning original YML.");
        return Ok(yml_content.to_string());
    }

    if let Some(models_list_yaml_mut) = root_yaml_val.get_mut("models").and_then(|m| m.as_sequence_mut()) {
        debug!("inject_prefound_values_into_yml: Processing 'models' list structure.");
        for model_yaml_item_mut in models_list_yaml_mut {
            let model_name_owned: Option<String> = model_yaml_item_mut.get("name").and_then(|n| n.as_str()).map(String::from);

            if let Some(name_str) = model_name_owned {
                inject_values_into_single_model_yaml(
                    model_yaml_item_mut,
                    &name_str,
                    &database_info,
                    &searchable_dimensions,
                    all_found_values,
                );
            } else {
                warn!("inject_prefound_values_into_yml: Skipping model in 'models' list due to missing 'name' field.");
            }
        }
    } else {
        debug!("inject_prefound_values_into_yml: Processing YAML as a single root model structure.");
        let model_name_owned_root: Option<String> = root_yaml_val.get("name").and_then(|n| n.as_str()).map(String::from);

        if let Some(name_str_root) = model_name_owned_root {
            inject_values_into_single_model_yaml(
                &mut root_yaml_val,
                &name_str_root,
                &database_info,
                &searchable_dimensions,
                all_found_values,
            );
        } else {
            warn!(
                "inject_prefound_values_into_yml: Root YAML object is not a 'models' list and lacks a 'name' field. Cannot process as single model. YML: {:?}",
                root_yaml_val.as_mapping().map(|m| m.keys().collect::<Vec<_>>())
            );
            return Ok(yml_content.to_string());
        }
    }
    
    serde_yaml::to_string(&root_yaml_val)
        .context("Failed to convert updated YAML with injected values back to string")
}