use axum::{
    http::StatusCode,
    Extension, Json,
};
use handlers::dashboards::{create_dashboard_handler, BusterDashboardResponse};
use middleware::AuthenticatedUser;


/// Create a new dashboard
///
/// This endpoint creates a new dashboard for the authenticated user.
pub async fn create_dashboard_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<BusterDashboardResponse>, (StatusCode, String)> {
    // Call the handler
    match create_dashboard_handler(&user).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => {
            tracing::error!("Failed to create dashboard: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error creating dashboard: {}", e),
            ))
        }
    }
}