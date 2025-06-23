use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::dashboard_files::fetch_dashboard_file_with_permission,
    schema::dashboard_files::dsl,
    pool::get_pg_pool,
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
use tracing::{error, info};
use uuid::Uuid;

/// Request for updating sharing permissions for a dashboard
#[derive(Debug, Serialize, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// Request for updating sharing settings for a dashboard
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateDashboardSharingRequest {
    /// List of users to share with
    pub users: Option<Vec<ShareRecipient>>,
    /// Whether the dashboard should be publicly accessible
    pub publicly_accessible: Option<bool>,
    /// Password for public access
    #[serde(default)]
    pub public_password: UpdateField<String>,
    /// Expiration date for public access
    #[serde(default)]
    pub public_expiry_date: UpdateField<DateTime<Utc>>,
}

/// Updates sharing permissions for a dashboard
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `user` - The authenticated user requesting the update
/// * `request` - The request object containing sharing settings
///
/// # Returns
///
/// Result indicating success or failure with error details
pub async fn update_dashboard_sharing_handler(
    dashboard_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateDashboardSharingRequest,
) -> Result<()> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        "Updating dashboard sharing permissions"
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

    // Process user sharing permissions if provided
    if let Some(users) = &request.users {
        for recipient in users {
            // Validate email format
            if !recipient.email.contains('@') {
                error!("Invalid email format: {}", recipient.email);
                return Err(anyhow!("Invalid email format: {}", recipient.email));
            }

            // Update (or create if not exists) the permission using create_share_by_email
            // The create_share_by_email function handles both creation and updates with upsert
            match create_share_by_email(
                &recipient.email, 
                *dashboard_id, 
                AssetType::DashboardFile, 
                recipient.role, 
                user.id
            ).await {
                Ok(_) => {
                    info!(
                        dashboard_id = %dashboard_id,
                        email = %recipient.email,
                        role = ?recipient.role,
                        "Updated sharing permission successfully"
                    );
                }
                Err(e) => {
                    error!(
                        dashboard_id = %dashboard_id,
                        email = %recipient.email,
                        "Failed to update sharing: {}", e
                    );
                    return Err(anyhow!("Failed to update sharing for email {}: {}", recipient.email, e));
                }
            }
        }
    }

    // Update public access settings
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    // Load current dashboard data for updates
    let dashboard = dashboard_with_permission.dashboard_file;
    
    // Create update values with current values as defaults
    let mut publicly_accessible = dashboard.publicly_accessible;
    let mut publicly_enabled_by = dashboard.publicly_enabled_by;
    let mut public_password = dashboard.public_password;
    let mut public_expiry_date = dashboard.public_expiry_date;
    let mut update_needed = false;
    
    // Update publicly_accessible if provided
    if let Some(value) = request.publicly_accessible {
        info!(
            dashboard_id = %dashboard_id,
            "Updating public accessibility for dashboard to {}",
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
                dashboard_id = %dashboard_id,
                "Setting public password for dashboard"
            );
            public_password = Some(password);
            update_needed = true;
        }
        UpdateField::SetNull => {
            info!(
                dashboard_id = %dashboard_id,
                "Removing public password for dashboard"
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
                dashboard_id = %dashboard_id,
                "Setting public expiry date for dashboard"
            );
            public_expiry_date = Some(date);
            update_needed = true;
        }
        UpdateField::SetNull => {
            info!(
                dashboard_id = %dashboard_id,
                "Removing public expiry date for dashboard"
            );
            public_expiry_date = None;
            update_needed = true;
        }
        UpdateField::NoChange => {}
    }
    
    // Execute the update if any changes were made
    if update_needed {
        diesel::update(dsl::dashboard_files)
            .filter(dsl::id.eq(dashboard_id))
            .set((
                dsl::publicly_accessible.eq(publicly_accessible),
                dsl::publicly_enabled_by.eq(publicly_enabled_by),
                dsl::public_password.eq(public_password),
                dsl::public_expiry_date.eq(public_expiry_date),
            ))
            .execute(&mut conn)
            .await?;
    }
    
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user.id,
        "Successfully updated dashboard sharing permissions"
    );

    Ok(())
}

#[cfg(test)]
mod tests {

    #[tokio::test]
    async fn test_update_dashboard_sharing_invalid_email() {
        // This is a placeholder test that would need to be properly implemented
        // with mocked dependencies
        assert!(true);
    }
    
    #[tokio::test]
    async fn test_update_dashboard_sharing_dashboard_not_found() {
        // This is a placeholder test that would need to be properly implemented
        // with mocked dependencies
        assert!(true);
    }
}