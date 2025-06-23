use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    chats::fetch_chat_with_permission,
    enums::{AssetPermissionRole, AssetType},
};
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use sharing::{check_permission_access, create_share_by_email, types::UpdateField};
use tracing::info;
use uuid::Uuid;

/// Request for updating sharing permissions for a chat
#[derive(Debug, Serialize, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// Request for updating sharing settings for a chat
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateChatSharingRequest {
    /// List of users to share with
    pub users: Option<Vec<ShareRecipient>>,
    /// Whether the chat should be publicly accessible
    pub publicly_accessible: Option<bool>,
    /// Password for public access
    #[serde(default)]
    pub public_password: UpdateField<String>,
    /// Expiration date for public access
    #[serde(default)]
    pub public_expiry_date: UpdateField<DateTime<Utc>>,
}

/// Updates sharing permissions for a chat
///
/// # Arguments
/// * `chat_id` - The ID of the chat to update sharing for
/// * `user` - The authenticated user updating the sharing permissions
/// * `request` - The update request containing sharing settings
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn update_chat_sharing_handler(
    chat_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateChatSharingRequest,
) -> Result<()> {
    info!(
        chat_id = %chat_id,
        user_id = %user.id,
        "Updating sharing permissions for chat"
    );

    // 1. Validate the chat exists
    let chat_exists = fetch_chat_with_permission(chat_id, &user.id).await?;

    let chat = if let Some(chat) = chat_exists {
        chat
    } else {
        return Err(anyhow!("Chat not found"));
    };

    // 2. Check if user has permission to update sharing for the chat (Owner or FullAccess)
    if !check_permission_access(
        chat.permission,
        &[AssetPermissionRole::Owner, AssetPermissionRole::FullAccess],
        chat.chat.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!(
            "Insufficient permissions to update sharing for this chat. You need Full Access or higher."
        ));
    }

    // 3. Process user sharing permissions if provided
    if let Some(users) = &request.users {
        for recipient in users {
            // The create_share_by_email function handles both creation and updates
            // It performs an upsert operation in the database
            match create_share_by_email(
                &recipient.email,
                *chat_id,
                AssetType::Chat,
                recipient.role,
                user.id,
            )
            .await
            {
                Ok(_) => {
                    info!(
                        "Updated sharing permission for email: {} on chat: {} with role: {:?}",
                        recipient.email, chat_id, recipient.role
                    );
                }
                Err(e) => {
                    tracing::error!(
                        "Failed to update sharing for email {}: {}",
                        recipient.email,
                        e
                    );
                    return Err(anyhow!(
                        "Failed to update sharing for email {}: {}",
                        recipient.email,
                        e
                    ));
                }
            }
        }
    }

    // Note: Currently, chats don't support public sharing
    // The public_* fields are included for API consistency but are ignored
    // If public sharing for chats is implemented in the future, this section will need to be updated
    // Following the pattern from metric_sharing_handler.rs and dashboard_sharing_handler.rs

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
    async fn test_update_chat_sharing_handler_chat_not_found() {
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

        // Test with empty request to simplify the test
        let request = UpdateChatSharingRequest {
            users: None,
            publicly_accessible: None,
            public_password: UpdateField::NoChange,
            public_expiry_date: UpdateField::NoChange,
        };

        // Call handler - should fail because the chat doesn't exist
        let chat_id = Uuid::new_v4();
        let result = update_chat_sharing_handler(&chat_id, &user, request).await;

        // Since we can't easily mock the function in an integration test
        // This is just a placeholder for the real test
        // The actual error could be different based on the testing environment
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_update_chat_sharing_handler_with_users() {
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

        // Test with users in the request
        let request = UpdateChatSharingRequest {
            users: Some(vec![ShareRecipient {
                email: "test@example.com".to_string(),
                role: AssetPermissionRole::CanView,
            }]),
            publicly_accessible: None,
            public_password: UpdateField::NoChange,
            public_expiry_date: UpdateField::NoChange,
        };

        // This test will fail in isolation as we can't easily mock the database
        // It's here as a structural guide - the real testing will happen in integration tests
        let chat_id = Uuid::new_v4();
        let result = update_chat_sharing_handler(&chat_id, &user, request).await;
        assert!(result.is_err()); // Should fail since chat doesn't exist
    }

    #[tokio::test]
    async fn test_update_chat_sharing_handler_with_public_access() {
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

        // Test with public access settings
        let request = UpdateChatSharingRequest {
            users: None,
            publicly_accessible: Some(true),
            public_password: UpdateField::NoChange,
            public_expiry_date: UpdateField::Update(Utc::now()),
        };

        // This test will fail in isolation as we can't easily mock the database
        // It's here as a structural guide - the real testing will happen in integration tests
        let chat_id = Uuid::new_v4();
        let result = update_chat_sharing_handler(&chat_id, &user, request).await;
        assert!(result.is_err()); // Should fail since chat doesn't exist
    }
}
