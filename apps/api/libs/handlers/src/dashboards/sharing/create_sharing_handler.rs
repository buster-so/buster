use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::dashboard_files::fetch_dashboard_file_with_permission,
};
use middleware::AuthenticatedUser;
use sharing::{
    check_permission_access,
    create_asset_permission::create_share_by_email,
};
use tracing::{error, info};
use uuid::Uuid;

/// Creates sharing permissions for a dashboard with specified users
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `user` - The authenticated user creating the permissions
/// * `emails_and_roles` - Vector of email addresses and roles to assign
///
/// # Returns
///
/// Ok(()) on success, or an error if the operation fails
pub async fn create_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user: &AuthenticatedUser,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        recipient_count = emails_and_roles.len(),
        "Creating dashboard sharing permissions"
    );

    // First check if the user has permission to share this dashboard
    let dashboard_with_permission = fetch_dashboard_file_with_permission(dashboard_id, &user.id).await?;
    
    // If dashboard not found, return error
    let dashboard_with_permission = match dashboard_with_permission {
        Some(dwp) => dwp,
        None => return Err(anyhow!("Dashboard not found")),
    };
    
    // Check if user has permission to share the dashboard
    // Users need FullAccess or Owner permission to share
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
        return Err(anyhow!("You don't have permission to share this dashboard"));
    }

    // Process each email and create sharing permissions
    let recipient_count = emails_and_roles.len();
    for (email, role) in emails_and_roles {
        if !email.contains('@') {
            error!("Invalid email format: {}", email);
            return Err(anyhow!("Invalid email format: {}", email));
        }

        // Create or update the permission using create_share_by_email
        match create_share_by_email(
            &email,
            *dashboard_id,
            AssetType::DashboardFile,
            role,
            user.id,
        )
        .await
        {
            Ok(_) => {
                info!("Created sharing permission for email: {} on dashboard: {}", email, dashboard_id);
            },
            Err(e) => {
                error!("Failed to create sharing for email {}: {}", email, e);
                return Err(anyhow!("Failed to create sharing for email {}: {}", email, e));
            }
        }
    }

    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        recipient_count = recipient_count,
        "Successfully created dashboard sharing permissions"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test_create_dashboard_sharing_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true); 
    }
}