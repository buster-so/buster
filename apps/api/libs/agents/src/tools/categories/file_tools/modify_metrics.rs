use std::{env, sync::Arc, time::Instant};

use anyhow::{anyhow, bail, Result};
use async_trait::async_trait;
use braintrust::{get_prompt_system_message, BraintrustClient};
use database::{
    models::{MetricFile, MetricFileToDataset},
    pool::get_pg_pool,
    schema::{datasets, metric_files, metric_files_to_datasets},
    types::MetricYml,
};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use futures::future::join_all;
use indexmap::IndexMap;
use query_engine::{data_source_query_routes::query_engine::query_engine, data_types::DataType};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{debug, error, info};
use uuid::Uuid;
use chrono::Utc;
use std::collections::HashMap;

use super::{
    common::{
        validate_sql, ModificationResult, ModifyFilesOutput, FailedFileModification,
    },
    file_types::file::FileWithId,
    FileModificationTool,
};
use crate::{
    agent::Agent,
    tools::{file_tools::common::METRIC_YML_SCHEMA, ToolExecutor},
};

#[derive(Debug)]
struct MetricUpdateBatch {
    pub files: Vec<MetricFile>,
    pub ymls: Vec<MetricYml>,
    pub failed_updates: Vec<(String, String)>,
    pub update_results: Vec<ModificationResult>,
    pub validation_messages: Vec<String>,
    pub validation_results: Vec<Vec<IndexMap<String, DataType>>>,
    pub updated_versions: Vec<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileUpdate {
    pub id: Uuid,
    pub yml_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateFilesParams {
    pub files: Vec<FileUpdate>,
}

pub struct ModifyMetricFilesTool {
    agent: Arc<Agent>,
}

impl ModifyMetricFilesTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

impl FileModificationTool for ModifyMetricFilesTool {}

/// Process a metric file update with complete new YAML content
/// Returns updated file, YAML, validation results and messages if successful
async fn process_metric_file_update(
    mut file: MetricFile,
    yml_content: String,
    duration: i64,
    user_id: &Uuid,
    data_source_id: &Uuid,
    data_source_dialect: &str,
) -> Result<(
    MetricFile,
    MetricYml,
    Vec<ModificationResult>,
    String,
    Vec<IndexMap<String, DataType>>,
    Vec<Uuid>,
)> {
    debug!(
        file_id = %file.id,
        file_name = %file.name,
        "Processing metric file update"
    );

    let mut results = Vec::new();

    // Create and validate new YML object
    match MetricYml::new(yml_content) {
        Ok(new_yml) => {
            debug!(
                file_id = %file.id,
                file_name = %file.name,
                "Successfully parsed and validated new metric content"
            );

            // Check if SQL has changed to avoid unnecessary validation
            let sql_changed = file.content.sql != new_yml.sql;
            
            // If SQL hasn't changed, we can use existing metadata and skip validation
            if !sql_changed && file.data_metadata.is_some() {
                debug!(
                    file_id = %file.id,
                    file_name = %file.name,
                    "SQL unchanged, skipping validation"
                );
                
                // Update file record
                file.content = new_yml.clone();
                file.name = new_yml.name.clone();
                file.updated_at = Utc::now();
                // Keep existing metadata since SQL hasn't changed

                // Track successful update
                results.push(ModificationResult {
                    file_id: file.id,
                    file_name: file.name.clone(),
                    success: true,
                    error: None,
                    modification_type: "content".to_string(),
                    timestamp: Utc::now(),
                    duration,
                });

                // Return with a message indicating SQL validation was skipped
                return Ok((
                    file, 
                    new_yml.clone(), 
                    results,
                    "SQL unchanged, validation skipped".to_string(),
                    Vec::new(), // Empty results since validation was skipped
                    Vec::new(), // Empty validated IDs since validation was skipped
                ));
            }
            
            if sql_changed {
                debug!(
                    file_id = %file.id,
                    file_name = %file.name,
                    "SQL has changed, performing validation"
                );
            } else {
                debug!(
                    file_id = %file.id,
                    file_name = %file.name,
                    "Metadata missing, performing validation"
                );
            }

            match validate_sql(&new_yml.sql, &data_source_id, &data_source_dialect, user_id).await {
                Ok((message, validation_results, metadata, validated_dataset_ids)) => {
                    // Update file record
                    file.content = new_yml.clone();
                    file.name = new_yml.name.clone();
                    file.updated_at = Utc::now();
                    file.data_metadata = metadata;

                    // Track successful update
                    results.push(ModificationResult {
                        file_id: file.id,
                        file_name: file.name.clone(),
                        success: true,
                        error: None,
                        modification_type: "content".to_string(),
                        timestamp: Utc::now(),
                        duration,
                    });

                    Ok((file, new_yml.clone(), results, message, validation_results, validated_dataset_ids))
                }
                Err(e) => {
                    let error = format!("SQL validation failed: {}", e);
                    error!(
                        file_id = %file.id,
                        file_name = %file.name,
                        error = %error,
                        "SQL validation error"
                    );
                    results.push(ModificationResult {
                        file_id: file.id,
                        file_name: file.name.clone(),
                        success: false,
                        error: Some(error.clone()),
                        modification_type: "sql_validation".to_string(),
                        timestamp: Utc::now(),
                        duration,
                    });
                    Err(anyhow::anyhow!(error))
                }
            }
        }
        Err(e) => {
            let error = format!("Failed to validate YAML: {}", e);
            error!(
                file_id = %file.id,
                file_name = %file.name,
                error = %error,
                "YAML validation error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: file.name.clone(),
                success: false,
                error: Some(error.clone()),
                modification_type: "validation".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            Err(anyhow::anyhow!(error))
        }
    }
}

#[async_trait]
impl ToolExecutor for ModifyMetricFilesTool {
    type Output = ModifyFilesOutput;
    type Params = UpdateFilesParams;

    fn get_name(&self) -> String {
        "update_metrics".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        let start_time = Instant::now();

        debug!("Starting file update execution");

        info!("Processing {} files for update", params.files.len());

        // Initialize batch processing structures
        let mut batch = MetricUpdateBatch {
            files: Vec::new(),
            ymls: Vec::new(),
            failed_updates: Vec::new(),
            update_results: Vec::new(),
            validation_messages: Vec::new(),
            validation_results: Vec::new(),
            updated_versions: Vec::new(),
        };

        // Collect file IDs and create map
        let metric_ids: Vec<Uuid> = params.files.iter().map(|f| f.id).collect();
        let file_map: HashMap<_, _> = params.files.iter().map(|f| (f.id, f)).collect();

        // Get database connection
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => {
                let duration = start_time.elapsed().as_millis() as i64;
                return Ok(ModifyFilesOutput {
                    message: format!("Failed to connect to database: {}", e),
                    files: Vec::new(),
                    failed_files: Vec::new(),
                    duration,
                });
            }
        };

        let data_source_id = match self.agent.get_state_value("data_source_id").await {
            Some(Value::String(id_str)) => Uuid::parse_str(&id_str).map_err(|e| anyhow!("Invalid data source ID format: {}", e))?,
            Some(_) => bail!("Data source ID is not a string"),
            None => bail!("Data source ID not found in agent state"),
        };

        let data_source_dialect = match self.agent.get_state_value("data_source_syntax").await {
            Some(Value::String(dialect_str)) => dialect_str,
            Some(_) => "generic".to_string(),
            None => "generic".to_string(),
        };

        // Map to store validated dataset IDs for each successfully updated metric
        let mut validated_dataset_ids_map: HashMap<Uuid, Vec<Uuid>> = HashMap::new();

        // Fetch metric files
        if !metric_ids.is_empty() {
            match metric_files::table
                .filter(metric_files::id.eq_any(&metric_ids))
                .filter(metric_files::deleted_at.is_null())
                .load::<MetricFile>(&mut conn)
                .await
            {
                Ok(files) => {
                    // Create futures for concurrent processing of file updates
                    let update_futures = files
                        .into_iter()
                        .filter_map(|file| {
                            let file_update = file_map.get(&file.id)?;
                            let start_time_elapsed = start_time.elapsed().as_millis() as i64;
                            let user_id = self.agent.get_user_id(); // Capture user_id outside async block
                            let data_source_dialect = data_source_dialect.clone();
                            
                            Some(async move {
                                let result = process_metric_file_update(
                                    file.clone(),
                                    file_update.yml_content.clone(),
                                    start_time_elapsed,
                                    &user_id, // Pass user_id reference
                                    &data_source_id,
                                    &data_source_dialect,
                                ).await;
                                
                                (file.name, result) // Return file name along with result
                            })
                        })
                        .collect::<Vec<_>>();
                    
                    // Wait for all futures to complete
                    let results = join_all(update_futures).await;
                    
                    // Process results
                    for (file_name, result) in results {
                        match result {
                            Ok((mut metric_file, metric_yml, mod_results, validation_message, validation_results, validated_ids)) => {
                                // Calculate next version number
                                let next_version = metric_file.version_history.get_latest_version()
                                                                    .map_or(1, |v| v.version_number + 1);

                                // Add new version to history
                                metric_file.version_history.add_version(next_version, metric_yml.clone());

                                batch.files.push(metric_file.clone());
                                batch.ymls.push(metric_yml);
                                batch.update_results.extend(mod_results);
                                batch.validation_messages.push(validation_message);
                                batch.validation_results.push(validation_results);
                                batch.updated_versions.push(next_version);
                                
                                // Store validated IDs associated with this metric file's ID
                                validated_dataset_ids_map.insert(metric_file.id, validated_ids);
                            }
                            Err(e) => {
                                batch.failed_updates.push((file_name, e.to_string()));
                            }
                        }
                    }
                }
                Err(e) => {
                    let duration = start_time.elapsed().as_millis() as i64;
                    return Ok(ModifyFilesOutput {
                        message: format!("Failed to fetch metric files: {}", e),
                        files: Vec::new(),
                        failed_files: Vec::new(),
                        duration,
                    });
                }
            }
        }

        // Process results and generate output message
        let duration = start_time.elapsed().as_millis() as i64;

        // Update metric files in database with version history and metadata
        if !batch.files.is_empty() {
            use diesel::insert_into;
            match insert_into(metric_files::table)
                .values(&batch.files)
                .on_conflict(metric_files::id)
                .do_update()
                .set((
                    metric_files::content.eq(excluded(metric_files::content)),
                    metric_files::updated_at.eq(excluded(metric_files::updated_at)),
                    metric_files::version_history.eq(excluded(metric_files::version_history)),
                    metric_files::name.eq(excluded(metric_files::name)),
                    metric_files::data_metadata.eq(excluded(metric_files::data_metadata)),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    debug!("Successfully updated metric files with versioning and metadata");
                    
                    // --- Insert into metric_files_to_datasets --- 
                    let mut join_table_records = Vec::new();
                    let now = Utc::now();
                    for (i, metric_file) in batch.files.iter().enumerate() {
                        if let Some(dataset_ids) = validated_dataset_ids_map.get(&metric_file.id) {
                             let current_version = batch.updated_versions[i];
                             for dataset_id in dataset_ids {
                                join_table_records.push(MetricFileToDataset {
                                    metric_file_id: metric_file.id,
                                    dataset_id: *dataset_id,
                                    metric_version_number: current_version,
                                    created_at: now,
                                });
                            }
                        }
                    }

                    if !join_table_records.is_empty() {
                        match insert_into(metric_files_to_datasets::table)
                           .values(&join_table_records)
                           .on_conflict_do_nothing() // Avoid errors if associations already exist for this version
                           .execute(&mut conn)
                           .await {
                                Ok(_) => tracing::debug!("Successfully inserted dataset associations for updated metrics"),
                                Err(e) => {
                                    tracing::error!("Failed to insert dataset associations for updated metrics: {}", e);
                                    // Add failures to the batch update list for user visibility
                                    for record in &join_table_records {
                                        // Find the corresponding file name
                                        if let Some(file) = batch.files.iter().find(|f| f.id == record.metric_file_id) {
                                            let error_message = format!(
                                                "Failed to associate datasets with metric '{}' (version {}). DB Error: {}", 
                                                file.name, record.metric_version_number, e
                                            );
                                            // Avoid adding duplicate failure messages for the same file if multiple dataset associations failed
                                            if !batch.failed_updates.iter().any(|(name, _)| name == &file.name) {
                                                batch.failed_updates.push((file.name.clone(), error_message));
                                            }
                                        }
                                    }
                                }
                        }
                   }
                    // --- End Insert --- 

                }
                Err(e) => {
                    error!("Failed to update metric files in database: {}", e);
                    return Err(anyhow!("Failed to update metric files in database: {}", e));
                }
            }
        }

        // Construct final output
        let successes_count = batch.files.len();
        let failures_count = batch.failed_updates.len();

        let message = match (successes_count, failures_count) {
            (s, 0) if s > 0 => format!("Successfully modified {} metric file{}.", s, if s == 1 { "" } else { "s" }),
            (0, f) if f > 0 => format!("Failed to modify {} metric file{}.", f, if f == 1 { "" } else { "s" }),
            (s, f) if s > 0 && f > 0 => format!("Successfully modified {} metric file{}, {} failed.", s, if s == 1 { "" } else { "s" }, f),
            _ => "No metric files were processed.".to_string(),
        };

        let mut output = ModifyFilesOutput {
            message,
            duration,
            files: Vec::new(),
            failed_files: Vec::new(),
        };

        // Add successful files to output
        output
            .files
            .extend(batch.files.iter().enumerate().map(|(i, file)| {
                let yml = &batch.ymls[i];
                let current_version = batch.updated_versions[i];
                FileWithId {
                    id: file.id,
                    name: file.name.clone(),
                    file_type: "metric".to_string(),
                    yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
                    result_message: Some(batch.validation_messages[i].clone()),
                    results: Some(batch.validation_results[i].clone()),
                    created_at: file.created_at,
                    updated_at: file.updated_at,
                    version_number: current_version,
                }
            }));

        // Add failed modifications to output
        output.failed_files.extend(
            batch
                .failed_updates
                .into_iter()
                .map(|(file_name, error)| {
                    let error_message = format!("Failed to modify '{}': {}.\\n\\nPlease attempt to modify the metric again. This error could be due to:\\n- Using a dataset that doesn't exist (please reevaluate the available datasets in the chat conversation)\\n- Invalid configuration in the metric file\\n- Special characters in the metric name or SQL query\\n- Syntax errors in the SQL query", file_name, error);
                    FailedFileModification { 
                        file_name, 
                        error: error_message,
                    }
                }),
        );

        // Set review_needed flag if execution was successful
        if output.failed_files.is_empty() {
            self.agent
                .set_state_value(String::from("review_needed"), Value::Bool(true))
                .await;
        }

        Ok(output)
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": self.get_name(),
          "description": get_modify_metrics_description().await,
          "strict": true,
          "parameters": {
            "type": "object",
            "required": ["files"],
            "properties": {
              "files": {
                "type": "array",
                "description": get_modify_metrics_yml_description().await,
                "items": {
                  "type": "object",
                  "required": ["id", "yml_content"],
                  "properties": {
                    "id": {
                      "type": "string",
                      "description": get_metric_id_description().await
                    },
                    "yml_content": {
                      "type": "string",
                      "description": get_metric_yml_description().await
                    }
                  },
                  "additionalProperties": false
                }
              }
            },
            "additionalProperties": false
          }
        })
    }
}

