use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Extension,
};
use handlers::metrics::{get_metric_handler, BusterMetric};
use serde::Deserialize;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct GetMetricQueryParams {
    #[serde(rename = "version_number")]
    pub version_number: Option<i32>,
    /// Optional password for accessing public password-protected metrics
    pub password: Option<String>,
}

pub async fn get_metric_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Query(params): Query<GetMetricQueryParams>,
) -> Result<ApiResponse<BusterMetric>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing GET request for metric with ID: {}, user_id: {}, version_number: {:?}",
        id,
        user.id,
        params.version_number
    );

    let metric = match get_metric_handler(&id, &user, params.version_number, params.password).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting metric: {}", e);
            let error_message = e.to_string();
            
            // Simple string matching for common error cases
            // Check for password required error
            if error_message.contains("public_password required") {
                tracing::info!("Password required error detected: {}", error_message);
                return Err((StatusCode::IM_A_TEAPOT, "Password required for public access"));
            }
            if error_message.contains("don't have permission") {
                return Err((StatusCode::FORBIDDEN, "Permission denied"));
            }
            if error_message.contains("Version") && error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Version not found"));
            }
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Metric not found"));
            }
            
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get metric"));
        }
    };

    Ok(ApiResponse::JsonData(metric))
}

