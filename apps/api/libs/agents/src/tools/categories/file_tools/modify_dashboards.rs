use std::time::Instant;
use std::{env, sync::Arc};

use anyhow::Result;
use async_trait::async_trait;
use braintrust::{get_prompt_system_message, BraintrustClient};
use database::{
    models::DashboardFile, pool::get_pg_pool, schema::dashboard_files, types::DashboardYml,
};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use query_engine::data_types::DataType;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{debug, error, info};
use chrono::Utc;
use uuid::Uuid;

use super::{
    common::{
        validate_metric_ids, FailedFileModification, ModificationResult,
        ModifyFilesOutput,
    },
    file_types::file::FileWithId,
    FileModificationTool,
};
use crate::{
    agent::Agent,
    tools::{file_tools::common::DASHBOARD_YML_SCHEMA, ToolExecutor},
};

#[derive(Debug)]
struct DashboardUpdateBatch {
    pub files: Vec<DashboardFile>,
    pub ymls: Vec<DashboardYml>,
    pub failed_updates: Vec<(String, String)>,
    pub update_results: Vec<ModificationResult>,
    pub validation_messages: Vec<String>,
    pub validation_results: Vec<Vec<IndexMap<String, DataType>>>,
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

pub struct ModifyDashboardFilesTool {
    agent: Arc<Agent>,
}

impl ModifyDashboardFilesTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

impl FileModificationTool for ModifyDashboardFilesTool {}

/// Process a dashboard file update with complete new YAML content
async fn process_dashboard_file_update(
    mut file: DashboardFile,
    yml_content: String, 
    duration: i64,
) -> Result<(
    DashboardFile,
    DashboardYml,
    Vec<ModificationResult>,
    String,
    Vec<IndexMap<String, DataType>>,
)> {
    debug!(
        file_id = %file.id,
        file_name = %file.name,
        "Processing dashboard file update"
    );

    let mut results = Vec::new();

    // Create and validate new YML object
    match DashboardYml::new(yml_content) {
        Ok(new_yml) => {
            debug!(
                file_id = %file.id,
                file_name = %file.name,
                "Successfully parsed and validated new dashboard content"
            );

            // Collect and validate metric IDs from rows
            let metric_ids: Vec<Uuid> = new_yml
                .rows
                .iter()
                .flat_map(|row| row.items.iter())
                .map(|item| item.id)
                .collect();

            if !metric_ids.is_empty() {
                match validate_metric_ids(&metric_ids).await {
                    Ok(missing_ids) if !missing_ids.is_empty() => {
                        let error = format!("Invalid metric references: {:?}", missing_ids);
                        error!(
                            file_id = %file.id,
                            file_name = %file.name,
                            error = %error,
                            "Metric validation error"
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
                        return Err(anyhow::anyhow!(error));
                    }
                    Err(e) => {
                        let error = format!("Failed to validate metrics: {}", e);
                        error!(
                            file_id = %file.id,
                            file_name = %file.name,
                            error = %error,
                            "Metric validation error"
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
                        return Err(anyhow::anyhow!(error));
                    }
                    Ok(_) => {
                        // All metrics exist, continue with update
                    }
                }
            }

            // Update file record
            file.content = new_yml.clone();
            file.updated_at = Utc::now();
            // Also update the file name to match the YAML name
            file.name = new_yml.name.clone();

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

            // Return successful result with empty validation results
            // since dashboards don't have SQL to validate like metrics do
            Ok((
                file,
                new_yml.clone(),
                results,
                "Dashboard validation successful".to_string(),
                Vec::new(),
            ))
        }
        Err(e) => {
            let error = format!("Failed to validate modified YAML: {}", e);
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
impl ToolExecutor for ModifyDashboardFilesTool {
    type Output = ModifyFilesOutput;
    type Params = UpdateFilesParams;

    fn get_name(&self) -> String {
        "update_dashboards".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        let start_time = Instant::now();

        debug!("Starting dashboard file update execution");

        info!("Processing {} files for update", params.files.len());

        // Initialize batch processing structures
        let mut batch = DashboardUpdateBatch {
            files: Vec::new(),
            ymls: Vec::new(),
            failed_updates: Vec::new(),
            update_results: Vec::new(),
            validation_messages: Vec::new(),
            validation_results: Vec::new(),
        };

        // Get database connection
        let mut conn = get_pg_pool().get().await?;

        // Process each file update
        for file_update in params.files {
            // Get the dashboard file from database
            match dashboard_files::table
                .filter(dashboard_files::id.eq(file_update.id))
                .filter(dashboard_files::deleted_at.is_null())
                .first::<DashboardFile>(&mut conn)
                .await
            {
                Ok(dashboard_file) => {
                    let duration = start_time.elapsed().as_millis() as i64;

                    // Process the dashboard file update
                    match process_dashboard_file_update(
                        dashboard_file.clone(),
                        file_update.yml_content,
                        duration,
                    )
                    .await
                    {
                        Ok((
                            mut dashboard_file,
                            dashboard_yml,
                            results,
                            validation_message,
                            validation_results,
                        )) => {
                            // Calculate next version number from existing version history
                            let next_version =
                                match dashboard_file.version_history.get_latest_version() {
                                    Some(version) => version.version_number + 1,
                                    None => 1,
                                };

                            // Add new version to history
                            dashboard_file
                                .version_history
                                .add_version(next_version, dashboard_yml.clone());

                            // Ensure the name field is updated
                            // This is redundant but ensures the name is set correctly
                            dashboard_file.name = dashboard_yml.name.clone();

                            batch.files.push(dashboard_file);
                            batch.ymls.push(dashboard_yml);
                            batch.update_results.extend(results);
                            batch.validation_messages.push(validation_message);
                            batch.validation_results.push(validation_results);
                        }
                        Err(e) => {
                            batch
                                .failed_updates
                                .push((format!("Dashboard {}", file_update.id), e.to_string()));
                        }
                    }
                }
                Err(e) => {
                    batch.failed_updates.push((
                        format!("Dashboard {}", file_update.id),
                        format!("Failed to find dashboard file: {}", e),
                    ));
                }
            }
        }

        // Update dashboard files in database with version history
        if !batch.files.is_empty() {
            use diesel::insert_into;
            match insert_into(dashboard_files::table)
                .values(&batch.files)
                .on_conflict(dashboard_files::id)
                .do_update()
                .set((
                    dashboard_files::content.eq(excluded(dashboard_files::content)),
                    dashboard_files::updated_at.eq(excluded(dashboard_files::updated_at)),
                    // Add version history and name to ensure they're updated
                    dashboard_files::version_history.eq(excluded(dashboard_files::version_history)),
                    // Explicitly set name even though it's in content to ensure it's updated in case content parsing fails
                    dashboard_files::name.eq(excluded(dashboard_files::name)),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    debug!("Successfully updated dashboard files with versioning");
                }
                Err(e) => {
                    error!("Failed to update dashboard files in database: {}", e);
                    return Err(anyhow::anyhow!(
                        "Failed to update dashboard files in database: {}",
                        e
                    ));
                }
            }
        }

        // Generate output
        let duration = start_time.elapsed().as_millis() as i64;

        // Construct message based on success/failure counts
        let successes_count = batch.files.len();
        let failures_count = batch.failed_updates.len();

        let message = match (successes_count, failures_count) {
            (s, 0) if s > 0 => format!("Successfully modified {} dashboard file{}.", s, if s == 1 { "" } else { "s" }),
            (0, f) if f > 0 => format!("Failed to modify {} dashboard file{}.", f, if f == 1 { "" } else { "s" }),
            (s, f) if s > 0 && f > 0 => format!("Successfully modified {} dashboard file{}, {} failed.", s, if s == 1 { "" } else { "s" }, f),
            _ => "No dashboard files were processed.".to_string(),
        };

        let mut output = ModifyFilesOutput {
            // Use the dynamically generated message
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
                FileWithId {
                    id: file.id,
                    name: file.name.clone(),
                    file_type: "dashboard".to_string(),
                    yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
                    result_message: Some(batch.validation_messages[i].clone()),
                    results: Some(batch.validation_results[i].clone()),
                    created_at: file.created_at,
                    updated_at: file.updated_at,
                    version_number: file.version_history.get_version_number(),
                }
            }));

        // Add failed updates to output
        output.failed_files.extend(
            batch
                .failed_updates
                .into_iter()
                .map(|(file_name, error)| FailedFileModification { file_name, error }),
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
            "description": get_modify_dashboards_description().await,
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["files"],
                "properties": {
                    "files": {
                        "type": "array",
                        "description": get_modify_dashboards_yml_description().await,
                        "items": {
                            "type": "object",
                            "required": ["id", "yml_content"],
                            "strict": true,
                            "properties": {
                                "id": {
                                    "type": "string",
                                    "description": get_dashboard_modification_id_description().await
                                },
                                "yml_content": {
                                    "type": "string",
                                    "description": get_dashboard_yml_description().await
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

async fn get_modify_dashboards_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Updates existing dashboard configuration files with new YAML content. Provide the complete YAML content for each dashboard, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple dashboards simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each dashboard, you need its UUID and the complete updated YAML content.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "e48ea999-fd99-4b17-9dbe-8b048af96eab").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Updates existing dashboard configuration files with new YAML content. Provide the complete YAML content for each dashboard, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple dashboards simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each dashboard, you need its UUID and the complete updated YAML content.".to_string()
        }
    }
}

async fn get_modify_dashboards_yml_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return format!("Array of dashboards to update. Each item requires an 'id' (UUID of the existing dashboard) and 'yml_content' (complete new YAML content that follows the specification below). You can update multiple dashboards in a single operation, making this ideal for bulk updates.\n\n{}", DASHBOARD_YML_SCHEMA);
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "9d2cc19b-32be-49bf-a2c2-1a82d0806230").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            format!("Array of dashboards to update. Each item requires an 'id' (UUID of the existing dashboard) and 'yml_content' (complete new YAML content that follows the specification below). You can update multiple dashboards in a single operation, making this ideal for bulk updates.\n\n{}", DASHBOARD_YML_SCHEMA)
        }
    }
}

async fn get_dashboard_modification_id_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "UUID of the dashboard file to update. This is a required identifier to locate the specific dashboard that needs to be modified.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "1d9cda62-53eb-4c5c-9c33-d3f81667b249").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "UUID of the dashboard file to update. This is a required identifier to locate the specific dashboard that needs to be modified.".to_string()
        }
    }
}

async fn get_dashboard_yml_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "The complete new YAML content for the dashboard, following the dashboard schema specification. This will replace the entire existing content of the file. Ensure all required fields are present and properly formatted according to the schema. When making significant changes to a dashboard, update the name to reflect these changes. If the dashboard's core topic remains the same, keep the original name.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "258a84a6-ec1a-4f45-b586-04853272deeb").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "The complete new YAML content for the dashboard, following the dashboard schema specification. This will replace the entire existing content of the file. Ensure all required fields are present and properly formatted according to the schema. When making significant changes to a dashboard, update the name to reflect these changes. If the dashboard's core topic remains the same, keep the original name.".to_string()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use uuid::Uuid;

    #[test]
    fn test_tool_parameter_validation() {
        // Test valid parameters
        let valid_params = json!({
            "files": [{
                "id": Uuid::new_v4().to_string(),
                "yml_content": "name: Test Dashboard\ndescription: A test dashboard\nrows:\n  - id: 1\n    items:\n      - id: 00000000-0000-0000-0000-000000000001\n    columnSizes: [12]"
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