async fn get_modify_metrics_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Updates existing metric configuration files with new YAML content. Provide the complete YAML content for each metric, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple metrics simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each metric, you need its UUID and the complete updated YAML content. **Prefer modifying metrics in bulk using this tool rather than one by one.**".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "d7aafe5a-95bc-4ad4-9c02-27e9124a9cd4").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Updates existing metric configuration files with new YAML content. Provide the complete YAML content for each metric, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple metrics simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each metric, you need its UUID and the complete updated YAML content. **Prefer modifying metrics in bulk using this tool rather than one by one.**".to_string()
        }
    }
}

async fn get_modify_metrics_yml_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Array of metrics to update. Each item requires an 'id' (UUID of the existing metric) and 'yml_content' (complete new YAML content that follows the specification below). You can update multiple metrics in a single operation, making this ideal for bulk updates. **Prefer using this for bulk updates rather than modifying metrics individually.**".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "54d01b7c-07c9-4c80-8ec7-8026ab8242a9").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Array of metrics to update. Each item requires an 'id' (UUID of the existing metric) and 'yml_content' (complete new YAML content that follows the specification below). You can update multiple metrics in a single operation, making this ideal for bulk updates. **Prefer using this for bulk updates rather than modifying metrics individually.**".to_string()
        }
    }
}

