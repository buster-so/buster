use crate::enums::{AssetPermissionRole, AssetType, IdentityType, Verification, WorkspaceSharing};
use crate::models::{AssetPermission, DashboardFile, MetricFile, User};
use crate::pool::get_pg_pool;
use crate::types::metric_yml::{BarAndLineAxis, BarLineChartConfig, BaseChartConfig, ChartConfig};
use crate::types::{DashboardYml, MetricYml, VersionHistory};
use anyhow::Result;
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use indexmap;
use uuid::Uuid;

/// Test database utilities
pub struct TestDb {
    pub test_id: String,
    pub organization_id: Uuid,
    pub user_id: Uuid,
}

impl TestDb {
    /// Creates a new test database environment
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

    /// Get a database connection from the pool
    pub async fn get_conn(
        &self,
    ) -> Result<
        diesel_async::pooled_connection::bb8::PooledConnection<diesel_async::AsyncPgConnection>,
    > {
        let pool = get_pg_pool();
        Ok(pool.get().await?)
    }

    /// Create a test user
    pub async fn create_test_user(&self) -> Result<User> {
        // This is a utility for creating test users
        // In a real test, we would insert the user in the database,
        // but here we just create and return the struct

        let user = User {
            id: self.user_id,
            email: format!("user-{}@example.com", self.test_id),
            name: Some(format!("Test User {}", self.test_id)),
            config: serde_json::json!({}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: serde_json::json!({}),
            avatar_url: None,
        };

        // This would normally insert the user, but we'll skip actual DB modifications
        // in test utilities and just return the struct

        Ok(user)
    }

    /// Create a test metric file
    pub async fn create_test_metric_file(&self, owner_id: &Uuid) -> Result<MetricFile> {
        let metric_id = Uuid::new_v4();
        let content = MetricYml {
            name: "Test Metric".to_string(),
            description: Some("Test metric description".to_string()),
            sql: "SELECT * FROM test".to_string(),
            time_frame: "last 30 days".to_string(),
            chart_config: create_default_chart_config(),
        };

        let metric_file = MetricFile {
            id: metric_id,
            name: format!("Test Metric {}", self.test_id),
            file_name: format!("test_metric_{}.yml", self.test_id),
            content,
            verification: Verification::Verified,
            evaluation_obj: None,
            evaluation_summary: None,
            evaluation_score: None,
            organization_id: self.organization_id,
            created_by: *owner_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            version_history: VersionHistory(std::collections::HashMap::new()),
            data_metadata: None,
            public_password: None,
            data_source_id: Uuid::new_v4(),
            workspace_sharing: WorkspaceSharing::None,
            workspace_sharing_enabled_by: None,
            workspace_sharing_enabled_at: None,
        };

        Ok(metric_file)
    }

    /// Create a test dashboard file
    pub async fn create_test_dashboard_file(&self, owner_id: &Uuid) -> Result<DashboardFile> {
        let dashboard_id = Uuid::new_v4();
        let content = DashboardYml {
            name: "Test Dashboard".to_string(),
            description: Some("Test dashboard description".to_string()),
            rows: Vec::new(),
        };

        let dashboard_file = DashboardFile {
            id: dashboard_id,
            name: format!("Test Dashboard {}", self.test_id),
            file_name: format!("test_dashboard_{}.yml", self.test_id),
            content,
            filter: None,
            organization_id: self.organization_id,
            created_by: *owner_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            version_history: VersionHistory(std::collections::HashMap::new()),
            public_password: None,
            workspace_sharing: WorkspaceSharing::None,
            workspace_sharing_enabled_by: None,
            workspace_sharing_enabled_at: None,
        };

        Ok(dashboard_file)
    }

    /// Create an asset permission for a file
    pub async fn create_asset_permission(
        &self,
        asset_id: &Uuid,
        asset_type: AssetType,
        identity_id: &Uuid,
        role: AssetPermissionRole,
    ) -> Result<AssetPermission> {
        let permission = AssetPermission {
            identity_id: *identity_id,
            identity_type: IdentityType::User,
            asset_id: *asset_id,
            asset_type,
            role,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            created_by: self.user_id,
            updated_by: self.user_id,
        };

        Ok(permission)
    }
}

/// Insert a test asset permission
pub async fn insert_test_permission(
    permission: &AssetPermission,
) -> Result<()> {
    use crate::schema::asset_permissions;
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    diesel::insert_into(asset_permissions::table)
        .values(permission)
        .on_conflict((
            asset_permissions::identity_id,
            asset_permissions::asset_id,
            asset_permissions::asset_type,
            asset_permissions::identity_type,
        ))
        .do_update()
        .set((
            asset_permissions::role.eq(permission.role),
            asset_permissions::updated_at.eq(permission.updated_at),
            asset_permissions::updated_by.eq(permission.updated_by),
            asset_permissions::deleted_at.eq::<Option<chrono::DateTime<Utc>>>(None), // Ensure not deleted on update
        ))
        .execute(&mut conn)
        .await?;

    Ok(())
}

/// Insert a test metric file
pub async fn insert_test_metric_file(
    metric_file: &MetricFile,
) -> Result<()> {
    use crate::schema::metric_files;
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    diesel::insert_into(metric_files::table)
        .values(metric_file)
        .execute(&mut conn)
        .await?;

    Ok(())
}

/// Insert a test dashboard file
pub async fn insert_test_dashboard_file(
    dashboard_file: &DashboardFile,
) -> Result<()> {
    use crate::schema::dashboard_files;
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    diesel::insert_into(dashboard_files::table)
        .values(dashboard_file)
        .execute(&mut conn)
        .await?;

    Ok(())
}

/// Helper function to create default chart config
fn create_default_chart_config() -> ChartConfig {
    ChartConfig::Bar(BarLineChartConfig {
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
            color_by: None,
        },
        bar_layout: None,
        bar_sort_by: None,
        bar_group_type: None,
        bar_show_total_at_top: None,
        line_group_type: None,
    })
}

/// Clean up test data
pub async fn cleanup_test_data(
    asset_ids: &[Uuid],
) -> Result<()> {
    use crate::schema::{asset_permissions, dashboard_files, metric_files};
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    // Delete any asset permissions for the test assets
    diesel::delete(asset_permissions::table)
        .filter(asset_permissions::asset_id.eq_any(asset_ids))
        .execute(&mut conn)
        .await?;

    // Delete test metric files
    diesel::delete(metric_files::table)
        .filter(metric_files::id.eq_any(asset_ids))
        .execute(&mut conn)
        .await?;

    // Delete test dashboard files
    diesel::delete(dashboard_files::table)
        .filter(dashboard_files::id.eq_any(asset_ids))
        .execute(&mut conn)
        .await?;

    Ok(())
}
