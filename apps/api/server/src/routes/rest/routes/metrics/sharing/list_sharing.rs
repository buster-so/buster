use axum::{extract::Path, http::StatusCode, Extension};
use handlers::metrics::sharing::list_metric_sharing_handler;
use middleware::AuthenticatedUser;
use serde::Serialize;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Response type for sharing permissions
#[derive(Debug, Serialize)]
pub struct SharingResponse {
    pub permissions: Vec<SharingPermission>,
}

/// Single sharing permission entry
#[derive(Debug, Serialize)]
pub struct SharingPermission {
    pub user_id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub role: database::enums::AssetPermissionRole,
}

/// REST handler for listing sharing permissions for a metric
pub async fn list_metric_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<Vec<SharingPermission>>, (StatusCode, String)> {
    tracing::info!(
        "Processing GET request for metric sharing with ID: {}, user_id: {}",
        id,
        user.id
    );

    match list_metric_sharing_handler(&id, &user).await {
        Ok(permissions) => {
            let response = permissions
                .into_iter()
                .map(|p| SharingPermission {
                    user_id: p.user.as_ref().map(|u| u.id).unwrap_or_default(),
                    email: p.user.as_ref().map(|u| u.email.clone()).unwrap_or_default(),
                    name: p.user.as_ref().and_then(|u| u.name.clone()),
                    avatar_url: p.user.as_ref().and_then(|u| u.avatar_url.clone()),
                    role: p.permission.role,
                })
                .collect();
            Ok(ApiResponse::JsonData(response))
        }
        Err(e) => {
            tracing::error!("Error listing sharing permissions: {}", e);
            let error_message = e.to_string();

            // Return appropriate status code based on error message
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Metric not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Permission denied: {}", e)));
            } else {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to list sharing permissions: {}", e),
                ));
            }
        }
    }
}
