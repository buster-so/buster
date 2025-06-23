use anyhow::Result;
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetType, Verification};
use database::models::{Chat, Collection, DashboardFile, MetricFile};
use database::schema::{chats, collections, dashboard_files, metric_files};
use database::types::metric_yml::{
    BarAndLineAxis, BarLineChartConfig, BaseChartConfig, ChartConfig,
};
use database::types::{DashboardYml, MetricYml, VersionHistory};
use diesel_async::RunQueryDsl;
use indexmap;
use std::collections::HashMap;
use uuid::Uuid;

use crate::common::db::TestDb;
use crate::common::permissions::PermissionTestHelpers;

/// Helper functions for creating and managing test assets
pub struct AssetTestHelpers;

impl AssetTestHelpers {
    /// Creates a test metric file
    pub async fn create_test_metric(test_db: &TestDb, name: &str) -> Result<MetricFile> {
        let mut conn = test_db.diesel_conn().await?;
        let metric_id = Uuid::new_v4();

        // Create a simple metric content
        let content = MetricYml {
            name: name.to_string(),
            description: Some(format!("Test metric description for {}", name)),
            sql: "SELECT * FROM test".to_string(),
            time_frame: "last 30 days".to_string(),
            chart_config: create_default_chart_config(),
            dataset_ids: Vec::new(),
        };

        let metric_file = MetricFile {
            id: metric_id,
            name: format!("{}-{}", test_db.test_id, name),
            file_name: format!(
                "{}-{}.yml",
                test_db.test_id,
                name.to_lowercase().replace(" ", "_")
            ),
            content,
            verification: Verification::Verified,
            evaluation_obj: None,
            evaluation_summary: None,
            evaluation_score: None,
            organization_id: test_db.organization_id,
            created_by: test_db.user_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
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

    /// Creates a test dashboard file
    pub async fn create_test_dashboard(test_db: &TestDb, name: &str) -> Result<DashboardFile> {
        let mut conn = test_db.diesel_conn().await?;
        let dashboard_id = Uuid::new_v4();

        // Create a simple dashboard content
        let content = DashboardYml {
            name: name.to_string(),
            description: Some(format!("Test dashboard description for {}", name)),
            rows: Vec::new(),
        };

        let dashboard_file = DashboardFile {
            id: dashboard_id,
            name: format!("{}-{}", test_db.test_id, name),
            file_name: format!(
                "{}-{}.yml",
                test_db.test_id,
                name.to_lowercase().replace(" ", "_")
            ),
            content,
            filter: None,
            organization_id: test_db.organization_id,
            created_by: test_db.user_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            version_history: VersionHistory(HashMap::new()),
            public_password: None,
        };

        diesel::insert_into(dashboard_files::table)
            .values(&dashboard_file)
            .execute(&mut conn)
            .await?;

        Ok(dashboard_file)
    }

    /// Creates a test collection
    pub async fn create_test_collection(test_db: &TestDb, name: &str) -> Result<Collection> {
        let mut conn = test_db.diesel_conn().await?;
        let collection_id = Uuid::new_v4();

        let collection = Collection {
            id: collection_id,
            name: format!("{}-{}", test_db.test_id, name),
            description: Some(format!("Test collection description for {}", name)),
            created_by: test_db.user_id,
            updated_by: test_db.user_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            organization_id: test_db.organization_id,
        };

        diesel::insert_into(collections::table)
            .values(&collection)
            .execute(&mut conn)
            .await?;

        Ok(collection)
    }

    /// Creates a test chat
    pub async fn create_test_chat(test_db: &TestDb, title: &str) -> Result<Chat> {
        let mut conn = test_db.diesel_conn().await?;
        let chat_id = Uuid::new_v4();

        let chat = Chat {
            id: chat_id,
            title: format!("{}-{}", test_db.test_id, title),
            organization_id: test_db.organization_id,
            created_by: test_db.user_id,
            updated_by: test_db.user_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
            most_recent_file_id: None,
            most_recent_file_type: None,
            most_recent_version_number: None,
        };

        diesel::insert_into(chats::table)
            .values(&chat)
            .execute(&mut conn)
            .await?;

        Ok(chat)
    }

    /// Creates a test metric with owner permission
    pub async fn create_test_metric_with_permission(
        test_db: &TestDb,
        name: &str,
        user_id: Uuid,
        role: AssetPermissionRole,
    ) -> Result<MetricFile> {
        let metric = Self::create_test_metric(test_db, name).await?;

        // Add permission
        PermissionTestHelpers::create_user_permission(
            test_db,
            metric.id,
            AssetType::MetricFile,
            user_id,
            role,
        )
        .await?;

        Ok(metric)
    }

    /// Creates a test dashboard with owner permission
    pub async fn create_test_dashboard_with_permission(
        test_db: &TestDb,
        name: &str,
        user_id: Uuid,
        role: AssetPermissionRole,
    ) -> Result<DashboardFile> {
        let dashboard = Self::create_test_dashboard(test_db, name).await?;

        // Add permission
        PermissionTestHelpers::create_user_permission(
            test_db,
            dashboard.id,
            AssetType::DashboardFile,
            user_id,
            role,
        )
        .await?;

        Ok(dashboard)
    }

    /// Creates a test collection with owner permission
    pub async fn create_test_collection_with_permission(
        test_db: &TestDb,
        name: &str,
        user_id: Uuid,
        role: AssetPermissionRole,
    ) -> Result<Collection> {
        let collection = Self::create_test_collection(test_db, name).await?;

        // Add permission
        PermissionTestHelpers::create_user_permission(
            test_db,
            collection.id,
            AssetType::Collection,
            user_id,
            role,
        )
        .await?;

        Ok(collection)
    }

    /// Creates a test chat with owner permission
    pub async fn create_test_chat_with_permission(
        test_db: &TestDb,
        title: &str,
        user_id: Uuid,
        role: AssetPermissionRole,
    ) -> Result<Chat> {
        let chat = Self::create_test_chat(test_db, title).await?;

        // Add permission
        PermissionTestHelpers::create_user_permission(
            test_db,
            chat.id,
            AssetType::Chat,
            user_id,
            role,
        )
        .await?;

        Ok(chat)
    }
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
        },
        bar_layout: None,
        bar_sort_by: None,
        bar_group_type: None,
        bar_show_total_at_top: None,
        line_group_type: None,
    })
}
