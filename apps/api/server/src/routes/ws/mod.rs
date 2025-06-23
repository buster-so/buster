mod chats;
pub mod ws;
pub mod ws_router;
pub mod ws_utils;

use axum::{routing::get, Router};

pub fn router() -> Router {
    Router::new().route("/", get(ws::ws))
}
