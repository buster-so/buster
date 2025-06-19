use anyhow::Result;
use axum::{extract::Path, Extension};
use middleware::types::AuthenticatedUser;
use uuid::Uuid;

use handlers::data_sources::{get_data_source_handler, GetDataSourceRequest, DataSourceResponse};

use crate::routes::rest::ApiResponse;

pub async fn get_data_source(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<ApiResponse<DataSourceResponse>, (axum::http::StatusCode, &'static str)> {
    // Convert string id to UUID
    let uuid = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return Err((
                axum::http::StatusCode::BAD_REQUEST,
                "Invalid UUID format",
            ))
        }
    };

    let request = GetDataSourceRequest { id: uuid };

    match get_data_source_handler(request, &user).await {
        Ok(data_source) => Ok(ApiResponse::JsonData(data_source)),
        Err(e) => {
            tracing::error!("Error getting data source: {:?}", e);
            if e.to_string().contains("not found") {
                Err((axum::http::StatusCode::NOT_FOUND, "Data source not found"))
            } else if e.to_string().contains("permissions") {
                Err((axum::http::StatusCode::FORBIDDEN, "Not authorized to access this data source"))
            } else if e.to_string().contains("not a member of any organization") {
                Err((axum::http::StatusCode::BAD_REQUEST, "User is not a member of any organization"))
            } else {
                Err((
                    axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to get data source",
                ))
            }
        }
    }
}