use anyhow::{Result, Context};
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetType, UserOrganizationRole};
use database::test_utils::{TestDb, cleanup_test_data, insert_test_dashboard_file, insert_test_permission};
use handlers::dashboards::get_dashboard_handler;
use middleware::{AuthenticatedUser, OrganizationMembership};
use serde_json;
use uuid::Uuid;

// Helper to create a basic AuthenticatedUser for tests
fn create_test_auth_user(user_id: Uuid, organization_id: Option<Uuid>) -> AuthenticatedUser {
    let organizations = if let Some(org_id) = organization_id {
        vec![OrganizationMembership { id: org_id, role: database::enums::UserOrganizationRole::Viewer }] // Default to Viewer
    } else {
        vec![]
    };
    AuthenticatedUser {
        id: user_id,
        organizations,
        email: format!("{}@test.com", user_id),
        name: Some("Test User".to_string()),
        config: serde_json::Value::Null,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: serde_json::Value::Null,
        avatar_url: None,
        teams: vec![],
    }
}

#[tokio::test]
async fn test_get_dashboard_no_permission_private() -> Result<()> {
    let test_db = TestDb::new().await?;
    let owner = test_db.create_test_user().await?;
    let dashboard = test_db.create_test_dashboard_file(&owner.id).await?;
    insert_test_dashboard_file(&dashboard).await?;

    let random_user = create_test_auth_user(Uuid::new_v4(), None); // User not in org, no share

    let result = get_dashboard_handler(&dashboard.id, &random_user, None, None).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("don't have permission"));

    cleanup_test_data(&[dashboard.id]).await?;
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_no_permission_public_no_password() -> Result<()> {
    let test_db = TestDb::new().await?;
    let owner = test_db.create_test_user().await?;
    let mut dashboard = test_db.create_test_dashboard_file(&owner.id).await?;
    dashboard.publicly_accessible = true;
    insert_test_dashboard_file(&dashboard).await?;

    let random_user = create_test_auth_user(Uuid::new_v4(), None);

    let result = get_dashboard_handler(&dashboard.id, &random_user, None, None).await;

    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.permission, AssetPermissionRole::CanView);

    cleanup_test_data(&[dashboard.id]).await?;
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_no_permission_public_correct_password() -> Result<()> {
    let test_db = TestDb::new().await?;
    let owner = test_db.create_test_user().await?;
    let mut dashboard = test_db.create_test_dashboard_file(&owner.id).await?;
    dashboard.publicly_accessible = true;
    let password = "testpassword".to_string();
    dashboard.public_password = Some(password.clone());
    insert_test_dashboard_file(&dashboard).await?;

    let random_user = create_test_auth_user(Uuid::new_v4(), None);

    let result = get_dashboard_handler(&dashboard.id, &random_user, None, Some(password)).await;

    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.permission, AssetPermissionRole::CanView);

    cleanup_test_data(&[dashboard.id]).await?;
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_no_permission_public_incorrect_password() -> Result<()> {
    let test_db = TestDb::new().await?;
    let owner = test_db.create_test_user().await?;
    let mut dashboard = test_db.create_test_dashboard_file(&owner.id).await?;
    dashboard.publicly_accessible = true;
    dashboard.public_password = Some("correctpassword".to_string());
    insert_test_dashboard_file(&dashboard).await?;

    let random_user = create_test_auth_user(Uuid::new_v4(), None);

    let result = get_dashboard_handler(&dashboard.id, &random_user, None, Some("wrongpassword".to_string())).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Incorrect password"));

    cleanup_test_data(&[dashboard.id]).await?;
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_no_permission_public_missing_password() -> Result<()> {
    let test_db = TestDb::new().await?;
    let owner = test_db.create_test_user().await?;
    let mut dashboard = test_db.create_test_dashboard_file(&owner.id).await?;
    dashboard.publicly_accessible = true;
    dashboard.public_password = Some("correctpassword".to_string());
    insert_test_dashboard_file(&dashboard).await?;

    let random_user = create_test_auth_user(Uuid::new_v4(), None);

    let result = get_dashboard_handler(&dashboard.id, &random_user, None, None).await; // No password

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("public_password required"));

    cleanup_test_data(&[dashboard.id]).await?;
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_no_permission_public_expired() -> Result<()> {
    let test_db = TestDb::new().await?;
    let owner = test_db.create_test_user().await?;
    let mut dashboard = test_db.create_test_dashboard_file(&owner.id).await?;
    dashboard.publicly_accessible = true;
    dashboard.public_expiry_date = Some(Utc::now() - chrono::Duration::days(1)); // Expired
    insert_test_dashboard_file(&dashboard).await?;

    let random_user = create_test_auth_user(Uuid::new_v4(), None);

    let result = get_dashboard_handler(&dashboard.id, &random_user, None, None).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("expired"));

    cleanup_test_data(&[dashboard.id]).await?;
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_direct_permission_public_password() -> Result<()> {
    // User has direct CanEdit permission, should bypass public password check
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    let mut dashboard = test_db.create_test_dashboard_file(&user.id).await?;
    dashboard.publicly_accessible = true;
    dashboard.public_password = Some("testpassword".to_string());
    insert_test_dashboard_file(&dashboard).await?;

    let permission = test_db.create_asset_permission(&dashboard.id, AssetType::DashboardFile, &user.id, AssetPermissionRole::CanEdit).await?;
    insert_test_permission(&permission).await?;

    let auth_user = create_test_auth_user(user.id, Some(test_db.organization_id));

    let result = get_dashboard_handler(&dashboard.id, &auth_user, None, None).await; // No password

    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.permission, AssetPermissionRole::CanEdit);

    cleanup_test_data(&[dashboard.id]).await?;
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_admin_role_public_password() -> Result<()> {
    // User is WorkspaceAdmin, should bypass public password check
    let test_db = TestDb::new().await?;
    let admin_user = test_db.create_test_user().await?;
    let mut dashboard = test_db.create_test_dashboard_file(&admin_user.id).await?;
    dashboard.publicly_accessible = true;
    dashboard.public_password = Some("testpassword".to_string());
    insert_test_dashboard_file(&dashboard).await?;

    let auth_user = AuthenticatedUser {
        id: admin_user.id,
        organizations: vec![OrganizationMembership {
            id: test_db.organization_id,
            role: database::enums::UserOrganizationRole::WorkspaceAdmin,
        }],
        email: format!("{}@test.com", admin_user.id),
        name: Some("Test Admin User".to_string()),
        config: serde_json::Value::Null,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: serde_json::Value::Null,
        avatar_url: None,
        teams: vec![],
    };

    let result = get_dashboard_handler(&dashboard.id, &auth_user, None, None).await; // No password

    assert!(result.is_ok());
    // Admins should get Owner permissions regardless of explicit asset permissions
    let response = result.unwrap();
    assert_eq!(response.permission, AssetPermissionRole::Owner);

    cleanup_test_data(&[dashboard.id]).await?;
    Ok(())
}

#[tokio::test]
async fn test_get_dashboard_not_found() -> Result<()> {
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    let auth_user = create_test_auth_user(user.id, None);
    let non_existent_id = Uuid::new_v4();

    let result = get_dashboard_handler(&non_existent_id, &auth_user, None, None).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not found"));

    Ok(())
} 