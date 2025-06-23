use anyhow::Result;
use database::enums::{AssetPermissionRole, AssetType, IdentityType, UserOrganizationRole};
use database::models::{DashboardFile, UserToOrganization};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, dashboard_files, users_to_organizations};
use database::types::{DashboardYml, VersionHistory};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use handlers::dashboards::get_dashboard_handler;
use middleware::{AuthenticatedUser, OrganizationMembership};
use std::collections::HashMap;
use uuid::Uuid;

// Use test_utils helpers
use database::test_utils::{TestDb, insert_test_dashboard_file, insert_test_permission, cleanup_test_data};

/// Test to ensure permission fields in dashboard response match the permission used for access control
#[tokio::test]
async fn test_dashboard_permission_field_consistency() -> Result<()> {
    // Use TestDb for setup
    let test_db = TestDb::new().await?;
    let user_id = test_db.user_id;
    let org_id = test_db.organization_id;
    
    // Create test dashboard using TestDb helper
    let dashboard = test_db.create_test_dashboard_file(&user_id).await?;
    // Insert dashboard using helper
    insert_test_dashboard_file(&dashboard).await?;
    
    // Add permission for asset using TestDb helper
    let permission = test_db.create_asset_permission(
        &dashboard.id, 
        AssetType::DashboardFile, 
        &user_id, 
        AssetPermissionRole::Owner
    ).await?;
    // Insert permission using helper
    insert_test_permission(&permission).await?;
    
    // Create middleware user
    let middleware_user = AuthenticatedUser {
        id: user_id,
        email: "test@example.com".to_string(),
        name: Some("Test User".to_string()),
        config: serde_json::json!({}),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
        organizations: vec![
            OrganizationMembership {
                id: org_id,
                role: UserOrganizationRole::WorkspaceAdmin,
            },
        ],
        teams: vec![],
    };
    
    // Get dashboard with the user who has owner permission
    let dashboard_response = get_dashboard_handler(&dashboard.id, &middleware_user, None, None).await?;
    
    // Check if permission fields are consistent
    assert_eq!(dashboard_response.permission, AssetPermissionRole::Owner);
    assert_eq!(dashboard_response.access, AssetPermissionRole::Owner);
    
    // Clean up using helper
    cleanup_test_data(&[dashboard.id]).await?;

    Ok(())
}

/// Test to ensure public dashboards grant CanView permission to users without direct permissions
#[tokio::test]
async fn test_public_dashboard_permission_field() -> Result<()> {
    // Use TestDb for setup
    let test_db = TestDb::new().await?;
    let owner_id = test_db.user_id;
    let org_id = test_db.organization_id;
    
    // Create test dashboard using TestDb helper
    let mut dashboard = test_db.create_test_dashboard_file(&owner_id).await?;
    
    // Make dashboard public
    dashboard.publicly_accessible = true;
    dashboard.publicly_enabled_by = Some(owner_id);
    dashboard.public_expiry_date = Some(chrono::Utc::now() + chrono::Duration::days(7));

    // Insert dashboard using helper
    insert_test_dashboard_file(&dashboard).await?;
    
    // Create another user (just need the ID)
    let other_user_id = Uuid::new_v4();
    
    // Add user to organization with viewer role (manual insert, no helper yet)
    let mut conn = get_pg_pool().get().await?;
    let user_org = UserToOrganization {
        user_id: other_user_id,
        organization_id: org_id,
        role: UserOrganizationRole::Viewer,
        sharing_setting: database::enums::SharingSetting::None,
        edit_sql: true,
        upload_csv: true,
        export_assets: true,
        email_slack_enabled: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: owner_id,
        updated_by: owner_id,
        deleted_by: None,
        status: database::enums::UserOrganizationStatus::Active,
    };
    
    diesel::insert_into(users_to_organizations::table)
        .values(&user_org)
        .execute(&mut conn)
        .await?;
    
    // Create middleware user for other user
    let other_middleware_user = AuthenticatedUser {
        id: other_user_id,
        email: "other@example.com".to_string(),
        name: Some("Other User".to_string()),
        config: serde_json::json!({}),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
        organizations: vec![
            OrganizationMembership {
                id: org_id,
                role: UserOrganizationRole::Viewer,
            },
        ],
        teams: vec![],
    };
    
    // Get dashboard with the other user who doesn't have direct permission
    let dashboard_response = get_dashboard_handler(&dashboard.id, &other_middleware_user, None, None).await?;
    
    // Public assets should have CanView permission by default
    assert_eq!(dashboard_response.permission, AssetPermissionRole::CanView);
    assert_eq!(dashboard_response.access, AssetPermissionRole::CanView);
    
    // Clean up using helper (also removes permissions)
    cleanup_test_data(&[dashboard.id]).await?;

    // Manual cleanup for user_org association
    diesel::delete(users_to_organizations::table)
        .filter(users_to_organizations::user_id.eq(other_user_id))
        .filter(users_to_organizations::organization_id.eq(org_id))
        .execute(&mut conn)
        .await?;

    Ok(())
}

/// Test to ensure access is denied for users without permissions and non-public dashboards
#[tokio::test]
async fn test_dashboard_permission_denied() -> Result<()> {
    // Use TestDb for setup
    let test_db = TestDb::new().await?;
    let owner_id = test_db.user_id;
    let org_id = test_db.organization_id;
    
    // Create a private test dashboard using TestDb helper
    let dashboard = test_db.create_test_dashboard_file(&owner_id).await?;
    // Insert dashboard using helper
    insert_test_dashboard_file(&dashboard).await?;
    
    // Create another user in a different organization
    let other_user_id = Uuid::new_v4();
    let other_org_id = Uuid::new_v4();
    
    // Create middleware user for other user
    let other_middleware_user = AuthenticatedUser {
        id: other_user_id,
        email: "other@example.com".to_string(),
        name: Some("Other User".to_string()),
        config: serde_json::json!({}),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
        organizations: vec![
            OrganizationMembership {
                id: other_org_id,
                role: UserOrganizationRole::Viewer,
            },
        ],
        teams: vec![],
    };
    
    // Try to get dashboard with a user who has no permissions
    let result = get_dashboard_handler(&dashboard.id, &other_middleware_user, None, None).await;
    
    // Should be denied access
    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.to_string().contains("You don't have permission"));
    
    // Clean up using helper
    cleanup_test_data(&[dashboard.id]).await?;
    
    Ok(())
}