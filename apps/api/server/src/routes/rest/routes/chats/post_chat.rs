use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use axum::Json;
use database::enums::AssetType;
use handlers::chats::post_chat_handler;
use handlers::chats::post_chat_handler::ChatCreateNewChat;
use handlers::chats::types::ChatWithMessages;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize, Clone)]
pub struct ChatCreateNewChatRequest {
    pub prompt: Option<String>,  // Now optional
    pub chat_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
    pub asset_id: Option<Uuid>,
    pub asset_type: Option<AssetType>,
    // Backward compatibility fields (optional)
    pub metric_id: Option<Uuid>,
    pub dashboard_id: Option<Uuid>,
}

impl From<ChatCreateNewChatRequest> for ChatCreateNewChat {
    fn from(request: ChatCreateNewChatRequest) -> Self {
        // Check for backward compatibility
        let asset_id = if request.asset_id.is_some() {
            request.asset_id
        } else if request.metric_id.is_some() {
            request.metric_id
        } else if request.dashboard_id.is_some() {
            request.dashboard_id
        } else {
            None
        };
        
        let asset_type = if request.asset_type.is_some() {
            request.asset_type
        } else if request.metric_id.is_some() {
            Some(AssetType::MetricFile)
        } else if request.dashboard_id.is_some() {
            Some(AssetType::DashboardFile)
        } else {
            None
        };
        
        Self {
            prompt: request.prompt,
            chat_id: request.chat_id,
            message_id: request.message_id,
            asset_id,
            asset_type,
            metric_id: request.metric_id,
            dashboard_id: request.dashboard_id,
        }
    }
}

pub async fn post_chat_route(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<ChatCreateNewChatRequest>,
) -> Result<ApiResponse<ChatWithMessages>, (StatusCode, &'static str)> {
    // Convert REST request to handler request
    let handler_request: ChatCreateNewChat = request.into();
    
    // Validate parameters
    if handler_request.asset_id.is_some() && handler_request.asset_type.is_none() {
        tracing::error!("asset_type must be provided when asset_id is specified");
        return Err((
            StatusCode::BAD_REQUEST,
            "asset_type must be provided when asset_id is specified",
        ));
    }
    
    // Call handler
    match post_chat_handler(handler_request, user, None).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error processing chat: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to process chat"))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_request_conversion_new_fields() {
        let test_uuid = Uuid::new_v4();
        let request = ChatCreateNewChatRequest {
            prompt: None,
            chat_id: None,
            message_id: None,
            asset_id: Some(test_uuid),
            asset_type: Some(AssetType::MetricFile),
            metric_id: None,
            dashboard_id: None,
        };

        let handler_request: ChatCreateNewChat = request.into();

        assert_eq!(handler_request.prompt, None);
        assert_eq!(handler_request.asset_id, Some(test_uuid));
        assert_eq!(handler_request.asset_type, Some(AssetType::MetricFile));
        assert_eq!(handler_request.metric_id, None);
        assert_eq!(handler_request.dashboard_id, None);
    }

    #[test]
    fn test_request_conversion_legacy_metric() {
        let test_uuid = Uuid::new_v4();
        let request = ChatCreateNewChatRequest {
            prompt: Some("Test prompt".to_string()),
            chat_id: None,
            message_id: None,
            asset_id: None,
            asset_type: None,
            metric_id: Some(test_uuid),
            dashboard_id: None,
        };

        let handler_request: ChatCreateNewChat = request.into();

        assert_eq!(handler_request.prompt, Some("Test prompt".to_string()));
        assert_eq!(handler_request.asset_id, Some(test_uuid));
        assert_eq!(handler_request.asset_type, Some(AssetType::MetricFile));
        assert_eq!(handler_request.metric_id, Some(test_uuid));
        assert_eq!(handler_request.dashboard_id, None);
    }

    #[test]
    fn test_request_conversion_legacy_dashboard() {
        let test_uuid = Uuid::new_v4();
        let request = ChatCreateNewChatRequest {
            prompt: Some("Test prompt".to_string()),
            chat_id: None,
            message_id: None,
            asset_id: None,
            asset_type: None,
            metric_id: None,
            dashboard_id: Some(test_uuid),
        };

        let handler_request: ChatCreateNewChat = request.into();

        assert_eq!(handler_request.prompt, Some("Test prompt".to_string()));
        assert_eq!(handler_request.asset_id, Some(test_uuid));
        assert_eq!(handler_request.asset_type, Some(AssetType::DashboardFile));
        assert_eq!(handler_request.metric_id, None);
        assert_eq!(handler_request.dashboard_id, Some(test_uuid));
    }

    #[test]
    fn test_request_conversion_mixed_priority() {
        // When both new and legacy fields are present, new fields take priority
        let asset_uuid = Uuid::new_v4();
        let metric_uuid = Uuid::new_v4();
        let request = ChatCreateNewChatRequest {
            prompt: Some("Test prompt".to_string()),
            chat_id: None,
            message_id: None,
            asset_id: Some(asset_uuid),
            asset_type: Some(AssetType::DashboardFile),
            metric_id: Some(metric_uuid),
            dashboard_id: None,
        };

        let handler_request: ChatCreateNewChat = request.into();

        assert_eq!(handler_request.asset_id, Some(asset_uuid));
        assert_eq!(handler_request.asset_type, Some(AssetType::DashboardFile));
        assert_eq!(handler_request.metric_id, Some(metric_uuid));
        assert_eq!(handler_request.dashboard_id, None);
    }

    #[test]
    fn test_request_conversion_all_none() {
        let request = ChatCreateNewChatRequest {
            prompt: None,
            chat_id: None,
            message_id: None,
            asset_id: None,
            asset_type: None,
            metric_id: None,
            dashboard_id: None,
        };

        let handler_request: ChatCreateNewChat = request.into();

        assert_eq!(handler_request.prompt, None);
        assert_eq!(handler_request.asset_id, None);
        assert_eq!(handler_request.asset_type, None);
        assert_eq!(handler_request.metric_id, None);
        assert_eq!(handler_request.dashboard_id, None);
    }
}
