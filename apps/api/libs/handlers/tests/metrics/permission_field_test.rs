use anyhow::Result;
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use database::models::{AssetPermission, MetricFile};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, metric_files};
use database::models::UserToOrganization;
use database::types::metric_yml::{BarAndLineAxis, BarLineChartConfig, BaseChartConfig};
use database::types::{ChartConfig, MetricYml, VersionHistory};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use handlers::metrics::get_metric_handler;
use std::collections::HashMap;
use uuid::Uuid;

/// Helper function to create a test metric file
async fn create_test_metric(
    organization_id: Uuid,
    user_id: Uuid,
    name: &str,
) -> Result<MetricFile> {
    let mut conn = get_pg_pool().get().await?;
    let metric_id = Uuid::new_v4();
    
    // Create a simple metric content
    let content = MetricYml {
        name: name.to_string(),
        description: Some(format!("Test metric description for {}", name)),
        sql: "SELECT * FROM test".to_string(),
        time_frame: "last 30 days".to_string(),
        chart_config: ChartConfig::Bar(BarLineChartConfig {
            base: BaseChartConfig {
                column_label_formats: indexmap::IndexMap::new(),
                column_settings: None,
                colors: None,
                show_legend: None,
                grid_lines: None,
                show_legend_headline: None,
                goal_lines: None,
                trendlines: None,
                disable_tooltip: None,
                y_axis_config: None,
                x_axis_config: None,
                category_axis_style_config: None,
                y2_axis_config: None,
            },
            bar_and_line_axis: BarAndLineAxis {
                x: vec!["x".to_string()],
                y: vec!["y".to_string()],
                category: None,
                tooltip: None,
            },
            bar_layout: None,
            bar_sort_by: None,
            bar_group_type: None,
            bar_show_total_at_top: None,
            line_group_type: None,
        }),
        dataset_ids: Vec::new(),
    };
    
    let metric_file = MetricFile {
        id: metric_id,
        name: name.to_string(),
        file_name: format!("{}.yml", name.to_lowercase().replace(" ", "_")),
        content,
        verification: database::enums::Verification::Verified,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id,
        created_by: user_id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: VersionHistory(HashMap::new()),
        data_metadata: None,
        public_password: None,
    };
    
    diesel::insert_into(metric_files::table)
        .values(&metric_file)
        .execute(&mut conn)
        .await?;
        
    Ok(metric_file)
}

/// Helper function to add permission for a metric
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
        asset_type: AssetType::MetricFile,
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

/// Test to ensure permission field in the response matches the permission used for access control
#[tokio::test]
async fn test_metric_permission_field_consistency() -> Result<()> {
    // Create user and organization for testing
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric
    let metric = create_test_metric(
        org_id, 
        user_id, 
        "Test Permission Metric"
    ).await?;
    
    // Add permission for asset
    add_permission(
        metric.id, 
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
    
    // Get metric with the user who has owner permission
    let metric_response = get_metric_handler(&metric.id, &middleware_user, None, None).await?;
    
    // Check if permission field matches what we set
    assert_eq!(metric_response.permission, AssetPermissionRole::Owner);
    
    Ok(())
}

/// Test to ensure public metrics grant CanView permission to users without direct permissions
#[tokio::test]
async fn test_public_metric_permission_field() -> Result<()> {
    // Create user and organization for testing
    let owner_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric
    let metric = create_test_metric(
        org_id, 
        owner_id, 
        "Public Metric"
    ).await?;
    
    // Make metric public
    let mut conn = get_pg_pool().get().await?;
    diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric.id))
        .set((
            metric_files::publicly_accessible.eq(true),
            metric_files::publicly_enabled_by.eq(Some(owner_id)),
            metric_files::public_expiry_date.eq(Some(chrono::Utc::now() + chrono::Duration::days(7))),
        ))
        .execute(&mut conn)
        .await?;
    
    // Create another user
    let other_user_id = Uuid::new_v4();
    
    // Add user to organization with viewer role
    let user_org = UserToOrganization {
        user_id: other_user_id,
        organization_id: org_id,
        role: database::enums::UserOrganizationRole::Viewer,
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
    
    diesel::insert_into(database::schema::users_to_organizations::table)
        .values(&user_org)
        .execute(&mut conn)
        .await?;
    
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
                id: org_id,
                role: database::enums::UserOrganizationRole::Viewer,
            },
        ],
        teams: vec![],
    };
    
    // Get metric with the other user who doesn't have direct permission
    let metric_response = get_metric_handler(&metric.id, &other_middleware_user, None, None).await?;
    
    // Public assets should have CanView permission by default
    assert_eq!(metric_response.permission, AssetPermissionRole::CanView);
    
    Ok(())
}

/// Test to ensure access is denied for users without permissions and non-public metrics
#[tokio::test]
async fn test_metric_permission_denied() -> Result<()> {
    // Create user and organization for testing
    let owner_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create a private test metric
    let metric = create_test_metric(
        org_id, 
        owner_id, 
        "Private Metric"
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
    
    // Try to get metric with a user who has no permissions
    let result = get_metric_handler(&metric.id, &other_middleware_user, None, None).await;
    
    // Should be denied access
    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.to_string().contains("You don't have permission"));
    
    Ok(())
}

/// Test to ensure password protection works for public metrics
#[tokio::test]
async fn test_password_protection() -> Result<()> {
    // Create user and organization for testing
    let owner_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric
    let metric = create_test_metric(
        org_id, 
        owner_id, 
        "Password Protected Metric"
    ).await?;
    
    // Make metric public with password
    let mut conn = get_pg_pool().get().await?;
    let password = "secret123";
    diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric.id))
        .set((
            metric_files::publicly_accessible.eq(true),
            metric_files::publicly_enabled_by.eq(Some(owner_id)),
            metric_files::public_password.eq(Some(password.to_string())),
        ))
        .execute(&mut conn)
        .await?;
    
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
    
    // Try to access without password - should be denied
    let result = get_metric_handler(&metric.id, &other_middleware_user, None, None).await;
    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.to_string().contains("public_password required"));
    
    // Try with incorrect password - should be denied
    let result = get_metric_handler(&metric.id, &other_middleware_user, None, Some("wrongpassword".to_string())).await;
    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.to_string().contains("Incorrect password"));
    
    // Try with correct password - should be allowed
    let result = get_metric_handler(&metric.id, &other_middleware_user, None, Some(password.to_string())).await;
    assert!(result.is_ok());
    
    Ok(())
}

/// Test to ensure expired public access is denied
#[tokio::test]
async fn test_expired_public_access() -> Result<()> {
    // Create user and organization for testing
    let owner_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric
    let metric = create_test_metric(
        org_id, 
        owner_id, 
        "Expired Public Metric"
    ).await?;
    
    // Make metric public with an expiry date in the past
    let mut conn = get_pg_pool().get().await?;
    let past_date = chrono::Utc::now() - chrono::Duration::days(1);
    diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric.id))
        .set((
            metric_files::publicly_accessible.eq(true),
            metric_files::publicly_enabled_by.eq(Some(owner_id)),
            metric_files::public_expiry_date.eq(Some(past_date)),
        ))
        .execute(&mut conn)
        .await?;
    
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
    
    // Try to access the expired public metric - should be denied
    let result = get_metric_handler(&metric.id, &other_middleware_user, None, None).await;
    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.to_string().contains("expired"));
    
    Ok(())
}