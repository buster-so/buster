use axum::{
    routing::{get, post, put, delete},
    Router,
};

mod delete_chats;
mod duplicate_chat;
mod get_chat;
mod get_chat_raw_llm_messages;
mod list_chats;
mod post_chat;
mod restore_chat;
mod sharing;
mod update_chat;
mod update_chats;

pub use delete_chats::delete_chats_route;
pub use duplicate_chat::duplicate_chat_route;
pub use get_chat::get_chat_route;
pub use get_chat_raw_llm_messages::get_chat_raw_llm_messages;
pub use list_chats::list_chats_route;
pub use post_chat::post_chat_route;
pub use restore_chat::restore_chat_route;
pub use update_chat::update_chat_route;
pub use update_chats::update_chats_route;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_chats_route))
        .route("/", post(post_chat_route))
        .route("/", put(update_chats_route))
        .route("/", delete(delete_chats_route))
        .route("/duplicate", post(duplicate_chat_route))
        .route("/:id", get(get_chat_route))
        .route("/:id", put(update_chat_route))
        .route("/:id/restore", put(restore_chat_route))
        .route("/:id/raw_llm_messages", get(get_chat_raw_llm_messages))
        .nest("/:id/sharing", sharing::router())
}
