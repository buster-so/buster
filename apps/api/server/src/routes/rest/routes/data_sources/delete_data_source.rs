use axum::{extract::Path, http::StatusCode, Extension};
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;
use handlers::data_sources::delete_data_source_handler;

pub async fn delete_data_source(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    // Convert string id to UUID
    let uuid = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return Err((StatusCode::BAD_REQUEST, "Invalid UUID format"));
        }
    };

    match delete_data_source_handler(&user, &uuid).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error deleting data source: {:?}", e);
            let error_msg = e.to_string();
            
            if error_msg.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Data source not found"));
            } else if error_msg.contains("permissions") {
                return Err((StatusCode::FORBIDDEN, "Insufficient permissions"));
            } else {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to delete data source",
                ));
            }
        }
    }
}