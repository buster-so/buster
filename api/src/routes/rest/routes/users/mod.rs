use axum::{
    routing::{get, put},
    Router,
};

mod get_user;
mod get_user_by_id;
mod update_user;

pub fn router() -> Router {
    Router::new()
        .route("/", get(get_user::get_user))
        .route("/:id", put(update_user::update_user))
        .route("/:id", get(get_user_by_id::get_user_by_id))
}
