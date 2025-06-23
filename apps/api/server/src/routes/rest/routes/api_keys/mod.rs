pub mod delete_api_key;
pub mod get_api_key;
pub mod list_api_keys;
pub mod post_api_key;
pub mod validate_api_key;

use axum::{
    middleware as axum_middleware,
    routing::{delete, get, post},
    Router,
};


use middleware::auth;

use self::{
    delete_api_key::delete_api_key, get_api_key::get_api_key, list_api_keys::list_api_keys,
    post_api_key::post_api_key, validate_api_key::validate_api_key,
};

pub fn router() -> Router {
    Router::new()
        .route("/validate", post(validate_api_key))
        .merge(
            Router::new()
                .route("/", post(post_api_key))
                .route("/", get(list_api_keys))
                .route("/:api_key_id", get(get_api_key))
                .route("/:api_key_id", delete(delete_api_key))
                .route_layer(axum_middleware::from_fn(auth)),
        )
}
