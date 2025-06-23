use crate::routes::rest::ApiResponse;
use axum::extract::{Path, Query};
use axum::http::StatusCode;
use axum::Extension;
use handlers::metrics::get_metric_data_handler::{GetMetricDataRequest, MetricDataResponse};
use middleware::AuthenticatedUser;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct GetMetricDataParams {
    pub version_number: Option<i32>,
    pub limit: Option<i64>,
    pub password: Option<String>,
}

pub async fn get_metric_data_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(metric_id): Path<Uuid>,
    Query(params): Query<GetMetricDataParams>,
) -> Result<ApiResponse<MetricDataResponse>, (StatusCode, String)> {
    tracing::info!(
        "Processing GET request for metric data with ID: {}",
        metric_id
    );

    let request = GetMetricDataRequest {
        metric_id,
        version_number: params.version_number,
        limit: params.limit,
        password: params.password,
    };

    match handlers::metrics::get_metric_data_handler(request, user).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            let error_message = e.to_string();
            tracing::error!("Error getting metric data: {}", error_message);
            
            // Check for specific password-related errors
            if error_message.contains("Incorrect password") || error_message.contains("public_password required") {
                Err((StatusCode::IM_A_TEAPOT, error_message))
            } else if error_message.contains("don't have permission") || error_message.contains("not found") || error_message.contains("expired") {
                // Handle permission, not found, or expired errors with 403 Forbidden
                Err((StatusCode::FORBIDDEN, error_message))
            } else {
                // Default to 500 for other errors
                Err((StatusCode::INTERNAL_SERVER_ERROR, error_message))
            }
        }
    }
}
