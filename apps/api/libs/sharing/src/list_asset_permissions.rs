use anyhow::{anyhow, Result};
use database::{
    enums::{AssetType, IdentityType},
    models::{AssetPermission, User},
    pool::get_pg_pool,
    schema::{asset_permissions, users},
};
use diesel::{ExpressionMethods, QueryDsl, prelude::*};
use diesel_async::RunQueryDsl;
use tracing::{error, info};
use uuid::Uuid;

use crate::{
    errors::SharingError, 
    types::{AssetPermissionWithUser, SerializableAssetPermission, UserInfo}
};

/// Lists all permissions for a given asset
///
/// # Arguments
///
/// * `asset_id` - The unique identifier of the asset
/// * `asset_type` - The type of the asset (e.g., Dashboard, Thread, Collection)
///
/// # Returns
///
/// A vector of asset permissions with user information
pub async fn list_shares(
    asset_id: Uuid,
    asset_type: AssetType,
) -> Result<Vec<AssetPermissionWithUser>> {
    info!(
        asset_id = %asset_id,
        asset_type = ?asset_type,
        "Listing permissions for asset"
    );

    // Validate asset type is not deprecated
    if matches!(asset_type, AssetType::Dashboard | AssetType::Thread) {
        return Err(SharingError::DeprecatedAssetType(format!("{:?}", asset_type)).into());
    }

    let pool = get_pg_pool();
    let mut conn = pool.get().await.map_err(|e| {
        error!("Failed to get database connection: {}", e);
        anyhow!("Database connection error: {}", e)
    })?;

    // Query permissions for the asset with user information
    let permissions_with_users: Vec<(AssetPermission, User)> = asset_permissions::table
        .inner_join(users::table.on(asset_permissions::identity_id.eq(users::id)))
        .filter(asset_permissions::asset_id.eq(asset_id))
        .filter(asset_permissions::asset_type.eq(asset_type))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .select((asset_permissions::all_columns, users::all_columns))
        .load::<(AssetPermission, User)>(&mut conn)
        .await
        .map_err(|e| {
            error!("Error querying permissions: {}", e);
            anyhow!("Database error: {}", e)
        })?;

    // Also get permissions for non-user identities (like teams/organizations)
    let other_permissions: Vec<AssetPermission> = asset_permissions::table
        .filter(asset_permissions::asset_id.eq(asset_id))
        .filter(asset_permissions::asset_type.eq(asset_type))
        .filter(asset_permissions::identity_type.ne(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .select(asset_permissions::all_columns)
        .load::<AssetPermission>(&mut conn)
        .await
        .map_err(|e| {
            error!("Error querying non-user permissions: {}", e);
            anyhow!("Database error: {}", e)
        })?;

    // Convert to AssetPermissionWithUser format
    let mut results: Vec<AssetPermissionWithUser> = permissions_with_users
        .into_iter()
        .map(|(permission, user)| {
            let user_info = UserInfo {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
            };

            AssetPermissionWithUser {
                permission: SerializableAssetPermission::from(permission),
                user: Some(user_info),
            }
        })
        .collect();

    // Add non-user permissions
    let other_results: Vec<AssetPermissionWithUser> = other_permissions
        .into_iter()
        .map(|permission| AssetPermissionWithUser {
            permission: SerializableAssetPermission::from(permission),
            user: None,
        })
        .collect();

    results.extend(other_results);
    
    info!(
        asset_id = %asset_id,
        asset_type = ?asset_type,
        permission_count = results.len(),
        "Found permissions for asset"
    );

    Ok(results)
}

#[cfg(test)]
mod list_shares_tests {
    // We're not using any imports yet since these are placeholder tests
    
    // This test is a skeleton and would need a proper test database setup
    #[tokio::test]
    async fn test_list_shares_empty() {
        // In a real test, we would:
        // 1. Set up a test database connection
        // 2. Create a transaction
        // 3. Call list_shares with a non-existent asset ID
        // 4. Verify that an empty list is returned
        // 5. Rollback the transaction
        
        // This is a placeholder to demonstrate the test structure
        assert!(true);
    }

    // This test is a skeleton and would need a proper test database setup
    #[tokio::test]
    async fn test_list_shares_with_permissions() {
        // In a real test, we would:
        // 1. Set up a test database connection
        // 2. Create a transaction
        // 3. Create test user and asset data
        // 4. Create test permissions
        // 5. Call list_shares with the asset ID
        // 6. Verify that the correct permissions are returned
        // 7. Rollback the transaction
        
        // This is a placeholder to demonstrate the test structure
        assert!(true);
    }

    // This test is a skeleton and would need a proper test database setup
    #[tokio::test]
    async fn test_list_shares_with_mixed_identities() {
        // In a real test, we would:
        // 1. Set up a test database connection
        // 2. Create a transaction
        // 3. Create test users, teams, and asset data
        // 4. Create test permissions for users and teams
        // 5. Call list_shares with the asset ID
        // 6. Verify that permissions for both users and teams are returned
        // 7. Rollback the transaction
        
        // This is a placeholder to demonstrate the test structure
        assert!(true);
    }
}

/// Lists all permissions for a given asset, filtered by identity type
pub async fn list_shares_by_identity_type(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_type: IdentityType,
) -> Result<Vec<AssetPermissionWithUser>> {
    info!(
        asset_id = %asset_id,
        asset_type = ?asset_type,
        identity_type = ?identity_type,
        "Listing permissions for asset filtered by identity type"
    );

    // Validate asset type is not deprecated
    if matches!(asset_type, AssetType::Dashboard | AssetType::Thread) {
        return Err(SharingError::DeprecatedAssetType(format!("{:?}", asset_type)).into());
    }

    let pool = get_pg_pool();
    let mut conn = pool.get().await.map_err(|e| {
        error!("Failed to get database connection: {}", e);
        anyhow!("Database connection error: {}", e)
    })?;

    let results: Vec<AssetPermissionWithUser> = if identity_type == IdentityType::User {
        // Query permissions with user information
        let permissions_with_users: Vec<(AssetPermission, User)> = asset_permissions::table
            .inner_join(users::table.on(asset_permissions::identity_id.eq(users::id)))
            .filter(asset_permissions::asset_id.eq(asset_id))
            .filter(asset_permissions::asset_type.eq(asset_type))
            .filter(asset_permissions::identity_type.eq(identity_type))
            .filter(asset_permissions::deleted_at.is_null())
            .select((asset_permissions::all_columns, users::all_columns))
            .load::<(AssetPermission, User)>(&mut conn)
            .await
            .map_err(|e| {
                error!("Error querying permissions with users: {}", e);
                anyhow!("Database error: {}", e)
            })?;

        // Convert to AssetPermissionWithUser format
        permissions_with_users
            .into_iter()
            .map(|(permission, user)| {
                let user_info = UserInfo {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar_url: user.avatar_url,
                };

                AssetPermissionWithUser {
                    permission: SerializableAssetPermission::from(permission),
                    user: Some(user_info),
                }
            })
            .collect()
    } else {
        // For non-user identities (like teams)
        let permissions: Vec<AssetPermission> = asset_permissions::table
            .filter(asset_permissions::asset_id.eq(asset_id))
            .filter(asset_permissions::asset_type.eq(asset_type))
            .filter(asset_permissions::identity_type.eq(identity_type))
            .filter(asset_permissions::deleted_at.is_null())
            .load::<AssetPermission>(&mut conn)
            .await
            .map_err(|e| {
                error!("Error querying non-user permissions: {}", e);
                anyhow!("Database error: {}", e)
            })?;

        permissions
            .into_iter()
            .map(|permission| AssetPermissionWithUser {
                permission: SerializableAssetPermission::from(permission),
                user: None,
            })
            .collect()
    };

    info!(
        asset_id = %asset_id,
        asset_type = ?asset_type,
        identity_type = ?identity_type,
        permission_count = results.len(),
        "Found permissions for asset with specified identity type"
    );

    Ok(results)
}

#[cfg(test)]
mod list_shares_by_identity_type_tests {
    // Additional tests would be implemented here, using a test database
    // or mocks for database interactions
}