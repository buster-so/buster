use axum::{Extension, Json};
use axum::http::StatusCode;
use handlers::metrics::{bulk_update_metrics_handler, BulkUpdateMetricsRequest, BulkUpdateMetricsResponse};
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;

/// REST handler for bulk updating metric statuses
///
/// This endpoint allows clients to update the verification status of multiple metrics
/// in a single API call, with support for batched concurrent processing.
///
/// # Path
/// `PUT /metrics`
///
/// # Request Body
/// A JSON object containing:
/// - `updates` - Array of metric status updates (ID and verification status)
/// - `batch_size` - Optional batch size for concurrent processing (defaults to 50)
///
/// # Response
/// On success: 200 OK with a JSON object containing:
/// - `updated_metrics` - Array of successfully updated metrics
/// - `failed_updates` - Array of failed updates with error details
/// - `total_processed` - Total count of metrics processed
/// - `success_count` - Count of successful updates
/// - `failure_count` - Count of failed updates
///
/// On error: Appropriate status code with error message
pub async fn bulk_update_metrics_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<BulkUpdateMetricsRequest>,
) -> Result<ApiResponse<BulkUpdateMetricsResponse>, (StatusCode, &'static str)> {
    // Validate batch size - REMOVED as batch_size is no longer in the request
    // if request.batch_size > 100 {
    //     return Err((
    //         StatusCode::BAD_REQUEST,
    //         "Batch size cannot exceed 100",
    //     ));
    // }

    // Validate request (using `request` directly as it's the Vec)
    if request.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Updates list cannot be empty",
        ));
    }

    if request.len() > 1000 {
        return Err((
            StatusCode::BAD_REQUEST,
            "Cannot process more than 1000 updates in a single request",
        ));
    }

    tracing::info!(
        "Processing bulk update request for {} metrics from user {}",
        request.len(), // Use request.len() directly
        user.id
    );

    // Process the bulk update - Pass None for batch_size, handler will use default
    match bulk_update_metrics_handler(request, None, &user).await {
        Ok(response) => {
            tracing::info!(
                "Bulk update processed. Success: {}, Failed: {}",
                response.success_count,
                response.failure_count
            );
            Ok(ApiResponse::JsonData(response))
        }
        Err(e) => {
            tracing::error!("Error processing bulk update: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to process bulk update"))
        }
    }
}