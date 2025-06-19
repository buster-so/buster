use axum::{
    Extension,
    Json,
};
use handlers::dashboards::{
    delete_dashboards_handler, 
    DeleteDashboardsRequest, 
    DeleteDashboardsResponse
};
use middleware::AuthenticatedUser;
use axum::http::StatusCode;


pub async fn delete_dashboards_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<DeleteDashboardsRequest>,
) -> Result<Json<DeleteDashboardsResponse>, (StatusCode, String)> {
    tracing::info!(
        "Processing DELETE request for {} dashboards, user_id: {}",
        request.ids.len(),
        user.id
    );
    
    match delete_dashboards_handler(request, &user).await {
        Ok(response) => {
            tracing::info!(
                "Successfully deleted {}/{} dashboards, user_id: {}",
                response.deleted_count,
                response.deleted_count + response.failed_ids.len(),
                user.id
            );
            
            // Return a 200 status regardless of partial failures
            // The response body contains detailed information about successes and failures
            Ok(Json(response))
        },
        Err(e) => {
            tracing::error!("Failed to delete dashboards: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete dashboards: {}", e)))
        }
    }
}