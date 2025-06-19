use std::time::Instant;
use std::{env, sync::Arc};

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use braintrust::{get_prompt_system_message, BraintrustClient};
use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission, DashboardFile, MetricFileToDashboardFile},
    pool::get_pg_pool,
    schema::{asset_permissions, dashboard_files, metric_files_to_dashboard_files, users_to_organizations},
    types::{DashboardYml, VersionHistory},
};
use diesel::prelude::*;
use diesel::{insert_into, SelectableHelper};
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use serde::{Deserialize, Serialize};
use serde_json::{self, Value};
use tracing::debug;
use uuid::Uuid;

use crate::{
    agent::Agent,
    tools::{file_tools::common::DASHBOARD_YML_SCHEMA, ToolExecutor},
};

use super::{
    common::{generate_deterministic_uuid, validate_metric_ids},
    file_types::file::FileWithId,
    FileModificationTool,
    create_metrics::FailedFileCreation,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardFileParams {
    pub name: String,
    pub yml_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDashboardFilesParams {
    pub files: Vec<DashboardFileParams>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDashboardFilesOutput {
    pub message: String,
    pub duration: i64,
    pub files: Vec<FileWithId>,
    pub failed_files: Vec<FailedFileCreation>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDashboardFile {
    pub name: String,
    pub yml_content: String,
}

pub struct CreateDashboardFilesTool {
    agent: Arc<Agent>,
}

impl CreateDashboardFilesTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

impl FileModificationTool for CreateDashboardFilesTool {}

/// Process a dashboard file creation request
/// Returns Ok((DashboardFile, DashboardYml)) if successful, or an error message if failed
async fn process_dashboard_file(
    tool_call_id: String,
    file: DashboardFileParams,
    user_id: &Uuid,
    organization_id: &Uuid,
) -> Result<(DashboardFile, DashboardYml), String> {
    debug!("Processing dashboard file creation: {}", file.name);

    let dashboard_yml = DashboardYml::new(file.yml_content.clone())
        .map_err(|e| format!("Invalid YAML format: {}", e))?;

    let dashboard_id = generate_deterministic_uuid(&tool_call_id, &file.name, "dashboard").unwrap();

    // Collect and validate metric IDs from rows
    let metric_ids: Vec<Uuid> = dashboard_yml
        .rows
        .iter()
        .flat_map(|row| row.items.iter())
        .map(|item| item.id)
        .collect();

    if !metric_ids.is_empty() {
        match validate_metric_ids(&metric_ids).await {
            Ok(missing_ids) if !missing_ids.is_empty() => {
                return Err(format!("Invalid metric references: {:?}", missing_ids));
            }
            Err(e) => {
                return Err(format!("Failed to validate metrics: {}", e));
            }
            Ok(_) => (), // All metrics exist
        }
    }

    let dashboard_file = DashboardFile {
        id: dashboard_id,
        name: dashboard_yml.name.clone(),
        file_name: file.name.clone(),
        content: dashboard_yml.clone(),
        filter: None,
        organization_id: *organization_id,
        created_by: *user_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: VersionHistory::new(1, dashboard_yml.clone()),
        public_password: None,
    };

    Ok((dashboard_file, dashboard_yml))
}

#[async_trait]
impl ToolExecutor for CreateDashboardFilesTool {
    type Output = CreateDashboardFilesOutput;
    type Params = CreateDashboardFilesParams;

    fn get_name(&self) -> String {
        "create_dashboards".to_string()
    }

    async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output> {
        let start_time = Instant::now();

        let user_id = self.agent.get_user_id();
        let files = params.files;

        let mut created_files = vec![];
        let mut failed_files = vec![];

        // Get DB connection early
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
        };

        // Fetch the organization ID for the user
        let organization_id = match users_to_organizations::table
            .filter(users_to_organizations::user_id.eq(user_id))
            .select(users_to_organizations::organization_id)
            .first::<Uuid>(&mut conn)
            .await
        {
            Ok(org_id) => org_id,
            Err(diesel::NotFound) => {
                return Err(anyhow!(
                    "User {} is not associated with any organization.",
                    user_id
                ));
            }
            Err(e) => {
                return Err(anyhow!(
                    "Failed to fetch organization ID for user {}: {}",
                    user_id,
                    e
                ));
            }
        };

        // Process dashboard files
        let mut dashboard_records = vec![];
        let mut dashboard_ymls = vec![];

        // First pass - validate and prepare all records
        for file in files {
            match process_dashboard_file(
                tool_call_id.clone(),
                file.clone(),
                &user_id,
                &organization_id,
            )
            .await
            {
                Ok((dashboard_file, dashboard_yml)) => {
                    dashboard_records.push(dashboard_file);
                    dashboard_ymls.push(dashboard_yml);
                }
                Err(e) => {
                    failed_files.push(FailedFileCreation { name: file.name, error: e });
                }
            }
        }

        // Second pass - bulk insert records
        if !dashboard_records.is_empty() {
            match insert_into(dashboard_files::table)
                .values(&dashboard_records)
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    // Get the user ID from the agent state
                    // let user_id = self.agent.get_user_id(); // Redundant
                    
                    // Create asset permissions for each dashboard file
                    for dashboard_file in &dashboard_records {
                        let asset_permission = AssetPermission {
                            asset_id: dashboard_file.id,
                            asset_type: AssetType::DashboardFile,
                            identity_id: user_id,
                            identity_type: IdentityType::User,
                            role: AssetPermissionRole::Owner,
                            created_by: user_id,
                            updated_by: user_id,
                            created_at: Utc::now(),
                            updated_at: Utc::now(),
                            deleted_at: None,
                        };
                        
                        match diesel::insert_into(asset_permissions::table)
                            .values(&asset_permission)
                            .execute(&mut conn)
                            .await
                        {
                            Ok(_) => (),
                            Err(e) => {
                                tracing::warn!(
                                    "Failed to create asset permission for dashboard file {}: {}",
                                    dashboard_file.id,
                                    e
                                );
                            }
                        }
                    }
                    
                    // Create associations between metrics and dashboards
                    for (i, dashboard_record) in dashboard_records.iter().enumerate() {
                        let metric_ids: Vec<Uuid> = dashboard_record.content
                            .rows
                            .iter()
                            .flat_map(|row| row.items.iter())
                            .map(|item| item.id)
                            .collect();
                        
                        if !metric_ids.is_empty() {
                            // Create a Vec of MetricFileToDashboardFile objects for bulk insert
                            let metric_dashboard_values: Vec<MetricFileToDashboardFile> = metric_ids
                                .iter()
                                .map(|metric_id| MetricFileToDashboardFile {
                                    metric_file_id: *metric_id,
                                    dashboard_file_id: dashboard_record.id,
                                    created_at: Utc::now(),
                                    updated_at: Utc::now(),
                                    deleted_at: None,
                                    created_by: user_id,
                                })
                                .collect();
                            
                            // Insert the associations
                            match diesel::insert_into(metric_files_to_dashboard_files::table)
                                .values(&metric_dashboard_values)
                                .on_conflict_do_nothing() // In case the association already exists
                                .execute(&mut conn)
                                .await
                            {
                                Ok(_) => (),
                                Err(e) => {
                                    tracing::warn!(
                                        "Failed to create metric-to-dashboard associations for dashboard {}: {}",
                                        dashboard_record.id,
                                        e
                                    );
                                }
                            }
                        }
                    }
                    
                    for (i, yml) in dashboard_ymls.into_iter().enumerate() {
                        created_files.push(FileWithId {
                            id: dashboard_records[i].id,
                            name: dashboard_records[i].name.clone(),
                            file_type: "dashboard".to_string(),
                            yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
                            result_message: None,
                            results: None,
                            created_at: dashboard_records[i].created_at,
                            updated_at: dashboard_records[i].updated_at,
                            version_number: dashboard_records[i].version_history.get_version_number(),
                        });
                    }
                }
                Err(e) => {
                    failed_files.extend(dashboard_records.iter().map(|r| {
                        FailedFileCreation {
                            name: r.file_name.clone(),
                            error: format!("Failed to create dashboard file: {}", e),
                        }
                    }));
                }
            }
        }

        let message = if failed_files.is_empty() {
            format!(
                "Successfully created {} dashboard files.",
                created_files.len()
            )
        } else {
            let success_msg = if !created_files.is_empty() {
                format!(
                    "Successfully created {} dashboard files. ",
                    created_files.len()
                )
            } else {
                String::new()
            };

            let failures: Vec<String> = failed_files
                .iter()
                .map(|failure| format!("Failed to create '{}': {}", failure.name, failure.error))
                .collect();

            if failures.len() == 1 {
                format!("{}{}.", success_msg.trim(), failures[0])
            } else {
                format!(
                    "{}Failed to create {} dashboard files:\n{}",
                    success_msg,
                    failures.len(),
                    failures.join("\n")
                )
            }
        };

        let duration = start_time.elapsed().as_millis() as i64;

        if !created_files.is_empty() {
            self.agent
                .set_state_value(String::from("dashboards_available"), Value::Bool(true))
                .await;
            
            self.agent
                .set_state_value(String::from("files_available"), Value::Bool(true)) 
                .await;
        }

        // Set review_needed flag if execution was successful
        if failed_files.is_empty() {
            self.agent
                .set_state_value(String::from("review_needed"), Value::Bool(true))
                .await;
        }

        Ok(CreateDashboardFilesOutput {
            message,
            duration,
            files: created_files,
            failed_files,
        })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["files"],
                "properties": {
                    "files": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["name", "yml_content"],
                            "strict": true,
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": get_dashboard_name_description().await
                                },
                                "yml_content": {
                                    "type": "string",
                                    "description": get_dashboard_yml_description().await
                                }
                            },
                            "additionalProperties": false
                        },
                        "description": "Array of dashboard files to create."
                    }
                },
                "additionalProperties": false
            },
            "description": get_dashboard_description().await
        })
    }
}

