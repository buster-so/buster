use axum::{
    routing::{get, post, put},
    Router,
};

mod assets;
mod favorites;
mod get_user;
mod get_user_by_id;
mod invite_users;
mod update_user;

pub fn router() -> Router {
    Router::new().route("/", get(get_user::get_user)).merge(
        Router::new()
            .route("/:user_id", put(update_user::update_user))
            .route("/:user_id", get(get_user_by_id::get_user_by_id))
            .nest("/:user_id", assets::router())
            .nest("/favorites", favorites::router())
            .route("/invite", post(invite_users::invite_users)),
    )
}
