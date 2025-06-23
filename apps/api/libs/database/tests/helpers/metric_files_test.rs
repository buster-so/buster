use anyhow::Result;
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetType};
use database::helpers::metric_files::{
    fetch_metric_file_with_permissions, fetch_metric_files_with_permissions,
};
use database::models::{Collection, CollectionToAsset, MetricFileToDashboardFile};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use tokio;
use uuid::Uuid;

use database::test_utils::{TestDb, insert_test_metric_file, insert_test_dashboard_file, insert_test_permission, cleanup_test_data};

/// Tests the fetch_metric_file_with_permissions function with direct permission
#[tokio::test]
async fn test_metric_file_direct_permission() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and file
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let metric_file = test_db.create_test_metric_file(&owner_id).await?;
    let metric_id = metric_file.id;
    
    // Insert the test metric file
    insert_test_metric_file(&metric_file).await?;
    
    // Test cases with different permission roles
    for role in [
        AssetPermissionRole::Owner,
        AssetPermissionRole::FullAccess,
        AssetPermissionRole::CanEdit,
        AssetPermissionRole::CanFilter,
        AssetPermissionRole::CanView,
    ] {
        // Create and insert permission
        let permission = test_db
            .create_asset_permission(&metric_id, AssetType::MetricFile, &owner_id, role)
            .await?;
        insert_test_permission(&permission).await?;
        
        // Fetch file with permissions
        let result = fetch_metric_file_with_permissions(&metric_id, &owner_id).await?;
        
        // Assert file is found and has correct permission
        assert!(result.is_some(), "Metric file should be found");
        let file_with_permission = result.unwrap();
        assert_eq!(file_with_permission.metric_file.id, metric_id);
        assert_eq!(file_with_permission.permission, Some(role));
    }
    
    // Clean up
    cleanup_test_data(&[metric_id]).await?;
    
    Ok(())
}

/// Tests the fetch_metric_file_with_permissions function when no permission exists
#[tokio::test]
async fn test_metric_file_no_permission() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and file
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let metric_file = test_db.create_test_metric_file(&owner_id).await?;
    let metric_id = metric_file.id;
    
    // Insert the test metric file
    insert_test_metric_file(&metric_file).await?;
    
    // Fetch file with permissions (no permission exists)
    let result = fetch_metric_file_with_permissions(&metric_id, &Uuid::new_v4()).await?;
    
    // Assert file is found but has no permission
    assert!(result.is_some(), "Metric file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.metric_file.id, metric_id);
    assert_eq!(file_with_permission.permission, None);
    
    // Clean up
    cleanup_test_data(&[metric_id]).await?;
    
    Ok(())
}

/// Tests the fetch_metric_file_with_permissions function with public accessibility
#[tokio::test]
async fn test_metric_file_public_access() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and file
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let mut metric_file = test_db.create_test_metric_file(&owner_id).await?;
    
    // Make the file publicly accessible
    metric_file.publicly_accessible = true;
    metric_file.publicly_enabled_by = Some(owner_id);
    metric_file.public_expiry_date = Some(Utc::now() + chrono::Duration::days(1));
    
    let metric_id = metric_file.id;
    
    // Insert the test metric file
    insert_test_metric_file(&metric_file).await?;
    
    // Fetch file with permissions for a random user (no direct permission)
    let random_user_id = Uuid::new_v4();
    let result = fetch_metric_file_with_permissions(&metric_id, &random_user_id).await?;
    
    // Assert file is found and has CanView permission due to public access
    assert!(result.is_some(), "Metric file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.metric_file.id, metric_id);
    assert_eq!(file_with_permission.permission, Some(AssetPermissionRole::CanView));
    
    // Clean up
    cleanup_test_data(&[metric_id]).await?;
    
    Ok(())
}

/// Tests the fetch_metric_file_with_permissions function with expired public accessibility
#[tokio::test]
async fn test_metric_file_expired_public_access() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and file
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let mut metric_file = test_db.create_test_metric_file(&owner_id).await?;
    
    // Make the file publicly accessible but expired
    metric_file.publicly_accessible = true;
    metric_file.publicly_enabled_by = Some(owner_id);
    metric_file.public_expiry_date = Some(Utc::now() - chrono::Duration::days(1)); // Expired
    
    let metric_id = metric_file.id;
    
    // Insert the test metric file
    insert_test_metric_file(&metric_file).await?;
    
    // Fetch file with permissions for a random user (no direct permission)
    let random_user_id = Uuid::new_v4();
    let result = fetch_metric_file_with_permissions(&metric_id, &random_user_id).await?;
    
    // Assert file is found but has no permission (public access expired)
    assert!(result.is_some(), "Metric file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.metric_file.id, metric_id);
    assert_eq!(file_with_permission.permission, None);
    
    // Clean up
    cleanup_test_data(&[metric_id]).await?;
    
    Ok(())
}

