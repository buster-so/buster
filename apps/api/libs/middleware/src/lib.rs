//! Middleware Library
//!
//! This library provides common middleware components for the Buster web server,
//! including authentication and CORS handling.

pub mod auth;
pub mod cors;
pub mod types;
pub mod error;

// Re-export commonly used types
pub use auth::auth;
pub use cors::cors;
pub use error::{
    sentry_layer, 
    init_sentry,
    is_sentry_enabled,
    init_tracing_subscriber,
    report_error,
    report_warning,
    capture_anyhow
};
pub use types::{AuthenticatedUser, OrganizationMembership, TeamMembership};
