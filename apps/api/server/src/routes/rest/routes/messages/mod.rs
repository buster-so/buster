use axum::{
    routing::{delete, put},
    Router,
};

mod delete_message;
mod update_message;

use delete_message::delete_message_rest_handler;
use update_message::update_message_rest_handler;

/// Create a router for message-related endpoints
pub fn router() -> Router {
    Router::new()
        // Delete a message and all subsequent messages in the same chat
        .route("/:id", delete(delete_message_rest_handler))
        // Update a message
        .route("/:id", put(update_message_rest_handler))
}