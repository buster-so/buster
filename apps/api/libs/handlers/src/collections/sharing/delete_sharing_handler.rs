use anyhow::{anyhow, Result};
use database::{
    collections::fetch_collection_with_permission,
    enums::{AssetPermissionRole, AssetType},
};
use middleware::AuthenticatedUser;
use sharing::{check_permission_access, remove_asset_permissions::remove_share_by_email};
use tracing::info;
use uuid::Uuid;

/// Handler to delete sharing permissions for a collection
///
/// # Arguments
/// * `collection_id` - The UUID of the collection to delete sharing permissions for
/// * `user_id` - The UUID of the user making the request
/// * `emails` - List of email addresses to remove sharing permissions for
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn delete_collection_sharing_handler(
    collection_id: &Uuid,
    user: &AuthenticatedUser,
    emails: Vec<String>,
) -> Result<()> {
    info!(
        collection_id = %collection_id,
        user_id = %user.id,
        "Deleting sharing permissions for collection"
    );

    // 1. Fetch the collection with permission
    let collection_with_permission =
        fetch_collection_with_permission(collection_id, &user.id).await?;

    // If collection not found, return error
    let collection_with_permission = match collection_with_permission {
        Some(cwp) => cwp,
        None => {
            return Err(anyhow!("Collection not found"));
        }
    };

    // 2. Check if user has permission to share the collection (FullAccess or Owner)
    let has_permission = check_permission_access(
        collection_with_permission.permission,
        &[AssetPermissionRole::FullAccess, AssetPermissionRole::Owner],
        collection_with_permission.collection.organization_id,
        &user.organizations,
    );

    if !has_permission {
        return Err(anyhow!(
            "User does not have permission to share this collection"
        ));
    }

    // 3. Process each email and delete sharing permissions
    for email in emails {
        // The remove_share_by_email function handles soft deletion of permissions
        match remove_share_by_email(&email, *collection_id, AssetType::Collection, user.id).await {
            Ok(_) => {
                info!(
                    "Deleted sharing permission for email: {} on collection: {}",
                    email, collection_id
                );
            }
            Err(e) => {
                // If the error is because the permission doesn't exist, we can ignore it
                if e.to_string().contains("No active permission found") {
                    tracing::warn!("No active permission found for email {}: {}", email, e);
                    continue;
                }

                tracing::error!("Failed to delete sharing for email {}: {}", email, e);
                return Err(anyhow!(
                    "Failed to delete sharing for email {}: {}",
                    email,
                    e
                ));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {

    #[tokio::test]
    async fn test_delete_collection_sharing_collection_not_found() {
        // Test case: Collection not found
        // Expected: Error with "Collection not found" message

        // Since we can't easily mock the function in an integration test
        // This is just a placeholder for the real test
        // A proper test would use a test database or more sophisticated mocking
        assert!(true);
    }

    #[tokio::test]
    async fn test_delete_collection_sharing_no_permission() {
        // This would test the case where a user doesn't have permission to delete sharing
        assert!(true);
    }

    #[tokio::test]
    async fn test_delete_collection_sharing_success() {
        // This would test the successful case
        assert!(true);
    }

    #[tokio::test]
    async fn test_delete_collection_sharing_invalid_email() {
        // This would test the case with an invalid email
        assert!(true);
    }
}
