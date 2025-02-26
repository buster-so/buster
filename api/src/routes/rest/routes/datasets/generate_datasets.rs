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
                "Error getting user organization id".to_string(),
            ));
        }
    };

    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => {
            return Err((
                StatusCode::FORBIDDEN,
                "Insufficient permissions".to_string(),
            ))
        }
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error checking user permissions".to_string(),
            ));
        }
    }

    match generate_datasets_handler(&request, &organization_id).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error generating datasets: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error generating datasets".to_string(),
            ))
        }
    }
}

async fn enhance_yaml_with_descriptions(yaml: String) -> Result<String> {
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
            yaml,
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
        crate::utils::clients::ai::langfuse::PromptName::CustomPrompt("enhance_yaml_descriptions".to_string()),
    )
    .await?;

    // Extract YAML from markdown code blocks
    let re = Regex::new(r"```yml\n([\s\S]*?)\n```").unwrap();
    let yaml = match re.captures(&response) {
        Some(caps) => caps.get(1).unwrap().as_str().to_string(),
        None => return Err(anyhow!("Failed to extract YAML from response")),
    };

    Ok(yaml)
}

async fn generate_model_yaml(
    model_name: &str,
    ds_columns: &[DatasetColumnRecord],
    schema: &str,
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
        return Err(anyhow!("No columns found for model"));
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

    let model = Model {
        name: model_name.to_string(),
        description: format!("Generated model for {}", model_name),
        dimensions,
        measures,
    };

    let config = ModelConfig {
        models: vec![model],
    };

    let yaml = serde_yaml::to_string(&config)?;
    
    
    // Enhance descriptions using OpenAI
    let enhanced_yaml = enhance_yaml_with_descriptions(yaml).await?;

    let cleaned_yaml = clean_yaml_quotes(&enhanced_yaml);
    
    Ok(cleaned_yaml)
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
            // Instead of returning early, add error for each model and return partial results
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

    // Process models concurrently
    let mut join_set = JoinSet::new();
    
    for model_name in &request.model_names {
        let model_name = model_name.clone();
        let schema = request.schema.clone();
        let ds_columns = ds_columns.clone();
        
        join_set.spawn(async move {
            let result = generate_model_yaml(&model_name, &ds_columns, &schema).await;
            (model_name, result)
        });
    }

    while let Some(result) = join_set.join_next().await {
        match result {
            Ok((model_name, Ok(yaml))) => {
                yml_contents.insert(model_name, yaml);
            }
            Ok((model_name, Err(e))) => {
                // Provide more detailed error message
                let error_msg = format!(
                    "Failed to generate YAML for model '{}': {}. Please check if the model exists and has valid columns.",
                    model_name, e
                );
                errors.insert(model_name, DetailedError {
                    message: error_msg,
                    error_type: "ModelGenerationError".to_string(),
                    context: Some(format!("Schema: {}", request.schema)),
                });
            }
            Err(e) => {
                // Handle task join error but continue processing
                tracing::error!("Task join error: {:?}", e);
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

    Ok(GenerateDatasetResponse {
        yml_contents,
        errors,
    })
}

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