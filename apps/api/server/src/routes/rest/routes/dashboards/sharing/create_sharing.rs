use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use database::enums::AssetPermissionRole;
use handlers::dashboards::sharing::create_dashboard_sharing_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// REST handler for creating dashboard sharing permissions
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the dashboard
/// * `request` - Vector of recipients to grant access to
///
/// # Returns
///
/// A success message on success, or an appropriate error response
pub async fn create_dashboard_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<ShareRecipient>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        dashboard_id = %id,
        user_id = %user.id,
        recipient_count = request.len(),
        "Processing POST request for dashboard sharing"
    );

    // Convert request to the format expected by the handler
    let emails_and_roles: Vec<(String, AssetPermissionRole)> = request
        .into_iter()
        .map(|recipient| (recipient.email, recipient.role))
        .collect();

    match create_dashboard_sharing_handler(&id, &user, emails_and_roles).await {
        Ok(_) => Ok(ApiResponse::JsonData("Sharing permissions created successfully".to_string())),
        Err(e) => {
            tracing::error!("Error creating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create sharing permissions: {}", e)))
        }
    }
}