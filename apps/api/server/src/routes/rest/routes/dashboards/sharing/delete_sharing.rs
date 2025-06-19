use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::dashboards::sharing::delete_dashboard_sharing_handler;
use middleware::AuthenticatedUser;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// REST handler for deleting dashboard sharing permissions
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the dashboard
/// * `request` - Vector of email addresses to remove sharing for
///
/// # Returns
///
/// A success message or an error response
pub async fn delete_dashboard_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<String>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        dashboard_id = %id,
        user_id = %user.id,
        email_count = request.len(),
        "Processing DELETE request for dashboard sharing permissions"
    );

    match delete_dashboard_sharing_handler(&id, &user, request).await {
        Ok(_) => {
            info!(
                dashboard_id = %id,
                user_id = %user.id,
                "Successfully deleted dashboard sharing permissions"
            );
            Ok(ApiResponse::JsonData("Sharing permissions deleted successfully".to_string()))
        }
        Err(e) => {
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete sharing permissions: {}", e)))
        }
    }
}