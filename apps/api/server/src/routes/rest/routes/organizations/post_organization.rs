use axum::{http::StatusCode, Json, Extension};
use handlers::organizations::post_organization_handler;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};

use crate::routes::rest::ApiResponse;

#[derive(Deserialize, Serialize)]
pub struct PostOrganizationRequest {
    name: String,
}

/// REST endpoint to create a new organization.
pub async fn post_organization(
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<PostOrganizationRequest>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    post_organization_handler(payload.name, user)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create organization: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to create organization",
            )
        })?;

    Ok(ApiResponse::NoContent)
}
