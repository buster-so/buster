use axum::{
    extract::Path,
    Extension,
    Json,
    http::StatusCode,
};
use handlers::dashboards::{update_dashboard_handler, DashboardUpdateRequest, BusterDashboardResponse};
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Updates a dashboard by ID
/// 
/// PUT /dashboards/:id
pub async fn update_dashboard_rest_handler(
    Path(id): Path<Uuid>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<DashboardUpdateRequest>,
) -> Result<ApiResponse<BusterDashboardResponse>, (StatusCode, String)> {
    tracing::info!(
        "Processing PUT request for dashboard with ID: {}, user_id: {}",
        id,
        user.id
    );
    
    match update_dashboard_handler(id, request, &user).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Failed to update dashboard: {}", e);
            
            let error_message = e.to_string();
            
            // Return 404 if not found or unauthorized
            if error_message.contains("not found") || error_message.contains("unauthorized") {
                return Err((StatusCode::NOT_FOUND, format!("Dashboard {} not found or unauthorized", id)));
            }
            
            // Return 403 if user doesn't have permission
            if error_message.contains("does not have permission") {
                return Err((StatusCode::FORBIDDEN, "You do not have permission to update this dashboard".to_string()));
            }
            
            // Generic error
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update dashboard: {}", e)))
        }
    }
}