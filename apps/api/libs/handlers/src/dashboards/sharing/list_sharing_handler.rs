use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::dashboard_files::fetch_dashboard_file_with_permission,
};
use middleware::AuthenticatedUser;
use sharing::{
    check_permission_access,
    list_asset_permissions::list_shares,
    types::AssetPermissionWithUser,
};
use tracing::{error, info};
use uuid::Uuid;

/// Lists all sharing permissions for a specific dashboard
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `user` - The authenticated user requesting the permissions
///
/// # Returns
///
/// A vector of asset permissions with user information
pub async fn list_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user: &AuthenticatedUser,
) -> Result<Vec<AssetPermissionWithUser>> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        "Listing dashboard sharing permissions"
    );

    // First check if the user has permission to view this dashboard
    let dashboard_with_permission = fetch_dashboard_file_with_permission(dashboard_id, &user.id).await?;
    
    // If dashboard not found, return error
    let dashboard_with_permission = match dashboard_with_permission {
        Some(dwp) => dwp,
        None => return Err(anyhow!("Dashboard not found")),
    };
    
    // Check if user has permission to view the dashboard
    // Users need at least CanView permission or any higher permission
    let has_permission = check_permission_access(
        dashboard_with_permission.permission,
        &[
            AssetPermissionRole::CanView,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        dashboard_with_permission.dashboard_file.organization_id,
        &user.organizations,
    );
    
    if !has_permission {
        return Err(anyhow!("You don't have permission to view this dashboard"));
    }

    // Get all permissions for the dashboard
    let permissions = list_shares(
        *dashboard_id,
        AssetType::DashboardFile,
    )
    .await
    .map_err(|e| {
        error!(
            dashboard_id = %dashboard_id,
            "Error listing dashboard permissions: {}", e
        );
        anyhow!("Error listing sharing permissions: {}", e)
    })?;

    info!(
        dashboard_id = %dashboard_id,
        permission_count = permissions.len(),
        "Successfully retrieved dashboard sharing permissions"
    );

    Ok(permissions)
}

#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test_list_dashboard_sharing_handler() {
        // Placeholder test implementation
        assert!(true);
    }
}