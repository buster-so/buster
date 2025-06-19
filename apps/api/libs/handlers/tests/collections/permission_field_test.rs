use anyhow::Result;
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use database::models::{AssetPermission, Collection};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, collections};
use database::models::UserToOrganization;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use handlers::collections::{get_collection_handler, GetCollectionRequest};
use uuid::Uuid;

/// Helper function to create a test collection
async fn create_test_collection(
    organization_id: Uuid,
    user_id: Uuid,
    name: &str,
) -> Result<Collection> {
    let mut conn = get_pg_pool().get().await?;
    let collection_id = Uuid::new_v4();
    
    let collection = Collection {
        id: collection_id,
        name: name.to_string(),
        description: Some(format!("Test collection description for {}", name)),
        created_by: user_id,
        updated_by: user_id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        organization_id,
    };
    
    diesel::insert_into(collections::table)
        .values(&collection)
        .execute(&mut conn)
        .await?;
        
    Ok(collection)
}

/// Helper function to add permission for a collection
async fn add_permission(
    asset_id: Uuid,
    user_id: Uuid,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    let permission = AssetPermission {
        identity_id: user_id,
        identity_type: IdentityType::User,
        asset_id,
        asset_type: AssetType::Collection,
        role,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by,
        updated_by: created_by,
    };
    
    diesel::insert_into(asset_permissions::table)
        .values(&permission)
        .execute(&mut conn)
        .await?;
        
    Ok(())
}

/// Test to ensure permission field in collection response matches the permission used for access control
#[tokio::test]
async fn test_collection_permission_field_consistency() -> Result<()> {
    // Create user and organization for testing
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test collection
    let collection = create_test_collection(
        org_id, 
        user_id, 
        "Test Permission Collection"
    ).await?;
    
    // Add permission for asset
    add_permission(
        collection.id, 
        user_id, 
        AssetPermissionRole::Owner,
        user_id
    ).await?;
    
    // Create middleware user
    let middleware_user = middleware::AuthenticatedUser {
        id: user_id,
        email: "test@example.com".to_string(),
        name: Some("Test User".to_string()),
        config: serde_json::json!({}),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
        organizations: vec![
            middleware::OrganizationMembership {
                id: org_id,
                role: database::enums::UserOrganizationRole::WorkspaceAdmin,
            },
        ],
        teams: vec![],
    };
    
    // Create request data
    let request = GetCollectionRequest {
        id: collection.id,
    };
    
    // Get collection with the user who has owner permission
    let collection_response = get_collection_handler(&middleware_user, request).await?;
    
    // Check if permission field matches what we set
    assert_eq!(collection_response.permission, AssetPermissionRole::Owner);
    
    Ok(())
}

/// Test to ensure access is denied for users without permissions
#[tokio::test]
async fn test_collection_permission_denied() -> Result<()> {
    // Create user and organization for testing
    let owner_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create a private test collection
    let collection = create_test_collection(
        org_id, 
        owner_id, 
        "Private Collection"
    ).await?;
    
    // Create another user in a different organization
    let other_user_id = Uuid::new_v4();
    let other_org_id = Uuid::new_v4();
    
    // Create middleware user for other user
    let other_middleware_user = middleware::AuthenticatedUser {
        id: other_user_id,
        email: "other@example.com".to_string(),
        name: Some("Other User".to_string()),
        config: serde_json::json!({}),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
        organizations: vec![
            middleware::OrganizationMembership {
                id: other_org_id,
                role: database::enums::UserOrganizationRole::Viewer,
            },
        ],
        teams: vec![],
    };
    
    // Create request data
    let request = GetCollectionRequest {
        id: collection.id,
    };
    
    // Try to get collection with a user who has no permissions
    let result = get_collection_handler(&other_middleware_user, request).await;
    
    // Should be denied access
    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.to_string().contains("You don't have permission"));
    
    Ok(())
}

/// Test inherited permissions through organization role
#[tokio::test]
async fn test_collection_org_admin_permission() -> Result<()> {
    // Create user and organization for testing
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test collection (without direct permission)
    let collection = create_test_collection(
        org_id, 
        user_id, 
        "Admin Collection"
    ).await?;
    
    // Create middleware user with admin role
    let middleware_user = middleware::AuthenticatedUser {
        id: user_id,
        email: "admin@example.com".to_string(),
        name: Some("Admin User".to_string()),
        config: serde_json::json!({}),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
        organizations: vec![
            middleware::OrganizationMembership {
                id: org_id,
                role: database::enums::UserOrganizationRole::WorkspaceAdmin,
            },
        ],
        teams: vec![],
    };
    
    // Create request data
    let request = GetCollectionRequest {
        id: collection.id,
    };
    
    // Get collection with the admin user
    let result = get_collection_handler(&middleware_user, request).await;
    
    // Access should be successful and admin should have Owner permission
    assert!(result.is_ok(), "Admin should have access: {:?}", result.err());
    if let Ok(response) = result {
        assert_eq!(response.permission, AssetPermissionRole::Owner);
    }
    
    Ok(())
}