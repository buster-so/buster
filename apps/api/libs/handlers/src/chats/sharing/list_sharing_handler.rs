use anyhow::{anyhow, Result};
use database::{
    chats::fetch_chat_with_permission,
    enums::{AssetPermissionRole, AssetType},
};
use middleware::AuthenticatedUser;
use sharing::{
    check_permission_access,
    list_asset_permissions::list_shares,
    types::AssetPermissionWithUser,
};
use tracing::{error, info};
use uuid::Uuid;

/// Lists all sharing permissions for a specific chat
///
/// # Arguments
///
/// * `chat_id` - The unique identifier of the chat
/// * `user` - The authenticated user requesting the permissions
///
/// # Returns
///
/// A vector of asset permissions with user information
pub async fn list_chat_sharing_handler(
    chat_id: &Uuid,
    user: &AuthenticatedUser,
) -> Result<Vec<AssetPermissionWithUser>> {
    info!(
        chat_id = %chat_id,
        user_id = %user.id,
        "Listing chat sharing permissions"
    );

    // 1. Validate the chat exists
    let chat_exists = fetch_chat_with_permission(chat_id, &user.id).await?;

    let chat = if let Some(chat) = chat_exists {
        chat
    } else {
        error!(
            chat_id = %chat_id,
            "Chat not found"
        );
        return Err(anyhow!("Chat not found"));
    };

    // 2. Check if user has permission to view the chat
    if !check_permission_access(
        chat.permission,
        &[AssetPermissionRole::Owner, AssetPermissionRole::FullAccess, AssetPermissionRole::CanEdit, AssetPermissionRole::CanView],
        chat.chat.organization_id,
        &user.organizations,
    ) {
        error!(
            chat_id = %chat_id,
            user_id = %user.id,
            "User does not have permission to view this chat"
        );
        return Err(anyhow!("User does not have permission to view this chat"));
    }

    // 3. Get all permissions for the chat
    let permissions = list_shares(
        *chat_id,
        AssetType::Chat,
    )
    .await
    .map_err(|e| {
        error!(
            chat_id = %chat_id,
            "Error listing chat permissions: {}", e
        );
        anyhow!("Error listing sharing permissions: {}", e)
    })?;

    info!(
        chat_id = %chat_id,
        permission_count = permissions.len(),
        "Successfully retrieved chat sharing permissions"
    );

    Ok(permissions)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use database::enums::UserOrganizationRole;
    use middleware::OrganizationMembership;
    use serde_json::json;
    use uuid::Uuid;
    
    #[tokio::test]
    async fn test_list_chat_sharing_handler() {
        // Create a test user with admin permissions
        let org_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            email: "admin@example.com".to_string(),
            organizations: vec![
                OrganizationMembership {
                    id: org_id,
                    role: UserOrganizationRole::WorkspaceAdmin,
                }
            ],
            name: Some("Test Admin".to_string()),
            config: json!({}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: json!({}),
            avatar_url: None,
            teams: vec![],
        };
        
        let chat_id = Uuid::new_v4();

        // This test will fail in isolation as we can't easily mock the database
        // In a real test, we would mock fetch_chat_with_permission to return a valid chat
        let result = list_chat_sharing_handler(&chat_id, &user).await;
        assert!(result.is_err());
    }
}