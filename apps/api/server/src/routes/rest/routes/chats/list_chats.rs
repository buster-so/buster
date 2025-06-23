use axum::{extract::Query, http::StatusCode, Extension};
use handlers::chats::list_chats_handler::{
    list_chats_handler, ChatListItem, ListChatsRequest,
};
use middleware::AuthenticatedUser;
use serde::Deserialize;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct ListChatsQuery {
    pub page: Option<i32>,
    #[serde(default = "default_page_size")]
    pub page_size: i32,
    #[serde(default)]
    pub admin_view: bool,
}

fn default_page_size() -> i32 {
    20 // Default to 20 items per page
}

pub async fn list_chats_route(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListChatsQuery>,
) -> Result<ApiResponse<Vec<ChatListItem>>, (StatusCode, &'static str)> {
    let request = ListChatsRequest {
        page: query.page,
        page_size: query.page_size,
        admin_view: query.admin_view,
    };

    match list_chats_handler(request, &user).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error listing chats: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to list chats"))
        }
    }
}
