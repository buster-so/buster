#![doc = "A Rust SDK for interacting with the Raindrop.ai API."]

pub mod errors;
pub mod types;

use anyhow::Context;
use reqwest::{Client, header};
use secrets::get_secret_sync;
use tracing::{debug, error, instrument};

use errors::RaindropError;
use types::{Event, Signal};

const DEFAULT_BASE_URL: &str = "https://api.raindrop.ai/v1";

/// Client for interacting with the Raindrop API.
#[derive(Debug, Clone)]
pub struct RaindropClient {
    client: Client,
    base_url: String,
    write_key: String,
}

impl RaindropClient {
    /// Creates a new RaindropClient.
    /// Reads the write key from the `RAINDROP_WRITE_KEY` environment variable.
    /// Uses the default Raindrop API base URL.
    pub fn new() -> Result<Self, RaindropError> {
        let write_key = get_secret_sync("RAINDROP_WRITE_KEY")
            .map_err(|_| RaindropError::MissingApiKey)?;
        let base_url = DEFAULT_BASE_URL.to_string();
        Self::build_client(write_key, base_url)
    }

    /// Creates a new RaindropClient with a specific write key and base URL.
    /// Useful for testing or custom deployments.
    pub fn with_key_and_url(write_key: String, base_url: &str) -> Result<Self, RaindropError> {
        Self::build_client(write_key, base_url.to_string())
    }

    /// Builds the underlying reqwest client.
    fn build_client(write_key: String, base_url: String) -> Result<Self, RaindropError> {
         let mut headers = header::HeaderMap::new();
        headers.insert(
            header::AUTHORIZATION,
            header::HeaderValue::from_str(&format!("Bearer {}", write_key))
                .map_err(RaindropError::InvalidHeaderValue)?,
        );
        headers.insert(
            header::CONTENT_TYPE,
            header::HeaderValue::from_static("application/json"),
        );

        let client = Client::builder()
            .default_headers(headers)
            .build()
            .map_err(RaindropError::HttpClientBuildError)?;

        Ok(Self {
            client,
            base_url,
            write_key,
        })
    }

    /// Tracks a batch of events.
    #[instrument(skip(self, events), fields(count = events.len()))]
    pub async fn track_events(&self, events: Vec<Event>) -> Result<(), RaindropError> {
        if events.is_empty() {
            debug!("No events to track, skipping API call.");
            return Ok(());
        }
        let url = format!("{}/events/track", self.base_url);
        self.post_data(&url, &events).await
    }

    /// Tracks a batch of signals.
    #[instrument(skip(self, signals), fields(count = signals.len()))]
    pub async fn track_signals(&self, signals: Vec<Signal>) -> Result<(), RaindropError> {
        if signals.is_empty() {
            debug!("No signals to track, skipping API call.");
            return Ok(());
        }
        let url = format!("{}/signals/track", self.base_url);
        self.post_data(&url, &signals).await
    }

    /// Helper function to POST JSON data to a specified URL.
    async fn post_data<T: serde::Serialize>(
        &self,
        url: &str,
        data: &T,
    ) -> Result<(), RaindropError> {
        debug!(url = url, "Sending POST request to Raindrop");

        let response = self
            .client
            .post(url)
            .json(data)
            .send()
            .await
            .map_err(RaindropError::RequestError)?;

        let status = response.status();
        if status.is_success() {
            debug!(url = url, status = %status, "Raindrop API call successful");
            Ok(())
        } else {
            let body = response.text().await.unwrap_or_else(|_| "Failed to read error body".to_string());
            error!(url = url, status = %status, body = body, "Raindrop API call failed");
            Err(RaindropError::ApiError { status, body })
        }
    }
} 