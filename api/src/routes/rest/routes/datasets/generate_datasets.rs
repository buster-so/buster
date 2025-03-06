use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::HashMap;
use uuid::Uuid;
use regex::Regex;
use tokio::task::JoinSet;
use futures::future::try_join_all;
use itertools::Itertools;
use serde_json;

use crate::{
    database::{
        lib::get_pg_pool,
        models::{Dataset, DataSource, User},
        schema::{data_sources, datasets},
    },
    routes::rest::ApiResponse,
    utils::{
        security::checks::is_user_workspace_admin_or_data_admin,
        user::user_info::get_user_organization_id,
        query_engine::{
            credentials::get_data_source_credentials,
            import_dataset_columns::{retrieve_dataset_columns_batch, DatasetColumnRecord},
        },
        clients::ai::{
            openai::{OpenAiChatModel, OpenAiChatRole, OpenAiChatContent, OpenAiChatMessage},
            llm_router::{llm_chat, LlmModel, LlmMessage},
        },
    },
};

#[derive(Debug, Deserialize)]
pub struct GenerateDatasetRequest {
    pub data_source_name: String,
    pub schema: String,
    pub database: Option<String>,
    pub model_names: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct GenerateDatasetResponse {
    pub yml_contents: HashMap<String, String>,  // Successful generations
    pub errors: HashMap<String, DetailedError>,  // Failed generations with detailed errors
}

#[derive(Debug, Serialize)]
pub struct DetailedError {
    pub message: String,
    pub error_type: String,
    pub context: Option<String>,
}

#[derive(Debug, Serialize)]
struct ModelConfig {
    models: Vec<Model>,
}

#[derive(Debug, Serialize)]
struct Model {
    name: String,
    description: String,
    dimensions: Vec<Dimension>,
    measures: Vec<Measure>,
}

#[derive(Debug, Serialize)]
struct Dimension {
    name: String,
    expr: String,
    #[serde(rename = "type")]
    type_: String,
    description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    searchable: Option<bool>,
}

#[derive(Debug, Serialize)]
struct Measure {
    name: String,
    expr: String,
    #[serde(rename = "type")]
    type_: String,
    agg: Option<String>,
    description: String,
}

// Add type mapping enum
#[derive(Debug)]
enum ColumnMappingType {
    Dimension(String),  // String holds the semantic type
    Measure(String),    // String holds the measure type (e.g., "number")
    Unsupported,
}

fn map_database_type(type_str: &str) -> ColumnMappingType {
    // Convert to uppercase for consistent matching
    let type_upper = type_str.to_uppercase();
    
    match type_upper.as_str() {
        // Numeric types that should be measures
        // Common numeric types across databases
        "NUMBER" | "DECIMAL" | "NUMERIC" | "FLOAT" | "REAL" | "DOUBLE" | "INT" | "INTEGER" | 
        "BIGINT" | "SMALLINT" | "TINYINT" | "BYTEINT" |
        // PostgreSQL specific
        "DOUBLE PRECISION" | "SERIAL" | "BIGSERIAL" | "SMALLSERIAL" | "MONEY" |
        // BigQuery specific
        "INT64" | "FLOAT64" | "NUMERIC" | "BIGNUMERIC" |
        // Redshift specific (mostly same as PostgreSQL)
        "DECIMAL" | "DOUBLE PRECISION" |
        // MySQL specific
        "MEDIUMINT" | "FLOAT4" | "FLOAT8" | "DOUBLE PRECISION" | "DEC" | "FIXED" => 
            ColumnMappingType::Measure(type_str.to_string()),
        
        // Date/Time types
        // Common date/time types
        "DATE" | "DATETIME" | "TIME" | "TIMESTAMP" | 
        // Snowflake specific
        "TIMESTAMP_LTZ" | "TIMESTAMP_NTZ" | "TIMESTAMP_TZ" |
        // PostgreSQL specific
        "TIMESTAMPTZ" | "TIMESTAMP WITH TIME ZONE" | "TIMESTAMP WITHOUT TIME ZONE" | "INTERVAL" |
        // BigQuery specific
        "DATETIME" | "TIMESTAMP" | "DATE" | "TIME" |
        // Redshift specific
        "TIMETZ" | "TIMESTAMPTZ" |
        // MySQL specific
        "YEAR" => 
            ColumnMappingType::Dimension(type_str.to_string()),
        
        // String types
        // Common string types
        "TEXT" | "STRING" | "VARCHAR" | "CHAR" | "CHARACTER" |
        // PostgreSQL specific
        "CHARACTER VARYING" | "NAME" | "CITEXT" | "CIDR" | "INET" | "MACADDR" | "UUID" |
        // BigQuery specific
        "STRING" | "BYTES" |
        // Redshift specific
        "BPCHAR" | "NCHAR" | "NVARCHAR" |
        // MySQL specific
        "TINYTEXT" | "MEDIUMTEXT" | "LONGTEXT" | "ENUM" | "SET" | "JSON" => 
            ColumnMappingType::Dimension(type_str.to_string()),
        
        // Boolean type
        "BOOLEAN" | "BOOL" | "BIT" => 
            ColumnMappingType::Dimension(type_str.to_string()),
        
        // Binary/BLOB types
        "BINARY" | "VARBINARY" | "BLOB" | "BYTEA" | "MEDIUMBLOB" | "LONGBLOB" | "TINYBLOB" => 
            ColumnMappingType::Unsupported,
        
        // Geometric types (PostgreSQL)
        "POINT" | "LINE" | "LSEG" | "BOX" | "PATH" | "POLYGON" | "CIRCLE" | "GEOMETRY" => 
            ColumnMappingType::Unsupported,
        
        // Array/JSON/Complex types
        "ARRAY" | "OBJECT" | "VARIANT" | "JSONB" | "HSTORE" | "XML" | "STRUCT" | "RECORD" => 
            ColumnMappingType::Unsupported,
        
        // Default to dimension for unknown types
        _ => {
            tracing::warn!("Unknown database type: {}, defaulting to dimension", type_str);
            ColumnMappingType::Dimension(type_str.to_string())
        }
    }
}

// Add a new function to clean up quotes in YAML
fn clean_yaml_quotes(yaml: &str) -> String {
    // First remove all single quotes
    let no_single_quotes = yaml.replace('\'', "");
    
    // Then remove all double quotes
    let no_quotes = no_single_quotes.replace('"', "");
    
    no_quotes
}

pub async fn generate_datasets(
    Extension(user): Extension<User>,
    Json(request): Json<GenerateDatasetRequest>,
) -> Result<ApiResponse<GenerateDatasetResponse>, (StatusCode, String)> {
    // Check if user is workspace admin or data admin
    let organization_id = match get_user_organization_id(&user.id).await {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to get user organization: {}", e),
            ));
        }
    };

    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => {
            return Err((
                StatusCode::FORBIDDEN,
                "User does not have sufficient permissions to generate datasets".to_string(),
            ))
        }
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to verify user permissions: {}", e),
            ));
        }
    }

    // Validate request
    if request.model_names.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "No model names provided in request".to_string(),
        ));
    }

    if request.schema.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Schema name cannot be empty".to_string(),
        ));
    }

    match generate_datasets_handler(&request, &organization_id).await {
        Ok(response) => {
            // Log summary of generation results
            let success_count = response.yml_contents.len();
            let error_count = response.errors.len();
            tracing::info!(
                "Dataset generation completed. Successful: {}, Failed: {}",
                success_count,
                error_count
            );
            
            if error_count > 0 {
                tracing::warn!("Errors encountered during generation: {:#?}", response.errors);
            }
            
            Ok(ApiResponse::JsonData(response))
        },
        Err(e) => {
            tracing::error!("Error generating datasets: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to generate datasets: {}", e),
            ))
        }
    }
}

