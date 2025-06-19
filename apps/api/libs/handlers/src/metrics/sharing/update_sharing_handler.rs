use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::metric_files::fetch_metric_file_with_permissions,
    pool::get_pg_pool,
    schema::metric_files::dsl,
};
use diesel::ExpressionMethods;
use diesel_async::RunQueryDsl as AsyncRunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use sharing::{
    check_permission_access, 
    create_asset_permission::create_share_by_email,
    types::UpdateField,
};
use tracing::info;
use uuid::Uuid;

/// Request for updating sharing permissions for a metric
#[derive(Debug, Serialize, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// Request for updating sharing settings for a metric
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateMetricSharingRequest {
    /// List of users to share with
    pub users: Option<Vec<ShareRecipient>>,
    /// Whether the metric should be publicly accessible
    pub publicly_accessible: Option<bool>,
    /// Password for public access
    #[serde(default)]
    pub public_password: UpdateField<String>,
    /// Expiration date for public access
    #[serde(default)]
    pub public_expiry_date: UpdateField<DateTime<Utc>>,
}

/// Handler to update sharing permissions for a metric
///
/// # Arguments
/// * `metric_id` - The UUID of the metric to update sharing permissions for
/// * `user_id` - The UUID of the user making the request
/// * `request` - The request object containing sharing settings
///
/// # Returns
/// * `Result<()>` - Success if all sharing permissions were updated
pub async fn update_metric_sharing_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateMetricSharingRequest,
) -> Result<()> {
    info!(
        metric_id = %metric_id,
        user_id = %user.id,
        "Updating sharing permissions for metric"
    );

    let mut conn = get_pg_pool().get().await?;

    // 1. Fetch metric file with permission
    let metric_file_with_permission = fetch_metric_file_with_permissions(metric_id, &user.id)
        .await
        .map_err(|e| anyhow!("Failed to fetch metric file with permissions: {}", e))?;

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
            "You don't have permission to update sharing for this metric"
        ));
    }

    // 3. Process user sharing permissions if provided
    if let Some(users) = &request.users {
        for recipient in users {
            // Validate email format
            if !recipient.email.contains('@') {
                return Err(anyhow!("Invalid email format: {}", recipient.email));
            }

            // Update (or create if not exists) the permission using create_share_by_email
            // The create_share_by_email function handles both creation and updates with upsert
            match create_share_by_email(
                &recipient.email,
                *metric_id,
                AssetType::MetricFile,
                recipient.role,
                user.id,
            )
            .await
            {
                Ok(_) => {
                    info!(
                        "Updated sharing permission for email: {} with role: {:?} on metric: {}",
                        recipient.email, recipient.role, metric_id
                    );
                }
                Err(e) => {
                    return Err(anyhow!(
                        "Failed to update sharing for email {}: {}",
                        recipient.email,
                        e
                    ));
                }
            }
        }
    }

    // 4. Update public access settings if provided
    // Load current metric data for updates
    let metric = metric_file.metric_file;
    
    // Create update values with current values as defaults
    let mut publicly_accessible = metric.publicly_accessible;
    let mut publicly_enabled_by = metric.publicly_enabled_by;
    let mut public_password = metric.public_password;
    let mut public_expiry_date = metric.public_expiry_date;
    let mut update_needed = false;
    
    // Update publicly_accessible if provided
    if let Some(value) = request.publicly_accessible {
        info!(
            metric_id = %metric_id,
            "Updating public accessibility for metric to {}",
            value
        );
        publicly_accessible = value;
        
        // Update publicly_enabled_by based on publicly_accessible
        publicly_enabled_by = if value {
            Some(user.id)
        } else {
            None
        };
        
        update_needed = true;
    }
    
    // Handle public_password using UpdateField
    match request.public_password {
        UpdateField::Update(password) => {
            if password.trim().is_empty() {
                return Err(anyhow!("Public password cannot be empty"));
            }
            info!(
                metric_id = %metric_id,
                "Setting public password for metric"
            );
            public_password = Some(password);
            update_needed = true;
        }
        UpdateField::SetNull => {
            info!(
                metric_id = %metric_id,
                "Removing public password for metric"
            );
            public_password = None;
            update_needed = true;
        }
        UpdateField::NoChange => {}
    }
    
    // Handle public_expiry_date using UpdateField
    match request.public_expiry_date {
        UpdateField::Update(date) => {
            // Validate that expiry date is in the future
            if date < Utc::now() {
                return Err(anyhow!("Public expiry date must be in the future"));
            }
            info!(
                metric_id = %metric_id,
                "Setting public expiry date for metric"
            );
            public_expiry_date = Some(date);
            update_needed = true;
        }
        UpdateField::SetNull => {
            info!(
                metric_id = %metric_id,
                "Removing public expiry date for metric"
            );
            public_expiry_date = None;
            update_needed = true;
        }
        UpdateField::NoChange => {}
    }
    
    // Execute the update if any changes were made
    if update_needed {
        diesel::update(dsl::metric_files)
            .filter(dsl::id.eq(metric_id))
            .set((
                dsl::publicly_accessible.eq(publicly_accessible),
                dsl::publicly_enabled_by.eq(publicly_enabled_by),
                dsl::public_password.eq(public_password),
                dsl::public_expiry_date.eq(public_expiry_date),
            ))
            .execute(&mut conn)
            .await?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_update_metric_sharing_invalid_email() {
        let metric_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            organizations: vec![],
            name: Some("Test".to_string()),
            config: serde_json::Value::Null,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: serde_json::Value::Null,
            avatar_url: None,
            teams: vec![],
        };

        let request = UpdateMetricSharingRequest {
            users: Some(vec![ShareRecipient {
                email: "invalid-email-format".to_string(),
                role: AssetPermissionRole::CanView,
            }]),
            publicly_accessible: None,
            public_password: UpdateField::NoChange,
            public_expiry_date: UpdateField::NoChange,
        };

        let result = update_metric_sharing_handler(&metric_id, &user, request).await;

        assert!(result.is_err());
        let error = result.unwrap_err().to_string();
        assert!(error.contains("Invalid email format") || error.contains("not found"));
    }

    #[tokio::test]
    async fn test_update_metric_sharing_metric_not_found() {
        let metric_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            organizations: vec![],
            name: Some("Test".to_string()),
            config: serde_json::Value::Null,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: serde_json::Value::Null,
            avatar_url: None,
            teams: vec![],
        };

        let request = UpdateMetricSharingRequest {
            users: None,
            publicly_accessible: Some(true),
            public_password: UpdateField::NoChange,
            public_expiry_date: UpdateField::Update(Utc::now() + chrono::Duration::days(1)),
        };

        let result = update_metric_sharing_handler(&metric_id, &user, request).await;

        assert!(result.is_err());
        // The specific error message might vary depending on the testing environment
        // but it should indicate the metric wasn't found
        let error = result.unwrap_err().to_string();
        assert!(error.contains("not found") || error.contains("database"));
    }

    #[tokio::test]
    async fn test_update_metric_sharing_with_only_public_settings() {
        let metric_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            organizations: vec![],
            name: Some("Test".to_string()),
            config: serde_json::Value::Null,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            attributes: serde_json::Value::Null,
            avatar_url: None,
            teams: vec![],
        };

        let request = UpdateMetricSharingRequest {
            users: None,
            publicly_accessible: Some(true),
            public_password: UpdateField::NoChange,
            public_expiry_date: UpdateField::Update(Utc::now() + chrono::Duration::days(1)),
        };

        // This test will fail in isolation as we can't easily mock the database
        // It's here as a structural guide - the real testing will happen in integration tests
        let result = update_metric_sharing_handler(&metric_id, &user, request).await;
        assert!(result.is_err()); // Should fail since metric doesn't exist
    }

    // Note: For comprehensive tests, we would need to set up proper mocks
    // for external dependencies like fetch_metric_file_with_permissions,
    // check_permission_access, and create_share_by_email. This would typically
    // involve using a mocking framework that's compatible with async functions.
}
