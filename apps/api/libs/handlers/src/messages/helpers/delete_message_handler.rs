use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    models::Message,
    pool::get_pg_pool,
    schema::messages,
    chats::fetch_chat_with_permission,
    enums::AssetPermissionRole,
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use tracing::info;
use middleware::AuthenticatedUser;
use sharing::check_permission_access;
use uuid::Uuid;

/// Deletes a message and marks all subsequent messages in the same chat as deleted
///
/// # Arguments
/// * `user` - The authenticated user requesting the deletion
/// * `message_id` - The ID of the message to delete
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn delete_message_handler(user: AuthenticatedUser, message_id: Uuid) -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    // Get the message to delete to find its chat_id and created_at timestamp
    let message = match messages::table
        .filter(messages::id.eq(message_id))
        .first::<Message>(&mut conn)
        .await
    {
        Ok(message) => message,
        Err(diesel::NotFound) => return Err(anyhow!("Message not found")),
        Err(e) => return Err(anyhow!("Database error: {}", e)),
    };

    // Check if the user has permission to delete messages in this chat
    let chat_with_permission = fetch_chat_with_permission(&message.chat_id, &user.id).await?;
    
    // If chat not found, return error
    let chat_with_permission = match chat_with_permission {
        Some(cwp) => cwp,
        None => return Err(anyhow!("Chat not found")),
    };
    
    // Check if user has appropriate permissions (CanEdit, FullAccess, or Owner)
    let has_permission = check_permission_access(
        chat_with_permission.permission,
        &[
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        chat_with_permission.chat.organization_id,
        &user.organizations,
    );
    
    // If user is the creator, they automatically have access
    let is_creator = chat_with_permission.chat.created_by == user.id;
    
    if !has_permission && !is_creator {
        return Err(anyhow!("You don't have permission to delete messages in this chat"));
    }

    // Mark the target message and all subsequent messages in the same chat as deleted
    let updated_count = diesel::update(messages::table)
        .filter(
            messages::chat_id
                .eq(message.chat_id)
                .and(messages::created_at.ge(message.created_at)),
        )
        .set(messages::deleted_at.eq(Some(Utc::now())))
        .execute(&mut conn)
        .await?;

    info!(
        message_id = %message_id,
        chat_id = %message.chat_id,
        updated_count = updated_count,
        "Deleted message and subsequent messages in chat"
    );

    Ok(())
}
