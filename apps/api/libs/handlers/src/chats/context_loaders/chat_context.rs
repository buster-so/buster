use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use agents::{Agent, AgentMessage};
use anyhow::Result;
use async_trait::async_trait;
use database::schema::metric_files;
use database::{
    models::{DashboardFile, MetricFile},
    pool::get_pg_pool,
    schema::{chats, dashboard_files, messages},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use litellm::{FunctionCall, ToolCall, MessageProgress};
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use super::ContextLoader;

// --- Structs for Simulated Tool Call (handling multiple files) ---
#[derive(Serialize, Deserialize, Debug, Clone)]
struct UserManuallyModifiedFileParams {
    asset_ids: Vec<Uuid>, // Changed to Vec
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ModifiedFileInfo {
    asset_id: Uuid,
    version_number: i32,
    yml_content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct UserManuallyModifiedFileOutput {
    updated_files: Vec<ModifiedFileInfo>, // Contains details for all updated files
}

// Add a struct to deserialize the search_data_catalog output
#[derive(Deserialize, Debug)]
struct SearchDataCatalogToolOutput {
    data_source_id: Option<Uuid>,
    // Include other fields if needed for future context, but only data_source_id is required now
}
// --- End Structs ---

pub struct ChatContextLoader {
    pub chat_id: Uuid,
}

impl ChatContextLoader {
    pub fn new(chat_id: Uuid) -> Self {
        Self { chat_id }
    }

    // Helper function to check for tool usage and set appropriate context
    async fn update_context_from_tool_calls(agent: &Arc<Agent>, message: &AgentMessage) {
        // Handle tool calls from assistant messages
        if let AgentMessage::Assistant {
            tool_calls: Some(tool_calls),
            ..
        } = message
        {
            for tool_call in tool_calls {
                match tool_call.function.name.as_str() {
                    "search_data_catalog" => {
                        // We will set data_context based on the *response* now,
                        // but keep this for potential future use or broader context setting.
                        // agent
                        //     .set_state_value(String::from("data_context"), Value::Bool(true))
                        //     .await;
                    }
                    "create_metrics" | "update_metrics" => {
                        agent
                            .set_state_value(String::from("metrics_available"), Value::Bool(true))
                            .await;
                    }
                    "create_dashboards" | "update_dashboards" => {
                        agent
                            .set_state_value(
                                String::from("dashboards_available"),
                                Value::Bool(true),
                            )
                            .await;
                    }
                    "import_assets" => {
                        // When we see import_assets, we need to check the content in the corresponding tool response
                        // This will be handled separately when processing tool messages
                    }
                    name if name.contains("file")
                        || name.contains("read")
                        || name.contains("write")
                        || name.contains("edit") =>
                    {
                        agent
                            .set_state_value(String::from("files_available"), Value::Bool(true))
                            .await;
                    }
                    _ => {}
                }
            }
        }

        // Handle tool responses - important for import_assets
        if let AgentMessage::Tool {
            name: Some(tool_name),
            content,
            ..
        } = message
        {
            if tool_name == "import_assets" {
                // Parse the tool response to see what was imported
                if let Ok(import_result) = serde_json::from_str::<serde_json::Value>(content) {
                    // Check for files array
                    if let Some(files) = import_result.get("files").and_then(|f| f.as_array()) {
                        if !files.is_empty() {
                            // Set files_available for any imported files
                            agent
                                .set_state_value(String::from("files_available"), Value::Bool(true))
                                .await;

                            // Check each file to determine its type
                            let mut has_metrics = false;
                            let mut has_dashboards = false;
                            let mut has_datasets = false;

                            for file in files {
                                // Check file_type/asset_type to determine what kind of asset this is
                                let file_type = file
                                    .get("file_type")
                                    .and_then(|ft| ft.as_str())
                                    .or_else(|| file.get("asset_type").and_then(|at| at.as_str()));

                                tracing::debug!(
                                    "Processing imported file with type: {:?}",
                                    file_type
                                );

                                match file_type {
                                    Some("metric") => {
                                        has_metrics = true;

                                        // Check if the metric has dataset references
                                        if let Some(yml_content) =
                                            file.get("yml_content").and_then(|y| y.as_str())
                                        {
                                            if yml_content.contains("dataset")
                                                || yml_content.contains("datasetIds")
                                            {
                                                has_datasets = true;
                                            }
                                        }
                                    }
                                    Some("dashboard") => {
                                        has_dashboards = true;

                                        // Dashboards often reference metrics too
                                        has_metrics = true;

                                        // Check if the dashboard has dataset references via metrics
                                        if let Some(yml_content) =
                                            file.get("yml_content").and_then(|y| y.as_str())
                                        {
                                            if yml_content.contains("dataset")
                                                || yml_content.contains("datasetIds")
                                            {
                                                has_datasets = true;
                                            }
                                        }
                                    }
                                    _ => {
                                        tracing::debug!(
                                            "Unknown file type in import_assets: {:?}",
                                            file_type
                                        );
                                    }
                                }
                            }

                            // Set appropriate state values based on what we found
                            if has_metrics {
                                tracing::debug!("Setting metrics_available state to true");
                                agent
                                    .set_state_value(
                                        String::from("metrics_available"),
                                        Value::Bool(true),
                                    )
                                    .await;
                            }
                            if has_dashboards {
                                tracing::debug!("Setting dashboards_available state to true");
                                agent
                                    .set_state_value(
                                        String::from("dashboards_available"),
                                        Value::Bool(true),
                                    )
                                    .await;
                            }
                            if has_datasets {
                                tracing::debug!("Setting data_context state to true");
                                agent
                                    .set_state_value(
                                        String::from("data_context"),
                                        Value::Bool(true),
                                    )
                                    .await;
                            }
                        }
                    }
                }
            }

            // NEW: Check for search_data_catalog response and extract data_source_id
            if tool_name == "search_data_catalog" {
                match serde_json::from_str::<SearchDataCatalogToolOutput>(content) {
                    Ok(output) => {
                        if let Some(ds_id) = output.data_source_id {
                            tracing::debug!(data_source_id = %ds_id, "Found data_source_id in search_data_catalog tool history, caching in agent state.");
                            // Cache the data_source_id
                            agent.set_state_value(
                                "data_source_id".to_string(), 
                                Value::String(ds_id.to_string())
                            ).await;
                            // Also set data_context flag to true since we found the ID
                            agent.set_state_value("data_context".to_string(), Value::Bool(true)).await;
                        } else {
                            // If the tool ran but didn't return an ID (e.g., no datasets found)
                            tracing::debug!("search_data_catalog tool ran in history but did not return a data_source_id.");
                            // Optionally clear or set to null if needed, or just leave as is
                            // agent.set_state_value("data_source_id".to_string(), Value::Null).await;
                        }
                    }
                    Err(e) => {
                        tracing::warn!(
                            error = %e, 
                            content = %content,
                            "Failed to parse search_data_catalog tool output from chat history."
                        );
                    }
                }
            }
        }
    }

    // Helper function to check if assets modified by tools in history were updated externally
    // Returns a list of simulated AgentMessages representing the updates.
    async fn check_external_asset_updates(
        agent: &Arc<Agent>,
        messages: &[AgentMessage],
    ) -> Result<Vec<AgentMessage>> {
        let mut tool_history_versions: HashMap<Uuid, i32> = HashMap::new(); // asset_id -> latest version seen in tool history

        // First pass: Find the latest version mentioned for each asset in tool history
        for message in messages {
            if let AgentMessage::Tool {
                name: Some(tool_name),
                content,
                ..
            } = message
            {
                if tool_name == "update_metrics"
                    || tool_name == "update_dashboards"
                    || tool_name == "create_metrics"
                    || tool_name == "create_dashboards"
                {
                    // ASSUMPTION: Content is JSON with "files": [{ "id": "...", "version_number": ... }] or similar
                    // We need to handle both single object responses and array responses
                    if let Ok(response_val) = serde_json::from_str::<Value>(content) {
                        let files_to_process = if let Some(files_array) =
                            response_val.get("files").and_then(|f| f.as_array())
                        {
                            // Handle array of files (like create/update tools)
                            files_array.clone()
                        } else if response_val.get("id").is_some()
                            && response_val.get("version_number").is_some()
                        {
                            // Handle single file object (potential alternative response format?)
                            vec![response_val]
                        } else {
                            // No recognizable file data
                            vec![]
                        };

                        for file_data in files_to_process {
                            if let (Some(id_val), Some(version_val)) =
                                (file_data.get("id"), file_data.get("version_number"))
                            // Look for version_number
                            {
                                if let (Some(id_str), Some(version_num)) =
                                    (id_val.as_str(), version_val.as_i64())
                                {
                                    if let Ok(asset_id) = Uuid::parse_str(id_str) {
                                        let entry =
                                            tool_history_versions.entry(asset_id).or_insert(0);
                                        *entry = (*entry).max(version_num as i32);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if tool_history_versions.is_empty() {
            return Ok(vec![]); // No assets modified by tools in history, nothing to check
        }

        let mut simulated_messages = Vec::new();
        let pool = get_pg_pool();
        let mut conn = pool.get().await?;

        let asset_ids: Vec<Uuid> = tool_history_versions.keys().cloned().collect();

        // Query current full records from DB to get version and content
        let current_metrics = metric_files::table
            .filter(metric_files::id.eq_any(&asset_ids))
            .load::<MetricFile>(&mut conn) // Load full MetricFile
            .await?;

        let current_dashboards = dashboard_files::table
            .filter(dashboard_files::id.eq_any(&asset_ids))
            .load::<DashboardFile>(&mut conn) // Load full DashboardFile
            .await?;

        // Combine results for easier iteration
        let all_current_assets: HashMap<Uuid, (i32, String)> = current_metrics
            .into_iter()
            .map(|mf| {
                let version = mf.version_history.get_version_number();
                let yml = serde_yaml::to_string(&mf.content).unwrap_or_default();
                (mf.id, (version, yml))
            })
            .chain(current_dashboards.into_iter().map(|df| {
                let version = df.version_history.get_version_number();
                let yml = serde_yaml::to_string(&df.content).unwrap_or_default();
                (df.id, (version, yml))
            }))
            .collect();

        // --- Refactored Logic: Collect all modified assets first ---
        let mut modified_assets_info: Vec<ModifiedFileInfo> = Vec::new();

        for (asset_id, tool_version) in &tool_history_versions {
            if let Some((db_version, db_yml_content)) = all_current_assets.get(asset_id) {
                 // Compare DB version with the latest version seen in tool history
                if *db_version > *tool_version {
                    tracing::warn!(
                        asset_id = %asset_id,
                        db_version = %db_version,
                        tool_version = %tool_version,
                        "Asset updated externally since last tool call in chat history. Adding to simulated update."
                    );
                    modified_assets_info.push(ModifiedFileInfo {
                        asset_id: *asset_id,
                        version_number: *db_version,
                        yml_content: db_yml_content.clone(),
                    });
                }
            }
        }

        // --- If any assets were modified, create ONE simulated call/response pair --- 
        if !modified_assets_info.is_empty() {
            let tool_name = "user_manually_modified_file".to_string();
            let modified_ids: Vec<Uuid> = modified_assets_info.iter().map(|i| i.asset_id).collect();

            // --- Generate Deterministic, LLM-like IDs --- 
            // Create a namespace UUID (can be any constant UUID)
            let namespace_uuid = Uuid::parse_str("6ba7b810-9dad-11d1-80b4-00c04fd430c8").unwrap(); 
            
            // Generate UUID v5 based on asset ID and version for determinism
            let call_seed = format!("{}-{}", modified_assets_info[0].asset_id, modified_assets_info[0].version_number);
            let deterministic_uuid = Uuid::new_v5(&namespace_uuid, call_seed.as_bytes());
            
            // Use the first part of the UUID for the ID string
            let id_suffix = deterministic_uuid.simple().to_string()[..27].to_string(); // Adjust length as needed
            
            // 1. ID for the ToolCall (and Assistant message)
            let tool_call_id = format!("call_{}", id_suffix);
            // 2. ID for the Tool response message itself (make it slightly different)
            let tool_response_msg_id = format!("tool_{}", id_suffix); 
            // --- End ID Generation ---

            // --- Create Simulated Tool Call (Params) --- 
            let params = UserManuallyModifiedFileParams { asset_ids: modified_ids };
            let params_json = serde_json::to_string(&params)?;

            let assistant_message = AgentMessage::Assistant {
                id: Some(tool_call_id.clone()), // Use ToolCall ID for Assistant Message ID
                content: None,
                tool_calls: Some(vec![ToolCall {
                    id: tool_call_id.clone(), // Use ID #1 for the ToolCall's ID
                    call_type: "function".to_string(),
                    function: FunctionCall { 
                        name: tool_name.clone(),
                        arguments: params_json,
                    },
                    code_interpreter: None,
                    retrieval: None,
                }]),
                name: None,
                progress: MessageProgress::Complete, 
                initial: false, 
            };
            simulated_messages.push(assistant_message);

            // --- Create Simulated Tool Response (Output) --- 
            let output = UserManuallyModifiedFileOutput { updated_files: modified_assets_info };
            let output_json = serde_json::to_string(&output)?;

            let tool_message = AgentMessage::Tool {
                tool_call_id: tool_call_id, // Use ID #1 for the ToolCall
                name: Some(tool_name),
                content: output_json,
                id: Some(tool_response_msg_id), // Use ID #2 for the Tool message's ID
                progress: MessageProgress::Complete, 
            };
            simulated_messages.push(tool_message);
        }

        Ok(simulated_messages)
    }
}

#[async_trait]
impl ContextLoader for ChatContextLoader {
    async fn load_context(
        &self,
        user: &AuthenticatedUser,
        agent: &Arc<Agent>,
    ) -> Result<Vec<AgentMessage>> {
        let mut conn = get_pg_pool().get().await?;

        // First verify the chat exists and user has access
        let chat = chats::table
            .filter(chats::id.eq(self.chat_id))
            .filter(chats::created_by.eq(&user.id))
            .filter(chats::deleted_at.is_null())
            .first::<database::models::Chat>(&mut conn)
            .await?;

        // Get only the most recent message for the chat
        let message = match messages::table
            .filter(messages::chat_id.eq(chat.id))
            .filter(messages::deleted_at.is_null())
            .order_by(messages::created_at.desc())
            .first::<database::models::Message>(&mut conn)
            .await
        {
            Ok(message) => message,
            Err(diesel::NotFound) => return Ok(vec![]),
            Err(e) => return Err(anyhow::anyhow!("Failed to get message: {}", e)),
        };

        // Convert the single message's history
        let mut agent_messages = Vec::new();
        let raw_messages =
            match serde_json::from_value::<Vec<AgentMessage>>(message.raw_llm_messages) {
                Ok(messages) => messages,
                Err(e) => {
                    tracing::error!(
                        "Failed to parse raw LLM messages for chat {}: {}",
                        chat.id,
                        e
                    );
                    Vec::new() // Return empty if parsing fails
                }
            };

        // Track seen message IDs to avoid duplicates from potential re-parsing/saving issues
        let mut seen_ids: HashSet<String> = HashSet::new();

        // Process messages to update context flags and collect unique messages
        for agent_message in &raw_messages {
            Self::update_context_from_tool_calls(agent, agent_message).await;

            if let Some(id) = agent_message.get_id() {
                if seen_ids.insert(id.to_string()) {
                    agent_messages.push(agent_message.clone());
                }
            } else {
                agent_messages.push(agent_message.clone());
            }
        }

        // Check for external updates and get simulated messages
        let simulated_update_messages =
            match Self::check_external_asset_updates(agent, &raw_messages).await {
                Ok(sim_messages) => sim_messages,
                Err(e) => {
                    tracing::error!("Failed to check for external asset updates: {}", e);
                    Vec::new() // Don't fail, just log and return no simulated messages
                }
            };

        // Append simulated messages, ensuring they haven't been seen before
        for sim_message in simulated_update_messages {
            if let Some(id) = sim_message.get_id() {
                if seen_ids.insert(id.to_string()) {
                    agent_messages.push(sim_message);
                }
            } else {
                // Should not happen for our simulated messages, but handle defensively
                agent_messages.push(sim_message);
            }
        }

        Ok(agent_messages)
    }
}
