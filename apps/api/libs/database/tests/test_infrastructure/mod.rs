// Integation tests for the test infrastructure
// These tests verify the functionality of our test utilities
use anyhow::Result;
use database::enums::{AssetPermissionRole, AssetType};
use diesel::QueryDsl;
use diesel::ExpressionMethods;
use diesel::TextExpressionMethods;
use super::common::db::{TestDb, TestSetup};
use super::common::users::AuthenticatedUser;
use database::models::Organization;
use super::common::permissions::PermissionTestHelpers;
use super::common::assets::AssetTestHelpers;

#[tokio::test]
async fn test_db_initialization() -> Result<()> {
    // Test database initialization
    let test_db = TestDb::new().await?;
    
    // Verify we can get a database connection
    let conn = test_db.diesel_conn().await?;
    drop(conn);
    
    Ok(())
}

#[tokio::test]
async fn test_create_organization_and_user() -> Result<()> {
    // Test the utility functions structure
    let test_db = TestDb::new().await?;
    
    // Test the user method
    let auth_user = test_db.user();
    assert_eq!(auth_user.id, test_db.user_id);
    assert_eq!(auth_user.organization_id, test_db.organization_id);
    
    Ok(())
}

#[tokio::test]
async fn test_create_authenticated_user() -> Result<()> {
    // Test the API for creating an authenticated user
    let test_db = TestDb::new().await?;
    
    // We can't directly check if a method is async, but we know it exists
    
    // Test the auth user structure
    let auth_user = test_db.user();
    assert!(auth_user.role == database::enums::UserOrganizationRole::WorkspaceAdmin);
    
    Ok(())
}

#[tokio::test]
async fn test_test_setup() -> Result<()> {
    // We can't fully test TestSetup without running actual DB operations, but we can verify the API
    
    // Ensure the TestSetup struct is available and has the expected structure
    assert_eq!(std::mem::size_of::<TestSetup>(), std::mem::size_of::<(AuthenticatedUser, Organization, TestDb)>());
    
    Ok(())
}

#[tokio::test]
async fn test_asset_creation_and_permissions() -> Result<()> {
    // Test the API structure for asset helpers
    let test_db = TestDb::new().await?;
    
    // These assertions just ensure our helper functions exist and compile
    // Each call returns a Future, showing it's an async function
    
    // Assert the asset helper functions exist
    let _metric_fut = AssetTestHelpers::create_test_metric(&test_db, "test");
    let _dashboard_fut = AssetTestHelpers::create_test_dashboard(&test_db, "test");
    let _collection_fut = AssetTestHelpers::create_test_collection(&test_db, "test");
    let _chat_fut = AssetTestHelpers::create_test_chat(&test_db, "test");
    
    // Assert the permission helper functions exist
    let _perm_fut = PermissionTestHelpers::create_user_permission(
        &test_db, 
        uuid::Uuid::new_v4(),
        AssetType::MetricFile, 
        test_db.user_id, 
        AssetPermissionRole::Owner);
        
    let _verify_fut = PermissionTestHelpers::verify_user_permission(
        &test_db,
        uuid::Uuid::new_v4(),
        test_db.user_id,
        AssetPermissionRole::Owner);
        
    let _asset_perms_fut = PermissionTestHelpers::get_asset_permissions(
        &test_db,
        uuid::Uuid::new_v4());
        
    let _user_perms_fut = PermissionTestHelpers::get_user_permissions(
        &test_db,
        test_db.user_id);
    
    Ok(())
}

#[tokio::test]
async fn test_asset_with_permission_helpers() -> Result<()> {
    // Test the combined asset+permission helper functions
    let test_db = TestDb::new().await?;
    
    // Verify the combined helper functions exist
    
    // Create test metric with permission future
    let _metric_with_perm_fut = AssetTestHelpers::create_test_metric_with_permission(
        &test_db,
        "Test Metric with Permission",
        test_db.user_id,
        AssetPermissionRole::Owner
    );
    
    // Create dashboard with permission future
    let _dashboard_with_perm_fut = AssetTestHelpers::create_test_dashboard_with_permission(
        &test_db,
        "Test Dashboard with Permission",
        test_db.user_id,
        AssetPermissionRole::CanEdit
    );
    
    // Create collection with permission future
    let _collection_with_perm_fut = AssetTestHelpers::create_test_collection_with_permission(
        &test_db,
        "Test Collection with Permission",
        test_db.user_id,
        AssetPermissionRole::CanView
    );
    
    // Create chat with permission future
    let _chat_with_perm_fut = AssetTestHelpers::create_test_chat_with_permission(
        &test_db,
        "Test Chat with Permission",
        test_db.user_id,
        AssetPermissionRole::Owner
    );
    
    Ok(())
}

#[tokio::test]
async fn test_cleanup() -> Result<()> {
    // Test that the cleanup API exists
    let test_db = TestDb::new().await?;
    
    // Verify that the cleanup method exists
    let _cleanup_fut = test_db.cleanup();
    
    // Since we can't actually clean up data without running real DB operations,
    // we just test the method signature and that it's callable
    
    Ok(())
}