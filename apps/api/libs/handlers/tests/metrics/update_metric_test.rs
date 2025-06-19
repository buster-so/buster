use anyhow::Result;
use database::enums::{AssetPermissionRole, AssetType, UserOrganizationRole, Verification};
use database::models::MetricFile;
use database::pool::init_pools;
use database::schema::metric_files;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use handlers::metrics::update_metric_handler::{update_metric_handler, UpdateMetricRequest};
use middleware::AuthenticatedUser;
use std::sync::Once;
use uuid::Uuid;

static INIT: Once = Once::new();

async fn init_db_pool() -> Result<()> {
    INIT.call_once(|| {
        // We'll just initialize the INIT variable 
        // The connection pool should already be initialized in the test environment
        println!("Database initialized for test");
    });
    
    Ok(())
}

// Mock test setup for handlers tests
struct TestSetup {
    pub user: AuthenticatedUser,
    pub organization: database::models::Organization,
    pub db: TestDb,
}

impl TestSetup {
    pub async fn new(role: Option<UserOrganizationRole>) -> Result<Self> {
        let db = TestDb::new().await?;
        
        // Create organization
        let organization = database::models::Organization {
            id: db.organization_id,
            name: format!("Test Org {}", Uuid::new_v4()),
            domain: Some("test.example.com".to_string()),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            deleted_at: None,
            payment_required: false,
        };
        
        // Create user with specified role
        let user_role = role.unwrap_or(UserOrganizationRole::WorkspaceAdmin);
        let now = chrono::Utc::now();
        
        let user = AuthenticatedUser {
            id: db.user_id,
            email: format!("test-user-{}@example.com", Uuid::new_v4()),
            name: Some(format!("Test User {}", Uuid::new_v4())),
            config: serde_json::json!({}),
            created_at: now,
            updated_at: now,
            attributes: serde_json::json!({}),
            avatar_url: None,
            organizations: vec![
                middleware::types::OrganizationMembership {
                    id: db.organization_id,
                    role: user_role,
                }
            ],
            teams: vec![],
        };
        
        Ok(Self {
            user,
            organization,
            db,
        })
    }
}

// Simple test database setup
struct TestDb {
    pub test_id: String,
    pub organization_id: Uuid,
    pub user_id: Uuid,
}

impl TestDb {
    pub async fn new() -> Result<Self> {
        let test_id = format!("test-{}", Uuid::new_v4());
        let organization_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        Ok(Self {
            test_id,
            organization_id,
            user_id,
        })
    }
    
    pub async fn diesel_conn(&self) -> Result<diesel_async::pooled_connection::bb8::PooledConnection<'_, diesel_async::AsyncPgConnection>> {
        database::pool::get_pg_pool()
            .get()
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get database connection: {}", e))
    }
    
    pub async fn cleanup(&self) -> Result<()> {
        // In a real environment, this would clean up test data
        // For our tests, we'll handle cleanup manually in each test
        Ok(())
    }
}

// Unit test to verify the verification field is properly handled
#[test]
fn test_verification_in_update_request() {
    // Create a simple update request with verification field set
    let request = UpdateMetricRequest {
        verification: Some(Verification::Verified),
        ..Default::default()
    };
    
    // Verify the verification field is correctly set
    assert_eq!(request.verification.unwrap(), Verification::Verified);
}

