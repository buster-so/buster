use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::HashMap;
use uuid::Uuid;
use regex::Regex;
use tokio::task::JoinSet;
use middleware::AuthenticatedUser;

use crate::{
    database::{
        pool::get_pg_pool,
        models::DataSource,
        schema::data_sources,
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
            openai::OpenAiChatModel,
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
    pub yml_contents: HashMap<String, String>,
    pub errors: HashMap<String, String>,
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
    #[allow(dead_code)]
    Dimension(String),  // String holds the semantic type
    #[allow(dead_code)]
    Measure(String),    // String holds the measure type (e.g., "number")
    Unsupported,
}

fn map_snowflake_type(type_str: &str) -> ColumnMappingType {
    // Convert to uppercase for consistent matching
    let type_upper = type_str.to_uppercase();
    
    match type_upper.as_str() {
        // Numeric types that should be measures
        "NUMBER" | "DECIMAL" | "NUMERIC" | "FLOAT" | "REAL" | "DOUBLE" | "INT" | "INTEGER" | 
        "BIGINT" | "SMALLINT" | "TINYINT" | "BYTEINT" => ColumnMappingType::Measure("number".to_string()),
        
        // Date/Time types
        "DATE" | "DATETIME" | "TIME" | "TIMESTAMP" | "TIMESTAMP_LTZ" | 
        "TIMESTAMP_NTZ" | "TIMESTAMP_TZ" => ColumnMappingType::Dimension("timestamp".to_string()),
        
        // String types
        "TEXT" | "STRING" | "VARCHAR" | "CHAR" | "CHARACTER" => ColumnMappingType::Dimension("string".to_string()),
        
        // Boolean type
        "BOOLEAN" | "BOOL" => ColumnMappingType::Dimension("boolean".to_string()),
        
        // Unsupported types
        "ARRAY" | "OBJECT" | "VARIANT" => ColumnMappingType::Unsupported,
        
        // Default to dimension for unknown types
        _ => {
            tracing::warn!("Unknown Snowflake type: {}, defaulting to string dimension", type_str);
            ColumnMappingType::Dimension("string".to_string())
        }
    }
}

pub async fn generate_datasets(
    Extension(user): Extension<AuthenticatedUser>,
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
            Your task is to ONLY replace text matching exactly \"{NEED DESCRIPTION HERE}\" with appropriate descriptions. Do not modify any other parts of the YAML or other descriptions without the placeholder. You should still return the entire YAML in your output.
            DO NOT modify any other part of the YAML.
            DO NOT add any explanations or text outside the ```yml block.
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
        match map_snowflake_type(&col.type_) {
            ColumnMappingType::Dimension(_) => {
                dimensions.push(Dimension {
                    name: col.name.clone(),
                    expr: col.name.clone(),
                    type_: col.type_.clone(),
                    description: "{NEED DESCRIPTION HERE}".to_string(),
                    searchable: Some(false),
                });
            }
            ColumnMappingType::Measure(_) => {
                measures.push(Measure {
                    name: col.name.clone(),
                    expr: col.name.clone(),
                    type_: col.type_.clone(),
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
    
    Ok(enhanced_yaml)
}

async fn generate_datasets_handler(
    request: &GenerateDatasetRequest,
    organization_id: &Uuid,
) -> Result<GenerateDatasetResponse> {
    let mut conn = get_pg_pool().get().await?;

    // Get data source
    let data_source = match data_sources::table
        .filter(data_sources::name.eq(&request.data_source_name))
        .filter(data_sources::organization_id.eq(organization_id))
        .filter(data_sources::deleted_at.is_null())
        .first::<DataSource>(&mut conn)
        .await
    {
        Ok(ds) => ds,
        Err(e) => return Err(anyhow!("Data source not found: {}", e)),
    };

    // Get credentials
    let credentials = get_data_source_credentials(&data_source.id, &data_source.type_, false).await?;

    // Prepare tables for batch validation
    let tables_to_validate: Vec<(String, String)> = request
        .model_names
        .iter()
        .map(|name| (name.clone(), request.schema.clone()))
        .collect();

    // Get all columns in one batch
    let ds_columns = match retrieve_dataset_columns_batch(&tables_to_validate, &credentials, request.database.clone()).await {
        Ok(cols) => cols,
        Err(e) => return Err(anyhow!("Failed to get columns from data source: {}", e)),
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

    let mut yml_contents = HashMap::new();
    let mut errors = HashMap::new();

    while let Some(result) = join_set.join_next().await {
        match result {
            Ok((model_name, Ok(yaml))) => {
                yml_contents.insert(model_name, yaml);
            }
            Ok((model_name, Err(e))) => {
                errors.insert(model_name, e.to_string());
            }
            Err(e) => {
                tracing::error!("Task join error: {:?}", e);
                return Err(anyhow!("Task execution failed"));
            }
        }
    }

    Ok(GenerateDatasetResponse {
        yml_contents,
        errors,
    })
} 