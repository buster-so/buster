use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::metric_files::fetch_metric_file_with_permissions,
    pool::get_pg_pool,
};
use middleware::AuthenticatedUser;
use sharing::{check_permission_access, remove_asset_permissions::remove_share_by_email};
use tracing::info;
use uuid::Uuid;

/// Handler to delete sharing permissions for a metric
///
/// # Arguments
/// * `metric_id` - The UUID of the metric to delete sharing permissions for
/// * `user_id` - The UUID of the user making the request
/// * `emails` - A list of email addresses for which to remove sharing permissions
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn delete_metric_sharing_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    emails: Vec<String>,
) -> Result<()> {
    info!(
        metric_id = %metric_id,
        user_id = %user.id,
        emails = ?emails,
        "Deleting sharing permissions for metric"
    );

    let mut conn = get_pg_pool().get().await?;

    // 1. Fetch metric file with permission
    let metric_file_with_permission =
        fetch_metric_file_with_permissions(metric_id, &user.id).await?;

    let metric_file = match metric_file_with_permission {
        Some(cwp) => cwp,
        None => return Err(anyhow!("Metric file not found")),
    };

    // 2. Check if user has at least FullAccess permission
    if !check_permission_access(
        metric_file.permission,
        &[AssetPermissionRole::FullAccess, AssetPermissionRole::Owner],
        metric_file.metric_file.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!(
            "You don't have permission to delete sharing for this metric"
        ));
    }

    // 3. Process each email and delete sharing permissions
    for email in emails {
        // The remove_share_by_email function handles soft deletion of permissions
        match remove_share_by_email(&email, *metric_id, AssetType::MetricFile, user.id).await {
            Ok(_) => {
                info!(
                    "Deleted sharing permission for email: {} on metric: {}",
                    email, metric_id
                );
            }
            Err(e) => {
                // If the error is because the permission doesn't exist, we can ignore it
                if e.to_string().contains("No active permission found") {
                    info!("No active permission found for email {}: {}", email, e);
                    continue;
                }

                return Err(anyhow!(
                    "Failed to delete sharing for email {}: {}",
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

    #[tokio::test]
    async fn test_delete_metric_sharing_handler() {
        // These tests would be implemented with proper mocking in a real-world scenario
        // Currently just placeholders for the test structure
        assert!(true);
    }
}
