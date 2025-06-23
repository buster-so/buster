use anyhow::Result;
use chrono::Utc;
use database::pool::get_pg_pool;
use database::schema::dashboard_files;
use database::types::dashboard_yml::DashboardYml;
use database::types::VersionHistory;
use diesel::{insert_into, ExpressionMethods};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde_json::Value;
use uuid::Uuid;

use crate::metrics::Version;
use super::{BusterDashboard, BusterDashboardResponse, DashboardConfig};
use database::organization::get_user_organization_id;
use database::enums::{AssetPermissionRole, AssetType, IdentityType, Verification};
use database::schema::asset_permissions;
use std::collections::HashMap;

pub async fn create_dashboard_handler(user: &AuthenticatedUser) -> Result<BusterDashboardResponse> {
    let mut conn = get_pg_pool().get().await?;

    // Create a default dashboard YAML
    let dashboard_yml = DashboardYml {
        name: "Untitled Dashboard".to_string(),
        description: None,
        rows: vec![],
    };

    // Convert to YAML string for the file field
    let yaml_content = serde_yaml::to_string(&dashboard_yml)?;

    // Convert to JSON Value for the content field
    let content_value: Value = serde_json::to_value(&dashboard_yml)?;

    // Generate a unique ID and filename
    let dashboard_id = Uuid::new_v4();

    // Get user's organization ID
    let organization_id = match get_user_organization_id(&user.id).await? {
        Some(organization_id) => organization_id,
        None => return Err(anyhow::anyhow!("User does not belong to any organization")),
    };

    // Current timestamp
    let now = Utc::now();

    // Create version history with initial version 1
    let version_history = VersionHistory::new(1, dashboard_yml);

    // Insert the dashboard file
    let dashboard_file = insert_into(dashboard_files::table)
        .values((
            dashboard_files::id.eq(dashboard_id),
            dashboard_files::name.eq("Untitled Dashboard"),
            dashboard_files::file_name.eq("Untitled Dashboard"),
            dashboard_files::content.eq(&content_value),
            dashboard_files::organization_id.eq(organization_id),
            dashboard_files::created_by.eq(user.id),
            dashboard_files::created_at.eq(now),
            dashboard_files::updated_at.eq(now),
            dashboard_files::publicly_accessible.eq(false),
            dashboard_files::version_history.eq(serde_json::to_value(version_history)?),
        ))
        .returning((
            dashboard_files::id,
            dashboard_files::name,
            dashboard_files::file_name,
            dashboard_files::created_by,
            dashboard_files::created_at,
            dashboard_files::updated_at,
        ))
        .get_result::<(
            Uuid,
            String,
            String,
            Uuid,
            chrono::DateTime<chrono::Utc>,
            chrono::DateTime<chrono::Utc>,
        )>(&mut conn)
        .await?;

    // Insert user permission for the dashboard
    insert_into(asset_permissions::table)
        .values((
            asset_permissions::identity_id.eq(user.id),
            asset_permissions::identity_type.eq(IdentityType::User),
            asset_permissions::asset_id.eq(dashboard_id),
            asset_permissions::asset_type.eq(AssetType::DashboardFile),
            asset_permissions::role.eq(AssetPermissionRole::Owner),
            asset_permissions::created_at.eq(now),
            asset_permissions::updated_at.eq(now),
            asset_permissions::created_by.eq(user.id),
            asset_permissions::updated_by.eq(user.id),
        ))
        .execute(&mut conn)
        .await?;

    // Construct the dashboard
    let dashboard = BusterDashboard {
        config: DashboardConfig { rows: vec![] },
        created_at: dashboard_file.4,
        created_by: dashboard_file.3,
        description: None,
        id: dashboard_file.0,
        name: dashboard_file.1,
        updated_at: Some(dashboard_file.5),
        updated_by: dashboard_file.3,
        status: Verification::Verified,
        version_number: 1,
        file: yaml_content,
        file_name: dashboard_file.2,
    };

    // Create initial version details for the response
    let initial_version = Version {
        version_number: 1,
        updated_at: now,
    };

    Ok(BusterDashboardResponse {
        access: AssetPermissionRole::Owner,
        metrics: HashMap::new(),
        dashboard,
        permission: AssetPermissionRole::Owner,
        public_password: None,
        collections: vec![],
        individual_permissions: Some(vec![]),
        publicly_accessible: false,
        public_expiry_date: None,
        public_enabled_by: None,
        versions: vec![initial_version],
    })
}

#[cfg(test)]
mod tests {
    
    

    #[tokio::test]
    async fn test_create_dashboard_handler() {
        // This is just a stub for now - actual implementation would require database mocking
        // For a real test, we would need to mock the database connection
        // and verify the dashboard properties
    }
}
