use anyhow::Result;
use chrono::Utc;
use database::{
    enums::AssetPermissionRole, helpers::collections::fetch_collection_with_permission,
    pool::get_pg_pool, schema::collections,
};
use diesel::{update, ExpressionMethods};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use sharing::check_permission_access;
use uuid::Uuid;

use crate::collections::types::DeleteCollectionResponse;

/// Handler for deleting collections
///
/// # Arguments
/// * `user` - The authenticated user deleting the collections
/// * `ids` - The IDs of the collections to delete
///
/// # Returns
/// * `Result<DeleteCollectionResponse>` - The IDs of the collections that were successfully deleted
pub async fn delete_collection_handler(
    user: &AuthenticatedUser,
    ids: Vec<Uuid>,
) -> Result<DeleteCollectionResponse> {
    // If no collection IDs provided, return empty result
    if ids.is_empty() {
        return Ok(DeleteCollectionResponse { ids: Vec::new() });
    }

    let mut successful_ids = Vec::new();
    let mut conn = get_pg_pool().get().await?;

    for id in &ids {
        // Fetch collection with permission to check if user has access
        let collection_with_permission =
            match fetch_collection_with_permission(id, &user.id).await? {
                Some(cwp) => cwp,
                None => continue, // Collection not found or already deleted
            };

        // Check if user has appropriate permissions (CanEdit, FullAccess, or Owner)
        let has_permission = check_permission_access(
            collection_with_permission.permission,
            &[
                AssetPermissionRole::FullAccess,
                AssetPermissionRole::Owner,
            ],
            collection_with_permission.collection.organization_id,
            &user.organizations,
        );

        if !has_permission {
            continue; // Skip this collection if user doesn't have permission
        }

        // Soft delete the collection
        let result = update(collections::table)
            .filter(collections::id.eq(id))
            .set(collections::deleted_at.eq(Some(Utc::now())))
            .execute(&mut conn)
            .await;

        if result.is_ok() {
            successful_ids.push(*id);
        }
    }

    // Return the IDs of the deleted collections
    Ok(DeleteCollectionResponse {
        ids: successful_ids,
    })
}
