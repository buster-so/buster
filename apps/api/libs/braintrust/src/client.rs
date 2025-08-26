use anyhow::{Result, anyhow};
use reqwest::Client;
use std::sync::Arc;
use tokio::sync::mpsc::{self, Sender};
use tracing::{debug, error};
use secrets::get_secret_sync;
use uuid::Uuid;

use crate::types::{Span, EventPayload, Prompt};
use crate::API_BASE;

/// Environment variable name for Braintrust API key
pub const BRAINTRUST_API_KEY_ENV: &str = "BRAINTRUST_API_KEY";

/// Client to interact with Braintrust API
pub struct BraintrustClient {
    api_key: String,
    project_id: String,
    client: Client,
    log_sender: Sender<Span>, // Channel for background logging
}

impl BraintrustClient {
    /// Create a new Braintrust client
    ///
    /// # Arguments
    /// * `api_key` - Optional Braintrust API key. If None, will look for BRAINTRUST_API_KEY environment variable
    /// * `project_id` - Braintrust project ID
    ///
    /// # Returns
    /// An Arc-wrapped BraintrustClient for thread-safe usage
    ///
    /// # Errors
    /// Returns an error if no API key is provided and the environment variable is not set
    pub fn new(api_key: Option<&str>, project_id: &str) -> Result<Arc<Self>> {
        // Get API key from parameter or environment variable
        let api_key = match api_key {
            Some(key) => key.to_string(),
            None => get_secret_sync(BRAINTRUST_API_KEY_ENV).map_err(|_| {
                anyhow!("Braintrust API key not provided and {} environment variable not set", BRAINTRUST_API_KEY_ENV)
            })?,
        };

        let client = Client::new();
        let (sender, mut receiver) = mpsc::channel::<Span>(100); // Buffer for 100 spans

        // Spawn a background task to handle logging
        let api_key_clone = api_key.clone();
        let project_id_clone = project_id.to_string();
        let client_clone = client.clone();
        tokio::spawn(async move {
            while let Some(span) = receiver.recv().await {
                let url = format!("{}/project_logs/{}/insert", API_BASE, project_id_clone.clone());
                let payload = EventPayload { events: vec![span.clone()] };
                
                debug!("Logging span: {}", span.span_id);
                
                match client_clone
                    .post(&url)
                    .header("Authorization", format!("Bearer {}", api_key_clone))
                    .header("Content-Type", "application/json")
                    .json(&payload)
                    .send()
                    .await
                {
                    Ok(response) => {
                        if !response.status().is_success() {
                            let status = response.status();
                            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                            error!("Failed to log span: HTTP {}, error: {}", status, error_text);
                        } else {
                            debug!("Successfully logged span: {}", span.span_id);
                        }
                    },
                    Err(e) => {
                        error!("Failed to log span: {}", e);
                    }
                }
            }
        });

        Ok(Arc::new(Self {
            api_key,
            project_id: project_id.to_string(),
            client,
            log_sender: sender,
        }))
    }

    /// Create a new span
    ///
    /// # Arguments
    /// * `name` - Name of the span
    /// * `span_type` - Type of the span (e.g., "llm", "function", etc.)
    /// * `root_span_id` - Optional root span ID for tracing
    /// * `parent_span_id` - Optional parent span ID for nested spans
    ///
    /// # Returns
    /// A new Span instance
    pub fn create_span(&self, name: &str, span_type: &str, root_span_id: Option<&str>, parent_span_id: Option<&str>) -> Span {
        let span_id = Uuid::new_v4().to_string();
        let root_id = root_span_id.map(|s| s.to_string()).unwrap_or_else(|| span_id.clone());
        
        Span::new(
            name,
            span_type,
            &root_id,
            parent_span_id,
        )
    }

    /// Log a span asynchronously in the background
    ///
    /// # Arguments
    /// * `span` - The span to log
    ///
    /// # Returns
    /// Result indicating success or failure of queuing the span - always returns Ok to ensure non-blocking
    pub async fn log_span(&self, span: Span) -> Result<()> {
        // Clone the sender to avoid awaiting on the send operation
        let log_sender = self.log_sender.clone();
        
        // Fire and forget - handle internally without requiring caller to spawn
        if let Err(e) = log_sender.send(span).await {
            // Just log the error and continue, don't propagate it to the caller
            error!("Failed to queue span for logging: {}", e);
        }
        
        // Return immediately without awaiting the log operation
        Ok(())
    }

    /// Log a span synchronously (wait for API response)
    ///
    /// # Arguments
    /// * `span` - The span to log
    ///
    /// # Returns
    /// Result indicating success or failure of the API call
    pub async fn log_span_sync(&self, span: Span) -> Result<()> {
        let url = format!("{}/project_logs/{}/insert", API_BASE, self.project_id);
        let payload = EventPayload { events: vec![span.clone()] };
        
        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| anyhow!("Failed to send span: {}", e))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(anyhow!("Failed to log span: HTTP {}, error: {}", status, error_text));
        }
        
        Ok(())
    }
    
    /// Get the project ID
    pub fn project_id(&self) -> &str {
        &self.project_id
    }

    /// Fetch a prompt by its ID
    ///
    /// # Arguments
    /// * `prompt_id` - ID of the prompt to fetch
    ///
    /// # Returns
    /// Result containing the Prompt if successful, or an error if the request fails
    ///
    /// # Errors
    /// Returns an error if the API request fails or if the response cannot be parsed
    pub async fn get_prompt(&self, prompt_id: &str) -> Result<Prompt> {
        let url = format!("{}/prompt/{}", API_BASE, prompt_id);
        
        debug!("Fetching prompt: {}", prompt_id);
        
        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| anyhow!("Failed to fetch prompt: {}", e))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(anyhow!("Failed to fetch prompt: HTTP {}, error: {}", status, error_text));
        }
        
        let prompt = response.json::<Prompt>().await
            .map_err(|e| anyhow!("Failed to parse prompt response: {}", e))?;
            
        debug!("Successfully fetched prompt: {}", prompt_id);
        
        Ok(prompt)
    }
}
