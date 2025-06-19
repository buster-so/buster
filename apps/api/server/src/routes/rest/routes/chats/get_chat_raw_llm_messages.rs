use crate::routes::rest::ApiResponse;
use axum::{extract::Path, http::StatusCode, Extension};
use handlers::chats::get_raw_llm_messages_handler::{
    get_raw_llm_messages_handler, GetRawLlmMessagesResponse,
};
use middleware::AuthenticatedUser;
use uuid::Uuid;

pub async fn get_chat_raw_llm_messages(
    Extension(user): Extension<AuthenticatedUser>,
    Path(chat_id): Path<Uuid>,
) -> Result<ApiResponse<GetRawLlmMessagesResponse>, (StatusCode, &'static str)> {
    let organization_id = match user.organizations.get(0) {
        Some(organization) => organization.id,
        _ => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to get organization id",
            ));
        }
    };

    match get_raw_llm_messages_handler(chat_id, organization_id).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            // Log the error for debugging and monitoring
            tracing::error!("Failed to get raw LLM messages: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to get raw LLM messages",
            ))
        }
    }
}