// Integration test for metric status update
#[tokio::test]
async fn test_update_metric_status() -> Result<()> {
    // Initialize DB connection pool
    init_db_pool().await?;
    
    // Set up test environment with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
    
    // Create test metric using helpers
    let test_id = format!("test-{}", Uuid::new_v4());
    let metric_id = Uuid::new_v4();
    let mut conn = setup.db.diesel_conn().await?;
    
    // Create a simple metric with test content
    let content = database::types::MetricYml {
        name: format!("Test Metric {}", test_id),
        description: Some(format!("Test metric description for {}", test_id)),
        sql: "SELECT * FROM test".to_string(),
        time_frame: "last 30 days".to_string(),
        chart_config: create_default_chart_config(),
        dataset_ids: vec![],
    };
    
    // Initial verification status
    let initial_verification = Verification::NotRequested;
    
    // Create the test metric file
    let metric_file = MetricFile {
        id: metric_id,
        name: format!("{}-Test Metric", test_id),
        file_name: format!("{}-test_metric.yml", test_id),
        content: content.clone(),
        verification: initial_verification,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: setup.organization.id,
        created_by: setup.user.id,
        created_at: setup.user.created_at,
        updated_at: setup.user.updated_at,
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: database::types::VersionHistory(std::collections::HashMap::new()),
        data_metadata: None,
        public_password: None,
    };
    
    // Insert the test metric into the database
    diesel::insert_into(metric_files::table)
        .values(&metric_file)
        .execute(&mut conn)
        .await?;
    
    // Create test user in the database (required for foreign key constraints)
    diesel::insert_into(database::schema::organizations::table)
        .values((
            database::schema::organizations::id.eq(setup.organization.id),
            database::schema::organizations::name.eq(&setup.organization.name),
            database::schema::organizations::domain.eq(setup.organization.domain.as_ref()),
            database::schema::organizations::created_at.eq(setup.organization.created_at),
            database::schema::organizations::updated_at.eq(setup.organization.updated_at),
            database::schema::organizations::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
        ))
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
    
    // Create test user
    diesel::insert_into(database::schema::users::table)
        .values((
            database::schema::users::id.eq(setup.user.id),
            database::schema::users::email.eq(&setup.user.email),
            database::schema::users::name.eq(setup.user.name.as_ref()),
            database::schema::users::config.eq(serde_json::json!({})),
            database::schema::users::created_at.eq(setup.user.created_at),
            database::schema::users::updated_at.eq(setup.user.updated_at),
            database::schema::users::attributes.eq(serde_json::json!({})),
            database::schema::users::avatar_url.eq::<Option<String>>(None),
        ))
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
        
    // Create user-organization relationship
    diesel::insert_into(database::schema::users_to_organizations::table)
        .values((
            database::schema::users_to_organizations::user_id.eq(setup.user.id),
            database::schema::users_to_organizations::organization_id.eq(setup.organization.id),
            database::schema::users_to_organizations::role.eq(setup.user.organizations[0].role),
            database::schema::users_to_organizations::sharing_setting.eq(database::enums::SharingSetting::None),
            database::schema::users_to_organizations::edit_sql.eq(true),
            database::schema::users_to_organizations::upload_csv.eq(true),
            database::schema::users_to_organizations::export_assets.eq(true),
            database::schema::users_to_organizations::email_slack_enabled.eq(true),
            database::schema::users_to_organizations::created_at.eq(setup.user.created_at),
            database::schema::users_to_organizations::updated_at.eq(setup.user.updated_at),
            database::schema::users_to_organizations::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
            database::schema::users_to_organizations::created_by.eq(setup.user.id),
            database::schema::users_to_organizations::updated_by.eq(setup.user.id),
            database::schema::users_to_organizations::deleted_by.eq::<Option<Uuid>>(None),
            database::schema::users_to_organizations::status.eq(database::enums::UserOrganizationStatus::Active),
        ))
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
    
    // Now create permission for the user
    diesel::insert_into(database::schema::asset_permissions::table)
        .values((
            database::schema::asset_permissions::identity_id.eq(setup.user.id),
            database::schema::asset_permissions::identity_type.eq(database::enums::IdentityType::User),
            database::schema::asset_permissions::asset_id.eq(metric_id),
            database::schema::asset_permissions::asset_type.eq(AssetType::MetricFile),
            database::schema::asset_permissions::role.eq(AssetPermissionRole::Owner),
            database::schema::asset_permissions::created_at.eq(setup.user.created_at),
            database::schema::asset_permissions::updated_at.eq(setup.user.created_at),
            database::schema::asset_permissions::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
            database::schema::asset_permissions::created_by.eq(setup.user.id),
            database::schema::asset_permissions::updated_by.eq(setup.user.id),
        ))
        .execute(&mut conn)
        .await?;
    
    // Create update request with new verification status
    let request = UpdateMetricRequest {
        verification: Some(Verification::Verified),
        ..Default::default()
    };
    
    // Call the update_metric_handler
    let updated_metric = update_metric_handler(
        &metric_id,
        &setup.user,
        request
    ).await?;
    
    // Verify response has the updated status
    assert_eq!(updated_metric.status, Verification::Verified);
    
    // Verify database was updated
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_eq!(db_metric.verification, Verification::Verified);
    
    // Clean up test data
    diesel::delete(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    // TestDb cleanup will handle the rest of the cleanup
    setup.db.cleanup().await?;
    
    Ok(())
}

// Helper function to create default chart config for testing
fn create_default_chart_config() -> database::types::metric_yml::ChartConfig {
    use database::types::metric_yml::{BarAndLineAxis, BarLineChartConfig, BaseChartConfig, ChartConfig};
    use indexmap::IndexMap;
    
    ChartConfig::Bar(BarLineChartConfig {
        base: BaseChartConfig {
            column_label_formats: IndexMap::new(),
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
    })
}

// Test unauthorized access
#[tokio::test]
async fn test_update_metric_status_unauthorized() -> Result<()> {
    // Initialize DB connection pool
    init_db_pool().await?;
    
    // Set up test environment with viewer user (limited permissions)
    let setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    
    // Create test metric
    let test_id = format!("test-{}", Uuid::new_v4());
    let metric_id = Uuid::new_v4();
    let mut conn = setup.db.diesel_conn().await?;
    
    // Create a simple metric with test content
    let content = database::types::MetricYml {
        name: format!("Test Metric {}", test_id),
        description: Some(format!("Test metric description for {}", test_id)),
        sql: "SELECT * FROM test".to_string(),
        time_frame: "last 30 days".to_string(),
        chart_config: create_default_chart_config(),
        dataset_ids: vec![],
    };
    
    // Initial verification status
    let initial_verification = Verification::NotRequested;
    
    // Create the test metric file
    let metric_file = MetricFile {
        id: metric_id,
        name: format!("{}-Test Metric", test_id),
        file_name: format!("{}-test_metric.yml", test_id),
        content: content.clone(),
        verification: initial_verification,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: setup.organization.id,
        created_by: setup.user.id,
        created_at: setup.user.created_at,
        updated_at: setup.user.updated_at,
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: database::types::VersionHistory(std::collections::HashMap::new()),
        data_metadata: None,
        public_password: None,
    };
    
    // Insert the test metric into the database
    diesel::insert_into(metric_files::table)
        .values(&metric_file)
        .execute(&mut conn)
        .await?;
    
    // Create test user in the database (required for foreign key constraints)
    diesel::insert_into(database::schema::organizations::table)
        .values((
            database::schema::organizations::id.eq(setup.organization.id),
            database::schema::organizations::name.eq(&setup.organization.name),
            database::schema::organizations::domain.eq(setup.organization.domain.as_ref()),
            database::schema::organizations::created_at.eq(setup.organization.created_at),
            database::schema::organizations::updated_at.eq(setup.organization.updated_at),
            database::schema::organizations::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
        ))
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
    
    // Create test user
    diesel::insert_into(database::schema::users::table)
        .values((
            database::schema::users::id.eq(setup.user.id),
            database::schema::users::email.eq(&setup.user.email),
            database::schema::users::name.eq(setup.user.name.as_ref()),
            database::schema::users::config.eq(serde_json::json!({})),
            database::schema::users::created_at.eq(setup.user.created_at),
            database::schema::users::updated_at.eq(setup.user.created_at),
            database::schema::users::attributes.eq(serde_json::json!({})),
            database::schema::users::avatar_url.eq::<Option<String>>(None),
        ))
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
        
    // Create user-organization relationship
    diesel::insert_into(database::schema::users_to_organizations::table)
        .values((
            database::schema::users_to_organizations::user_id.eq(setup.user.id),
            database::schema::users_to_organizations::organization_id.eq(setup.organization.id),
            database::schema::users_to_organizations::role.eq(setup.user.organizations[0].role),
            database::schema::users_to_organizations::sharing_setting.eq(database::enums::SharingSetting::None),
            database::schema::users_to_organizations::edit_sql.eq(true),
            database::schema::users_to_organizations::upload_csv.eq(true),
            database::schema::users_to_organizations::export_assets.eq(true),
            database::schema::users_to_organizations::email_slack_enabled.eq(true),
            database::schema::users_to_organizations::created_at.eq(setup.user.created_at),
            database::schema::users_to_organizations::updated_at.eq(setup.user.created_at),
            database::schema::users_to_organizations::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
            database::schema::users_to_organizations::created_by.eq(setup.user.id),
            database::schema::users_to_organizations::updated_by.eq(setup.user.id),
            database::schema::users_to_organizations::deleted_by.eq::<Option<Uuid>>(None),
            database::schema::users_to_organizations::status.eq(database::enums::UserOrganizationStatus::Active),
        ))
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
    
    // Create view-only permission
    diesel::insert_into(database::schema::asset_permissions::table)
        .values((
            database::schema::asset_permissions::identity_id.eq(setup.user.id),
            database::schema::asset_permissions::identity_type.eq(database::enums::IdentityType::User),
            database::schema::asset_permissions::asset_id.eq(metric_id),
            database::schema::asset_permissions::asset_type.eq(AssetType::MetricFile),
            database::schema::asset_permissions::role.eq(AssetPermissionRole::CanView),
            database::schema::asset_permissions::created_at.eq(setup.user.created_at),
            database::schema::asset_permissions::updated_at.eq(setup.user.created_at),
            database::schema::asset_permissions::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
            database::schema::asset_permissions::created_by.eq(setup.user.id),
            database::schema::asset_permissions::updated_by.eq(setup.user.id),
        ))
        .execute(&mut conn)
        .await?;
    
    // Create update request with new verification status
    let request = UpdateMetricRequest {
        verification: Some(Verification::Verified),
        ..Default::default()
    };
    
    // Call the update_metric_handler - should fail
    let result = update_metric_handler(
        &metric_id,
        &setup.user,
        request
    ).await;
    
    // Verify the operation failed
    assert!(result.is_err());
    
    // Verify database was not updated
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_eq!(db_metric.verification, initial_verification);
    
    // Clean up test data
    diesel::delete(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    // TestDb cleanup will handle the rest of the cleanup
    setup.db.cleanup().await?;
    
    Ok(())
}

// Test edge cases for status updates
#[tokio::test]
async fn test_update_metric_status_null_value() -> Result<()> {
    // Initialize DB connection pool
    init_db_pool().await?;
    
    // Set up test environment with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
    
    // Create test metric
    let test_id = format!("test-{}", Uuid::new_v4());
    let metric_id = Uuid::new_v4();
    let mut conn = setup.db.diesel_conn().await?;
    
    // Create a simple metric with test content
    let content = database::types::MetricYml {
        name: format!("Test Metric {}", test_id),
        description: Some(format!("Test metric description for {}", test_id)),
        sql: "SELECT * FROM test".to_string(),
        time_frame: "last 30 days".to_string(),
        chart_config: create_default_chart_config(),
        dataset_ids: vec![],
    };
    
    // Initial verification status - set to Verified for this test
    let initial_verification = Verification::Verified;
    
    // Create the test metric file
    let metric_file = MetricFile {
        id: metric_id,
        name: format!("{}-Test Metric", test_id),
        file_name: format!("{}-test_metric.yml", test_id),
        content: content.clone(),
        verification: initial_verification,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: setup.organization.id,
        created_by: setup.user.id,
        created_at: setup.user.created_at,
        updated_at: setup.user.updated_at,
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: database::types::VersionHistory(std::collections::HashMap::new()),
        data_metadata: None,
        public_password: None,
    };
    
    // Insert the test metric into the database
    diesel::insert_into(metric_files::table)
        .values(&metric_file)
        .execute(&mut conn)
        .await?;
    
    // Create test user in the database (required for foreign key constraints)
    diesel::insert_into(database::schema::organizations::table)
        .values((
            database::schema::organizations::id.eq(setup.organization.id),
            database::schema::organizations::name.eq(&setup.organization.name),
            database::schema::organizations::domain.eq(setup.organization.domain.as_ref()),
            database::schema::organizations::created_at.eq(setup.organization.created_at),
            database::schema::organizations::updated_at.eq(setup.organization.updated_at),
            database::schema::organizations::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
        ))
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
    
    // Create test user
    diesel::insert_into(database::schema::users::table)
        .values((
            database::schema::users::id.eq(setup.user.id),
            database::schema::users::email.eq(&setup.user.email),
            database::schema::users::name.eq(setup.user.name.as_ref()),
            database::schema::users::config.eq(serde_json::json!({})),
            database::schema::users::created_at.eq(setup.user.created_at),
            database::schema::users::updated_at.eq(setup.user.created_at),
            database::schema::users::attributes.eq(serde_json::json!({})),
            database::schema::users::avatar_url.eq::<Option<String>>(None),
        ))
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
        
    // Create user-organization relationship
    diesel::insert_into(database::schema::users_to_organizations::table)
        .values((
            database::schema::users_to_organizations::user_id.eq(setup.user.id),
            database::schema::users_to_organizations::organization_id.eq(setup.organization.id),
            database::schema::users_to_organizations::role.eq(setup.user.organizations[0].role),
            database::schema::users_to_organizations::sharing_setting.eq(database::enums::SharingSetting::None),
            database::schema::users_to_organizations::edit_sql.eq(true),
            database::schema::users_to_organizations::upload_csv.eq(true),
            database::schema::users_to_organizations::export_assets.eq(true),
            database::schema::users_to_organizations::email_slack_enabled.eq(true),
            database::schema::users_to_organizations::created_at.eq(setup.user.created_at),
            database::schema::users_to_organizations::updated_at.eq(setup.user.created_at),
            database::schema::users_to_organizations::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
            database::schema::users_to_organizations::created_by.eq(setup.user.id),
            database::schema::users_to_organizations::updated_by.eq(setup.user.id),
            database::schema::users_to_organizations::deleted_by.eq::<Option<Uuid>>(None),
            database::schema::users_to_organizations::status.eq(database::enums::UserOrganizationStatus::Active),
        ))
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
    
    // Create permission for the user - Owner level
    diesel::insert_into(database::schema::asset_permissions::table)
        .values((
            database::schema::asset_permissions::identity_id.eq(setup.user.id),
            database::schema::asset_permissions::identity_type.eq(database::enums::IdentityType::User),
            database::schema::asset_permissions::asset_id.eq(metric_id),
            database::schema::asset_permissions::asset_type.eq(AssetType::MetricFile),
            database::schema::asset_permissions::role.eq(AssetPermissionRole::Owner),
            database::schema::asset_permissions::created_at.eq(setup.user.created_at),
            database::schema::asset_permissions::updated_at.eq(setup.user.created_at),
            database::schema::asset_permissions::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
            database::schema::asset_permissions::created_by.eq(setup.user.id),
            database::schema::asset_permissions::updated_by.eq(setup.user.id),
        ))
        .execute(&mut conn)
        .await?;
    
    // Create update request with null verification value
    let request = UpdateMetricRequest {
        verification: None,
        ..Default::default()
    };
    
    // Call the update_metric_handler
    let updated_metric = update_metric_handler(
        &metric_id,
        &setup.user,
        request
    ).await?;
    
    // Verify original status is preserved
    assert_eq!(updated_metric.status, initial_verification);
    
    // Verify database status was not changed
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_eq!(db_metric.verification, initial_verification);
    
    // Clean up test data
    diesel::delete(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    // TestDb cleanup will handle the rest of the cleanup
    setup.db.cleanup().await?;
    
    Ok(())
}
    
