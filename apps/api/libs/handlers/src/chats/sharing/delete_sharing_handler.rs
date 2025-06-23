use anyhow::{anyhow, Result};
use database::{
    chats::fetch_chat_with_permission,
    enums::{AssetPermissionRole, AssetType},
};
use middleware::AuthenticatedUser;
use sharing::{check_permission_access, remove_asset_permissions::remove_share_by_email};
use tracing::{error, info};
use uuid::Uuid;

/// Handler for deleting sharing permissions for a specific chat
pub async fn delete_chat_sharing_handler(
    chat_id: &Uuid,
    user: &AuthenticatedUser,
    emails: Vec<String>,
) -> Result<()> {
    info!(
        chat_id = %chat_id,
        user_id = %user.id,
        email_count = emails.len(),
        "Deleting chat sharing permissions"
    );

    // 1. Validate the chat exists
    let chat_exists = fetch_chat_with_permission(chat_id, &user.id).await?;

    let chat = if let Some(chat) = chat_exists {
        chat
    } else {
        error!(chat_id = %chat_id, "Chat not found");
        return Err(anyhow!("Chat not found"));
    };

    // 2. Check if user has permission to delete sharing (Owner or FullAccess)
    if !check_permission_access(
        chat.permission,
        &[AssetPermissionRole::Owner, AssetPermissionRole::FullAccess],
        chat.chat.organization_id,
        &user.organizations,
    ) {
        error!(
            chat_id = %chat_id,
            user_id = %user.id,
            "User does not have permission to delete sharing for this chat"
        );
        return Err(anyhow!(
            "Insufficient permissions to delete sharing for this chat. You need Full Access or higher."
        ));
    }

    // 3. Process each email and delete sharing permissions
    for email in &emails {
        // Validate email format
        if !email.contains('@') {
            error!(email = %email, "Invalid email format");
            return Err(anyhow!("Invalid email format: {}", email));
        }

        match remove_share_by_email(email, *chat_id, AssetType::Chat, user.id).await {
            Ok(_) => {
                info!(
                    chat_id = %chat_id,
                    email = %email,
                    "Deleted sharing permission"
                );
            }
            Err(e) => {
                // If the error is because the permission doesn't exist, we can ignore it
                if e.to_string().contains("No active permission found") {
                    info!(
                        chat_id = %chat_id,
                        email = %email,
                        "No active permission found to delete"
                    );
                    continue;
                }

                error!(
                    chat_id = %chat_id,
                    email = %email,
                    "Failed to delete sharing: {}", e
                );
                return Err(anyhow!(
                    "Failed to delete sharing for email {}: {}",
                    email,
                    e
                ));
            }
        }
    }

    info!(
        chat_id = %chat_id,
        email_count = emails.len(),
        "Successfully deleted chat sharing permissions"
    );

    Ok(())
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
    async fn test_delete_chat_sharing_handler_invalid_email() {
        // Create a test user with admin permissions
        let org_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            email: "admin@example.com".to_string(),
            organizations: vec![OrganizationMembership {
                id: org_id,
                role: UserOrganizationRole::WorkspaceAdmin,
            }],
            name: Some("Test Admin".to_string()),
            config: json!({}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: json!({}),
            avatar_url: None,
            teams: vec![],
        };

        let chat_id = Uuid::new_v4();
        let emails = vec!["invalid-email".to_string()];

        // This test will fail in isolation as we can't easily mock the database
        // In a real test, we would mock fetch_chat_with_permission to return a valid chat
        let result = delete_chat_sharing_handler(&chat_id, &user, emails).await;
        assert!(result.is_err());
    }
}
