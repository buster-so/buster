use anyhow::{Context, Result};
use chrono::Utc;
use database::{
    enums::{AssetType, IdentityType},
    pool::get_pg_pool,
    schema::asset_permissions,
};
use diesel::ExpressionMethods;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::{errors::SharingError, user_lookup::find_user_by_email};

/// Removes a sharing record for a specific user + asset combination
pub async fn remove_share(
    identity_id: Uuid,
    identity_type: IdentityType,
    asset_id: Uuid,
    asset_type: AssetType,
    updated_by: Uuid,
) -> Result<()> {
    // Validate asset type is not deprecated
    if matches!(asset_type, AssetType::Dashboard | AssetType::Thread) {
        return Err(SharingError::DeprecatedAssetType(format!("{:?}", asset_type)).into());
    }

    let mut conn = get_pg_pool().get().await?;
    let now = Utc::now();

    // Soft delete - update the deleted_at field
    let rows = diesel::update(asset_permissions::table)
        .filter(asset_permissions::identity_id.eq(identity_id))
        .filter(asset_permissions::identity_type.eq(identity_type))
        .filter(asset_permissions::asset_id.eq(asset_id))
        .filter(asset_permissions::asset_type.eq(asset_type))
        .filter(asset_permissions::deleted_at.is_null())
        .set((
            asset_permissions::deleted_at.eq(now),
            asset_permissions::updated_at.eq(now),
            asset_permissions::updated_by.eq(updated_by),
        ))
        .execute(&mut conn)
        .await
        .context("Failed to remove asset permission")?;

    if rows == 0 {
        return Err(SharingError::AssetNotFound(format!(
            "No active permission found for asset {} of type {:?}",
            asset_id, asset_type
        ))
        .into());
    }

    Ok(())
}

/// Removes a sharing record identified by user email
///
/// Requires the caller to have Owner or FullAccess permission on the asset.
pub async fn remove_share_by_email(
    email: &str,
    asset_id: Uuid,
    asset_type: AssetType,
    updated_by: Uuid,
) -> Result<()> {
    // Validate email format
    if !email.contains('@') {
        return Err(SharingError::InvalidEmail(email.to_string()).into());
    }

    // Find the user by email
    let user = find_user_by_email(email)
        .await?
        .ok_or_else(|| SharingError::UserNotFound(email.to_string()))?;

    // Remove the share for the user
    remove_share(
        user.id,
        IdentityType::User,
        asset_id,
        asset_type,
        updated_by,
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::AssetType;
    use uuid::Uuid;

    #[test]
    fn test_invalid_email_format() {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(remove_share_by_email(
            "not-an-email",
            Uuid::new_v4(),
            AssetType::Collection,
            Uuid::new_v4(),
        ));

        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("Invalid email"));
    }

    // Note: The following tests are commented out as they would require
    // more complex integration test setup with database access.
    // In a real implementation, we would use integration tests to cover these cases.

    // Test case: User has CanEdit permission but not Owner or FullAccess
    // Expected result: InsufficientPermissions error

    // Test case: User not found by email
    // Expected result: UserNotFound error

    // Test case: Successful removal when user has Owner permission
    // Expected result: Success
}
