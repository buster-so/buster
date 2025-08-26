use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use database::{
    client::SupabaseClient, enums::{AssetPermissionRole, AssetType, IdentityType}, models::AssetPermission, pool::get_pg_pool, schema::asset_permissions
};
use diesel::{prelude::*, upsert::excluded};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::{errors::SharingError, user_lookup::find_user_by_email};

#[derive(Debug)]
pub struct ShareCreationInput {
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub identity_id: Uuid,
    pub identity_type: IdentityType,
    pub role: AssetPermissionRole,
}

/// Creates a new sharing record for an asset
pub async fn create_share(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_id: Uuid,
    identity_type: IdentityType,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<AssetPermission> {
    let now = Utc::now();

    // Validate asset type is not deprecated
    if matches!(asset_type, AssetType::Dashboard | AssetType::Thread) {
        return Err(SharingError::DeprecatedAssetType(format!("{:?}", asset_type)).into());
    }

    let mut conn = get_pg_pool().get().await?;

    let permission = AssetPermission {
        identity_id,
        identity_type,
        asset_id,
        asset_type,
        role,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by,
        updated_by: created_by,
    };

    diesel::insert_into(asset_permissions::table)
        .values(&permission)
        .on_conflict((
            asset_permissions::identity_id,
            asset_permissions::asset_id,
            asset_permissions::asset_type,
            asset_permissions::identity_type,
        ))
        .do_update()
        .set((
            asset_permissions::role.eq(role),
            asset_permissions::updated_at.eq(now),
            asset_permissions::updated_by.eq(created_by),
            asset_permissions::deleted_at.eq::<Option<DateTime<Utc>>>(None),
        ))
        .get_result(&mut conn)
        .await
        .context("Failed to create/update asset permission")
}

/// Creates or updates an asset permission for a user identified by email
///
/// # Arguments
/// * `email` - The email address of the user to grant access to
/// * `asset_id` - The ID of the asset to share
/// * `asset_type` - The type of asset (must not be deprecated)
/// * `role` - The permission role to assign
/// * `created_by` - The ID of the user creating the permission
///
/// # Returns
/// * `Result<AssetPermission>` - The created or updated permission record
pub async fn create_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<AssetPermission> {
    // Validate asset type is not deprecated
    if matches!(asset_type, AssetType::Dashboard | AssetType::Thread) {
        return Err(SharingError::DeprecatedAssetType(format!("{:?}", asset_type)).into());
    }

    // Validate email format
    if !email.contains('@') {
        return Err(SharingError::InvalidEmail(email.to_string()).into());
    }

    // Find the user by email
    let user = match find_user_by_email(email).await? {
        Some(user) => user,
        None => {
            // User doesn't exist, create a new user in Supabase Auth
            // This will automatically create the user in the database through triggers
            let user_id = Uuid::new_v4();
            let supabase_client = SupabaseClient::new().await
                .context("Failed to initialize Supabase client")?;

            // Create user in Supabase Auth
            supabase_client
                .create_user(user_id, email)
                .await
                .context("Failed to create user in Supabase Auth")?;

            // Wait for a moment to allow the database trigger to create the user
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

            // Try to find the user again after creation
            find_user_by_email(email).await?.ok_or_else(|| {
                SharingError::UserNotFound(format!(
                    "User was created in Auth but not found in database: {}",
                    email
                ))
            })?
        }
    };

    // Create the share for the user
    create_share(
        asset_id,
        asset_type,
        user.id,
        IdentityType::User,
        role,
        created_by,
    )
    .await
}

/// Creates multiple sharing records in bulk
pub async fn create_shares_bulk(
    shares: Vec<ShareCreationInput>,
    created_by: Uuid,
) -> Result<Vec<AssetPermission>> {
    let now = Utc::now();

    // Validate no deprecated asset types
    if shares
        .iter()
        .any(|s| matches!(s.asset_type, AssetType::Dashboard | AssetType::Thread))
    {
        return Err(SharingError::DeprecatedAssetType(
            "Cannot create permissions for deprecated asset types".to_string(),
        )
        .into());
    }

    let permissions: Vec<AssetPermission> = shares
        .into_iter()
        .map(|share| AssetPermission {
            identity_id: share.identity_id,
            identity_type: share.identity_type,
            asset_id: share.asset_id,
            asset_type: share.asset_type,
            role: share.role,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by,
            updated_by: created_by,
        })
        .collect();

    let mut conn = get_pg_pool().get().await?;

    diesel::insert_into(asset_permissions::table)
        .values(&permissions)
        .on_conflict((
            asset_permissions::identity_id,
            asset_permissions::asset_id,
            asset_permissions::asset_type,
            asset_permissions::identity_type,
        ))
        .do_update()
        .set((
            asset_permissions::role.eq(excluded(asset_permissions::role)),
            asset_permissions::updated_at.eq(now),
            asset_permissions::updated_by.eq(created_by),
            asset_permissions::deleted_at.eq::<Option<DateTime<Utc>>>(None),
        ))
        .get_results(&mut conn)
        .await
        .context("Failed to create/update asset permissions in bulk")
}

#[cfg(test)]
mod tests {
    use super::*;

    use database::enums::{AssetPermissionRole, AssetType};
    use uuid::Uuid;

    #[test]
    fn test_invalid_email_format() {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(create_share_by_email(
            "not-an-email",
            Uuid::new_v4(),
            AssetType::Collection,
            AssetPermissionRole::CanView,
            Uuid::new_v4(),
        ));

        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("Invalid email"));
    }

    #[tokio::test]
    async fn test_create_share_by_email_validates_asset_type() {
        // Test that deprecated asset types are rejected
        let result = create_share_by_email(
            "test@example.com",
            Uuid::new_v4(),
            AssetType::Dashboard, // Deprecated asset type
            AssetPermissionRole::Owner,
            Uuid::new_v4(),
        )
        .await;

        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("Deprecated asset type"));
        assert!(err.contains("Dashboard"));
    }

    // Note: Additional integration tests would be needed to test the database interactions
    // These would require mocking the database or using a test database
}
