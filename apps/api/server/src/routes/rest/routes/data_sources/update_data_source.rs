use anyhow::Result;
use axum::{extract::Path, http::StatusCode, Extension, Json};
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;
use handlers::data_sources::{update_data_source_handler, UpdateDataSourceRequest};

pub async fn update_data_source(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateDataSourceRequest>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match update_data_source_handler(&user, &id, payload).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error updating data source: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to update data source",
            ))
        }
    }
}
