//! Error handling middleware with Sentry integration
//!
//! This module provides middleware for error tracking and logging with Sentry

use std::fmt::Display;
use anyhow::Error;
use axum::extract::Request;
use sentry::protocol::{Event, Level};
use tower::ServiceBuilder;
use tracing::{error, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use secrets::get_secret_sync_or_default;

/// Creates a Sentry layer for the Axum application
///
/// This function configures Sentry error tracking for an Axum application.
/// It adds two layers:
/// 1. NewSentryLayer - Creates a new Sentry hub for each request
/// 2. SentryHttpLayer - Automatically creates transactions for HTTP requests
///
/// # Returns
/// A ServiceBuilder with the Sentry layers configured
pub fn sentry_layer() -> ServiceBuilder<tower::layer::util::Stack<
    sentry_tower::SentryHttpLayer,
    tower::layer::util::Stack<
        sentry_tower::SentryLayer<sentry_tower::NewFromTopProvider, std::sync::Arc<sentry::Hub>, axum::extract::Request>,
        tower::layer::util::Identity
    >
>> {
    ServiceBuilder::new()
        .layer(sentry_tower::NewSentryLayer::<Request>::new_from_top())
        .layer(sentry_tower::SentryHttpLayer::with_transaction())
}

/// Initializes the Sentry client with proper configuration
///
/// # Arguments
/// * `dsn` - The Sentry DSN (Data Source Name)
///
/// # Returns
/// A Sentry client guard that keeps the client alive
pub fn init_sentry(dsn: &str) -> Option<sentry::ClientInitGuard> {
    let environment = get_secret_sync_or_default("ENVIRONMENT", "development");
    let is_development = environment == "development";

    if is_development {
        return None;
    }

    let options = sentry::ClientOptions {
        release: sentry::release_name!(),
        environment: Some(environment.into()),
        traces_sample_rate: 1.0,
        attach_stacktrace: true,
        default_integrations: true,
        ..Default::default()
    };

    Some(sentry::init((dsn, options)))
}

/// Determines if Sentry should be enabled based on the environment
///
/// # Returns
/// true if Sentry should be enabled, false otherwise
pub fn is_sentry_enabled() -> bool {
    let environment = get_secret_sync_or_default("ENVIRONMENT", "development");
    environment != "development"
}

/// Initializes the tracing subscriber with optional Sentry integration
///
/// This function creates a tracing subscriber and conditionally adds Sentry integration
/// based on the environment.
///
/// # Arguments
/// * `env_filter` - The environment filter to use
///
/// # Returns
/// Unit, after initializing the global subscriber
pub fn init_tracing_subscriber(env_filter: EnvFilter) {
    // Create a base registry
    let registry = tracing_subscriber::registry()
        .with(env_filter)
        .with(tracing_subscriber::fmt::layer());
    
    if is_sentry_enabled() {
        // Add Sentry layer if Sentry is enabled
        registry.with(sentry_tracing::layer()).init();
    } else {
        // Otherwise just initialize the registry as is
        registry.init();
    }
}

/// Report an error to Sentry and also log it with tracing
///
/// This function should be used when you want to both log an error and report it to Sentry.
/// It accepts any error type that implements Display + Send + Sync + 'static.
///
/// # Arguments
/// * `err` - The error to report
/// * `msg` - Optional additional context message
///
/// # Examples
/// ```
/// use middleware::error::report_error;
///
/// if let Err(e) = some_operation() {
///     report_error(e, Some("Failed during important operation"));
///     return some_fallback();
/// }
/// ```
pub fn report_error<E>(err: E, msg: Option<&str>) 
where
    E: Display + Send + Sync + 'static
{
    let error_msg = if let Some(context) = msg {
        format!("{}: {}", context, err)
    } else {
        format!("{}", err)
    };
    
    // Log the error with tracing
    error!("{}", error_msg);
    
    // Report to Sentry
    sentry::capture_event(Event {
        message: Some(error_msg),
        level: Level::Error,
        ..Default::default()
    });
}

/// Report a warning to Sentry and also log it with tracing
///
/// Similar to report_error but for warning level events
///
/// # Arguments
/// * `warning` - The warning message
/// * `context` - Optional additional context
pub fn report_warning(warning: &str, context: Option<&str>) {
    let warning_msg = if let Some(ctx) = context {
        format!("{}: {}", ctx, warning)
    } else {
        warning.to_string()
    };
    
    // Log the warning with tracing
    warn!("{}", warning_msg);
    
    // Report to Sentry
    sentry::capture_event(Event {
        message: Some(warning_msg),
        level: Level::Warning,
        ..Default::default()
    });
}

/// Capture an anyhow::Error and report it to Sentry
///
/// This function is particularly useful for handling anyhow errors,
/// which are commonly used in the codebase.
///
/// # Arguments
/// * `err` - The anyhow error to report
/// * `msg` - Optional additional context message
pub fn capture_anyhow(err: &Error, msg: Option<&str>) {
    // Extract the error chain for better context
    let mut err_msg = if let Some(context) = msg {
        format!("{}: {}", context, err)
    } else {
        format!("{}", err)
    };
    
    // Add the error chain for better context
    let mut source = err.source();
    while let Some(err) = source {
        err_msg.push_str(&format!("\nCaused by: {}", err));
        source = err.source();
    }
    
    // Log the error with tracing
    error!("{}", err_msg);
    
    // Capture the full error chain in Sentry
    sentry::capture_event(Event {
        message: Some(err_msg),
        level: Level::Error,
        ..Default::default()
    });
}

// Define a custom error type for authentication/authorization issues
// #[derive(Debug)]
// pub enum AuthError {
//     Unauthorized,
//     PaymentRequired,
//     InternalError(String),
// }

// Implement IntoResponse for AuthError to convert it into an HTTP response
// impl IntoResponse for AuthError {
//     fn into_response(self) -> Response {
//         let (status, error_message) = match self {
//             AuthError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
//             AuthError::PaymentRequired => {
//                 (StatusCode::PAYMENT_REQUIRED, "Payment Required".to_string())
//             }
//             AuthError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
//         };
// 
//         let body = Json(json!({ "error": error_message }));
// 
//         (status, body).into_response()
//     }
// } 