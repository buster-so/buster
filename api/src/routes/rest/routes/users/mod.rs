use axum::{
    routing::{get, put},
    Router,
};

mod assets;
mod get_user;
mod get_user_by_id;
mod update_user;

pub fn router() -> Router {
    Router::new()
        .route("/", get(get_user::get_user))
        .route("/:user_id", put(update_user::update_user))
        .route("/:user_id", get(get_user_by_id::get_user_by_id))
        .nest("/:user_id", assets::router())
}