/// Tests the fetch_metric_files_with_permissions function for multiple files
#[tokio::test]
async fn test_fetch_multiple_metric_files() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and files
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    
    // Create and insert three test metric files with different permissions
    let metric_file1 = test_db.create_test_metric_file(&owner_id).await?;
    let metric_id1 = metric_file1.id;
    insert_test_metric_file(&metric_file1).await?;
    
    let mut metric_file2 = test_db.create_test_metric_file(&owner_id).await?;
    metric_file2.publicly_accessible = true;
    metric_file2.public_expiry_date = Some(Utc::now() + chrono::Duration::days(1));
    let metric_id2 = metric_file2.id;
    insert_test_metric_file(&metric_file2).await?;
    
    let metric_file3 = test_db.create_test_metric_file(&owner_id).await?;
    let metric_id3 = metric_file3.id;
    insert_test_metric_file(&metric_file3).await?;
    
    // Create and insert permissions
    let permission1 = test_db
        .create_asset_permission(&metric_id1, AssetType::MetricFile, &owner_id, AssetPermissionRole::CanEdit)
        .await?;
    insert_test_permission(&permission1).await?;
    
    let permission3 = test_db
        .create_asset_permission(&metric_id3, AssetType::MetricFile, &owner_id, AssetPermissionRole::CanView)
        .await?;
    insert_test_permission(&permission3).await?;
    
    // Fetch multiple files with permissions
    let ids = vec![metric_id1, metric_id2, metric_id3];
    let results = fetch_metric_files_with_permissions(&ids, &owner_id).await?;
    
    // Assert correct permissions for each file
    assert_eq!(results.len(), 3, "Should return 3 files");
    
    // Find each file in results and check its permission
    for result in &results {
        if result.metric_file.id == metric_id1 {
            assert_eq!(result.permission, Some(AssetPermissionRole::CanEdit));
        } else if result.metric_file.id == metric_id2 {
            assert_eq!(result.permission, Some(AssetPermissionRole::CanView)); // Public file
        } else if result.metric_file.id == metric_id3 {
            assert_eq!(result.permission, Some(AssetPermissionRole::CanView));
        } else {
            panic!("Unexpected file ID in results");
        }
    }
    
    // Clean up
    cleanup_test_data(&ids).await?;
    
    Ok(())
}