async fn get_metric_yml_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        // Revert to just returning the schema string plus basic instruction
        return format!("The complete new YAML content for the metric, following the metric schema specification. This will replace the entire existing content of the file. Ensure all required fields are present and properly formatted according to the schema. When modifying multiple metrics, provide each in the 'files' array. **Prefer bulk modifications.**\n\n{}", METRIC_YML_SCHEMA);
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "28467bdb-6cab-49ce-bca5-193d26c620b2").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            // Revert to just returning the schema string plus basic instruction on error
            format!("The complete new YAML content for the metric, following the metric schema specification. This will replace the entire existing content of the file. Ensure all required fields are present and properly formatted according to the schema. When modifying multiple metrics, provide each in the 'files' array. **Prefer bulk modifications.**\n\n{}", METRIC_YML_SCHEMA)
        }
    }
}

async fn get_metric_id_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "UUID of the metric file to update. This is a required identifier to locate the specific metric that needs to be modified.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "471a0880-72f9-4989-bf47-397884a944fd").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "UUID of the metric file to update. This is a required identifier to locate the specific metric that needs to be modified.".to_string()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use serde_json::json;

    #[test]
    fn test_modification_result_tracking() {
        let result = ModificationResult {
            file_id: Uuid::new_v4(),
            file_name: "test.yml".to_string(),
            success: true,
            error: None,
            modification_type: "content".to_string(),
            timestamp: Utc::now(),
            duration: 0,
        };

        assert!(result.success);
        assert!(result.error.is_none());

        let error_result = ModificationResult {
            success: false,
            error: Some("Failed to parse YAML".to_string()),
            ..result
        };
        assert!(!error_result.success);
        assert!(error_result.error.is_some());
        assert_eq!(error_result.error.unwrap(), "Failed to parse YAML");
    }

    #[test]
    fn test_tool_parameter_validation() {
        // Test valid parameters
        let valid_params = json!({
            "files": [{
                "id": Uuid::new_v4().to_string(),
                "yml_content": "name: Test Metric\ndescription: A test metric"
            }]
        });
        let valid_args = serde_json::to_string(&valid_params).unwrap();
        let result = serde_json::from_str::<UpdateFilesParams>(&valid_args);
        assert!(result.is_ok());

        // Test missing required fields
        let missing_fields_params = json!({
            "files": [{
                "id": Uuid::new_v4().to_string()
                // missing yml_content
            }]
        });
        let missing_args = serde_json::to_string(&missing_fields_params).unwrap();
        let result = serde_json::from_str::<UpdateFilesParams>(&missing_args);
        assert!(result.is_err());
    }
}
