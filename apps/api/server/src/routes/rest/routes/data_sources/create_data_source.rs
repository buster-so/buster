use anyhow::Result;
use axum::{http::StatusCode, Extension, Json};
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;
use handlers::data_sources::{create_data_source_handler, CreateDataSourceRequest, CreateDataSourceResponse};

pub async fn create_data_source(
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<CreateDataSourceRequest>,
) -> Result<ApiResponse<CreateDataSourceResponse>, (StatusCode, &'static str)> {
    match create_data_source_handler(&user, payload).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error creating data source: {:?}", e);
            let error_msg = e.to_string();
            
            if error_msg.contains("already exists") {
                return Err((StatusCode::CONFLICT, "Data source already exists"));
            } else if error_msg.contains("permissions") {
                return Err((StatusCode::FORBIDDEN, "Insufficient permissions"));
            } else {
                return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to create data source"));
            }
        }
    }
}