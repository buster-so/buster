use axum::http::{
    header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    Method,
};
use tower_http::cors::{Any, CorsLayer};

/// Creates a CORS layer with default configuration for the Buster API.
/// 
/// This allows:
/// - GET, POST, PUT, DELETE methods
/// - Any origin
/// - Authorization, Accept, and Content-Type headers
pub fn cors() -> CorsLayer {
    CorsLayer::new()
        .allow_methods(vec![Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_origin(Any)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE])
} 