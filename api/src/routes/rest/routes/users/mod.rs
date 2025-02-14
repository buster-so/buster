use axum::{
    middleware,
    routing::{get, put},
    Router,
};

use crate::buster_middleware::auth::auth;

mod assets;
mod get_user;
mod get_user_by_id;
mod update_user;

pub fn router() -> Router {
    Router::new()
        .route("/", get(get_user::get_user))
        .merge(
            Router::new()
                .route("/:user_id", put(update_user::update_user))
                .route("/:user_id", get(get_user_by_id::get_user_by_id))
                .nest("/:user_id", assets::router())
                .route_layer(middleware::from_fn(auth))
        )
}