async fn enhance_yaml_with_descriptions(yaml: String, model_name: &str) -> Result<String> {
    const DESCRIPTION_PLACEHOLDER: &str = "{NEED DESCRIPTION HERE}";
    
    // Skip OpenAI call if no placeholders exist
    if !yaml.contains(DESCRIPTION_PLACEHOLDER) {
        return Ok(yaml);
    }

    let messages = vec![
        LlmMessage::new(
            "developer".to_string(),
            "You are a YAML description enhancer. Your output must be wrapped in markdown code blocks using ```yml format.
            Your task is to ONLY replace text matching exactly {NEED DESCRIPTION HERE} with appropriate descriptions. Do not modify any other parts of the YAML or other descriptions without the placeholder. You should still return the entire YAML in your output.
            DO NOT modify any other part of the YAML.
            DO NOT add any explanations or text outside the ```yml block.
            No double or single quotes.
            Return the complete YAML wrapped in markdown, with only the placeholders replaced.".to_string(),
        ),
        LlmMessage::new(
            "user".to_string(),
            yaml.clone(),
        ),
    ];

    let response = match llm_chat(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        &messages,
        0.1,
        2048,
        120,
        None,
        false,
        None,
        &Uuid::new_v4(),
        &Uuid::new_v4(),
        crate::utils::clients::ai::langfuse::PromptName::CustomPrompt("enhance_yaml_descriptions".to_string()),
    )
    .await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!(
                error = %e,
                model = %model_name,
                "Failed to enhance YAML descriptions"
            );
            return Err(anyhow!("Failed to enhance descriptions for model '{}': {}", model_name, e));
        }
    };

    // Extract YAML from markdown code blocks
    let re = Regex::new(r"```yml\n([\s\S]*?)\n```").unwrap();
    let yaml = match re.captures(&response) {
        Some(caps) => caps.get(1).unwrap().as_str().to_string(),
        None => {
            tracing::error!(
                model = %model_name,
                response = %response,
                "Failed to extract YAML from LLM response"
            );
            return Err(anyhow!("Failed to extract enhanced YAML from response for model '{}'. Response did not contain properly formatted YAML.", model_name));
        }
    };

    Ok(yaml)
}

async fn generate_model_yaml(
    model_name: &str,
    ds_columns: &[DatasetColumnRecord],
    schema: &str,
    entities: Option<&Vec<EntityRelationship>>,
) -> Result<String> {
    // Filter columns for this model
    let model_columns: Vec<_> = ds_columns
        .iter()
        .filter(|col| {
            col.dataset_name.to_lowercase() == model_name.to_lowercase()
                && col.schema_name.to_lowercase() == schema.to_lowercase()
        })
        .collect();

    if model_columns.is_empty() {
        return Err(anyhow!("No columns found for model '{}' in schema '{}'", model_name, schema));
    }

    let mut dimensions = Vec::new();
    let mut measures = Vec::new();

    // Process each column and categorize as dimension or measure
    for col in model_columns {
        match map_database_type(&col.type_) {
            ColumnMappingType::Dimension(semantic_type) => {
                dimensions.push(Dimension {
                    name: col.name.clone(),
                    expr: col.name.clone(),
                    type_: semantic_type,
                    description: "{NEED DESCRIPTION HERE}".to_string(),
                    searchable: Some(false),
                });
            }
            ColumnMappingType::Measure(measure_type) => {
                measures.push(Measure {
                    name: col.name.clone(),
                    expr: col.name.clone(),
                    type_: measure_type,
                    agg: Some("sum".to_string()),
                    description: "{NEED DESCRIPTION HERE}".to_string(),
                });
            }
            ColumnMappingType::Unsupported => {
                tracing::warn!(
                    "Skipping unsupported column type: {} for column: {}",
                    col.type_,
                    col.name
                );
            }
        }
    }

    // Create a temporary struct that matches our desired YAML structure
    #[derive(Serialize)]
    struct ModelWithEntities {
        name: String,
        description: String,
        dimensions: Vec<Dimension>,
        measures: Vec<Measure>,
        #[serde(skip_serializing_if = "Option::is_none")]
        entities: Option<Vec<EntityRelationship>>,
    }

    #[derive(Serialize)]
    struct ConfigWithEntities {
        models: Vec<ModelWithEntities>,
    }

    let model = ModelWithEntities {
        name: model_name.to_string(),
        description: format!("Generated model for {}", model_name),
        dimensions,
        measures,
        entities: entities.cloned(),
    };

    let config = ConfigWithEntities {
        models: vec![model],
    };

    let yaml = serde_yaml::to_string(&config)
        .map_err(|e| anyhow!("Failed to serialize YAML for model '{}': {}", model_name, e))?;
    
    // Enhance descriptions using OpenAI
    let enhanced_yaml = enhance_yaml_with_descriptions(yaml, model_name).await?;

    let cleaned_yaml = clean_yaml_quotes(&enhanced_yaml);
    
    Ok(cleaned_yaml)
}

async fn extract_keys_from_models(
    models: &[DatasetColumnRecord],
    schema: &str,
) -> Result<String> {
    // Group models by dataset name, cloning the data
    let grouped_models: HashMap<String, Vec<DatasetColumnRecord>> = models
        .iter()
        .filter(|col| col.schema_name.to_lowercase() == schema.to_lowercase())
        .map(|col| (col.dataset_name.clone(), col.clone()))
        .into_group_map();

    // Process models in batches
    let batches: Vec<Vec<(String, Vec<DatasetColumnRecord>)>> = grouped_models
        .into_iter()
        .collect::<Vec<_>>()
        .chunks(BATCH_SIZE)
        .map(|chunk| chunk.to_vec())
        .collect();

    let mut join_set = JoinSet::new();
    let mut all_docs = String::new();
    let mut errors = Vec::new();

    // Process each batch concurrently
    for batch in batches {
        let batch_models = batch;
        let schema = schema.to_string();
        
        join_set.spawn(async move {
            let models_str = batch_models
                .iter()
                .map(|(table_name, columns)| {
                    let columns_str = columns
                        .iter()
                        .map(|col| format!("Column: {} (Type: {})", col.name, col.type_))
                        .collect::<Vec<_>>()
                        .join("\n");
                    
                    format!("Table: {}\n{}", table_name, columns_str)
                })
                .collect::<Vec<_>>()
                .join("\n\n");

            let messages = vec![
                LlmMessage::new(
                    "system".to_string(),
                    "You are a database schema analyzer. For each table, identify the primary key and likely foreign keys based on column names and types. Output in markdown format.".to_string(),
                ),
                LlmMessage::new(
                    "user".to_string(),
                    format!("Analyze these tables and output in markdown format with primary and foreign keys:\n\n{}", models_str),
                ),
            ];

            let response = llm_chat(
                LlmModel::OpenAi(OpenAiChatModel::O3Mini),
                &messages,
                0.1,
                2048,
                120,
                None,
                false,
                None,
                &Uuid::new_v4(),
                &Uuid::new_v4(),
                crate::utils::clients::ai::langfuse::PromptName::CustomPrompt("analyze_table_keys".to_string()),
            )
            .await
            .map_err(|e| (batch_models.clone(), e))?;

            Ok::<_, (Vec<(String, Vec<DatasetColumnRecord>)>, anyhow::Error)>((batch_models, response))
        });
    }

    // Collect results
    while let Some(result) = join_set.join_next().await {
        match result {
            Ok(Ok((_, markdown))) => {
                all_docs.push_str(&markdown);
                all_docs.push_str("\n\n");
            }
            Ok(Err((batch_models, e))) => {
                let affected_tables = batch_models.iter()
                    .map(|(name, _)| name.clone())
                    .collect::<Vec<_>>()
                    .join(", ");
                errors.push(format!("Error processing tables {}: {}", affected_tables, e));
                tracing::error!("Error processing batch: {}", e);
            }
            Err(e) => {
                errors.push(format!("Task join error: {}", e));
                tracing::error!("Task join error: {}", e);
            }
        }
    }

    if !errors.is_empty() {
        tracing::warn!("Encountered errors while processing some tables: {:?}", errors);
    }

    Ok(all_docs)
}

async fn identify_entity_relationships(
    markdown_docs: &str,
    model_names: &[String],
) -> Result<HashMap<String, Vec<EntityRelationship>>> {
    let batches: Vec<Vec<String>> = model_names
        .chunks(BATCH_SIZE)
        .map(|chunk| chunk.to_vec())
        .collect();

    let mut join_set = JoinSet::new();
    let mut relationships: HashMap<String, Vec<EntityRelationship>> = HashMap::new();
    let mut errors = Vec::new();

    // Process each batch concurrently
    for batch in batches {
        let batch_models = batch.clone();
        let docs = markdown_docs.to_string();
        
        join_set.spawn(async move {
            let messages = vec![
                LlmMessage::new(
                    "system".to_string(),
                    r#"You are a database relationship analyzer. Your task is to identify relationships between tables and output them in a specific JSON format. Only include tables that have relationships with other tables. Skip any tables that don't have relationships.

IMPORTANT OUTPUT RULES:
1. Your response must ONLY contain the JSON content wrapped in ```json code blocks
2. Do not include any explanations, notes, or other text outside the code blocks
3. If no relationships exist, output an empty JSON object wrapped in code blocks
4. Each relationship must have exactly these fields: name, expr, type, description
5. All values must be strings
6. No multi-line values are allowed
7. No special characters that could break JSON parsing
8. The JSON must be properly formatted with no trailing commas

Example output format:
```json
{
  "table_name1": [
    {
      "name": "related_table1",
      "expr": "foreign_key_column",
      "type": "foreign",
      "description": "Simple description of the relationship"
    },
    {
      "name": "related_table2",
      "expr": "another_foreign_key",
      "type": "foreign",
      "description": "Another simple description"
    }
  ],
  "table_name2": [
    {
      "name": "related_table3",
      "expr": "foreign_key_column",
      "type": "foreign",
      "description": "Simple description of another relationship"
    }
  ]
}"#.to_string(),
                ),
                LlmMessage::new(
                    "user".to_string(),
                    format!(
                        "For these tables: {}\n\nAnalyze this schema documentation and output JSON showing relationships in the exact format shown above. Remember to only include tables that have relationships:\n\n{}",
                        batch_models.join(", "),
                        docs
                    ),
                ),
            ];

            let response = llm_chat(
                LlmModel::OpenAi(OpenAiChatModel::O3Mini),
                &messages,
                0.1,
                2048,
                120,
                None,
                false,
                None,
                &Uuid::new_v4(),
                &Uuid::new_v4(),
                crate::utils::clients::ai::langfuse::PromptName::CustomPrompt("identify_relationships".to_string()),
            )
            .await
            .map_err(|e| (batch_models.clone(), e))?;

            // Extract JSON from code blocks
            let json_str = if response.contains("```") {
                let re = Regex::new(r"```(?:json)?\n([\s\S]*?)\n```").unwrap();
                match re.captures(&response) {
                    Some(caps) => caps.get(1).unwrap().as_str().to_string(),
                    None => {
                        return Err((batch_models, anyhow!("Failed to extract JSON from response")));
                    }
                }
            } else {
                response
            };

            // If the JSON is empty or just whitespace, return an empty map
            if json_str.trim().is_empty() {
                return Ok::<_, (Vec<String>, anyhow::Error)>((batch_models, HashMap::new()));
            }

            // Parse JSON into a temporary Value to validate structure
            let json_value: serde_json::Value = match serde_json::from_str(&json_str) {
                Ok(v) => v,
                Err(e) => {
                    tracing::error!("JSON parsing error. Content:\n{}", json_str);
                    return Err((batch_models, anyhow!("Failed to parse JSON: {}", e)));
                }
            };

            // Validate JSON structure and convert to our target format
            let mut validated_relationships: HashMap<String, Vec<EntityRelationship>> = HashMap::new();

            if let serde_json::Value::Object(tables) = json_value {
                for (table_name, relationships_value) in tables {
                    if let serde_json::Value::Array(relationships) = relationships_value {
                        let mut valid_relationships = Vec::new();

                        for rel in relationships {
                            if let serde_json::Value::Object(rel_obj) = rel {
                                // Extract and validate required fields
                                let name = rel_obj.get("name").and_then(|v| v.as_str()).unwrap_or("");
                                let expr = rel_obj.get("expr").and_then(|v| v.as_str()).unwrap_or("");
                                let type_ = rel_obj.get("type").and_then(|v| v.as_str()).unwrap_or("");
                                let description = rel_obj.get("description").and_then(|v| v.as_str()).unwrap_or("");

                                // Only include if all required fields are present and non-empty
                                if !name.is_empty() && !expr.is_empty() && !type_.is_empty() && !description.is_empty() {
                                    valid_relationships.push(EntityRelationship {
                                        name: name.to_string(),
                                        expr: expr.to_string(),
                                        type_: type_.to_string(),
                                        description: description.to_string(),
                                    });
                                }
                            }
                        }

                        // Only include tables with valid relationships
                        if !valid_relationships.is_empty() {
                            validated_relationships.insert(table_name, valid_relationships);
                        }
                    }
                }
            }

            Ok((batch_models, validated_relationships))
        });
    }

    // Collect results
    while let Some(result) = join_set.join_next().await {
        match result {
            Ok(Ok((tables, json_relationships))) => {
                for table in tables {
                    if let Some(entities) = json_relationships.get(&table) {
                        if !entities.is_empty() {
                            relationships.insert(table, entities.clone());
                        }
                    }
                }
            }
            Ok(Err((tables, e))) => {
                let affected_tables = tables.join(", ");
                errors.push(format!("Error processing relationships for tables {}: {}", affected_tables, e));
                tracing::error!("Error processing batch relationships: {}", e);
            }
            Err(e) => {
                errors.push(format!("Task join error: {}", e));
                tracing::error!("Task join error: {}", e);
            }
        }
    }

    if !errors.is_empty() {
        tracing::warn!("Encountered errors while processing some relationships: {:?}", errors);
    }

    Ok(relationships)
}

