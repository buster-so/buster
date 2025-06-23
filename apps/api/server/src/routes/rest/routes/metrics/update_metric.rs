use axum::{
    extract::Path,
    http::StatusCode,
    Extension, Json,
};
use handlers::metrics::{update_metric_handler, BusterMetric, UpdateMetricRequest};
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

pub async fn update_metric_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateMetricRequest>,
) -> Result<ApiResponse<BusterMetric>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing PUT request for metric with ID: {}, user_id: {}",
        id,
        user.id
    );

    let metric = match update_metric_handler(&id, &user, request).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error updating metric: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to update metric"));
        }
    };

    Ok(ApiResponse::JsonData(metric))
}