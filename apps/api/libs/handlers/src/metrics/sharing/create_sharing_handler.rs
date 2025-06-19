use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::metric_files::fetch_metric_file_with_permissions,
    pool::get_pg_pool,
};
use middleware::AuthenticatedUser;
use sharing::{check_permission_access, create_asset_permission::create_share_by_email};
use tracing::info;
use uuid::Uuid;

/// Handler to create sharing permissions for a metric
///
/// # Arguments
/// * `metric_id` - The UUID of the metric to create sharing permissions for
/// * `user_id` - The UUID of the user making the request
/// * `emails_and_roles` - List of tuples containing (email, role) pairs
///
/// # Returns
/// * `Result<()>` - Success if all sharing permissions were created
pub async fn create_metric_sharing_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    emails_and_roles: Vec<(String, AssetPermissionRole)>,
) -> Result<()> {
    info!(
        metric_id = %metric_id,
        user_id = %user.id,
        recipients_count = emails_and_roles.len(),
        "Creating sharing permissions for metric"
    );

    // 1. Fetch metric file with permission
    let metric_file_with_permission = fetch_metric_file_with_permissions(metric_id, &user.id)
        .await
        .map_err(|e| anyhow!("Failed to fetch metric file with permissions: {}", e))?;

    let metric_file = if let Some(metric_file) = metric_file_with_permission {
        metric_file
    } else {
        return Err(anyhow!("Metric file not found"));
    };

    // 2. Check if user has at least FullAccess permission
    if !check_permission_access(
        metric_file.permission,
        &[AssetPermissionRole::FullAccess, AssetPermissionRole::Owner],
        metric_file.metric_file.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!("You don't have permission to share this metric"));
    }

    // 3. Process each email-role pair and create sharing permissions
    for (email, role) in emails_and_roles {
        // Validate email format
        if !email.contains('@') {
            return Err(anyhow!("Invalid email format: {}", email));
        }

        // Create or update the permission using create_share_by_email
        match create_share_by_email(&email, *metric_id, AssetType::MetricFile, role, user.id).await
        {
            Ok(_) => {
                info!(
                    "Created sharing permission for email: {} with role: {:?} on metric: {}",
                    email, role, metric_id
                );
            }
            Err(e) => {
                return Err(anyhow!(
                    "Failed to create sharing for email {}: {}",
                    email,
                    e
                ));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {

    // Note: For comprehensive tests, we would need to set up proper mocks
    // for external dependencies like fetch_metric_file_with_permissions,
    // check_permission_access, and create_share_by_email. This would typically
    // involve using a mocking framework that's compatible with async functions.
}
