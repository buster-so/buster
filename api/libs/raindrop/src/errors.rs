use thiserror::Error;
use reqwest::header::InvalidHeaderValue;

/// Custom error types for the Raindrop SDK.
#[derive(Error, Debug)]
pub enum RaindropError {
    #[error("Missing Raindrop API Write Key. Set the RAINDROP_WRITE_KEY environment variable.")]
    MissingApiKey,

    #[error("Invalid header value provided: {0}")]
    InvalidHeaderValue(#[from] InvalidHeaderValue),

    #[error("Failed to build HTTP client: {0}")]
    HttpClientBuildError(#[from] reqwest::Error),

    #[error("HTTP request failed: {0}")]
    RequestError(reqwest::Error),

    #[error("Raindrop API error: {status} - {body}")]
    ApiError {
        status: reqwest::StatusCode,
        body: String,
    },

    #[error("Failed to serialize request body: {0}")]
    SerializationError(#[from] serde_json::Error),
} 