/// Tests access to a metric file through dashboard permissions
/// This test specifically checks that a user with access to a dashboard can view 
/// metrics associated with that dashboard
#[tokio::test]
async fn test_metric_file_dashboard_access() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test users and files
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let viewer_id = Uuid::new_v4(); // Another user who will have access to dashboard but not directly to metric
    
    // Create metric and dashboard files
    let metric_file = test_db.create_test_metric_file(&owner_id).await?;
    let metric_id = metric_file.id;
    insert_test_metric_file(&metric_file).await?;
    
    let dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    let dashboard_id = dashboard_file.id;
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Create association between metric and dashboard
    let metric_to_dashboard = MetricFileToDashboardFile {
        metric_file_id: metric_id,
        dashboard_file_id: dashboard_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: owner_id,
    };
    
    // Insert association
    diesel::insert_into(database::schema::metric_files_to_dashboard_files::table)
        .values(&metric_to_dashboard)
        .execute(&mut conn)
        .await?;
    
    // Give viewer permission to dashboard but not to metric
    let dashboard_permission = test_db
        .create_asset_permission(&dashboard_id, AssetType::DashboardFile, &viewer_id, AssetPermissionRole::CanView)
        .await?;
    insert_test_permission(&dashboard_permission).await?;
    
    // Fetch metric file with permissions as viewer
    let result = fetch_metric_file_with_permissions(&metric_id, &viewer_id).await?;
    
    // Assert viewer can view metric through dashboard permission
    assert!(result.is_some(), "Metric file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.metric_file.id, metric_id);
    assert_eq!(file_with_permission.permission, Some(AssetPermissionRole::CanView));
    
    // Clean up
    cleanup_test_data(&[metric_id, dashboard_id]).await?;
    
    // Delete metric-to-dashboard association
    diesel::delete(database::schema::metric_files_to_dashboard_files::table)
        .filter(database::schema::metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    Ok(())
}

/// Tests access to a metric file through collection permissions
#[tokio::test]
async fn test_metric_file_collection_access() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test users and files
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let viewer_id = Uuid::new_v4(); // Another user who will have access to collection but not directly to metric
    
    // Create metric file
    let metric_file = test_db.create_test_metric_file(&owner_id).await?;
    let metric_id = metric_file.id;
    insert_test_metric_file(&metric_file).await?;
    
    // Create collection
    let collection_id = Uuid::new_v4();
    let collection = Collection {
        id: collection_id,
        name: format!("Test Collection {}", test_db.test_id),
        description: Some("Test collection description".to_string()),
        created_by: owner_id,
        updated_by: owner_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        organization_id: test_db.organization_id,
    };
    
    // Insert collection
    diesel::insert_into(database::schema::collections::table)
        .values(&collection)
        .execute(&mut conn)
        .await?;
    
    // Create association between metric and collection
    let collection_to_asset = CollectionToAsset {
        collection_id,
        asset_id: metric_id,
        asset_type: AssetType::MetricFile,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: owner_id,
        updated_by: owner_id,
    };
    
    // Insert association
    diesel::insert_into(database::schema::collections_to_assets::table)
        .values(&collection_to_asset)
        .execute(&mut conn)
        .await?;
    
    // Give viewer permission to collection but not to metric
    let collection_permission = test_db
        .create_asset_permission(&collection_id, AssetType::Collection, &viewer_id, AssetPermissionRole::CanEdit)
        .await?;
    insert_test_permission(&collection_permission).await?;
    
    // Fetch metric file with permissions as viewer
    let result = fetch_metric_file_with_permissions(&metric_id, &viewer_id).await?;
    
    // Assert viewer can view metric through collection permission
    assert!(result.is_some(), "Metric file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.metric_file.id, metric_id);
    assert_eq!(file_with_permission.permission, Some(AssetPermissionRole::CanEdit));
    
    // Clean up
    cleanup_test_data(&[metric_id]).await?;
    
    // Delete collection and associations
    diesel::delete(database::schema::collections_to_assets::table)
        .filter(database::schema::collections_to_assets::collection_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::collections::table)
        .filter(database::schema::collections::id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
    
    Ok(())
}

/// Tests permission hierarchy when multiple permissions exist
#[tokio::test]
async fn test_metric_file_permission_hierarchy() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test users and files
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    
    // Create metric file
    let metric_file = test_db.create_test_metric_file(&owner_id).await?;
    let metric_id = metric_file.id;
    insert_test_metric_file(&metric_file).await?;
    
    // Create collection
    let collection_id = Uuid::new_v4();
    let collection = Collection {
        id: collection_id,
        name: format!("Test Collection {}", test_db.test_id),
        description: Some("Test collection description".to_string()),
        created_by: owner_id,
        updated_by: owner_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        organization_id: test_db.organization_id,
    };
    
    // Insert collection
    diesel::insert_into(database::schema::collections::table)
        .values(&collection)
        .execute(&mut conn)
        .await?;
    
    // Create association between metric and collection
    let collection_to_asset = CollectionToAsset {
        collection_id,
        asset_id: metric_id,
        asset_type: AssetType::MetricFile,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: owner_id,
        updated_by: owner_id,
    };
    
    // Insert association
    diesel::insert_into(database::schema::collections_to_assets::table)
        .values(&collection_to_asset)
        .execute(&mut conn)
        .await?;
    
    // Create dashboard file
    let dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    let dashboard_id = dashboard_file.id;
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Create association between metric and dashboard
    let metric_to_dashboard = MetricFileToDashboardFile {
        metric_file_id: metric_id,
        dashboard_file_id: dashboard_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: owner_id,
    };
    
    // Insert association
    diesel::insert_into(database::schema::metric_files_to_dashboard_files::table)
        .values(&metric_to_dashboard)
        .execute(&mut conn)
        .await?;
    
    // Give user multiple permissions to test hierarchy
    
    // Direct permission - CanFilter
    let direct_permission = test_db
        .create_asset_permission(&metric_id, AssetType::MetricFile, &owner_id, AssetPermissionRole::CanFilter)
        .await?;
    insert_test_permission(&direct_permission).await?;
    
    // Collection permission - CanEdit (higher than direct)
    let collection_permission = test_db
        .create_asset_permission(&collection_id, AssetType::Collection, &owner_id, AssetPermissionRole::CanEdit)
        .await?;
    insert_test_permission(&collection_permission).await?;
    
    // Dashboard permission - CanView (lower than others)
    let dashboard_permission = test_db
        .create_asset_permission(&dashboard_id, AssetType::DashboardFile, &owner_id, AssetPermissionRole::CanView)
        .await?;
    insert_test_permission(&dashboard_permission).await?;
    
    // Fetch metric file with permissions
    let result = fetch_metric_file_with_permissions(&metric_id, &owner_id).await?;
    
    // Assert the highest permission level is used (collection's CanEdit)
    assert!(result.is_some(), "Metric file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.metric_file.id, metric_id);
    assert_eq!(file_with_permission.permission, Some(AssetPermissionRole::CanEdit));
    
    // Clean up
    cleanup_test_data(&[metric_id, dashboard_id]).await?;
    
    // Delete collections and associations
    diesel::delete(database::schema::collections_to_assets::table)
        .filter(database::schema::collections_to_assets::collection_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::collections::table)
        .filter(database::schema::collections::id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
    
    // Delete metric-to-dashboard association
    diesel::delete(database::schema::metric_files_to_dashboard_files::table)
        .filter(database::schema::metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    Ok(())
}