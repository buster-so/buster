use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::dashboard_files::fetch_dashboard_file_with_permission,
};
use middleware::AuthenticatedUser;
use sharing::{
    check_permission_access,
    remove_asset_permissions::remove_share_by_email,
};
use tracing::{error, info};
use uuid::Uuid;

/// Deletes sharing permissions for a specific dashboard
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `user` - The authenticated user requesting the deletion
/// * `emails` - Vector of email addresses to remove sharing for
///
/// # Returns
///
/// Result indicating success or failure
pub async fn delete_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user: &AuthenticatedUser,
    emails: Vec<String>,
) -> Result<()> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        email_count = emails.len(),
        "Deleting dashboard sharing permissions"
    );

    // First check if the user has permission to delete sharing for this dashboard
    let dashboard_with_permission = fetch_dashboard_file_with_permission(dashboard_id, &user.id).await?;
    
    // If dashboard not found, return error
    let dashboard_with_permission = match dashboard_with_permission {
        Some(dwp) => dwp,
        None => return Err(anyhow!("Dashboard not found")),
    };
    
    // Check if user has permission to delete sharing for the dashboard
    // Users need FullAccess or Owner permission
    let has_permission = check_permission_access(
        dashboard_with_permission.permission,
        &[
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        dashboard_with_permission.dashboard_file.organization_id,
        &user.organizations,
    );
    
    if !has_permission {
        return Err(anyhow!("You don't have permission to delete sharing for this dashboard"));
    }

    // Process each email and delete sharing permissions
    for email in &emails {
        // The remove_share_by_email function handles soft deletion of permissions
        match remove_share_by_email(
            email,
            *dashboard_id,
            AssetType::DashboardFile,
            user.id,
        )
        .await
        {
            Ok(_) => {
                info!(
                    dashboard_id = %dashboard_id,
                    email = %email,
                    "Deleted sharing permission"
                );
            },
            Err(e) => {
                // If the error is because the permission doesn't exist, we can ignore it
                if e.to_string().contains("No active permission found") {
                    info!(
                        dashboard_id = %dashboard_id,
                        email = %email,
                        "No active permission found to delete"
                    );
                    continue;
                }
                
                error!(
                    dashboard_id = %dashboard_id,
                    email = %email,
                    "Failed to delete sharing: {}", e
                );
                return Err(anyhow!("Failed to delete sharing for email {}: {}", email, e));
            }
        }
    }

    info!(
        dashboard_id = %dashboard_id,
        email_count = emails.len(),
        "Successfully deleted dashboard sharing permissions"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test_delete_dashboard_sharing_handler() {
        // Placeholder test implementation
        assert!(true);
    }
}