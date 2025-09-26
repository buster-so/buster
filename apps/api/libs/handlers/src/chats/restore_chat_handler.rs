use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::AssetType,
    models::{Message, MessageToFile},
    pool::get_pg_pool,
    schema::{chats, dashboard_files, messages, messages_to_files, metric_files},
};
use diesel::{update, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use futures::future::try_join_all;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::chats::get_chat_handler::get_chat_handler;
use crate::chats::types::ChatWithMessages;
// Import public handler types directly
use crate::dashboards::{update_dashboard_handler, DashboardUpdateRequest};
use crate::metrics::{update_metric_handler, UpdateMetricRequest};

/// Request structure for restoring an asset (metric or dashboard) version in a chat
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatRestoreRequest {
    /// ID of the asset to restore
    pub asset_id: Uuid,
    /// Type of asset to restore (metric_file or dashboard_file)
    pub asset_type: AssetType,
    /// Version number to restore
    pub version_number: i32,
}

/// Handler for restoring a previous version of an asset (metric or dashboard) and documenting it in a chat
///
/// # Arguments
/// * `chat_id` - The UUID of the chat where the restoration will be documented
/// * `user` - The authenticated user making the request
/// * `request` - The restoration request with asset_id, asset_type, and version_number
///
/// # Returns
/// * `Result<ChatWithMessages>` - The updated chat with new messages documenting the restoration
///
/// # Process
/// 1. Concurrently:
///    a. Restores the specified asset version using the appropriate handler
///    b. Fetches the most recent message from the chat (to copy raw_llm_messages)
/// 2. Waits for restoration and fetch to complete.
/// 3. Constructs new message details (text, file link, raw_llm_messages).
/// 4. Concurrently:
///    a. Inserts the new message documenting the restoration
///    b. Inserts the message-to-file association
///    c. Updates the chat record with the latest file info
/// 5. Waits for insertions and update to complete.
/// 6. Returns the updated chat with all messages
pub async fn restore_chat_handler(
    chat_id: &Uuid,
    user: &AuthenticatedUser,
    request: ChatRestoreRequest,
) -> Result<ChatWithMessages> {
    // Clone variables needed for concurrent tasks
    let user_clone1 = user.clone();
    let request_clone1 = request.clone();
    let chat_id_clone1 = *chat_id;

    // Task 1: Restore Asset
    let restore_task = tokio::spawn(async move {
        let (file_type, file_name, file_id, version_number) = match request_clone1.asset_type {
            AssetType::MetricFile => {
                let metric_request = UpdateMetricRequest {
                    restore_to_version: Some(request_clone1.version_number),
                    ..Default::default()
                };
                let updated_metric =
                    update_metric_handler(&request_clone1.asset_id, &user_clone1, metric_request)
                        .await?;
                (
                    "metric_file".to_string(),
                    updated_metric.name,
                    updated_metric.id,
                    updated_metric.versions.len() as i32,
                )
            }
            AssetType::DashboardFile => {
                let dashboard_request = DashboardUpdateRequest {
                    restore_to_version: Some(request_clone1.version_number),
                    ..Default::default()
                };
                let updated_dashboard = update_dashboard_handler(
                    request_clone1.asset_id,
                    dashboard_request,
                    &user_clone1,
                )
                .await?;
                (
                    "dashboard".to_string(),
                    updated_dashboard.dashboard.name,
                    updated_dashboard.dashboard.id,
                    updated_dashboard.dashboard.version_number,
                )
            }
            _ => {
                return Err(anyhow!(
                    "Unsupported asset type for restoration: {:?}",
                    request_clone1.asset_type
                ))
            }
        };
        // Explicitly type the Ok variant for the compiler
        Ok::<_, anyhow::Error>((file_type, file_name, file_id, version_number))
    });

    // Task 2: Get the most recent message to copy raw_llm_messages
    let last_message_task = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await?;
        let last_message = messages::table
            .filter(messages::chat_id.eq(&chat_id_clone1))
            .filter(messages::deleted_at.is_null())
            .limit(1)
            .order_by(messages::created_at.desc())
            .first::<Message>(&mut conn) // Assuming Message derives Clone
            .await
            .ok();
        // Explicitly type the Ok variant
        Ok::<_, anyhow::Error>(last_message)
    });

    // Wait for initial tasks to complete
    let (restore_result, last_message_result) = tokio::join!(restore_task, last_message_task);

    // Handle potential errors from spawned tasks
    let (file_type, file_name, file_id, version_number) = restore_result??;
    let last_message = last_message_result??;

    // --- START: Fetch restored content from main table ---
    let file_content: String = {
        let mut conn = get_pg_pool().get().await?;
        match request.asset_type {
            AssetType::MetricFile => {
                let content_json = metric_files::table
                    .filter(metric_files::id.eq(&file_id))
                    .select(metric_files::content)
                    .first::<serde_json::Value>(&mut conn)
                    .await?;
                // Convert JSON Value to pretty YAML String
                serde_yaml::to_string(&content_json)
                    .map_err(|e| anyhow!("Failed to convert metric content to YAML: {}", e))?
            }
            AssetType::DashboardFile => {
                let content_json = dashboard_files::table
                    .filter(dashboard_files::id.eq(&file_id))
                    .select(dashboard_files::content)
                    .first::<serde_json::Value>(&mut conn)
                    .await?;
                // Convert JSON Value to pretty YAML String for the message
                serde_yaml::to_string(&content_json)
                    .map_err(|e| anyhow!("Failed to convert dashboard content to YAML: {}", e))?
            }
            // This case should be unreachable due to the check in the restore_task
            _ => {
                return Err(anyhow!(
                    "Unexpected asset type after successful restoration: {:?}",
                    request.asset_type
                ))
            }
        }
    };
    // --- END: Fetch restored content from main table ---

    // Step 3: Construct message details
    let tool_call_id = format!("call_{}", Uuid::new_v4().to_string().replace("-", ""));
    let mut raw_llm_messages = if let Some(last_msg) = &last_message {
        // Use clone here if last_message is Some(Message)
        if let Ok(msgs) = serde_json::from_value::<Vec<Value>>(last_msg.raw_llm_messages.clone()) {
            msgs
        } else {
            Vec::new()
        }
    } else {
        Vec::new()
    };

    raw_llm_messages.push(json!({
        "name": "buster_super_agent",
        "role": "assistant",
        "tool_calls": [
          {
            "id": tool_call_id,
            "type": "function",
            "function": {
              "name": format!("restore_{}", file_type),
              "arguments": json!({
                "version_number": request.version_number
              }).to_string()
            }
          }
        ]
    }));
    raw_llm_messages.push(json!({
        "name": format!("restore_{}", file_type),
        "role": "tool",
        "content": json!({
            "message": format!("Successfully restored 1 {} files.", file_type),
            "file_contents": file_content
        }).to_string(),
        "tool_call_id": tool_call_id
    }));

    let message_id = Uuid::new_v4();
    let now = Utc::now();
    let timestamp = now.timestamp();

    let response_messages = json!([
        {
            "id": file_id.to_string(),
            "type": "file",
            "metadata": [
                {
                    "status": "completed",
                    "message": format!("Restored from version {}", request.version_number),
                    "timestamp": timestamp
                }
            ],
            "file_name": file_name, // file_name is already String, no clone needed if moved
            "file_type": file_type, // file_type is already String, no clone needed if moved
            "version_number": version_number, // version_number is i32 (Copy)
            "filter_version_id": null
        }
    ]);

    // Create Message object - requires Message to be Clone if used in multiple tasks
    // Assuming Message derives Clone
    let message = Message {
        id: message_id,
        request_message: None,
        response_messages, // This is Value, likely Clone
        reasoning: json!([]),
        title: "Version Restoration".to_string(),
        raw_llm_messages: Value::Array(raw_llm_messages), // raw_llm_messages moved here
        final_reasoning_message: Some(format!(
            "v{} was created by restoring v{}",
            version_number, request.version_number
        )),
        chat_id: *chat_id,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: user.id,
        feedback: None,
        is_completed: false,
        post_processing_message: None,
    };

    // Create MessageToFile object - requires MessageToFile to be Clone if used in multiple tasks
    // Assuming MessageToFile derives Clone
    let message_to_file = MessageToFile {
        id: Uuid::new_v4(),
        message_id: message_id,
        file_id: file_id,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        is_duplicate: false,
        version_number: version_number,
    };

    // Step 4: Concurrently insert message, message_to_file, and update chat
    // Clone necessary variables for final tasks
    let message_clone = message.clone(); // Requires Message: Clone
    let message_to_file_clone = message_to_file.clone(); // Requires MessageToFile: Clone
    let chat_id_clone2 = *chat_id;
    let request_asset_type_clone = request.asset_type; // AssetType is likely Copy
    let file_id_clone = file_id; // file_id is Uuid (Copy)

    let insert_message_task = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await?;
        diesel::insert_into(messages::table)
            .values(&message_clone) // Use cloned message
            .execute(&mut conn)
            .await?;
        Ok::<_, anyhow::Error>(()) // Explicit Ok type
    });

    let insert_mtf_task = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await?;
        diesel::insert_into(messages_to_files::table)
            .values(&message_to_file_clone) // Use cloned mtf
            .execute(&mut conn)
            .await?;
        Ok::<_, anyhow::Error>(()) // Explicit Ok type
    });

    let update_chat_task = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await?;
        update(chats::table)
            .filter(chats::id.eq(&chat_id_clone2))
            .set((
                chats::most_recent_file_id.eq(Some(file_id_clone)),
                chats::most_recent_version_number.eq(Some(version_number)), // version_number is Copy
                chats::most_recent_file_type.eq(Some(request_asset_type_clone)),
                chats::updated_at.eq(now), // now is Copy
            ))
            .execute(&mut conn)
            .await?;
        Ok::<_, anyhow::Error>(()) // Explicit Ok type
    });

    // Wait for final database operations using try_join_all for cleaner error handling
    try_join_all(vec![insert_message_task, insert_mtf_task, update_chat_task]).await?;

    // Return the updated chat with messages
    get_chat_handler(chat_id, user, false).await
}
