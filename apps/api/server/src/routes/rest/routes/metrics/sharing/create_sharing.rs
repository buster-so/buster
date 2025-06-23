use axum::{
    extract::{Json, Path},
    http::StatusCode,
    Extension,
};
use database::enums::AssetPermissionRole;
use handlers::metrics::sharing::create_metric_sharing_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Structure for a single share recipient with their role
#[derive(Debug, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// REST handler for creating sharing permissions for a metric
pub async fn create_metric_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<ShareRecipient>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    tracing::info!(
        "Processing POST request for metric sharing with ID: {}, user_id: {}",
        id,
        user.id
    );

    let emails_and_roles: Vec<(String, AssetPermissionRole)> = request
        .into_iter()
        .map(|recipient| (recipient.email, recipient.role))
        .collect();

    match create_metric_sharing_handler(&id, &user, emails_and_roles).await {
        Ok(_) => Ok(ApiResponse::JsonData(
            "Sharing permissions created successfully".to_string(),
        )),
        Err(e) => {
            tracing::error!("Error creating sharing permissions: {}", e);

            // Map specific errors to appropriate status codes
            let error_message = e.to_string();

            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Metric not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((
                    StatusCode::FORBIDDEN,
                    format!("Insufficient permissions: {}", e),
                ));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }

            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create sharing permissions: {}", e),
            ))
        }
    }
}
