use axum::{
    extract::{Extension, Path},
    http::StatusCode,
};
use handlers::chats::sharing::list_chat_sharing_handler;
use middleware::AuthenticatedUser;
use serde::Serialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Serialize)]
pub struct SharingPermission {
    pub user_id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub role: database::enums::AssetPermissionRole,
}

/// REST handler for listing chat sharing permissions
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the chat
///
/// # Returns
///
/// A JSON response containing all sharing permissions for the chat
pub async fn list_chat_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<Vec<SharingPermission>>, (StatusCode, String)> {
    info!(
        chat_id = %id,
        user_id = %user.id,
        "Processing GET request for chat sharing permissions"
    );

    match list_chat_sharing_handler(&id, &user).await {
        Ok(permissions) => {
            let response = permissions
                .into_iter()
                .map(|p| SharingPermission {
                    user_id: p.user.as_ref().map(|u| u.id).unwrap_or_default(),
                    email: p.user.as_ref().map(|u| u.email.clone()).unwrap_or_default(),
                    name: p.user.as_ref().and_then(|u| u.name.clone()),
                    avatar_url: p.user.as_ref().and_then(|u| u.avatar_url.clone()),
                    role: p.permission.role,
                })
                .collect();
            Ok(ApiResponse::JsonData(response))
        }
        Err(e) => {
            tracing::error!("Error listing chat sharing permissions: {}", e);
            if e.to_string().contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Chat not found: {}", e)));
            } else if e.to_string().contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Permission denied: {}", e)));
            } else {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to list sharing permissions: {}", e),
                ));
            }
        }
    }
}
