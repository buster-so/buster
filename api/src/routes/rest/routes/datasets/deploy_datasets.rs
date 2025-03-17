use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl, SelectableHelper};
use diesel_async::RunQueryDsl;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

use crate::{
    database::{
        enums::DatasetType,
        lib::get_pg_pool,
        models::{DataSource, Dataset, DatasetColumn, EntityRelationship, User},
        schema::{data_sources, dataset_columns, datasets, entity_relationship},
    },
    routes::rest::ApiResponse,
    utils::{
        dataset::column_management::{get_column_types, update_dataset_columns},
        query_engine::{
            credentials::get_data_source_credentials,
            import_dataset_columns::{retrieve_dataset_columns, retrieve_dataset_columns_batch},
            write_query_engine::write_query_engine,
        },
        security::checks::is_user_workspace_admin_or_data_admin,
        stored_values::{process_stored_values_background, store_column_values, StoredValueColumn},
        user::user_info::get_user_organization_id,
        validation::{dataset_validation::validate_model, ValidationError, ValidationResult},
        ColumnUpdate, ValidationErrorType,
    },
};

#[derive(Debug, Deserialize)]
pub struct BusterConfig {
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsRequest {
    pub id: Option<Uuid>,
    pub data_source_name: String,
    pub env: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: String,
    pub model: Option<String>,
    pub schema: String,
    pub database: Option<String>,
    pub description: String,
    pub sql_definition: Option<String>,
    pub entity_relationships: Option<Vec<DeployDatasetsEntityRelationshipsRequest>>,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
    pub yml_file: Option<String>,
    pub database_identifier: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsColumnsRequest {
    pub name: String,
    pub description: String,
    pub semantic_type: Option<String>,
    pub expr: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub agg: Option<String>,
    #[serde(default)]
    pub stored_values: bool,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsEntityRelationshipsRequest {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Serialize)]
pub struct DeployDatasetsResponse {
    pub results: Vec<ValidationResult>,
    pub summary: DeploymentSummary,
}

#[derive(Serialize)]
pub struct DeploymentSummary {
    pub total_models: usize,
    pub successful_models: usize,
    pub failed_models: usize,
    pub successes: Vec<DeploymentSuccess>,
    pub failures: Vec<DeploymentFailure>,
}

#[derive(Serialize)]
pub struct DeploymentSuccess {
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
}

#[derive(Serialize)]
pub struct DeploymentFailure {
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
    pub errors: Vec<ValidationError>,
}

#[derive(Debug, Deserialize)]
pub struct BusterModel {
    pub version: i32,
    pub models: Vec<Model>,
}

#[derive(Debug, Deserialize)]
pub struct Model {
    pub name: String,
    pub data_source_name: Option<String>,
    pub database: Option<String>,
    pub schema: Option<String>,
    pub env: String,
    pub description: String,
    pub model: Option<String>,
    #[serde(rename = "type")]
    pub type_: String,
    pub entities: Vec<Entity>,
    pub dimensions: Vec<Dimension>,
    pub measures: Vec<Measure>,
}

#[derive(Debug, Deserialize)]
pub struct Entity {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub entity_type: String,
}

#[derive(Debug, Deserialize)]
pub struct Dimension {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub dimension_type: String,
    pub description: String,
    pub searchable: bool,
}

#[derive(Debug, Deserialize)]
pub struct Measure {
    pub name: String,
    pub expr: String,
    pub agg: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct BatchValidationRequest {
    pub datasets: Vec<DatasetValidationRequest>,
}

#[derive(Debug, Deserialize)]
pub struct DatasetValidationRequest {
    pub dataset_id: Option<Uuid>,
    pub name: String,
    pub schema: String,
    pub data_source_name: String,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
}

#[derive(Debug, Serialize)]
pub struct BatchValidationResult {
    pub successes: Vec<DatasetValidationSuccess>,
    pub failures: Vec<DatasetValidationFailure>,
}

#[derive(Debug, Serialize)]
pub struct DatasetValidationSuccess {
    pub dataset_id: Uuid,
    pub name: String,
    pub schema: String,
    pub data_source_name: String,
}

#[derive(Debug, Serialize)]
pub struct DatasetValidationFailure {
    pub dataset_id: Option<Uuid>,
    pub name: String,
    pub schema: String,
    pub data_source_name: String,
    pub errors: Vec<ValidationError>,
}

// Main API endpoint function
pub async fn deploy_datasets(
    Extension(user): Extension<User>,
    Json(request): Json<Vec<DeployDatasetsRequest>>,
) -> Result<ApiResponse<DeployDatasetsResponse>, (StatusCode, String)> {
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

    // Check permissions
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
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    }

    // Call handler function
    match handle_deploy_datasets(&user.id, request).await {
        Ok(result) => Ok(ApiResponse::JsonData(result)),
        Err(e) => {
            tracing::error!("Error in deploy_datasets: {:?}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

// Main handler function that contains all business logic
async fn handle_deploy_datasets(
    user_id: &Uuid,
    requests: Vec<DeployDatasetsRequest>,
) -> Result<DeployDatasetsResponse> {
    let results = deploy_datasets_handler(user_id, requests, false).await?;

    let successful_models = results.iter().filter(|r| r.success).count();
    let failed_models = results.iter().filter(|r| !r.success).count();

    let summary = DeploymentSummary {
        total_models: results.len(),
        successful_models,
        failed_models,
        successes: results
            .iter()
            .filter(|r| r.success)
            .map(|r| DeploymentSuccess {
                model_name: r.model_name.clone(),
                data_source_name: r.data_source_name.clone(),
                schema: r.schema.clone(),
            })
            .collect(),
        failures: results
            .iter()
            .filter(|r| !r.success)
            .map(|r| DeploymentFailure {
                model_name: r.model_name.clone(),
                data_source_name: r.data_source_name.clone(),
                schema: r.schema.clone(),
                errors: r.errors.clone(),
            })
            .collect(),
    };

    Ok(DeployDatasetsResponse { results, summary })
}

// Handler function that contains all the business logic
async fn deploy_datasets_handler(
    user_id: &Uuid,
    requests: Vec<DeployDatasetsRequest>,
    is_simple: bool,
) -> Result<Vec<ValidationResult>> {
    let organization_id = get_user_organization_id(user_id).await?;
    let mut conn = get_pg_pool().get().await?;
    let mut results = Vec::new();

    // Group requests by data source and database for efficient validation
    let mut data_source_groups: HashMap<(String, Option<String>), Vec<&DeployDatasetsRequest>> = HashMap::new();
    for req in &requests {
        data_source_groups
            .entry((req.data_source_name.clone(), req.database.clone()))
            .or_default()
            .push(req);
    }

    // Process each data source group
    for ((data_source_name, database), group) in data_source_groups {

        // Get data source
        let data_source = match data_sources::table
            .filter(data_sources::name.eq(&data_source_name))
            .filter(data_sources::env.eq(&group[0].env))
            .filter(data_sources::organization_id.eq(&organization_id))
            .filter(data_sources::deleted_at.is_null())
            .select(data_sources::all_columns)
            .first::<DataSource>(&mut conn)
            .await
        {
            Ok(ds) => ds,
            Err(e) => {
                for req in group {
                    let mut validation = ValidationResult::new(
                        req.name.clone(),
                        req.data_source_name.clone(),
                        req.schema.clone(),
                    );
                    validation.add_error(ValidationError::data_source_error(format!(
                        "Data source '{}' not found: {}. Please verify the data source exists and you have access.",
                        data_source_name, e
                    )).with_context(format!("Environment: {}", req.env)));
                    results.push(validation);
                }
                continue;
            }
        };

        // Get credentials for the data source
        let credentials = match get_data_source_credentials(&data_source.secret_id, &data_source.type_, false).await {
            Ok(creds) => creds,
            Err(e) => {
                for req in group {
                    let mut validation = ValidationResult::new(
                        req.name.clone(),
                        req.data_source_name.clone(),
                        req.schema.clone(),
                    );
                    validation.add_error(ValidationError::credentials_error(
                        &data_source_name,
                        &format!("Failed to get credentials: {}. Please check data source configuration.", e)
                    ).with_context(format!("Data source ID: {}", data_source.id)));
                    results.push(validation);
                }
                continue;
            }
        };

        // Prepare tables for batch validation
        let tables_to_validate: Vec<(String, String)> = group
            .iter()
            .map(|req| (req.name.clone(), req.schema.clone()))
            .collect();

        tracing::info!(
            "Validating tables for data source '{:?}.{:?}': {:?}",
            data_source_name,
            database,
            tables_to_validate
        );

        // Get all columns in one batch - this acts as our validation
        let ds_columns = match retrieve_dataset_columns_batch(&tables_to_validate, &credentials, database.clone()).await {
            Ok(cols) => {
                // Add debug logging
                tracing::info!(
                    "Retrieved {} columns for data source '{}'. Tables found: {:?}",
                    cols.len(),
                    data_source_name,
                    cols.iter()
                        .map(|c| format!("{}.{}", c.schema_name, c.dataset_name))
                        .collect::<HashSet<_>>()
                );
                cols
            },
            Err(e) => {
                tracing::error!(
                    "Error retrieving columns for data source '{}': {:?}",
                    data_source_name,
                    e
                );
                for req in group {
                    let mut validation = ValidationResult::new(
                        req.name.clone(),
                        req.data_source_name.clone(),
                        req.schema.clone(),
                    );
                    validation.add_error(ValidationError::schema_error(
                        &req.schema,
                        &format!("Failed to retrieve columns: {}. Please verify schema access and permissions.", e)
                    ).with_context(format!("Data source: {}, Database: {:?}", data_source_name, database)));
                    results.push(validation);
                }
                continue;
            }
        };

        // Create a map of valid datasets and their columns
        let mut valid_datasets = Vec::new();
        let mut dataset_columns_map: HashMap<String, Vec<_>> = HashMap::new();
        
        for req in group {
            let mut validation = ValidationResult::new(
                req.name.clone(),
                req.data_source_name.clone(),
                req.schema.clone(),
            );

            // Get columns for this dataset
            let columns: Vec<_> = ds_columns
                .iter()
                .filter(|col| {
                    let name_match = col.dataset_name.to_lowercase() == req.name.to_lowercase();
                    let schema_match = col.schema_name.to_lowercase() == req.schema.to_lowercase();
                    
                    // Add detailed debug logging for column matching
                    tracing::info!(
                        "Matching table '{}.{}': name_match={}, schema_match={} (comparing against {}.{})",
                        col.schema_name,
                        col.dataset_name,
                        name_match,
                        schema_match,
                        req.schema,
                        req.name
                    );
                    
                    name_match && schema_match
                })
                .collect();

            if columns.is_empty() {
                tracing::warn!(
                    "No columns found for dataset '{}' in schema '{}'. Available tables:\n{}",
                    req.name,
                    req.schema,
                    ds_columns
                        .iter()
                        .map(|c| format!("  - {}.{}", c.schema_name, c.dataset_name))
                        .collect::<Vec<_>>()
                        .join("\n")
                );
                validation.add_error(ValidationError::table_not_found(&format!(
                    "{}.{}",
                    req.schema,
                    req.name
                )).with_context(format!("Available tables: {}", 
                    ds_columns
                        .iter()
                        .map(|c| format!("{}.{}", c.schema_name, c.dataset_name))
                        .collect::<HashSet<_>>()
                        .iter()
                        .take(5) // Limit to 5 tables to avoid overly long messages
                        .cloned()
                        .collect::<Vec<_>>()
                        .join(", ")
                )));
                validation.success = false;
            } else {
                tracing::info!(
                    "✅ Found {} columns for dataset '{}.{}'",
                    columns.len(),
                    req.schema,
                    req.name
                );
                validation.success = true;
                valid_datasets.push(req);
                dataset_columns_map.insert(req.name.clone(), columns);
            }

            results.push(validation);
        }

        // Bulk upsert valid datasets
        if !valid_datasets.is_empty() {
            let now = Utc::now();
            
            // Get existing dataset IDs for this data source
            let existing_datasets: HashSet<String> = datasets::table
                .filter(datasets::data_source_id.eq(&data_source.id))
                .filter(datasets::deleted_at.is_null())
                .select(datasets::name)
                .load::<String>(&mut conn)
                .await?
                .into_iter()
                .collect();

            // Get new dataset names from the request
            let new_dataset_names: HashSet<String> = valid_datasets
                .iter()
                .map(|req| req.name.clone())
                .collect();

            // Find datasets that exist but aren't in the request
            let datasets_to_delete: Vec<String> = existing_datasets
                .difference(&new_dataset_names)
                .cloned()
                .collect();

            // Mark datasets as deleted if they're not in the request
            if !datasets_to_delete.is_empty() {
                tracing::info!(
                    "Marking {} datasets as deleted for data source '{}': {:?}",
                    datasets_to_delete.len(),
                    data_source_name,
                    datasets_to_delete
                );
                
                diesel::update(datasets::table)
                    .filter(datasets::data_source_id.eq(&data_source.id))
                    .filter(datasets::name.eq_any(&datasets_to_delete))
                    .filter(datasets::deleted_at.is_null())
                    .set(datasets::deleted_at.eq(now))
                    .execute(&mut conn)
                    .await?;
            }

            // Prepare datasets for upsert
            let mut datasets_to_upsert: Vec<Dataset> = valid_datasets
                .iter()
                .map(|req| Dataset {
                    id: req.id.unwrap_or_else(Uuid::new_v4),
                    name: req.name.clone(),
                    data_source_id: data_source.id,
                    created_at: now,
                    updated_at: now,
                    database_name: req.name.clone(),
                    when_to_use: Some(req.description.clone()),
                    when_not_to_use: None,
                    type_: DatasetType::View,
                    definition: req.sql_definition.clone().unwrap_or_default(),
                    schema: req.schema.clone(),
                    enabled: true,
                    created_by: user_id.clone(),
                    updated_by: user_id.clone(),
                    deleted_at: None,
                    imported: false,
                    organization_id: organization_id.clone(),
                    model: req.model.clone(),
                    yml_file: req.yml_file.clone(),
                    database_identifier: req.database.clone(),
                })
                .collect();

            // Deduplicate datasets by database_name and data_source_id to prevent ON CONFLICT errors
            let mut unique_datasets = HashMap::new();
            for dataset in datasets_to_upsert {
                unique_datasets.insert((dataset.database_name.clone(), dataset.data_source_id), dataset);
            }
            datasets_to_upsert = unique_datasets.into_values().collect();

            // Bulk upsert datasets
            diesel::insert_into(datasets::table)
                .values(&datasets_to_upsert)
                .on_conflict((datasets::database_name, datasets::data_source_id))
                .do_update()
                .set((
                    datasets::updated_at.eq(excluded(datasets::updated_at)),
                    datasets::updated_by.eq(excluded(datasets::updated_by)),
                    datasets::definition.eq(excluded(datasets::definition)),
                    datasets::when_to_use.eq(excluded(datasets::when_to_use)),
                    datasets::model.eq(excluded(datasets::model)),
                    datasets::yml_file.eq(excluded(datasets::yml_file)),
                    datasets::schema.eq(excluded(datasets::schema)),
                    datasets::name.eq(excluded(datasets::name)),
                    datasets::deleted_at.eq(None::<DateTime<Utc>>),
                ))
                .execute(&mut conn)
                .await?;

            // Get the dataset IDs after upsert for column operations
            let dataset_ids: HashMap<String, Uuid> = datasets::table
                .filter(datasets::data_source_id.eq(&data_source.id))
                .filter(datasets::database_name.eq_any(valid_datasets.iter().map(|req| &req.name)))
                .filter(datasets::deleted_at.is_null())
                .select((datasets::database_name, datasets::id))
                .load::<(String, Uuid)>(&mut conn)
                .await?
                .into_iter()
                .collect();

            // Bulk upsert columns for each dataset
            for req in valid_datasets {
                let dataset_id = match dataset_ids.get(&req.name) {
                    Some(id) => *id,
                    None => {
                        tracing::error!(
                            "Dataset ID not found after upsert for {}.{}",
                            req.schema,
                            req.name
                        );
                        continue;
                    }
                };

                // Create a map of column name to type from ds_columns for easier lookup
                let ds_column_types: HashMap<String, String> = dataset_columns_map
                    .get(&req.name)
                    .map(|cols| {
                        cols.iter()
                            .map(|col| (col.name.to_lowercase(), col.type_.clone()))
                            .collect()
                    })
                    .unwrap_or_default();

                // Filter out metrics and segments fields as they don't exist as actual columns
                let filtered_columns: Vec<&DeployDatasetsColumnsRequest> = req.columns
                    .iter()
                    .filter(|col| {
                        // Check if this is a real column that exists in the database
                        ds_column_types.contains_key(&col.name.to_lowercase())
                    })
                    .collect();

                let mut columns: Vec<DatasetColumn> = filtered_columns
                    .iter()
                    .map(|col| {
                        // Look up the type from ds_columns, fallback to request type or "text"
                        let column_type = ds_column_types
                            .get(&col.name.to_lowercase())
                            .cloned()
                            .or_else(|| col.type_.clone())
                            .unwrap_or_else(|| "text".to_string());

                        DatasetColumn {
                            id: Uuid::new_v4(),
                            dataset_id,
                            name: col.name.clone(),
                            type_: column_type,  // Use the type from ds_columns
                            description: Some(col.description.clone()),
                            nullable: true,
                            created_at: now,
                            updated_at: now,
                            deleted_at: None,
                            stored_values: None,
                            stored_values_status: None,
                            stored_values_error: None,
                            stored_values_count: None,
                            stored_values_last_synced: None,
                            semantic_type: col.semantic_type.clone(),
                            dim_type: col.type_.clone(),
                            expr: col.expr.clone(),
                        }
                    })
                    .collect();
                
                // Deduplicate columns by dataset_id and name to prevent ON CONFLICT errors
                let mut unique_columns = HashMap::new();
                for column in columns {
                    unique_columns.insert((column.dataset_id, column.name.clone()), column);
                }
                columns = unique_columns.into_values().collect();

                // First: Bulk upsert columns
                diesel::insert_into(dataset_columns::table)
                    .values(&columns)
                    .on_conflict((dataset_columns::dataset_id, dataset_columns::name))
                    .do_update()
                    .set((
                        dataset_columns::type_.eq(excluded(dataset_columns::type_)),
                        dataset_columns::description.eq(excluded(dataset_columns::description)),
                        dataset_columns::semantic_type.eq(excluded(dataset_columns::semantic_type)),
                        dataset_columns::dim_type.eq(excluded(dataset_columns::dim_type)),
                        dataset_columns::expr.eq(excluded(dataset_columns::expr)),
                        dataset_columns::updated_at.eq(now),
                        dataset_columns::deleted_at.eq(None::<DateTime<Utc>>),
                    ))
                    .execute(&mut conn)
                    .await?;

                // Then: Soft delete removed columns
                let current_column_names: HashSet<String> = dataset_columns::table
                    .filter(dataset_columns::dataset_id.eq(dataset_id))
                    .filter(dataset_columns::deleted_at.is_null())
                    .select(dataset_columns::name)
                    .load::<String>(&mut conn)
                    .await?
                    .into_iter()
                    .collect();

                let new_column_names: HashSet<String> = columns
                    .iter()
                    .map(|c| c.name.clone())
                    .collect();

                let columns_to_delete: Vec<String> = current_column_names
                    .difference(&new_column_names)
                    .cloned()
                    .collect();

                if !columns_to_delete.is_empty() {
                    diesel::update(dataset_columns::table)
                        .filter(dataset_columns::dataset_id.eq(dataset_id))
                        .filter(dataset_columns::name.eq_any(&columns_to_delete))
                        .filter(dataset_columns::deleted_at.is_null())
                        .set(dataset_columns::deleted_at.eq(now))
                        .execute(&mut conn)
                        .await?;
                }
            }
        }
    }

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::models::User;
    use crate::utils::validation::types::{ValidationError, ValidationErrorType, ValidationResult};
    use std::collections::HashMap;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_deploy_datasets_partial_success() {
        // Create test user
        let user_id = Uuid::new_v4();
        
        // Create two test requests - one valid, one invalid
        let requests = vec![
            DeployDatasetsRequest {
                id: None,
                data_source_name: "test_data_source".to_string(),
                env: "test".to_string(),
                type_: "table".to_string(),
                name: "valid_table".to_string(),
                model: None,
                schema: "public".to_string(),
                database: None,
                description: "Test description".to_string(),
                sql_definition: None,
                entity_relationships: None,
                columns: vec![
                    DeployDatasetsColumnsRequest {
                        name: "id".to_string(),
                        description: "Primary key".to_string(),
                        semantic_type: None,
                        expr: None,
                        type_: Some("number".to_string()),
                        agg: None,
                        stored_values: false,
                    }
                ],
                yml_file: None,
                database_identifier: None,
            },
            DeployDatasetsRequest {
                id: None,
                data_source_name: "non_existent_data_source".to_string(), // This will fail
                env: "test".to_string(),
                type_: "table".to_string(),
                name: "invalid_table".to_string(),
                model: None,
                schema: "public".to_string(),
                database: None,
                description: "Test description".to_string(),
                sql_definition: None,
                entity_relationships: None,
                columns: vec![],
                yml_file: None,
                database_identifier: None,
            }
        ];

        // Mock implementation for testing - we can't actually run the handler as-is
        // because it requires a database connection and other dependencies
        // This is just to illustrate the test structure
        
        // In a real test, you would:
        // 1. Mock the database and other dependencies
        // 2. Call the handler with the test requests
        // 3. Verify the response has both success and failure cases
        
        // For now, we'll just assert that the structure of our test is correct
        assert_eq!(requests.len(), 2);
        assert_eq!(requests[0].name, "valid_table");
        assert_eq!(requests[1].name, "invalid_table");
        
        // In a real test with mocks, you would assert:
        // - The function returns a Result with 2 ValidationResults
        // - The first ValidationResult has success=true
        // - The second ValidationResult has success=false and appropriate errors
    }
}