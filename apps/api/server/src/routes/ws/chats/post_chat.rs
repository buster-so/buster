use anyhow::Result;
use handlers::chats::post_chat_handler::ChatCreateNewChat;
use handlers::chats::post_chat_handler::{self, ThreadEvent};
use middleware::AuthenticatedUser;
use tokio::sync::mpsc;

use crate::routes::ws::{
        chats::chats_router::{ChatEvent as WSThreadEvent, ChatsRoute},
        ws::{WsEvent, WsResponseMessage, WsSendMethod, WsErrorCode},
        ws_router::WsRoutes,
        ws_utils::{send_ws_message, send_error_message},
    };

/// Creates a new thread for a user and processes their request using the shared handler
///
/// This handler supports:
/// - Optional prompts when an asset is provided
/// - Generic asset references (asset_id and asset_type)
/// - Legacy specific asset fields (metric_id, dashboard_id) for backward compatibility
/// - Streaming of results for all flows, including auto-generated messages for prompt-less requests
pub async fn post_thread(
    user: &AuthenticatedUser,
    request: ChatCreateNewChat,
) -> Result<()> {
    // Validate request parameters
    // When asset_id is provided, asset_type must also be provided
    if request.asset_id.is_some() && request.asset_type.is_none() {
        return send_error_message(
            &user.id.to_string(),
            WsRoutes::Chats(ChatsRoute::Post),
            WsEvent::Threads(WSThreadEvent::PostThread),
            WsErrorCode::BadRequest,
            "asset_type must be provided when asset_id is specified".to_string(),
            user,
        ).await;
    }

    // Create channel for streaming results
    let (tx, mut rx) = mpsc::channel(1000);

    let user_id = user.id.to_string();
    let user_clone = user.clone();

    // Spawn task to process streaming results
    tokio::spawn(async move {
        while let Some(result) = rx.recv().await {
            match result {
                Ok((container, event)) => {
                    let event = match event {
                        ThreadEvent::GeneratingResponseMessage => {
                            WsEvent::Threads(WSThreadEvent::GeneratingResponseMessage)
                        }
                        ThreadEvent::GeneratingReasoningMessage => {
                            WsEvent::Threads(WSThreadEvent::GeneratingReasoningMessage)
                        }
                        ThreadEvent::GeneratingTitle => {
                            WsEvent::Threads(WSThreadEvent::GeneratingTitle)
                        }
                        ThreadEvent::InitializeChat => {
                            WsEvent::Threads(WSThreadEvent::InitializeChat)
                        }
                        ThreadEvent::Completed => {
                            WsEvent::Threads(WSThreadEvent::Complete)
                        }
                    };

                    let response = WsResponseMessage::new_no_user(
                        WsRoutes::Chats(ChatsRoute::Post),
                        event,
                        &container,
                        None,
                        WsSendMethod::All,
                    );

                    if let Err(e) = send_ws_message(&user_id, &response).await {
                        tracing::error!("Failed to send websocket message: {}", e);
                        break;
                    }
                }
                Err(err) => {
                    tracing::error!("Error in message stream: {:?}", err);
                    
                    // Send error message to client
                    if let Err(e) = send_error_message(
                        &user_id,
                        WsRoutes::Chats(ChatsRoute::Post),
                        WsEvent::Threads(WSThreadEvent::PostThread),
                        WsErrorCode::InternalServerError,
                        format!("Error processing thread: {}", err),
                        &user_clone,
                    ).await {
                        tracing::error!("Failed to send error message: {}", e);
                    }
                    
                    break;
                }
            }
        }

        Ok::<(), anyhow::Error>(())
    });

    // Call shared handler with channel for streaming messages
    match post_chat_handler::post_chat_handler(request, user.clone(), Some(tx)).await {
        Ok(chat_with_messages) => {
            // The spawned task above already handles forwarding the 'Complete' event
            // received from the handler. Sending it again here is redundant.
            // The final chat state is implicitly sent when the handler sends
            // its BusterContainer::Chat with the Completed event.
            Ok(())
        }
        Err(e) => {
            send_error_message(
                &user.id.to_string(),
                WsRoutes::Chats(ChatsRoute::Post),
                WsEvent::Threads(WSThreadEvent::PostThread),
                WsErrorCode::InternalServerError,
                format!("Error creating thread: {}", e),
                user,
            ).await
        }
    }
}