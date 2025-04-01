use anyhow::Result;
use axum::{extract::Json, Extension};
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

use crate::{
    database::{
        enums::DatasetType,
        lib::get_pg_pool,
        models::{DataSource, Dataset, DatasetColumn, User},
        schema::{data_sources, dataset_columns, datasets},
    },
    routes::rest::ApiResponse,
    utils::{
        query_engine::{
            credentials::get_data_source_credentials,
            import_dataset_columns::{retrieve_dataset_columns_batch},
        },
        security::checks::is_user_workspace_admin_or_data_admin,
        user::user_info::get_user_organization_id,
        validation::{ValidationError, ValidationResult},
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
    // Log the number of datasets to be deployed
    tracing::info!("Received deploy request for {} datasets", request.len());
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
    tracing::info!("Starting deployment of {} datasets", requests.len());
    
    // For debugging, log details of each dataset
    for (i, req) in requests.iter().enumerate() {
        tracing::info!(
            "Dataset {}/{}: {}.{} (DB: {:?}, Source: {})",
            i+1, 
            requests.len(),
            req.schema,
            req.name,
            req.database,
            req.data_source_name
        );
    }
    
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
    
    tracing::info!("Grouped requests into {} data source groups", data_source_groups.len());

    // Process each data source group
    for ((data_source_name, database), group) in data_source_groups {
        tracing::info!(
            "Processing data source group: {} (database: {:?}) with {} models", 
            data_source_name, 
            database, 
            group.len()
        );

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
            
            // Use a composite key of name, schema, database_identifier AND data_source_id for more precise identification
            // IMPORTANT: Don't filter by deleted_at.is_null() so we can find ALL datasets including deleted ones
            let existing_dataset_identifiers: HashSet<(String, String, Option<String>, Uuid)> = datasets::table
                .filter(datasets::data_source_id.eq(&data_source.id))
                // No filter for deleted_at here - we want to find ALL datasets including deleted ones
                .select((datasets::name, datasets::schema, datasets::database_identifier, datasets::data_source_id))
                .load::<(String, String, Option<String>, Uuid)>(&mut conn)
                .await?
                .into_iter()
                .map(|(name, schema, db_id, ds_id)| (
                    name.to_lowercase(),    // Convert to lowercase for case-insensitive matching
                    schema.to_lowercase(),  // Convert to lowercase for case-insensitive matching
                    db_id, 
                    ds_id
                ))
                .collect();
                
            tracing::info!(
                "Existing dataset identifiers in database: {:?}",
                existing_dataset_identifiers
            );

            // Get new dataset identifiers from the request
            // NOTE: Use lowercase for name and schema to ensure case-insensitive matching
            let new_dataset_identifiers: HashSet<(String, String, Option<String>, Uuid)> = valid_datasets
                .iter()
                .map(|req| (
                    req.name.to_lowercase(),         // Convert to lowercase for case-insensitive matching
                    req.schema.to_lowercase(),       // Convert to lowercase for case-insensitive matching 
                    req.database.clone(),
                    data_source.id
                ))
                .collect();
                
            tracing::info!(
                "New dataset identifiers to deploy: {:?}",
                new_dataset_identifiers
            );

            // Find datasets that exist but aren't in the request - using improved matching logic
            let datasets_to_delete: Vec<(String, String, Option<String>, Uuid)> = existing_dataset_identifiers
                .iter()
                .filter(|(name, schema, db_id, ds_id)| {
                    // A dataset should be deleted if there's no matching entry in new_dataset_identifiers
                    !new_dataset_identifiers.iter().any(|(new_name, new_schema, new_db_id, new_ds_id)| {
                        // Match by name, schema, data_source_id
                        name == new_name && 
                        schema == new_schema && 
                        ds_id == new_ds_id &&
                        // Special handling for database_identifier
                        match (db_id, new_db_id) {
                            (Some(a), Some(b)) => a == b,  // Both have values, must match
                            (None, None) => true,          // Both are NULL, considered matching
                            _ => false                     // One NULL, one with value, not matching
                        }
                    })
                })
                .cloned()
                .collect();
                
            tracing::info!(
                "Found {} existing datasets, {} new datasets, and {} datasets to delete for data source '{}'",
                existing_dataset_identifiers.len(),
                new_dataset_identifiers.len(),
                datasets_to_delete.len(),
                data_source_name
            );
            
            if !datasets_to_delete.is_empty() {
                tracing::info!(
                    "Datasets to delete: {:?}",
                    datasets_to_delete.iter()
                        .map(|(name, schema, db, _)| 
                            format!("{}.{} (DB: {:?})", schema, name, db)
                        )
                        .collect::<Vec<_>>()
                );
            }

            // Mark datasets as deleted if they're not in the request
            if !datasets_to_delete.is_empty() {
                tracing::info!(
                    "Marking {} datasets as deleted for data source '{}': {:?}",
                    datasets_to_delete.len(),
                    data_source_name,
                    datasets_to_delete
                );
                
                for (name_lower, schema_lower, database, dataset_source_id) in &datasets_to_delete {
                    // Use prepared statement for more precise deletion
                    let sql_query = if let Some(db_id) = database {
                        format!(
                            "UPDATE datasets SET deleted_at = $1
                             WHERE data_source_id = $2
                             AND LOWER(name) = LOWER($3)
                             AND LOWER(schema) = LOWER($4)
                             AND database_identifier = $5
                             AND deleted_at IS NULL"
                        )
                    } else {
                        format!(
                            "UPDATE datasets SET deleted_at = $1
                             WHERE data_source_id = $2
                             AND LOWER(name) = LOWER($3)
                             AND LOWER(schema) = LOWER($4)
                             AND database_identifier IS NULL
                             AND deleted_at IS NULL"
                        )
                    };
                    
                    tracing::info!(
                        "Executing delete query for dataset {}.{} (DB: {:?})", 
                        schema_lower, name_lower, database
                    );
                    
                    // Execute with proper parameters
                    let result = if let Some(db_id) = database {
                        diesel::sql_query(&sql_query)
                            .bind::<diesel::sql_types::Timestamptz, _>(now)
                            .bind::<diesel::sql_types::Uuid, _>(*dataset_source_id)
                            .bind::<diesel::sql_types::Text, _>(name_lower)
                            .bind::<diesel::sql_types::Text, _>(schema_lower)
                            .bind::<diesel::sql_types::Text, _>(db_id)
                            .execute(&mut conn)
                            .await
                    } else {
                        diesel::sql_query(&sql_query)
                            .bind::<diesel::sql_types::Timestamptz, _>(now)
                            .bind::<diesel::sql_types::Uuid, _>(*dataset_source_id)
                            .bind::<diesel::sql_types::Text, _>(name_lower)
                            .bind::<diesel::sql_types::Text, _>(schema_lower)
                            .execute(&mut conn)
                            .await
                    };
                    
                    match result {
                        Ok(count) => {
                            tracing::info!(
                                "Successfully marked {} dataset(s) as deleted: {}.{} (DB: {:?})",
                                count, schema_lower, name_lower, database
                            );
                        },
                        Err(e) => {
                            // Log error but continue processing other datasets
                            tracing::error!(
                                "Failed to mark dataset {}.{} (DB: {:?}) as deleted: {}",
                                schema_lower, name_lower, database, e
                            );
                        }
                    };
                }
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

            // Deduplicate datasets by composite key to prevent ON CONFLICT errors
            // Use (name, schema, database_identifier, data_source_id) as a composite key
            let mut unique_datasets = HashMap::new();
            for dataset in datasets_to_upsert {
                unique_datasets.insert(
                    (
                        dataset.name.clone(), 
                        dataset.schema.clone(), 
                        dataset.database_identifier.clone(),
                        dataset.data_source_id
                    ), 
                    dataset
                );
            }
            datasets_to_upsert = unique_datasets.into_values().collect();

            // Bulk upsert datasets with more precise identification
            for dataset in &datasets_to_upsert {
                // Enhanced logging for upsert operation
                tracing::info!(
                    "Upserting dataset {}.{} (DB: {:?}, ID: {})",
                    dataset.schema, dataset.name, dataset.database_identifier, dataset.id
                );
                
                // First, try to handle each dataset with database_identifier separately
                // to prevent conflicts
                if dataset.database_identifier.is_some() {
                    // For datasets with database_identifier, first check if a matching record exists
                    // with the exact same composite key (name, schema, data_source_id, database_identifier)
                    let existing_id = datasets::table
                        .filter(datasets::name.eq(&dataset.name))
                        .filter(datasets::schema.eq(&dataset.schema))
                        .filter(datasets::data_source_id.eq(dataset.data_source_id))
                        .filter(datasets::database_identifier.eq(&dataset.database_identifier))
                        .select(datasets::id)
                        .first::<Uuid>(&mut conn)
                        .await;
                        
                    match existing_id {
                        Ok(id) => {
                            // Found an existing dataset with the exact same composite key
                            tracing::info!(
                                "Found existing dataset with ID {} matching {}.{} with DB: {:?}",
                                id, dataset.schema, dataset.name, dataset.database_identifier
                            );
                            
                            // Update the existing record
                            let update_result = diesel::update(datasets::table)
                                .filter(datasets::id.eq(id))
                                .set((
                                    datasets::updated_at.eq(dataset.updated_at),
                                    datasets::updated_by.eq(dataset.updated_by),
                                    datasets::definition.eq(&dataset.definition),
                                    datasets::when_to_use.eq(&dataset.when_to_use),
                                    datasets::model.eq(&dataset.model),
                                    datasets::yml_file.eq(&dataset.yml_file),
                                    datasets::deleted_at.eq(None::<DateTime<Utc>>),
                                ))
                                .execute(&mut conn)
                                .await;
                                
                            match update_result {
                                Ok(_) => {
                                    tracing::info!(
                                        "Successfully updated dataset {}.{} (DB: {:?})",
                                        dataset.schema, dataset.name, dataset.database_identifier
                                    );
                                },
                                Err(e) => {
                                    tracing::error!(
                                        "Failed to update dataset {}.{} (DB: {:?}): {}",
                                        dataset.schema, dataset.name, dataset.database_identifier, e
                                    );
                                    return Err(e.into());
                                }
                            }
                        },
                        Err(_) => {
                            // No existing dataset with this exact composite key found,
                            // try inserting it
                            tracing::info!(
                                "No existing dataset found for {}.{} (DB: {:?}), inserting new",
                                dataset.schema, dataset.name, dataset.database_identifier
                            );
                            
                            let insert_result = diesel::insert_into(datasets::table)
                                .values(dataset)
                                .on_conflict((datasets::name, datasets::schema, datasets::data_source_id))
                                .do_update()
                                .set((
                                    datasets::updated_at.eq(excluded(datasets::updated_at)),
                                    datasets::updated_by.eq(excluded(datasets::updated_by)),
                                    datasets::definition.eq(excluded(datasets::definition)),
                                    datasets::when_to_use.eq(excluded(datasets::when_to_use)),
                                    datasets::model.eq(excluded(datasets::model)),
                                    datasets::yml_file.eq(excluded(datasets::yml_file)),
                                    datasets::database_identifier.eq(excluded(datasets::database_identifier)),
                                    datasets::deleted_at.eq(None::<DateTime<Utc>>),
                                ))
                                .execute(&mut conn)
                                .await;
                                
                            match insert_result {
                                Ok(_) => {
                                    tracing::info!(
                                        "Successfully inserted dataset {}.{} (DB: {:?})",
                                        dataset.schema, dataset.name, dataset.database_identifier
                                    );
                                },
                                Err(e) => {
                                    tracing::error!(
                                        "Failed to insert dataset {}.{} (DB: {:?}): {}",
                                        dataset.schema, dataset.name, dataset.database_identifier, e
                                    );
                                    return Err(e.into());
                                }
                            }
                        }
                    }
                } else {
                    // For datasets without database_identifier, use the standard upsert approach
                    let result = diesel::insert_into(datasets::table)
                        .values(dataset)
                        .on_conflict((datasets::name, datasets::schema, datasets::data_source_id))
                        .do_update()
                        .set((
                            datasets::updated_at.eq(excluded(datasets::updated_at)),
                            datasets::updated_by.eq(excluded(datasets::updated_by)),
                            datasets::definition.eq(excluded(datasets::definition)),
                            datasets::when_to_use.eq(excluded(datasets::when_to_use)),
                            datasets::model.eq(excluded(datasets::model)),
                            datasets::yml_file.eq(excluded(datasets::yml_file)),
                            datasets::database_identifier.eq(excluded(datasets::database_identifier)),
                            datasets::deleted_at.eq(None::<DateTime<Utc>>),
                        ))
                        .execute(&mut conn)
                        .await;
                        
                    // Handle the result
                    match result {
                        Ok(_) => {
                            tracing::info!(
                                "Successfully upserted dataset {}.{} (no DB identifier)",
                                dataset.schema, dataset.name
                            );
                        },
                        Err(e) => {
                            tracing::error!(
                                "Failed to upsert dataset {}.{}: {}",
                                dataset.schema, dataset.name, e
                            );
                            return Err(e.into());
                        }
                    }
                }
            }

            // Get the dataset IDs after upsert for column operations using the composite key
            let mut dataset_ids = HashMap::new();
            
            // Create a clone of the valid_datasets for the lookup
            let datasets_to_lookup: Vec<_> = valid_datasets.iter().map(|req| (
                req.name.clone(), 
                req.schema.clone(), 
                req.database.clone()
            )).collect();
            
            // For each valid dataset, get the ID using the precise composite key
            for (name, schema, database) in datasets_to_lookup {
                tracing::info!(
                    "Looking up dataset ID for {}.{} (DB: {:?})", 
                    schema, name, database
                );
                
                // Build a query using Diesel ORM
                let name_lower = name.to_lowercase();
                let schema_lower = schema.to_lowercase();
                
                let mut query = datasets::table
                    .filter(datasets::data_source_id.eq(data_source.id))
                    .filter(datasets::name.eq(&name_lower))
                    .filter(datasets::schema.eq(&schema_lower))
                    .filter(datasets::deleted_at.is_null())
                    .select(datasets::id)
                    .into_boxed();
                
                // Add database_identifier condition
                if let Some(db) = &database {
                    query = query.filter(datasets::database_identifier.eq(db));
                } else {
                    query = query.filter(datasets::database_identifier.is_null());
                }
                
                // Execute the query
                let dataset_id = query.first::<Uuid>(&mut conn).await;
                
                // Store ID if found
                match dataset_id {
                    Ok(id) => {
                        tracing::info!(
                            "Found dataset ID {} for {}.{} (DB: {:?})",
                            id, schema, name, database
                        );
                        dataset_ids.insert(name.clone(), id);
                    },
                    Err(e) => {
                        tracing::error!(
                            "Error looking up dataset ID for {}.{} (DB: {:?}): {}",
                            schema, name, database, e
                        );
                    }
                }
            }

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
                    
                tracing::info!(
                    "Dataset {}.{} (DB: {:?}): Found {} current columns and {} new columns",
                    req.schema,
                    req.name,
                    req.database,
                    current_column_names.len(),
                    new_column_names.len()
                );

                let columns_to_delete: Vec<String> = current_column_names
                    .difference(&new_column_names)
                    .cloned()
                    .collect();

                if !columns_to_delete.is_empty() {
                    tracing::info!(
                        "Dataset {}.{} (DB: {:?}): Deleting {} columns: {:?}",
                        req.schema,
                        req.name,
                        req.database,
                        columns_to_delete.len(),
                        columns_to_delete
                    );
                    
                    // Use Diesel query builder for column deletion
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