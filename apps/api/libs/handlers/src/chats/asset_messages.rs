use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::AssetType,
    models::{DashboardFile, Message, MessageToFile, MetricFile},
    pool::get_pg_pool,
    schema::{chats, dashboard_files, messages, messages_to_files, metric_files},
};
use diesel::{insert_into, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
// Using json for our serialization
use middleware::AuthenticatedUser;
use serde_json::json;
use uuid::Uuid;

use super::context_loaders::fetch_asset_details;

/// Generate default messages for prompt-less asset-based chats
///
/// This function creates a message to be shown in a chat when a user
/// opens an asset without providing a prompt. It includes:
/// 1. A file response that represents the asset itself
/// 2. A text response with helpful context
///
/// The function also adds the asset information to raw_llm_messages so
/// the agent can understand the context of the asset being viewed.
///
/// The function checks that the user has permission to view the asset
/// and fetches the asset details for display.
pub async fn generate_asset_messages(
    asset_id: Uuid,
    asset_type: AssetType,
    user: &AuthenticatedUser,
) -> Result<Vec<Message>> {
    // In a real implementation, we would check permissions here
    // However, for now, we'll skip this as the sharing module is not available
    // check_asset_permission(asset_id, asset_type, user, AssetPermissionLevel::CanView).await?;

    // Fetch asset details based on type
    let asset_details = fetch_asset_details(asset_id, asset_type).await?;

    // Create a single message with both text and file response
    let message_id = Uuid::new_v4();
    let timestamp = Utc::now().timestamp();

    // Fetch detailed asset information
    let mut conn = get_pg_pool().get().await?;

    // Prepare asset data based on asset type
    let (asset_data, asset_type_str, additional_files) = match asset_type {
        AssetType::MetricFile => {
            let metric = metric_files::table
                .filter(metric_files::id.eq(asset_id))
                .first::<MetricFile>(&mut conn)
                .await?;

            // Get YAML content
            let yml_content = serde_yaml::to_string(&metric.content)?;

            // For simplicity, we'll just use an empty array for results
            // since MetricYml may not have results field
            let results = serde_json::json!([]);

            // Create asset data object
            let asset_data = json!({
                "id": asset_id.to_string(),
                "name": metric.name,
                "file_type": "metric_file",
                "asset_type": "metric_file",
                "yml_content": yml_content,
                "result_message": "0 records were returned",
                "results": results,
                "created_at": metric.created_at,
                "version_number": metric.version_history.get_version_number(),
                "updated_at": metric.updated_at
            });

            (asset_data, "metric_file", Vec::new())
        }
        AssetType::DashboardFile => {
            let dashboard = dashboard_files::table
                .filter(dashboard_files::id.eq(asset_id))
                .first::<DashboardFile>(&mut conn)
                .await?;

            // Get YAML content
            let yml_content = serde_yaml::to_string(&dashboard.content)?;

            // Create asset data object
            let asset_data = json!({
                "id": asset_id.to_string(),
                "name": dashboard.name,
                "file_type": "dashboard",
                "asset_type": "dashboard",
                "yml_content": yml_content,
                "created_at": dashboard.created_at,
                "version_number": dashboard.version_history.get_version_number(),
                "updated_at": dashboard.updated_at
            });

            // Extract metric IDs from dashboard
            let mut metric_ids = std::collections::HashSet::new();
            for row in &dashboard.content.rows {
                for item in &row.items {
                    metric_ids.insert(item.id);
                }
            }

            // Load all associated metrics for context (they won't be shown in UI)
            let mut metric_files_data = Vec::new();
            for metric_id in metric_ids {
                match metric_files::table
                    .filter(metric_files::id.eq(metric_id))
                    .first::<MetricFile>(&mut conn)
                    .await
                {
                    Ok(metric) => {
                        // Get YAML content for this metric
                        if let Ok(yml_content) = serde_yaml::to_string(&metric.content) {
                            // Add metric as additional file data for agent context
                            let metric_data = json!({
                                "id": metric.id.to_string(),
                                "name": metric.name,
                                "file_type": "metric_file",
                                "asset_type": "metric_file",
                                "yml_content": yml_content,
                                "created_at": metric.created_at,
                                "version_number": metric.version_history.get_version_number(),
                                "updated_at": metric.updated_at
                            });

                            metric_files_data.push(metric_data);
                        }
                    }
                    Err(e) => {
                        // Log error but continue with other metrics
                        tracing::warn!(
                            "Failed to load metric {} for dashboard context: {}",
                            metric_id,
                            e
                        );
                    }
                }
            }

            tracing::info!(
                "Loaded {} metrics as context for dashboard import",
                metric_files_data.len()
            );

            (asset_data, "dashboard", metric_files_data)
        }
        _ => {
            return Err(anyhow!(
                "Unsupported asset type for generating asset messages: {:?}",
                asset_type
            ));
        }
    };

    // Determine appropriate message based on file count
    let additional_files_count = additional_files.len();
    let message_text = if additional_files_count == 0 {
        format!("Successfully imported 1 {} file.", asset_type_str)
    } else {
        format!(
            "Successfully imported 1 {} file with {} additional context files.",
            asset_type_str, additional_files_count
        )
    };

    // Create combined file list with the main asset first, followed by context files
    let mut all_files = vec![asset_data];
    all_files.extend(additional_files);

    // Create the user message with imported asset information
    let user_message = serde_json::json!({
        "role": "user",
        "content": format!(
            "I've imported the following {}:\n\n{}\n\nFile details:\n{}",
            asset_type_str,
            message_text,
            serde_json::to_string_pretty(&all_files).unwrap_or_else(|_| "Unable to format file details".to_string())
        )
    });

    // Create raw_llm_messages with just the user message
    let raw_llm_messages = serde_json::json!([user_message]);

    let message = Message {
        id: message_id,
        request_message: None, // Empty request for auto-generated messages
        chat_id: Uuid::nil(),  // Will be set by caller
        created_by: user.id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        response_messages: serde_json::json!([
            {
                "type": "text",
                "id": Uuid::new_v4().to_string(),
                "message": format!("{} has been pulled into a new chat.\n\nContinue chatting to modify or make changes to it.", asset_details.name),
                "is_final_message": true
            },
            {
                "type": "file",
                "id": asset_id.to_string(),
                "file_type": asset_details.file_type,
                "file_name": asset_details.name,
                "version_number": asset_details.version_number,
                "filter_version_id": null,
                "metadata": [
                    {
                        "status": "completed",
                        "message": "Pulled into new chat",
                        "timestamp": timestamp
                    }
                ]
            }
        ]),
        reasoning: serde_json::Value::Array(vec![]),
        final_reasoning_message: Some("".to_string()),
        title: asset_details.name.clone(),
        raw_llm_messages, // Add the agent context messages
        feedback: None,
        is_completed: true,
        post_processing_message: None,
    };

    Ok(vec![message])
}

/// Create association between message and file in the database
///
/// This function creates an entry in the messages_to_files table to link
/// a message with an asset file. This is necessary to support features
/// like file navigation and referencing.
///
/// Only certain asset types (MetricFile and DashboardFile) are supported.
pub async fn create_message_file_association(
    message_id: Uuid,
    file_id: Uuid,
    version_number: i32,
    asset_type: AssetType,
) -> Result<()> {
    // Only create association for file-type assets
    if asset_type != AssetType::MetricFile && asset_type != AssetType::DashboardFile {
        return Err(anyhow!(
            "Cannot create file association for non-file asset type"
        ));
    }

    let mut conn = get_pg_pool().get().await?;

    let message_to_file = MessageToFile {
        id: Uuid::new_v4(),
        message_id,
        file_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        is_duplicate: false,
        version_number,
    };

    // Insert the message-to-file association
    insert_into(messages_to_files::table)
        .values(&message_to_file)
        .execute(&mut conn)
        .await?;

    // Get the chat_id for this message
    let message_result = messages::table
        .filter(messages::id.eq(message_id))
        .select(messages::chat_id)
        .first::<Uuid>(&mut conn)
        .await;

    if let Ok(chat_id) = message_result {
        // Check if this is a supported file type
        let file_type = match asset_type {
            AssetType::MetricFile | AssetType::DashboardFile | AssetType::ReportFile => asset_type,
            _ => return Ok(()),
        };

        // Update the chat with the most recent file information
        diesel::update(chats::table.find(chat_id))
            .set((
                chats::most_recent_file_id.eq(Some(file_id)),
                chats::most_recent_file_type.eq(Some(file_type)),
                chats::updated_at.eq(Utc::now()),
            ))
            .execute(&mut conn)
            .await?;
    }

    Ok(())
}
