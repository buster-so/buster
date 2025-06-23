// This file will contain the new dataset deployment handler logic.

use anyhow::Result;
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::Deserialize; // Added for DeployDatasetsRequest if it's moved or redefined here
use serde_yaml; // Added for model deserialization
use std::collections::{HashMap, HashSet};
use tokio::spawn; // Added for concurrent job execution
use tracing::{error, info, warn};
use uuid::Uuid;

// Types from this crate's parent (handlers) -> Corrected to super
use super::types::{DeployDatasetsRequest, ValidationError, ValidationResult}; // Added DeployDatasetsRequest

// Corrected to use the `database` crate directly as per Cargo.toml
use database::{
    enums::DatasetType,
    models::{DataSource, Dataset},
    pool::get_pg_pool,
    schema::{data_sources, datasets},
};

// Add imports for semantic_layer and stored_values
use semantic_layer::models::Model as SemanticModel; // Using alias
use stored_values::jobs as stored_values_jobs; // Using module alias for clarity

// TODO: Define or import necessary structs like DeployDatasetsRequest, DataSource, Dataset, etc.
// For now, let's assume DeployDatasetsRequest will be passed in.
// The actual database models (DataSource, Dataset) will need to be accessible.
// This might involve adding `database` features to this handler crate or using fully qualified paths.

// Local definition of DeployDatasetsRequest removed, it is now imported from super::types

