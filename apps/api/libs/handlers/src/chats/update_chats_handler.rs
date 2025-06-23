use anyhow::Result;
use chrono::Utc;
use database::{
    helpers::chats::fetch_chats_with_permissions,
    pool::get_pg_pool,
    enums::AssetPermissionRole,
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use sharing::check_permission_access;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatUpdate {
    pub id: Uuid,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatUpdateResult {
    pub id: Uuid,
    pub success: bool,
    pub error: Option<String>,
}

/// Bulk update chat titles
/// 
/// This function efficiently updates the titles of multiple chats.
/// It validates that the user has permission to update each chat (they must have CanEdit, FullAccess, or Owner permissions)
/// in a single database query, then performs individual updates for each chat.
/// 
/// Returns a list of results indicating success or failure for each chat.
pub async fn update_chats_handler(
    updates: Vec<ChatUpdate>,
    user: &AuthenticatedUser,
) -> Result<Vec<ChatUpdateResult>> {
    use database::schema::chats;
    
    // If no updates provided, return empty result
    if updates.is_empty() {
        return Ok(Vec::new());
    }
    
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    // Extract all chat IDs
    let chat_ids: Vec<Uuid> = updates.iter().map(|u| u.id).collect();
    
    // Fetch all chats with their permissions
    let chats_with_permissions = fetch_chats_with_permissions(&chat_ids, &user.id).await?;
    
    // Create a set of authorized chat IDs for quick lookup
    let authorized_chat_ids: HashSet<Uuid> = chats_with_permissions
        .iter()
        .filter(|cwp| {
            // Check if user has appropriate permissions (CanEdit, FullAccess, or Owner)
            // or if they are the creator of the chat
            let is_creator = cwp.chat.created_by == user.id;
            let has_permission = check_permission_access(
                cwp.permission,
                &[AssetPermissionRole::CanEdit, AssetPermissionRole::FullAccess, AssetPermissionRole::Owner],
                cwp.chat.organization_id,
                &user.organizations,
            );
            
            is_creator || has_permission
        })
        .map(|cwp| cwp.chat.id)
        .collect();
    
    let mut update_results = Vec::with_capacity(updates.len());
    
    // Process each update
    for update in updates {
        if authorized_chat_ids.contains(&update.id) {
            // Update the chat title
            let result = diesel::update(chats::table)
                .filter(chats::id.eq(update.id))
                .set((
                    chats::title.eq(update.title.clone()),
                    chats::updated_at.eq(Utc::now()),
                ))
                .execute(&mut conn)
                .await;
            
            match result {
                Ok(_) => update_results.push(ChatUpdateResult {
                    id: update.id,
                    success: true,
                    error: None,
                }),
                Err(e) => update_results.push(ChatUpdateResult {
                    id: update.id,
                    success: false,
                    error: Some(format!("Failed to update chat: {}", e)),
                }),
            }
        } else {
            update_results.push(ChatUpdateResult {
                id: update.id,
                success: false,
                error: Some("Chat not found or you don't have permission to update it".to_string()),
            });
        }
    }
    
    Ok(update_results)
}