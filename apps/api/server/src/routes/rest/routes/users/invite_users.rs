use anyhow::Result;
use axum::{Extension, Json};
use handlers::users::invite_user_handler;

use crate::routes::rest::ApiResponse;
use axum::http::StatusCode;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::error;

#[derive(Deserialize)]
pub struct InviteUsersRequest {
    pub emails: Vec<String>,
}

pub async fn invite_users(
    Extension(user): Extension<AuthenticatedUser>,
    Json(body): Json<InviteUsersRequest>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    let result = invite_user_handler(&user, body.emails).await;

    match result {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            error!("Failed to invite users: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to process invitation request",
            ))
        }
    }
}
