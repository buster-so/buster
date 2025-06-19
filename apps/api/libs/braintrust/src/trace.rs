use anyhow::Result;
use std::sync::Arc;
use tracing::debug;

use crate::client::BraintrustClient;
use crate::types::Span;

/// TraceBuilder for constructing and managing spans
pub struct TraceBuilder {
    client: Arc<BraintrustClient>,
    root_span: Span,
}

impl TraceBuilder {
    /// Create a new trace with a root span
    ///
    /// # Arguments
    /// * `client` - Reference to the Braintrust client
    /// * `name` - Name of the trace
    ///
    /// # Returns
    /// A new TraceBuilder instance
    pub fn new(client: Arc<BraintrustClient>, name: &str) -> Self {
        let root_span = Span::new(name, "task", "", None); // Root span has empty root_span_id initially
        let root_span_id = root_span.span_id.clone();
        let mut root_span = root_span;
        root_span.root_span_id = root_span_id; // Set root_span_id after creation
        
        debug!("Created new trace with root span ID: {}", root_span.span_id);

        Self { client, root_span }
    }

    /// Immediately create and log a span, return it for further updates
    /// Logging happens asynchronously in the background
    ///
    /// # Arguments
    /// * `name` - Name of the span
    /// * `span_type` - Type of the span (e.g., "llm", "function", etc.)
    ///
    /// # Returns
    /// The created span
    pub async fn add_span(&self, name: &str, span_type: &str) -> Result<Span> {
        let span = Span::new(name, span_type, &self.root_span.span_id, Some(&self.root_span.span_id));
        debug!("Adding span '{}' with ID: {} to trace", name, span.span_id());
        // Log span non-blockingly (client handles the background processing)
        self.client.log_span(span.clone()).await?;
        Ok(span)
    }

    /// Create a child span from a parent span
    /// Logging happens asynchronously in the background
    ///
    /// # Arguments
    /// * `name` - Name of the span
    /// * `span_type` - Type of the span
    /// * `parent_span` - Parent span
    ///
    /// # Returns
    /// The created child span
    pub async fn add_child_span(&self, name: &str, span_type: &str, parent_span: &Span) -> Result<Span> {
        let span = Span::new(name, span_type, &self.root_span.span_id, Some(parent_span.span_id()));
        debug!("Adding child span '{}' with ID: {} to parent: {}", 
               name, span.span_id(), parent_span.span_id());
        // Log span non-blockingly (client handles the background processing)
        self.client.log_span(span.clone()).await?;
        Ok(span)
    }

    /// Get the root span ID
    pub fn root_span_id(&self) -> &str {
        &self.root_span.root_span_id
    }

    /// Get a reference to the root span
    pub fn root_span(&self) -> &Span {
        &self.root_span
    }

    /// Finish and log the root span
    /// Logging happens asynchronously in the background
    ///
    /// # Returns
    /// Result indicating success or failure of queuing the span (always Ok)
    pub async fn finish(self) -> Result<()> {
        debug!("Finishing trace with root span ID: {}", self.root_span.span_id);
        let finished_root = self.root_span.set_output(serde_json::json!("Trace completed"));
        // Log span non-blockingly (client handles the background processing)
        self.client.log_span(finished_root).await?;
        Ok(())
    }
}