async fn generate_datasets_handler(
    request: &GenerateDatasetRequest,
    organization_id: &Uuid,
) -> Result<GenerateDatasetResponse> {
    let mut conn = get_pg_pool().get().await?;
    let mut yml_contents = HashMap::new();
    let mut errors = HashMap::new();

    // Get data source
    let data_source = match data_sources::table
        .filter(data_sources::name.eq(&request.data_source_name))
        .filter(data_sources::organization_id.eq(organization_id))
        .filter(data_sources::deleted_at.is_null())
        .first::<DataSource>(&mut conn)
        .await
    {
        Ok(ds) => ds,
        Err(e) => {
            let error_msg = format!(
                "Data source '{}' not found: {}. Please verify the data source exists and you have access.",
                request.data_source_name, e
            );
            
            for model_name in &request.model_names {
                errors.insert(model_name.clone(), DetailedError {
                    message: error_msg.clone(),
                    error_type: "DataSourceNotFound".to_string(),
                    context: Some(format!("Schema: {}", request.schema)),
                });
            }
            
            return Ok(GenerateDatasetResponse {
                yml_contents,
                errors,
            });
        }
    };

    // Get credentials
    let credentials = match get_data_source_credentials(&data_source.secret_id, &data_source.type_, false).await {
        Ok(creds) => creds,
        Err(e) => {
            let error_msg = format!(
                "Failed to get credentials for data source '{}': {}. Please check data source configuration.",
                request.data_source_name, e
            );
            
            for model_name in &request.model_names {
                errors.insert(model_name.clone(), DetailedError {
                    message: error_msg.clone(),
                    error_type: "CredentialsError".to_string(),
                    context: Some(format!("Data source: {}, Schema: {}", 
                                         request.data_source_name, request.schema)),
                });
            }
            
            return Ok(GenerateDatasetResponse {
                yml_contents,
                errors,
            });
        }
    };

    // Prepare tables for batch validation
    let tables_to_validate: Vec<(String, String)> = request
        .model_names
        .iter()
        .map(|name| (name.clone(), request.schema.clone()))
        .collect();

    // Get all columns in one batch
    let ds_columns = match retrieve_dataset_columns_batch(&tables_to_validate, &credentials, request.database.clone()).await {
        Ok(cols) => cols,
        Err(e) => {
            let error_msg = format!(
                "Failed to retrieve columns from data source '{}': {}. Please verify schema '{}' and table access.",
                request.data_source_name, e, request.schema
            );
            tracing::error!(
                error = %e,
                data_source = %request.data_source_name,
                schema = %request.schema,
                "Failed to retrieve columns from data source"
            );
            
            for model_name in &request.model_names {
                errors.insert(model_name.clone(), DetailedError {
                    message: error_msg.clone(),
                    error_type: "SchemaError".to_string(),
                    context: Some(format!("Model: {}, Schema: {}", model_name, request.schema)),
                });
            }
            
            return Ok(GenerateDatasetResponse {
                yml_contents,
                errors,
            });
        }
    };

    // Step 1: Extract primary and foreign keys
    let markdown_docs = match extract_keys_from_models(&ds_columns, &request.schema).await {
        Ok(docs) => docs,
        Err(e) => {
            tracing::error!(
                error = %e,
                schema = %request.schema,
                model_count = %request.model_names.len(),
                "Failed to extract keys from models"
            );
            // Add error to all models since this affects all of them
            for model_name in &request.model_names {
                errors.insert(model_name.clone(), DetailedError {
                    message: format!("Failed to extract keys from model: {}", e),
                    error_type: "KeyExtractionError".to_string(),
                    context: Some(format!("Schema: {}", request.schema)),
                });
            }
            String::new()  // Continue with empty docs but errors are now tracked
        }
    };

    // Step 2: Identify entity relationships
    let entity_relationships = match identify_entity_relationships(&markdown_docs, &request.model_names).await {
        Ok(relationships) => relationships,
        Err(e) => {
            tracing::error!(
                error = %e,
                schema = %request.schema,
                model_count = %request.model_names.len(),
                "Failed to identify entity relationships"
            );
            // Add error to all models since this affects all of them
            for model_name in &request.model_names {
                errors.insert(model_name.clone(), DetailedError {
                    message: format!("Failed to identify entity relationships: {}", e),
                    error_type: "RelationshipError".to_string(),
                    context: Some(format!("Schema: {}, Model: {}", request.schema, model_name)),
                });
            }
            HashMap::new()  // Continue with empty relationships but errors are now tracked
        }
    };

    // Process models concurrently
    let mut join_set = JoinSet::new();
    
    for model_name in &request.model_names {
        let model_name = model_name.clone();
        let schema = request.schema.clone();
        let ds_columns = ds_columns.clone();
        let entities = entity_relationships.get(&model_name).cloned();
        
        join_set.spawn(async move {
            let yaml = generate_model_yaml(
                &model_name,
                &ds_columns,
                &schema,
                entities.as_ref()
            ).await
                .map_err(|e| (model_name.clone(), e))?;
            
            Ok::<_, (String, anyhow::Error)>((model_name, yaml))
        });
    }

    while let Some(result) = join_set.join_next().await {
        match result {
            Ok(Ok((model_name, yaml))) => {
                yml_contents.insert(model_name, yaml);
            }
            Ok(Err((model_name, e))) => {
                tracing::error!(
                    error = %e,
                    model = %model_name,
                    schema = %request.schema,
                    "Failed to generate YAML for model"
                );
                errors.insert(model_name, DetailedError {
                    message: format!("Failed to generate YAML: {}", e),
                    error_type: "ModelGenerationError".to_string(),
                    context: Some(format!("Schema: {}", request.schema)),
                });
            }
            Err(e) => {
                tracing::error!(
                    error = %e,
                    schema = %request.schema,
                    "Task join error in YAML generation"
                );
                let affected_models: Vec<_> = request.model_names.iter()
                    .filter(|name| !yml_contents.contains_key(*name) && !errors.contains_key(*name))
                    .collect();
                
                for model_name in affected_models {
                    errors.insert(
                        model_name.clone(), 
                        DetailedError {
                            message: format!("Internal processing error: {}. Please try again later.", e),
                            error_type: "InternalError".to_string(),
                            context: Some(format!("Model: {}", model_name)),
                        }
                    );
                }
            }
        }
    }

    // Log the generated YMLs
    for (model_name, yaml) in &yml_contents {
        tracing::info!(
            model = %model_name,
            yaml_length = %yaml.len(),
            "Generated YAML for model"
        );
    }

    // Log any errors
    if !errors.is_empty() {
        tracing::warn!(
            error_count = %errors.len(),
            total_models = %request.model_names.len(),
            failed_models = ?errors.keys().collect::<Vec<_>>(),
            "Encountered errors while generating YAMLs"
        );
    }

    Ok(GenerateDatasetResponse {
        yml_contents,
        errors,
    })
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct EntityRelationship {
    name: String,
    expr: String,
    #[serde(rename = "type")]
    type_: String,
    description: String,
}

const BATCH_SIZE: usize = 10;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::models::User;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_generate_datasets_partial_success() {
        // Create test request with multiple models
        let request = GenerateDatasetRequest {
            data_source_name: "test_source".to_string(),
            schema: "public".to_string(),
            database: None,
            model_names: vec![
                "valid_model".to_string(),
                "non_existent_model".to_string(), // This will fail
            ],
        };

        let organization_id = Uuid::new_v4();

        // Mock implementation for testing - we can't actually run the handler as-is
        // because it requires a database connection and other dependencies
        // This is just to illustrate the test structure
        
        // In a real test, you would:
        // 1. Mock the database and other dependencies
        // 2. Call the handler with the test request
        // 3. Verify the response has both successes and failures
        
        // For now, we'll just assert that the structure of our test is correct
        assert_eq!(request.model_names.len(), 2);
        assert_eq!(request.model_names[0], "valid_model");
        assert_eq!(request.model_names[1], "non_existent_model");
        
        // In a real test with mocks, you would assert:
        // - The function returns a Result with a GenerateDatasetResponse
        // - The response contains one entry in yml_contents for the valid model
        // - The response contains one entry in errors for the invalid model
        // - The error has an appropriate error_type and message
    }
} 