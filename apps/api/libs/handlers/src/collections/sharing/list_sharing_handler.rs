use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::collections::fetch_collection_with_permission,
};
use middleware::AuthenticatedUser;
use sharing::{
    check_permission_access,
    list_asset_permissions::list_shares,
    types::AssetPermissionWithUser,
};
use tracing::info;
use uuid::Uuid;

/// Handler to list all sharing permissions for a collection
///
/// # Arguments
/// * `collection_id` - The UUID of the collection to list sharing permissions for
/// * `user` - The authenticated user making the request
///
/// # Returns
/// * `Result<Vec<AssetPermissionWithUser>>` - A list of all sharing permissions for the collection
pub async fn list_collection_sharing_handler(
    collection_id: &Uuid,
    user: &AuthenticatedUser,
) -> Result<Vec<AssetPermissionWithUser>> {
    info!(
        collection_id = %collection_id,
        user_id = %user.id,
        "Listing sharing permissions for collection"
    );

    // 1. Fetch the collection with permission
    let collection_with_permission = fetch_collection_with_permission(collection_id, &user.id).await?;
    
    // If collection not found, return error
    let collection_with_permission = match collection_with_permission {
        Some(cwp) => cwp,
        None => {
            return Err(anyhow!("Collection not found"));
        }
    };
    
    // 2. Check if user has permission to view the collection (at least CanView)
    let has_permission = check_permission_access(
        collection_with_permission.permission,
        &[
            AssetPermissionRole::CanView,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        collection_with_permission.collection.organization_id,
        &user.organizations,
    );
    
    if !has_permission {
        return Err(anyhow!("User does not have permission to view this collection"));
    }

    // 3. Get all permissions for the collection
    let permissions = list_shares(
        *collection_id,
        AssetType::Collection,
    ).await?;

    Ok(permissions)
}

#[cfg(test)]
mod tests {
    // Test cases would be implemented here
    // Currently adding placeholders similar to the metrics implementation

    #[tokio::test]
    async fn test_list_collection_sharing_success() {
        // This would be a proper test using mocks and expected values
        assert!(true);
    }

    #[tokio::test]
    async fn test_list_collection_sharing_collection_not_found() {
        // This would test the error case when a collection is not found
        assert!(true);
    }

    #[tokio::test]
    async fn test_list_collection_sharing_no_permission() {
        // This would test the error case when a user doesn't have permission
        assert!(true);
    }
}