use axum::{extract::Path, http::StatusCode, Extension, Json};
use handlers::metrics::{
    delete_metric_handler, delete_metrics_handler, DeleteMetricsRequest, DeleteMetricsResponse,
};
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Handler for deleting a single metric by ID (via path parameter)
pub async fn delete_metric_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing DELETE request for metric with ID: {}, user_id: {}",
        id,
        user.id
    );

    match delete_metric_handler(&id, &user).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error deleting metric: {}", e);
            if e.to_string().contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Metric not found"));
            }
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to delete metric"))
        }
    }
}

/// Handler for bulk deleting multiple metrics (via request body)
pub async fn delete_metrics_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<DeleteMetricsRequest>,
) -> Result<ApiResponse<DeleteMetricsResponse>, (StatusCode, String)> {
    tracing::info!(
        "Processing bulk DELETE request for {} metrics, user_id: {}",
        request.ids.len(),
        user.id
    );

    match delete_metrics_handler(request, &user).await {
        Ok(response) => {
            // Return 204 No Content if all deletions were successful and there were IDs to delete
            if response.failed_ids.is_empty() && !response.successful_ids.is_empty() {
                return Ok(ApiResponse::NoContent);
            }

            // Return 207 Multi-Status if there were mixed results
            if !response.failed_ids.is_empty() {
                return Ok(ApiResponse::JsonData(response));
            }

            // Return 200 OK for other cases (like empty list)
            Ok(ApiResponse::JsonData(response))
        }
        Err(e) => {
            tracing::error!("Error in bulk metric deletion: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete metrics: {}", e),
            ))
        }
    }
}
