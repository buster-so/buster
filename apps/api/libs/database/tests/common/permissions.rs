use anyhow::Result;
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use database::models::AssetPermission;
use database::schema::asset_permissions;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::common::db::TestDb;

/// Helper functions for testing permissions
pub struct PermissionTestHelpers;

impl PermissionTestHelpers {
    /// Creates a permission for an asset with the specified role
    pub async fn create_permission(
        test_db: &TestDb,
        asset_id: Uuid,
        asset_type: AssetType,
        identity_id: Uuid,
        identity_type: IdentityType,
        role: AssetPermissionRole,
    ) -> Result<AssetPermission> {
        let mut conn = test_db.diesel_conn().await?;
        
        let permission = AssetPermission {
            identity_id,
            identity_type,
            asset_id,
            asset_type,
            role,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            created_by: test_db.user_id,
            updated_by: test_db.user_id,
        };
        
        diesel::insert_into(asset_permissions::table)
            .values(&permission)
            .execute(&mut conn)
            .await?;
            
        Ok(permission)
    }
    
    /// Creates a user permission for an asset
    pub async fn create_user_permission(
        test_db: &TestDb,
        asset_id: Uuid,
        asset_type: AssetType,
        user_id: Uuid,
        role: AssetPermissionRole,
    ) -> Result<AssetPermission> {
        Self::create_permission(
            test_db,
            asset_id,
            asset_type,
            user_id,
            IdentityType::User,
            role,
        ).await
    }
    
    /// Creates a team permission for an asset
    pub async fn create_team_permission(
        test_db: &TestDb,
        asset_id: Uuid,
        asset_type: AssetType,
        team_id: Uuid,
        role: AssetPermissionRole,
    ) -> Result<AssetPermission> {
        Self::create_permission(
            test_db,
            asset_id,
            asset_type,
            team_id,
            IdentityType::Team,
            role,
        ).await
    }
    
    /// Creates an organization permission for an asset
    pub async fn create_organization_permission(
        test_db: &TestDb,
        asset_id: Uuid,
        asset_type: AssetType,
        org_id: Uuid,
        role: AssetPermissionRole,
    ) -> Result<AssetPermission> {
        Self::create_permission(
            test_db,
            asset_id,
            asset_type,
            org_id,
            IdentityType::Organization,
            role,
        ).await
    }
    
    /// Verifies that a permission exists with the expected role
    pub async fn verify_permission(
        test_db: &TestDb,
        asset_id: Uuid,
        identity_id: Uuid,
        expected_role: AssetPermissionRole,
    ) -> Result<()> {
        let mut conn = test_db.diesel_conn().await?;
        
        let permission = asset_permissions::table
            .filter(asset_permissions::asset_id.eq(asset_id))
            .filter(asset_permissions::identity_id.eq(identity_id))
            .first::<AssetPermission>(&mut conn)
            .await?;
            
        assert_eq!(permission.role, expected_role);
        Ok(())
    }
    
    /// Verifies that a user has the expected permission
    pub async fn verify_user_permission(
        test_db: &TestDb,
        asset_id: Uuid,
        user_id: Uuid,
        expected_role: AssetPermissionRole,
    ) -> Result<()> {
        Self::verify_permission(test_db, asset_id, user_id, expected_role).await
    }
    
    /// Gets all permissions for an asset
    pub async fn get_asset_permissions(
        test_db: &TestDb,
        asset_id: Uuid,
    ) -> Result<Vec<AssetPermission>> {
        let mut conn = test_db.diesel_conn().await?;
        
        let permissions = asset_permissions::table
            .filter(asset_permissions::asset_id.eq(asset_id))
            .load::<AssetPermission>(&mut conn)
            .await?;
            
        Ok(permissions)
    }
    
    /// Gets all permissions for a user
    pub async fn get_user_permissions(
        test_db: &TestDb,
        user_id: Uuid,
    ) -> Result<Vec<AssetPermission>> {
        let mut conn = test_db.diesel_conn().await?;
        
        let permissions = asset_permissions::table
            .filter(asset_permissions::identity_id.eq(user_id))
            .filter(asset_permissions::identity_type.eq(IdentityType::User))
            .load::<AssetPermission>(&mut conn)
            .await?;
            
        Ok(permissions)
    }
    
    /// Deletes a permission
    pub async fn delete_permission(
        test_db: &TestDb,
        asset_id: Uuid,
        identity_id: Uuid,
    ) -> Result<()> {
        let mut conn = test_db.diesel_conn().await?;
        
        diesel::delete(asset_permissions::table)
            .filter(asset_permissions::asset_id.eq(asset_id))
            .filter(asset_permissions::identity_id.eq(identity_id))
            .execute(&mut conn)
            .await?;
            
        Ok(())
    }
}