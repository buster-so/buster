use anyhow::{anyhow, Result};
use database::{
    chats::fetch_chat_with_permission,
    enums::{AssetPermissionRole, AssetType},
};
use middleware::AuthenticatedUser;
use sharing::{check_permission_access, create_share_by_email};
use tracing;
use uuid::Uuid;

/// Creates sharing permissions for a chat
///
/// # Arguments
/// * `chat_id` - The ID of the chat to share
/// * `user` - The authenticated user creating the sharing permissions
/// * `emails_and_roles` - List of (email, role) pairs representing the recipients and their access levels
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn create_chat_sharing_handler(
    chat_id: &Uuid,
    user: &AuthenticatedUser,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    // 1. Validate the chat exists
    let chat_exists = fetch_chat_with_permission(chat_id, &user.id).await?;

    let chat = if let Some(chat) = chat_exists {
        chat
    } else {
        return Err(anyhow!("Chat not found"));
    };

    if !check_permission_access(
        chat.permission,
        &[AssetPermissionRole::Owner, AssetPermissionRole::FullAccess],
        chat.chat.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!(
            "Insufficient permissions to share this chat.  You need Full Access or higher."
        ));
    }

    for (email, role) in emails_and_roles {
        match create_share_by_email(&email, *chat_id, AssetType::Chat, role, user.id).await {
            Ok(_) => {
                tracing::info!(
                    "Created sharing permission for email: {} on chat: {} with role: {:?}",
                    email,
                    chat_id,
                    role
                );
            }
            Err(e) => {
                tracing::error!("Failed to create sharing for email {}: {}", email, e);
                return Err(anyhow!(
                    "Failed to create sharing for email {}: {}",
                    email,
                    e
                ));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {}