async fn get_dashboard_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Creates **new** dashboard files. Use this if no existing dashboard file can fulfill the user's needs. Before using this tool, carefully think through the dashboard format, specification, and structure to ensure it meets requirements. Guard Rail: Do not execute any file creation or modifications until a thorough data catalog search has been completed and reviewed, and you have a clear understanding of the dashboard specification.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "7ec9d087-e222-4af3-8896-77d5c135f3c3").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Creates **new** dashboard files. Use this if no existing dashboard file can fulfill the user's needs. Before using this tool, carefully think through the dashboard format, specification, and structure to ensure it meets requirements. Guard Rail: Do not execute any file creation or modifications until a thorough data catalog search has been completed and reviewed, and you have a clear understanding of the dashboard specification.".to_string()
        }
    }
}

async fn get_dashboard_yml_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return DASHBOARD_YML_SCHEMA.to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "9d2cc19b-32be-49bf-a2c2-1a82d0806230").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            DASHBOARD_YML_SCHEMA.to_string()
        }
    }
}

async fn get_dashboard_name_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "The natural language name/title for the dashboard, exactly matching the 'name' field within the YML content. This name will identify the dashboard in the UI. Do not include file extensions or use file path characters.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "c8d19094-5530-4d5f-aaeb-4665ef292450").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "The natural language name/title for the dashboard, exactly matching the 'name' field within the YML content. This name will identify the dashboard in the UI. Do not include file extensions or use file path characters.".to_string()
        }
    }
}