// Simplified handler function
pub async fn deploy_datasets_handler_core(
    user_id: &Uuid,
    organization_id: Uuid, // Pass organization_id directly
    requests: Vec<DeployDatasetsRequest>, // This now uses the imported DeployDatasetsRequest
                           // conn: &mut AsyncPgConnection, // Or get a connection from a pool passed in/accessible globally
) -> Result<Vec<ValidationResult>> {
    // Temporary: Get a connection. This needs to be replaced with proper DB connection management.
    let mut conn = database::pool::get_pg_pool().get().await?; // This path is incorrect from here

    let mut results = Vec::new();

    let mut data_source_groups: HashMap<
        (String, String, Option<String>),
        Vec<&DeployDatasetsRequest>,
    > = HashMap::new();
    for req in &requests {
        data_source_groups
            .entry((
                req.data_source_name.clone(),
                req.env.clone(),
                req.database.clone(),
            ))
            .or_default()
            .push(req);
    }

    let mut successfully_processed_data_source_ids: HashSet<Uuid> = HashSet::new();
    let mut deployed_datasets_by_data_source: HashMap<Uuid, HashSet<String>> = HashMap::new();

    for ((data_source_name, env, _database), group) in data_source_groups {
        // Get data source
        let data_source = match database::schema::data_sources::table // Incorrect path
            .filter(database::schema::data_sources::name.eq(&data_source_name))
            .filter(database::schema::data_sources::env.eq(&env))
            .filter(database::schema::data_sources::organization_id.eq(&organization_id))
            .filter(database::schema::data_sources::deleted_at.is_null())
            .select(database::schema::data_sources::all_columns)
            .first::<database::models::DataSource>(&mut conn) // Incorrect path
            .await
        {
            Ok(ds) => ds,
            Err(e) => {
                error!(
                    "Data source '{}' not found for env '{}': {}",
                    data_source_name, env, e
                );
                for req in group {
                    let mut validation = ValidationResult::new(
                        req.name.clone(),
                        req.data_source_name.clone(),
                        req.schema.clone(),
                    );
                    validation.add_error(ValidationError::data_source_error(format!(
                        "Data source '{}' not found for environment '{}'",
                        data_source_name, env
                    )));
                    results.push(validation);
                }
                continue;
            }
        };

        successfully_processed_data_source_ids.insert(data_source.id);

        let request_db_names: Vec<String> = group.iter().map(|req| req.name.clone()).collect();
        let existing_dataset_ids: HashMap<String, Uuid> = match database::schema::datasets::table // Incorrect path
            .filter(database::schema::datasets::data_source_id.eq(data_source.id))
            .filter(database::schema::datasets::database_name.eq_any(&request_db_names))
            .select((database::schema::datasets::database_name, database::schema::datasets::id))
            .load::<(String, Uuid)>(&mut conn)
            .await
        {
            Ok(ids) => ids.into_iter().collect(),
            Err(e) => {
                error!("Failed to retrieve existing dataset IDs for data source '{}': {}", data_source_name, e);
                // Propagate error for this group or mark results as failed
                for req_in_group in group {
                    if let Some(validation_result) = results.iter_mut().find(|r| r.model_name == req_in_group.name && r.data_source_name == req_in_group.data_source_name && r.schema == req_in_group.schema) {
                        validation_result.add_error(ValidationError::internal_error(format!("Failed to retrieve existing dataset IDs: {}", e)));
                    } else {
                         let mut validation = ValidationResult::new(
                            req_in_group.name.clone(),
                            req_in_group.data_source_name.clone(),
                            req_in_group.schema.clone(),
                        );
                        validation.add_error(ValidationError::internal_error(format!("Failed to retrieve existing dataset IDs: {}", e)));
                        results.push(validation);
                    }
                }
                continue; // Continue to the next group
            }
        };

        let mut datasets_to_upsert_map: HashMap<(String, Uuid), database::models::Dataset> =
            HashMap::new(); // Incorrect path

        for req in group.clone() {
            // group is Vec<&DeployDatasetsRequest>
            // Collect names of datasets intended for deployment in this group for this data_source.id
            deployed_datasets_by_data_source
                .entry(data_source.id)
                .or_default()
                .insert(req.name.clone());

            let mut validation = ValidationResult::new(
                req.name.clone(),
                req.data_source_name.clone(),
                req.schema.clone(),
            );
            // Basic validation, e.g., if model is required
            if req.model.is_none() {
                // Example validation: model is required
                validation.add_error(ValidationError::internal_error(
                    "Field 'model' is required.".to_string(),
                ));
                results.push(validation);
                continue; // Skip this request
            }
            validation.success = true; // Assume success initially, will be overridden by upsert errors
            results.push(validation);

            let now = Utc::now();
            let dataset_id = existing_dataset_ids
                .get(&req.name)
                .copied()
                .unwrap_or_else(|| req.id.unwrap_or_else(Uuid::new_v4));

            // Use req.database as a fallback for database_identifier
            let final_database_identifier = req
                .database_identifier
                .clone()
                .or_else(|| req.database.clone());

            let dataset = database::models::Dataset {
                // Incorrect path
                id: dataset_id,
                name: req.name.clone(),
                data_source_id: data_source.id,
                created_at: now, // This will be handled by DB default or on_conflict for new records
                updated_at: now,
                database_name: req.name.clone(),
                when_to_use: Some(req.description.clone()),
                when_not_to_use: None,
                type_: database::enums::DatasetType::View, // Incorrect path
                definition: req.sql_definition.clone().unwrap_or_default(), // Still keeping SQL definition
                schema: req.schema.clone(),
                enabled: true,        // By default, a deployed dataset is enabled
                created_by: *user_id, // This will be handled by DB default or on_conflict for new records
                updated_by: *user_id,
                deleted_at: None, // Explicitly mark as not deleted
                imported: false,
                organization_id: organization_id,
                model: req.model.clone(),
                yml_file: req.yml_file.clone(), // Ensure yml_file is included
                database_identifier: final_database_identifier, // This was req.database before, ensure it's correct
            };
            datasets_to_upsert_map.insert((req.name.clone(), data_source.id), dataset);
        }

        let datasets_to_upsert: Vec<database::models::Dataset> =
            datasets_to_upsert_map.into_values().collect(); // Incorrect path

        if !datasets_to_upsert.is_empty() {
            let now = Utc::now();
            match diesel::insert_into(database::schema::datasets::table) // Incorrect path
                .values(&datasets_to_upsert)
                .on_conflict((
                    database::schema::datasets::database_name,
                    database::schema::datasets::data_source_id,
                )) // Incorrect path
                .do_update()
                .set((
                    database::schema::datasets::name.eq(excluded(database::schema::datasets::name)),
                    database::schema::datasets::updated_at.eq(now),
                    database::schema::datasets::updated_by
                        .eq(excluded(database::schema::datasets::updated_by)),
                    database::schema::datasets::definition
                        .eq(excluded(database::schema::datasets::definition)),
                    database::schema::datasets::when_to_use
                        .eq(excluded(database::schema::datasets::when_to_use)),
                    database::schema::datasets::model
                        .eq(excluded(database::schema::datasets::model)),
                    database::schema::datasets::yml_file
                        .eq(excluded(database::schema::datasets::yml_file)),
                    database::schema::datasets::schema
                        .eq(excluded(database::schema::datasets::schema)),
                    database::schema::datasets::database_identifier
                        .eq(excluded(database::schema::datasets::database_identifier)),
                    database::schema::datasets::enabled.eq(true), // Directly set to true on upsert
                    database::schema::datasets::deleted_at.eq(None as Option<DateTime<Utc>>), // Explicitly ensure it's not deleted
                ))
                .execute(&mut conn)
                .await
            {
                Ok(num_upserted) => {
                    info!(
                        "Successfully upserted {} datasets for data source '{}'",
                        num_upserted, data_source_name
                    );
                    // Success is already marked for validation results, no change needed here unless specific counts matter.
                }
                Err(e) => {
                    error!(
                        "Failed to bulk upsert datasets for data_source_id '{}': {}",
                        data_source.id, e
                    );
                    // Mark all results for this group's successfully mapped datasets as failed
                    for dataset_to_upsert in &datasets_to_upsert {
                        if let Some(validation_result) = results.iter_mut().find(|r| {
                            r.model_name == dataset_to_upsert.name
                                && r.data_source_name == data_source_name
                                && r.schema == dataset_to_upsert.schema
                        }) {
                            validation_result.success = false; // Mark as false explicitly
                            validation_result.add_error(ValidationError::internal_error(format!(
                                "Failed to upsert dataset: {}",
                                e
                            )));
                        }
                    }
                }
            };
            // Column processing is skipped as per requirements.

            // ---- START: New logic for stored values jobs ----
            info!(
                data_source_id = %data_source.id,
                "Processing datasets for potential stored value sync jobs."
            );
            for dataset_for_jobs in &datasets_to_upsert {
                if let Some(yml_file_content) = &dataset_for_jobs.yml_file {
                    match serde_yaml::from_str::<SemanticModel>(yml_file_content) {
                        Ok(model_data) => {
                            let job_database_name = match dataset_for_jobs
                                .database_identifier
                                .as_ref()
                            {
                                Some(db_id) => db_id.clone(),
                                None => {
                                    warn!(
                                        dataset_name = %dataset_for_jobs.name,
                                        data_source_id = %dataset_for_jobs.data_source_id,
                                        model_name = %model_data.name,
                                        "Skipping stored values job creation for model dimensions: dataset.database_identifier is None."
                                    );
                                    continue; // Skip this model's dimensions processing
                                }
                            };

                            let job_schema_name = dataset_for_jobs.schema.clone();

                            for dimension in model_data.dimensions {
                                if dimension.searchable {
                                    info!(
                                        "Found searchable dimension '{}' in model '{}' for dataset '{}' (data_source_id: {})",
                                        dimension.name, model_data.name, dataset_for_jobs.name, dataset_for_jobs.data_source_id
                                    );

                                    let job_data_source_id = dataset_for_jobs.data_source_id;
                                    let current_job_database_name = job_database_name.clone();
                                    let current_job_schema_name = job_schema_name.clone();
                                    let job_table_name = dataset_for_jobs.name.clone();
                                    let job_column_name = dimension.name.clone();

                                    spawn(async move {
                                        info!(
                                            data_source_id = %job_data_source_id,
                                            database_name = %current_job_database_name,
                                            schema_name = %current_job_schema_name,
                                            table_name = %job_table_name,
                                            column_name = %job_column_name,
                                            "Setting up and running stored values sync job for searchable dimension."
                                        );

                                        if let Err(e) = stored_values_jobs::setup_sync_job(
                                            job_data_source_id,
                                            current_job_database_name.clone().to_lowercase(),
                                            current_job_schema_name.clone().to_lowercase(),
                                            job_table_name.clone().to_lowercase(),
                                            job_column_name.clone().to_lowercase(),
                                        )
                                        .await
                                        {
                                            error!(
                                                "Failed to setup stored values sync job for {}.{}.{}.{} on data_source {}: {}",
                                                current_job_database_name, current_job_schema_name, job_table_name, job_column_name, job_data_source_id, e
                                            );
                                            return;
                                        }

                                        match stored_values_jobs::sync_distinct_values_chunk(
                                            job_data_source_id,
                                            current_job_database_name.clone().to_lowercase(),
                                            current_job_schema_name.clone().to_lowercase(),
                                            job_table_name.clone().to_lowercase(),
                                            job_column_name.clone().to_lowercase(),
                                        ).await {
                                            Ok(count) => info!(
                                                "Successfully synced {} distinct values for searchable dimension '{}' (data_source_id: {}).",
                                                count, dimension.name, job_data_source_id
                                            ),
                                            Err(e) => error!(
                                                "Failed to sync distinct values for searchable dimension '{}' (data_source_id: {}): {}",
                                                dimension.name, job_data_source_id, e
                                            ),
                                        }
                                    });
                                }
                            }
                        }
                        Err(e) => {
                            error!(
                                "Failed to deserialize YML content for dataset '{}' (data_source_id: {}): {}. Skipping sync job creation for its dimensions.",
                                dataset_for_jobs.name, dataset_for_jobs.data_source_id, e
                            );
                        }
                    }
                }
            }
            // ---- END: New logic for stored values jobs ----
        } else {
            info!(
                "No datasets to upsert for data source '{}'",
                data_source_name
            );
        }
    }

    // --- SOFT DELETION LOGIC ---
    info!("Starting soft-deletion phase for datasets not in the current deployment batch...");

    for data_source_id_to_clean in successfully_processed_data_source_ids {
        let names_in_current_deployment = deployed_datasets_by_data_source
            .get(&data_source_id_to_clean)
            .cloned()
            .unwrap_or_default();

        let active_datasets_in_db: Vec<(Uuid, String)> = match database::schema::datasets::table
            .filter(database::schema::datasets::data_source_id.eq(data_source_id_to_clean))
            .filter(database::schema::datasets::deleted_at.is_null())
            .select((
                database::schema::datasets::id,
                database::schema::datasets::database_name,
            ))
            .load::<(Uuid, String)>(&mut conn)
            .await
        {
            Ok(datasets) => datasets,
            Err(e) => {
                error!(
                    "SOFT_DELETE_FAIL: Failed to retrieve active datasets for data_source_id '{}': {}. Skipping soft-deletion for this data source.",
                    data_source_id_to_clean, e
                );
                // Optionally, add a non-model-specific error to `results` or a general operational warning.
                continue;
            }
        };

        let mut dataset_ids_to_soft_delete: Vec<Uuid> = Vec::new();
        for (dataset_id, dataset_name_in_db) in active_datasets_in_db {
            if !names_in_current_deployment.contains(&dataset_name_in_db) {
                dataset_ids_to_soft_delete.push(dataset_id);
            }
        }

        if !dataset_ids_to_soft_delete.is_empty() {
            info!(
                "SOFT_DELETE: Identified {} datasets to soft-delete for data_source_id '{}'.",
                dataset_ids_to_soft_delete.len(),
                data_source_id_to_clean
            );
            let now = Utc::now();
            match diesel::update(
                database::schema::datasets::table
                    .filter(database::schema::datasets::id.eq_any(&dataset_ids_to_soft_delete)),
            )
            .set((
                database::schema::datasets::deleted_at.eq(now),
                database::schema::datasets::updated_at.eq(now),
                database::schema::datasets::updated_by.eq(*user_id),
                database::schema::datasets::enabled.eq(false),
            ))
            .execute(&mut conn)
            .await
            {
                Ok(num_deleted) => {
                    info!(
                        "SOFT_DELETE_SUCCESS: Successfully soft-deleted {} datasets for data_source_id '{}'.",
                        num_deleted, data_source_id_to_clean
                    );
                }
                Err(e) => {
                    error!(
                        "SOFT_DELETE_FAIL: Failed to soft-delete {} datasets for data_source_id '{}': {}. These datasets may remain active erroneously.",
                        dataset_ids_to_soft_delete.len(), data_source_id_to_clean, e
                    );
                    // Optionally, add a non-model-specific error to `results` or a general operational warning.
                }
            }
        } else {
            info!(
                "SOFT_DELETE: No datasets to soft-delete for data_source_id '{}'. All active datasets were part of the deployment or no relevant active datasets found.",
                data_source_id_to_clean
            );
        }
    }
    // --- END SOFT DELETION LOGIC ---

    Ok(results)
}

// IMPORTANT: The database interaction parts (marked with // Incorrect path)
// need to be resolved. This handler needs access to:
// 1. A database connection pool (e.g., `get_pg_pool()`).
// 2. Database models (`DataSource`, `Dataset`).
// 3. Diesel schema (`data_sources`, `datasets`).
// 4. Enums (`DatasetType`).

// This likely means the `handlers` crate needs a "database" or "models" feature flag,
// or these types need to be passed in or accessed via a shared context/crate.
// For example, `database::pool::get_pg_pool()` would need to be changed to something like `shared_db::pool::get()`.
// Similarly for models like `database::models::Dataset` -> `shared_db::models::Dataset`.
// And schema `database::schema::datasets::table` -> `shared_db::schema::datasets::table`.
