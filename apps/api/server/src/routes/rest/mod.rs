use axum::{
    body::Body,
    http::{Response, StatusCode},
    middleware as axum_middleware,
    response::IntoResponse,
    Json, Router,
};

use middleware::auth;

mod routes;

pub fn router() -> Router {
    Router::new().nest("/", routes::router())
}

pub enum ApiResponse<T> {
    OK,
    #[allow(dead_code)]
    Created,
    NoContent,
    JsonData(T),
}

impl<T> IntoResponse for ApiResponse<T>
where
    T: serde::Serialize,
{
    fn into_response(self) -> Response<Body> {
        match self {
            Self::OK => (StatusCode::OK).into_response(),
            Self::Created => (StatusCode::CREATED).into_response(),
            Self::JsonData(data) => (StatusCode::OK, Json(data)).into_response(),
            Self::NoContent => (StatusCode::NO_CONTENT).into_response(),
        }
    }
}
