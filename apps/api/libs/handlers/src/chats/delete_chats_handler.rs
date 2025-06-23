use anyhow::Result;
use chrono::Utc;
use database::{
    enums::AssetPermissionRole, helpers::chats::fetch_chats_with_permissions, pool::get_pg_pool,
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use sharing::check_permission_access;
use std::collections::HashSet;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatDeleteResult {
    pub id: Uuid,
    pub success: bool,
    pub error: Option<String>,
}

/// Bulk delete chats (soft delete by setting deleted_at)
///
/// This function efficiently soft deletes multiple chats using a bulk update operation.
/// It validates that the user has permission to delete each chat (they must have CanEdit, FullAccess, or Owner permissions).
///
/// Returns a list of results indicating success or failure for each chat.
pub async fn delete_chats_handler(
    chat_ids: Vec<Uuid>,
    user: &AuthenticatedUser,
) -> Result<Vec<ChatDeleteResult>> {
    use database::schema::chats;

    // If no chat IDs provided, return empty result
    if chat_ids.is_empty() {
        return Ok(Vec::new());
    }

    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    // Fetch all chats with their permissions
    let chats_with_permissions = fetch_chats_with_permissions(&chat_ids, &user.id).await?;

    // Create a set of authorized chat IDs for quick lookup
    let authorized_chat_ids: HashSet<Uuid> = chats_with_permissions
        .iter()
        .filter(|cwp| {
            // Check if user has appropriate permissions (CanEdit, FullAccess, or Owner)
            let has_permission = check_permission_access(
                cwp.permission,
                &[
                    AssetPermissionRole::CanEdit,
                    AssetPermissionRole::FullAccess,
                    AssetPermissionRole::Owner,
                ],
                cwp.chat.organization_id,
                &user.organizations,
            );

            has_permission
        })
        .map(|cwp| cwp.chat.id)
        .collect();

    // Prepare results for unauthorized chats
    let mut delete_results: Vec<ChatDeleteResult> = chat_ids
        .iter()
        .filter(|id| !authorized_chat_ids.contains(id))
        .map(|id| ChatDeleteResult {
            id: *id,
            success: false,
            error: Some("Chat not found or you don't have permission to delete it".to_string()),
        })
        .collect();

    // If we have authorized deletes, perform them in bulk
    if !authorized_chat_ids.is_empty() {
        let authorized_ids: Vec<Uuid> = authorized_chat_ids.into_iter().collect();

        // Perform a bulk update for all authorized chats at once
        let result = diesel::update(chats::table)
            .filter(chats::id.eq_any(authorized_ids.clone()))
            .set((
                chats::deleted_at.eq(Some(Utc::now())),
                chats::updated_at.eq(Utc::now()),
            ))
            .execute(&mut conn)
            .await;

        match result {
            Ok(_) => {
                // Add success results for all authorized chats
                let success_results: Vec<ChatDeleteResult> = authorized_ids
                    .into_iter()
                    .map(|id| ChatDeleteResult {
                        id,
                        success: true,
                        error: None,
                    })
                    .collect();

                delete_results.extend(success_results);
            }
            Err(e) => {
                // Add error results for all authorized chats
                let error_results: Vec<ChatDeleteResult> = authorized_ids
                    .into_iter()
                    .map(|id| ChatDeleteResult {
                        id,
                        success: false,
                        error: Some(format!("Failed to delete chat: {}", e)),
                    })
                    .collect();

                delete_results.extend(error_results);
            }
        }
    }

    Ok(delete_results)
}
