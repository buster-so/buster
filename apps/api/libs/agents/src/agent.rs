use crate::tools::{IntoToolCallExecutor, ToolExecutor};
use anyhow::Result;
use litellm::{
    AgentMessage, ChatCompletionChunk, ChatCompletionRequest, DeltaToolCall, FunctionCall,
    LiteLLMClient, MessageProgress, Metadata, Tool, ToolCall, ToolChoice,
};
use once_cell::sync::Lazy;
use serde_json::Value;
use std::time::{Duration, Instant};
use secrets::{get_secret_sync, get_secret_sync_or_default};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::{broadcast, mpsc, RwLock};
use tokio_retry::{strategy::ExponentialBackoff, Retry};
use tracing::{debug, error, info, instrument, warn};
use uuid::Uuid;

// Raindrop imports
use raindrop::types::{AiData as RaindropAiData, Event as RaindropEvent};
use raindrop::RaindropClient;

// Type definition for tool registry to simplify complex type
// No longer needed, defined below
use crate::models::AgentThread;

// Import Mode related types (adjust path if needed)
use crate::agents::modes::ModeConfiguration;

// --- Reverted AgentError Struct ---
#[derive(Debug, Clone)]
pub struct AgentError(pub String);

impl std::error::Error for AgentError {}

impl std::fmt::Display for AgentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
// --- End Reverted AgentError Struct ---

type MessageResult = Result<AgentMessage, AgentError>;

#[derive(Debug)]
struct MessageBuffer {
    content: String,
    tool_calls: HashMap<String, PendingToolCall>,
    last_flush: Instant,
    message_id: Option<String>,
    first_message_sent: bool,
}

impl MessageBuffer {
    fn new() -> Self {
        Self {
            content: String::new(),
            tool_calls: HashMap::new(),
            last_flush: Instant::now(),
            message_id: None,
            first_message_sent: false,
        }
    }

    fn should_flush(&self) -> bool {
        self.last_flush.elapsed() >= Duration::from_millis(50)
    }

    fn has_changes(&self) -> bool {
        !self.content.is_empty() || !self.tool_calls.is_empty()
    }

    async fn flush(&mut self, agent: &Agent) -> Result<()> {
        if !self.has_changes() {
            return Ok(());
        }

        // Create tool calls vector if we have any
        let tool_calls: Option<Vec<ToolCall>> = if !self.tool_calls.is_empty() {
            Some(
                self.tool_calls
                    .values()
                    .filter_map(|p| {
                        if p.function_name.is_some() {
                            Some(p.clone().into_tool_call())
                        } else {
                            None
                        }
                    })
                    .collect(),
            )
        } else {
            None
        };

        // Create and send the message
        let message = AgentMessage::assistant(
            self.message_id.clone(),
            if self.content.is_empty() {
                None
            } else {
                Some(self.content.clone())
            },
            tool_calls,
            MessageProgress::InProgress,
            Some(!self.first_message_sent),
            Some(agent.name.clone()),
        );

        // Continue on error with broadcast::error::SendError
        // Ensure we handle the Result from get_stream_sender first
        if let Ok(sender) = agent.get_stream_sender().await {
            if let Err(e) = sender.send(Ok(message)) {
                // Log warning but don't fail the operation
                tracing::warn!("Channel send error, message may be dropped: {}", e);
            }
        } else {
            tracing::warn!("Stream sender not available, message dropped.");
        }

        // Update state
        self.first_message_sent = true;
        self.last_flush = Instant::now();
        // Do NOT clear content between flushes - we need to accumulate all content
        // only to keep tool calls as they may still be accumulating

        Ok(())
    }
}

// Helper struct to store the tool and its enablement condition
struct RegisteredTool {
    executor: Box<dyn ToolExecutor<Output = Value, Params = Value> + Send + Sync>,
    // Make the condition optional
    enablement_condition: Option<Box<dyn Fn(&HashMap<String, Value>) -> bool + Send + Sync>>,
}

// Update the ToolRegistry type alias is no longer needed, but we need the new type for the map
type ToolsMap = Arc<RwLock<HashMap<String, RegisteredTool>>>;

// --- Define ModeProvider Trait ---
#[async_trait::async_trait]
pub trait ModeProvider {
    // Fetches the complete configuration for a given agent state
    async fn get_configuration_for_state(
        &self,
        state: &HashMap<String, Value>,
    ) -> Result<ModeConfiguration>;
}
// --- End ModeProvider Trait ---

#[derive(Clone)]
/// The Agent struct is responsible for managing conversations with the LLM
/// and coordinating tool executions. It maintains a registry of available tools
/// and handles the recursive nature of tool calls.
pub struct Agent {
    /// Client for communicating with the LLM provider
    llm_client: LiteLLMClient,
    /// Registry of available tools, mapped by their names
    tools: ToolsMap,
    /// The initial/default model identifier (can be overridden by mode)
    model: String,
    /// Flexible state storage for maintaining memory across interactions
    state: Arc<RwLock<HashMap<String, Value>>>,
    /// The current thread being processed, if any
    current_thread: Arc<RwLock<Option<AgentThread>>>,
    /// Sender for streaming messages from this agent and sub-agents
    stream_tx: Arc<RwLock<Option<broadcast::Sender<MessageResult>>>>,
    /// The user ID for the current thread
    user_id: Uuid,
    /// The session ID for the current thread
    session_id: Uuid,
    /// Agent name
    name: String,
    /// Shutdown signal sender
    shutdown_tx: Arc<RwLock<broadcast::Sender<()>>>,
    /// List of tool names that should terminate the agent loop upon successful execution.
    /// This will be managed by the ModeProvider now.
    terminating_tool_names: Arc<RwLock<Vec<String>>>,
    /// Provider for mode-specific logic (prompt, model, tools, termination)
    mode_provider: Arc<dyn ModeProvider + Send + Sync>,
}

impl Agent {
    /// Create a new Agent instance with a specific LLM client and model
    pub fn new(
        initial_model: String,
        user_id: Uuid,
        session_id: Uuid,
        name: String,
        api_key: Option<String>,
        base_url: Option<String>,
        mode_provider: Arc<dyn ModeProvider + Send + Sync>,
    ) -> Self {
        let llm_client = LiteLLMClient::new(api_key, base_url);

        // When creating a new agent, initialize broadcast channel with higher capacity for better concurrency
        let (tx, _rx) = broadcast::channel(10000);
        // Increase shutdown channel capacity to avoid blocking
        let (shutdown_tx, _) = broadcast::channel(100);

        Self {
            llm_client,
            tools: Arc::new(RwLock::new(HashMap::new())), // Initialize empty
            model: initial_model,
            state: Arc::new(RwLock::new(HashMap::new())),
            current_thread: Arc::new(RwLock::new(None)),
            stream_tx: Arc::new(RwLock::new(Some(tx))),
            user_id,
            session_id,
            shutdown_tx: Arc::new(RwLock::new(shutdown_tx)),
            name,
            terminating_tool_names: Arc::new(RwLock::new(Vec::new())), // Initialize empty list
            mode_provider,                                             // Store the provider
        }
    }

    /// Create a new Agent that shares state and stream with an existing agent
    pub fn from_existing(
        existing_agent: &Agent,
        name: String,
        mode_provider: Arc<dyn ModeProvider + Send + Sync>,
    ) -> Self {
        let llm_api_key = get_secret_sync("LLM_API_KEY").ok(); // Use ok() instead of expect
        let llm_base_url = get_secret_sync("LLM_BASE_URL").ok(); // Use ok() instead of expect

        let llm_client = LiteLLMClient::new(llm_api_key, llm_base_url);

        Self {
            llm_client,
            tools: Arc::new(RwLock::new(HashMap::new())), // Independent tools for sub-agent
            model: existing_agent.model.clone(),
            state: Arc::clone(&existing_agent.state), // Shared state
            current_thread: Arc::clone(&existing_agent.current_thread), // Shared thread (if needed)
            stream_tx: Arc::clone(&existing_agent.stream_tx), // Shared stream
            user_id: existing_agent.user_id,
            session_id: existing_agent.session_id,
            shutdown_tx: Arc::clone(&existing_agent.shutdown_tx), // Shared shutdown
            name,
            terminating_tool_names: Arc::new(RwLock::new(Vec::new())), // Sub-agent starts with empty term tools?
            mode_provider: Arc::clone(&mode_provider),                 // Share provider
        }
    }

    pub async fn get_enabled_tools(&self) -> Vec<Tool> {
        let tools = self.tools.read().await;
        let state = self.state.read().await; // Read state once

        let mut enabled_tools = Vec::new();

        for (_, registered_tool) in tools.iter() {
            // Check if condition is None (always enabled) or Some(condition) evaluates to true
            let is_enabled = match &registered_tool.enablement_condition {
                None => true, // Always enabled if no condition is specified
                Some(condition) => condition(&state),
            };

            if is_enabled {
                enabled_tools.push(Tool {
                    tool_type: "function".to_string(),
                    function: registered_tool.executor.get_schema().await,
                });
            }
        }

        enabled_tools
    }

    /// Get a new receiver for the broadcast channel.
    /// Returns an error if the stream channel has been closed or was not initialized.
    pub async fn get_stream_receiver(
        &self,
    ) -> Result<broadcast::Receiver<MessageResult>, AgentError> {
        match self.stream_tx.read().await.as_ref() {
            Some(tx) => Ok(tx.subscribe()),
            None => Err(AgentError(
                "Stream channel is closed or not initialized.".to_string(),
            )), // Use string error
        }
    }

    /// Get a clone of the current stream sender.
    /// Returns an error if the stream channel has been closed or was not initialized.
    pub async fn get_stream_sender(&self) -> Result<broadcast::Sender<MessageResult>, AgentError> {
        match self.stream_tx.read().await.as_ref() {
            Some(tx) => Ok(tx.clone()),
            None => Err(AgentError(
                "Stream channel is closed or not initialized.".to_string(),
            )), // Use string error
        }
    }

    /// Get a value from the agent's state by key
    pub async fn get_state_value(&self, key: &str) -> Option<Value> {
        self.state.read().await.get(key).cloned()
    }

    /// Set a value in the agent's state
    pub async fn set_state_value(&self, key: String, value: Value) {
        self.state.write().await.insert(key, value);
    }

    /// Update multiple state values at once using a closure
    pub async fn update_state<F>(&self, f: F)
    where
        F: FnOnce(&mut HashMap<String, Value>),
    {
        let mut state = self.state.write().await;
        f(&mut state);
    }

    /// Clear all state values
    pub async fn clear_state(&self) {
        self.state.write().await.clear();
    }

    // --- New Methods ---

    /// Get the current state map
    pub async fn get_state(&self) -> HashMap<String, Value> {
        self.state.read().await.clone()
    }

    /// Clear all registered tools
    pub async fn clear_tools(&self) {
        self.tools.write().await.clear();
    }

    // --- Helper state functions ---
    /// Check if a state key exists
    pub async fn state_key_exists(&self, key: &str) -> bool {
        self.state.read().await.contains_key(key)
    }

    /// Get a boolean value from state, returning None if key doesn't exist or is not a bool
    pub async fn get_state_bool(&self, key: &str) -> Option<bool> {
        self.state.read().await.get(key).and_then(|v| v.as_bool())
    }
    // --- End Helper state functions ---

    /// Get the current thread being processed, if any
    pub async fn get_current_thread(&self) -> Option<AgentThread> {
        self.current_thread.read().await.clone()
    }

    pub fn get_user_id(&self) -> Uuid {
        self.user_id
    }

    pub fn get_session_id(&self) -> Uuid {
        self.session_id
    }

    pub fn get_model_name(&self) -> &str {
        &self.model
    }

    /// Get the complete conversation history of the current thread
    pub async fn get_conversation_history(&self) -> Option<Vec<AgentMessage>> {
        self.current_thread
            .read()
            .await
            .as_ref()
            .map(|thread| thread.messages.clone())
    }

    /// Truncate previous tool results of a specific tool to keep conversation manageable
    pub async fn truncate_previous_tool_results(&self, tool_name: &str, replacement_content: &str) -> Result<()> {
        let mut thread_lock = self.current_thread.write().await;
        if let Some(thread) = thread_lock.as_mut() {
            let mut modified_count = 0;
            
            // Find and truncate previous tool results, but skip the most recent one if it exists
            let mut tool_message_indices: Vec<usize> = Vec::new();
            for (index, message) in thread.messages.iter().enumerate() {
                if let AgentMessage::Tool { name: Some(ref msg_tool_name), .. } = message {
                    if msg_tool_name == tool_name {
                        tool_message_indices.push(index);
                    }
                }
            }
            
            // Skip the last occurrence (if any) and truncate all previous ones
            if tool_message_indices.len() > 1 {
                // Remove the last index (most recent) from the list to truncate
                tool_message_indices.pop();
                
                for &index in &tool_message_indices {
                    if let Some(AgentMessage::Tool { content, .. }) = thread.messages.get_mut(index) {
                        *content = replacement_content.to_string();
                        modified_count += 1;
                    }
                }
            }
            
            if modified_count > 0 {
                debug!(
                    tool_name = tool_name,
                    truncated_count = modified_count,
                    "Truncated previous tool results to keep conversation manageable"
                );
            }
        }
        Ok(())
    }

    /// Update the current thread with a new message
    async fn update_current_thread(&self, message: AgentMessage) -> Result<()> {
        let mut thread_lock = self.current_thread.write().await;
        if let Some(thread) = thread_lock.as_mut() {
            thread.messages.push(message);
        }
        Ok(())
    }

    /// Add a new tool with the agent, including its enablement condition
    ///
    /// # Arguments
    /// * `name` - The name of the tool, used to identify it in tool calls
    /// * `tool` - The tool implementation that will be executed
    /// * `enablement_condition` - An optional closure that determines if the tool is enabled based on agent state.
    ///                          If `None`, the tool is always considered enabled.
    pub async fn add_tool<T, F>(
        &self,
        name: String,
        tool: T,
        // Make the condition optional
        enablement_condition: Option<F>,
    ) where
        T: ToolExecutor + 'static,
        T::Params: serde::de::DeserializeOwned,
        T::Output: serde::Serialize,
        F: Fn(&HashMap<String, Value>) -> bool + Send + Sync + 'static,
    {
        let mut tools = self.tools.write().await;
        let value_tool = tool.into_tool_call_executor();
        let registered_tool = RegisteredTool {
            executor: Box::new(value_tool),
            // Box the closure only if it's Some
            enablement_condition: enablement_condition
                .map(|f| Box::new(f) as Box<dyn Fn(&HashMap<String, Value>) -> bool + Send + Sync>),
        };
        tools.insert(name, registered_tool);
    }

    /// Add multiple tools to the agent at once
    ///
    /// # Arguments
    /// * `tools_with_conditions` - HashMap of tool names, implementations, and optional enablement conditions
    pub async fn add_tools<E, F>(&self, tools_with_conditions: HashMap<String, (E, Option<F>)>)
    where
        E: ToolExecutor + 'static,
        E::Params: serde::de::DeserializeOwned,
        E::Output: serde::Serialize,
        F: Fn(&HashMap<String, Value>) -> bool + Send + Sync + 'static,
    {
        let mut tools_map = self.tools.write().await;
        for (name, (tool, condition)) in tools_with_conditions {
            let value_tool = tool.into_tool_call_executor();
            let registered_tool = RegisteredTool {
                executor: Box::new(value_tool),
                enablement_condition: condition.map(|f| {
                    Box::new(f) as Box<dyn Fn(&HashMap<String, Value>) -> bool + Send + Sync>
                }),
            };
            tools_map.insert(name, registered_tool);
        }
    }

    /// Process a thread of conversation, potentially executing tools and continuing
    /// the conversation recursively until a final response is reached.
    ///
    /// This is a convenience wrapper around process_thread_streaming that collects
    /// all streamed messages into a final response.
    ///
    /// # Arguments
    /// * `thread` - The conversation thread to process
    ///
    /// # Returns
    /// * A Result containing the final Message from the assistant
    pub async fn process_thread(self: &Arc<Self>, thread: &AgentThread) -> Result<AgentMessage> {
        let mut rx = self.process_thread_streaming(thread).await?;

        let mut final_message = None;
        while let Ok(msg) = rx.recv().await {
            match msg {
                Ok(AgentMessage::Done) => break,  // Stop collecting on Done message
                Ok(m) => final_message = Some(m), // Store the latest non-Done message
                Err(e) => return Err(e.into()),   // Propagate errors
            }
        }

        final_message.ok_or_else(|| anyhow::anyhow!("No final message received before Done signal"))
    }

    /// Process a thread of conversation with streaming responses. This is the primary
    /// interface for processing conversations.
    ///
    /// # Arguments
    /// * `thread` - The conversation thread to process
    ///
    /// # Returns
    /// * A Result containing a receiver for streamed messages
    pub async fn process_thread_streaming(
        self: &Arc<Self>,
        thread: &AgentThread,
    ) -> Result<broadcast::Receiver<MessageResult>> {
        // Spawn the processing task
        let agent_arc_clone = self.clone();
        let thread_clone = thread.clone();
        let agent_for_shutdown = self.clone();
        let mut shutdown_rx = agent_for_shutdown.get_shutdown_receiver().await;
        let agent_for_ok = self.clone();

        tokio::spawn(async move {
            // Clone agent here for use within the select! arms after the initial future completes
            let agent_clone_for_post_process = agent_arc_clone.clone();
            tokio::select! {
                result = Agent::process_thread_with_depth(agent_arc_clone, thread_clone.clone(), &thread_clone, 0) => {
                    if let Err(e) = result {
                        // Log the error
                        let err_msg = format!("Error processing thread: {:?}", e);
                        error!("{}", err_msg);
                        // Use the clone created before select!
                        // Handle the Result from get_stream_sender
                        let agent_error = AgentError(err_msg); // Use reverted struct
                        if let Ok(sender) = agent_clone_for_post_process.get_stream_sender().await {
                            if let Err(send_err) = sender.send(Err(agent_error)) {
                               tracing::warn!("Failed to send error message to stream: {}", send_err);
                            }
                        } else {
                            tracing::warn!("Stream sender not available when trying to send error message.");
                        }
                    }
                     // Use the clone created before select!
                     // Handle the Result from get_stream_sender
                     if let Ok(sender) = agent_clone_for_post_process.get_stream_sender().await {
                         if let Err(e) = sender.send(Ok(AgentMessage::Done)) {
                            tracing::debug!("Failed to send Done message, receiver likely dropped: {}", e);
                         }
                     } else {
                         tracing::debug!("Stream sender not available when trying to send Done message.");
                     }
                },
                _ = shutdown_rx.recv() => {
                    // Use the clone created before select!
                    let agent_clone_shutdown = agent_clone_for_post_process.clone(); // Can clone the clone
                    let shutdown_msg = AgentMessage::assistant(
                        Some("shutdown_message".to_string()),
                        Some("Processing interrupted due to shutdown signal".to_string()),
                        None,
                        MessageProgress::Complete,
                        None,
                        Some(agent_clone_shutdown.name.clone()),
                    );
                    // Handle the Result from get_stream_sender
                    if let Ok(sender) = agent_clone_shutdown.get_stream_sender().await {
                        if let Err(e) = sender.send(Ok(shutdown_msg)) {
                           tracing::warn!("Failed to send shutdown notification: {}", e);
                        }
                    } else {
                        tracing::warn!("Stream sender not available when trying to send shutdown notification.");
                    }

                    // Handle the Result from get_stream_sender
                    if let Ok(sender) = agent_clone_for_post_process.clone().get_stream_sender().await {
                         if let Err(e) = sender.send(Ok(AgentMessage::Done)) {
                            tracing::debug!("Failed to send Done message after shutdown, receiver likely dropped: {}", e);
                        }
                    } else {
                        tracing::debug!("Stream sender not available when trying to send Done message after shutdown.");
                    }
                }
            }
        });

        // Handle the Result from get_stream_receiver
        // Add mapping back for the outer function signature
        agent_for_ok
            .get_stream_receiver()
            .await
            .map_err(anyhow::Error::from)
    }

    async fn process_thread_with_depth(
        agent: Arc<Agent>,
        thread: AgentThread,
        thread_ref: &AgentThread,
        recursion_depth: u32,
    ) -> Result<()> {
        // Attempt to initialize Raindrop client (non-blocking)
        let raindrop_client = RaindropClient::new().ok();

        // Set the initial thread
        {
            let mut current = agent.current_thread.write().await;
            *current = Some(thread_ref.clone());
        }

        let max_recursion = get_secret_sync("MAX_RECURSION")
            .ok()
            .and_then(|v| v.parse::<u32>().ok())
            .unwrap_or(15);

        // Limit recursion to a maximum of 15 times
        if recursion_depth >= max_recursion {
            let max_depth_msg = format!("Maximum recursion depth ({}) reached.", recursion_depth);
            warn!("{}", max_depth_msg);
            let message = AgentMessage::assistant(
                Some("max_recursion_depth_message".to_string()),
                Some(max_depth_msg.clone()), // Send the message string
                None,
                MessageProgress::Complete,
                None,
                Some(agent.name.clone()),
            );
            // Handle the Result from get_stream_sender
            if let Ok(sender) = agent.get_stream_sender().await {
                // Send the Ok message first
                if let Err(e) = sender.send(Ok(message)) {
                    warn!(
                        "Channel send error when sending max recursion depth message: {}",
                        e
                    );
                }
                // Send the error itself over the channel
                if let Err(e) = sender.send(Err(AgentError(max_depth_msg))) {
                    // Send string error
                    warn!(
                        "Channel send error when sending max recursion depth error: {}",
                        e
                    );
                }
            } else {
                warn!("Stream sender not available when sending max recursion depth info.");
            }
            agent.close().await; // Ensure stream is closed
            return Ok(()); // Stop processing gracefully, error sent via channel
        }

        // --- Fetch and Apply Mode Configuration ---
        let state = agent.get_state().await;
        let mode_config = agent
            .mode_provider
            .get_configuration_for_state(&state)
            .await?;

        // Apply Tool Loading via the closure provided by the mode
        agent.clear_tools().await; // Clear previous mode's tools
        (mode_config.tool_loader)(&agent).await?; // Explicitly cast self

        // Apply Terminating Tools for this mode
        {
            // Scope for write lock
            let mut term_tools_lock = agent.terminating_tool_names.write().await;
            term_tools_lock.clear();
            term_tools_lock.extend(mode_config.terminating_tools);
        }
        // --- End Mode Configuration Application ---

        // --- Prepare LLM Messages ---
        // Use prompt from mode_config
        let system_message = AgentMessage::developer(mode_config.prompt);
        let mut llm_messages = vec![system_message];
        llm_messages.extend(
            agent
                .current_thread // Use self.current_thread which is updated
                .read()
                .await
                .as_ref()
                .ok_or_else(|| anyhow::anyhow!("Current thread not set"))?
                .messages
                // Filter out previous Developer messages if desired, or keep history clean
                .iter()
                .filter(|msg| !matches!(msg, AgentMessage::Developer { .. }))
                .cloned(),
        );
        // --- End Prepare LLM Messages ---

        // Collect all enabled tools and their schemas
        let tools = agent.get_enabled_tools().await;

        // Get user message for logging (unchanged)
        let _user_message = thread_ref
            .messages
            .last()
            .filter(|msg| matches!(msg, AgentMessage::User { .. }))
            .cloned();

        // Create the tool-enabled request
        let request = ChatCompletionRequest {
            model: mode_config.model, // Use the model from mode config
            messages: llm_messages,
            tools: if tools.is_empty() { None } else { Some(tools) },
            tool_choice: Some(ToolChoice::Required), // Or adjust based on mode?
            stream: Some(true),                      // Enable streaming
            metadata: Some(Metadata {
                generation_name: "agent".to_string(),
                user_id: thread_ref.user_id.to_string(),
                session_id: thread_ref.id.to_string(),
                trace_id: Uuid::new_v4().to_string(),
            }),
            reasoning_effort: Some("medium".to_string()),
            ..Default::default()
        };

        // --- Track Request with Raindrop ---
        if let Some(client) = raindrop_client.clone() {
            let request_clone = request.clone(); // Clone request for tracking
            let user_id = agent.user_id.clone();
            let session_id = agent.session_id.to_string();
            let current_history = agent.get_conversation_history().await.unwrap_or_default();
            tokio::spawn(async move {
                let event = RaindropEvent {
                    user_id: user_id.to_string(),
                    event: "llm_request".to_string(),
                    properties: Some(HashMap::from([(
                        "conversation_history".to_string(),
                        serde_json::to_value(&current_history).unwrap_or(Value::Null),
                    )])),
                    attachments: None,
                    ai_data: Some(RaindropAiData {
                        model: request_clone.model.clone(),
                        input: serde_json::to_string(&request_clone.messages).unwrap_or_default(),
                        output: "".to_string(), // Output is not known yet
                        convo_id: Some(session_id.clone()),
                    }),
                    event_id: None, // Raindrop assigns this
                    timestamp: Some(chrono::Utc::now()),
                };
                if let Err(e) = client.track_events(vec![event]).await {
                    tracing::error!(agent_name = %user_id, session_id = %session_id, "Error tracking llm_request with Raindrop: {:?}", e);
                }
            });
        }
        // --- End Track Request ---

        // --- Retry Logic for Initial Stream Request ---
        let retry_strategy = ExponentialBackoff::from_millis(100).take(3); // Retry 3 times, ~100ms, ~200ms, ~400ms

        // Define a condition for retrying: only on network-related errors
        let retry_condition = |e: &anyhow::Error| -> bool {
            if let Some(req_err) = e.downcast_ref::<reqwest::Error>() {
                // Retry on specific transient errors
                req_err.is_timeout() || req_err.is_connect() || req_err.is_request()
            } else {
                false // Don't retry if it's not a reqwest network error
            }
        };

        // The retry operation now wraps the actual result or a permanent error in an outer Ok
        // Retriable errors are returned as the Err variant for Retry::spawn
        let stream_rx_result = Retry::spawn(retry_strategy, || {
            // Clone necessary data for the closure
            let agent_clone = agent.clone();
            let request_clone = request.clone();
            let retry_condition_clone = retry_condition; // Clone the condition closure
            async move {
                match agent_clone
                    .llm_client
                    .stream_chat_completion(request_clone)
                    .await
                {
                    Ok(rx) => Ok(Ok(rx)), // Outer Ok, Inner Ok: Success
                    Err(e) => {
                        if retry_condition_clone(&e) {
                            // Check if error is retriable
                            Err(e) // Outer Err: Signal retry
                        } else {
                            // Outer Ok, Inner Err: Permanent failure, stop retrying
                            Ok(Err(e))
                        }
                    }
                }
            }
        })
        .await;
        // --- End Retry Logic ---

        // Get the streaming response from the LLM
        // Handle the nested result from the retry logic
        let mut stream_rx: mpsc::Receiver<Result<ChatCompletionChunk>> = match stream_rx_result {
            Ok(Ok(rx)) => rx, // Success case
            Ok(Err(permanent_error)) => {
                // Permanent error case (non-retriable)
                let error_message = format!(
                    "Error starting LLM stream (non-retriable): {:?}",
                    permanent_error
                );
                tracing::error!(agent_name = %agent.name, chat_id = %agent.session_id, user_id = %agent.user_id, "{}", error_message);
                return Err(permanent_error); // Return the permanent error
            }
            Err(last_retriable_error) => {
                // Error after retries exhausted
                let error_message = format!(
                    "Error starting LLM stream after multiple retries: {:?}",
                    last_retriable_error
                );
                tracing::error!(agent_name = %agent.name, chat_id = %agent.session_id, user_id = %agent.user_id, "{}", error_message);
                return Err(last_retriable_error); // Return the last retriable error
            }
        };

        // Process the streaming chunks
        let mut buffer = MessageBuffer::new();
        let mut _is_complete = false;
        const STREAM_TIMEOUT_SECS: u64 = 120; // Timeout after 120 seconds of inactivity

        loop {
            // Replaced `while let` with `loop` and explicit timeout
            match tokio::time::timeout(Duration::from_secs(STREAM_TIMEOUT_SECS), stream_rx.recv())
                .await
            {
                Ok(Some(chunk_result)) => {
                    // Received a message within timeout
                    match chunk_result {
                        Ok(chunk) => {
                            if chunk.choices.is_empty() {
                                continue;
                            }

                            buffer.message_id = Some(chunk.id.clone());
                            let delta = &chunk.choices[0].delta;

                            // Accumulate content if present
                            if let Some(content) = &delta.content {
                                buffer.content.push_str(content);
                            }

                            // Process tool calls if present
                            if let Some(tool_calls) = &delta.tool_calls {
                                for tool_call in tool_calls {
                                    let id = tool_call.id.clone().unwrap_or_else(|| {
                                        buffer
                                            .tool_calls
                                            .keys()
                                            .next()
                                            .cloned()
                                            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
                                    });

                                    // Get or create the pending tool call
                                    let pending_call =
                                        buffer.tool_calls.entry(id.clone()).or_default();

                                    // Update the pending call with the delta
                                    pending_call.update_from_delta(tool_call);
                                }
                            }

                            // Check if we should flush the buffer
                            if buffer.should_flush() {
                                buffer.flush(&agent).await?;
                            }

                            // Check if this is the final chunk
                            if chunk.choices[0].finish_reason.is_some() {
                                _is_complete = true;
                                // Don't break here yet, let the loop condition handle it
                            }
                        }
                        Err(e) => {
                            // Format the error string
                            let error_message =
                                format!("Error receiving chunk from LLM stream: {:?}", e);

                            tracing::error!(agent_name = %agent.name, chat_id = %agent.session_id, user_id = %agent.user_id, "{}", error_message);
                            // Send string error over broadcast channel before returning
                            let agent_error = AgentError(error_message.clone()); // Create string error
                            if let Ok(sender) = agent.get_stream_sender().await {
                                // clone() is now valid for AgentError(String)
                                if let Err(send_err) = sender.send(Err(agent_error)) {
                                    warn!("Failed to send stream error over channel: {}", send_err);
                                }
                            } else {
                                warn!("Stream sender not available for sending error.");
                            }
                            // Return anyhow::Error as before
                            return Err(anyhow::anyhow!(error_message));
                        }
                    }
                }
                Ok(None) => {
                    // Stream closed gracefully
                    break;
                }
                Err(_) => {
                    // Timeout occurred
                    // Format the timeout message
                    let timeout_msg = format!(
                        "LLM stream timed out after {} seconds of inactivity.",
                        STREAM_TIMEOUT_SECS
                    );
                    warn!(agent_name = %agent.name, chat_id = %agent.session_id, user_id = %agent.user_id, "{}", timeout_msg);

                    // Send string timeout error over broadcast channel
                    let agent_error = AgentError(timeout_msg.clone()); // Create string error
                    if let Ok(sender) = agent.get_stream_sender().await {
                        if let Err(send_err) = sender.send(Err(agent_error)) {
                            warn!("Failed to send timeout error over channel: {}", send_err);
                        }
                    } else {
                        warn!("Stream sender not available for sending timeout error.");
                    }
                    // We could return an error here, or just break and let the agent finish
                    // For now, let's break and proceed with whatever was buffered
                    break;
                }
            }
        }

        // Flush any remaining buffered content or tool calls before creating final message
        buffer.flush(&agent).await?;

        // Create and send the final message
        let final_tool_calls: Option<Vec<ToolCall>> = if !buffer.tool_calls.is_empty() {
            Some(
                buffer
                    .tool_calls
                    .values()
                    .map(|p| p.clone().into_tool_call())
                    .collect(),
            )
        } else {
            None
        };

        let final_message = AgentMessage::assistant(
            buffer.message_id,
            if buffer.content.is_empty() {
                None
            } else {
                Some(buffer.content)
            },
            final_tool_calls.clone(),
            MessageProgress::Complete,
            Some(false), // Never the first message at this stage
            Some(agent.name.clone()),
        );

        // Broadcast the final assistant message
        // Ensure we don't block if the receiver dropped
        // Handle the Result from get_stream_sender
        if let Ok(sender) = agent.get_stream_sender().await {
            if let Err(e) = sender.send(Ok(final_message.clone())) {
                tracing::debug!(
                    "Failed to send final assistant message (receiver likely dropped): {}",
                    e
                );
            }
        } else {
            tracing::debug!("Stream sender not available when sending final assistant message.");
        }

        // Update thread with assistant message
        agent.update_current_thread(final_message.clone()).await?;

        // --- Track Response with Raindrop ---
        if let Some(client) = raindrop_client {
            let request_clone = request.clone(); // Clone again for response tracking
            let final_message_clone = final_message.clone();
            let user_id = agent.user_id.clone();
            let session_id = agent.session_id.to_string();
            // Get history *after* adding the final message
            let current_history = agent.get_conversation_history().await.unwrap_or_default();
            tokio::spawn(async move {
                let event = RaindropEvent {
                    user_id: user_id.to_string(),
                    event: "llm_response".to_string(),
                    properties: Some(HashMap::from([(
                        "conversation_history".to_string(),
                        serde_json::to_value(&current_history).unwrap_or(Value::Null),
                    )])),
                    attachments: None,
                    ai_data: Some(RaindropAiData {
                        model: request_clone.model.clone(),
                        input: serde_json::to_string(&request_clone.messages).unwrap_or_default(),
                        output: serde_json::to_string(&final_message_clone).unwrap_or_default(),
                        convo_id: Some(session_id.clone()),
                    }),
                    event_id: None, // Raindrop assigns this
                    timestamp: Some(chrono::Utc::now()),
                };
                if let Err(e) = client.track_events(vec![event]).await {
                    tracing::error!(agent_name = %user_id, session_id = %session_id, "Error tracking llm_response with Raindrop: {:?}", e);
                }
            });
        }
        // --- End Track Response ---

        // Get the updated thread state AFTER adding the final assistant message
        // This will be used for the potential recursive call later.
        let mut updated_thread_for_recursion = agent
            .current_thread
            .read()
            .await
            .as_ref()
            .cloned()
            .ok_or_else(|| {
                anyhow::anyhow!("Failed to get updated thread state after adding assistant message")
            })?;

        // --- Tool Execution Logic ---
        // If the LLM wants to use tools, execute them
        if let Some(tool_calls) = final_tool_calls {
            let mut results = Vec::new();
            let agent_tools = agent.tools.read().await; // Read tools once
            let terminating_names = agent.terminating_tool_names.read().await; // Read terminating names once

            // Execute each requested tool
            let mut should_terminate = false; // Flag to indicate if loop should terminate after this tool
            for tool_call in tool_calls {
                // Find the registered tool entry
                if let Some(registered_tool) = agent_tools.get(&tool_call.function.name) {
                    // Parse the parameters
                    let params: Value = match serde_json::from_str(&tool_call.function.arguments) {
                        Ok(p) => p,
                        Err(e) => {
                            let err_msg = format!(
                                "Failed to parse tool arguments for {}: {}",
                                tool_call.function.name, e
                            );
                            error!("{}", err_msg);
                            // Return anyhow::Error as before
                            return Err(anyhow::anyhow!(err_msg));
                        }
                    };

                    let _tool_input = serde_json::json!({
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": params.clone() // Clone params for logging
                        },
                        "id": tool_call.id
                    });

                    // --- Tool Execution with Timeout ---
                    const TOOL_TIMEOUT_SECS: u64 = 60; // Timeout for tool execution
                    let tool_execution_result = tokio::time::timeout(
                        Duration::from_secs(TOOL_TIMEOUT_SECS),
                        registered_tool
                            .executor
                            .execute(params, tool_call.id.clone()),
                    )
                    .await;

                    // Process tool execution result (timeout or actual result/error)
                    let result: Result<Value> = match tool_execution_result {
                        Ok(Ok(r)) => Ok(r),   // Tool executed successfully within timeout
                        Ok(Err(e)) => Err(e), // Tool returned an error within timeout
                        Err(_) => {
                            // Tool execution timed out
                            let timeout_msg = format!(
                                "Tool '{}' timed out after {} seconds.",
                                tool_call.function.name, TOOL_TIMEOUT_SECS
                            );
                            warn!(agent_name = %agent.name, chat_id = %agent.session_id, user_id = %agent.user_id, tool_name = %tool_call.function.name, "{}", timeout_msg);
                            // Return an error indicating timeout, wrapped in anyhow
                            Err(anyhow::anyhow!(format!(
                                "Tool '{}' timed out after {} seconds.",
                                tool_call.function.name, TOOL_TIMEOUT_SECS
                            )))
                        }
                    };

                    // Handle the result (success, error, or timeout error)
                    let tool_message = match result {
                        Ok(r) => {
                            // Tool succeeded
                            let result_str = serde_json::to_string(&r)?;
                            AgentMessage::tool(
                                None,
                                result_str.clone(),
                                tool_call.id.clone(),
                                Some(tool_call.function.name.clone()),
                                MessageProgress::Complete,
                            )
                        }
                        Err(e) => {
                            // Tool failed (either execution error or timeout)
                            // Error `e` is already anyhow::Error here
                            let error_message = format!(
                                "Tool execution failed for {}: {:?}",
                                tool_call.function.name, e
                            );

                            // Log error differently for timeout vs execution error if needed
                            error!(agent_name = %agent.name, chat_id = %agent.session_id, user_id = %agent.user_id, tool_name = %tool_call.function.name, "{}", error_message);

                            // Create an error tool message to send back to the LLM
                            AgentMessage::tool(
                                None,
                                serde_json::json!({ "error": error_message }).to_string(), // Send descriptive error string
                                tool_call.id.clone(),
                                Some(tool_call.function.name.clone()),
                                MessageProgress::Complete,
                            )
                            // Note: We are NOT returning the error here, instead we send
                            // the error back as a tool result message to the LLM.
                        }
                    };

                    // Broadcast the tool message as soon as we receive it - use try_send to avoid blocking
                    // Handle the Result from get_stream_sender
                    if let Ok(sender) = agent.get_stream_sender().await {
                        if let Err(e) = sender.send(Ok(tool_message.clone())) {
                            tracing::debug!(
                                "Failed to send tool message (receiver likely dropped): {}",
                                e
                            );
                        }
                    } else {
                        tracing::debug!("Stream sender not available when sending tool message.");
                    }

                    // Update thread with tool response BEFORE checking termination
                    agent.update_current_thread(tool_message.clone()).await?;
                    results.push(tool_message);

                    // Check if this tool's name is in the terminating list
                    if terminating_names.contains(&tool_call.function.name) {
                        should_terminate = true;
                        tracing::info!(
                            "Tool '{}' triggered agent termination.",
                            tool_call.function.name
                        );
                        break; // Exit the tool execution loop
                    }
                } else {
                    // Handle case where the LLM hallucinated a tool name
                    let err_msg = format!(
                        "Attempted to call non-existent tool: {}",
                        tool_call.function.name
                    );
                    error!("{}", err_msg);

                    // Create a fake tool result indicating the error (string based)
                    let error_result = AgentMessage::tool(
                        None,
                        serde_json::json!({ "error": err_msg.clone() }).to_string(), // Use the string message
                        tool_call.id.clone(),
                        Some(tool_call.function.name.clone()),
                        MessageProgress::Complete,
                    );
                    // Broadcast the error message
                    // Handle the Result from get_stream_sender
                    if let Ok(sender) = agent.get_stream_sender().await {
                        if let Err(e) = sender.send(Ok(error_result.clone())) {
                            tracing::debug!(
                                "Failed to send tool error message (receiver likely dropped): {}",
                                e
                            );
                        }
                        // Also send the specific error type over the channel
                        if let Err(e) = sender.send(Err(AgentError(err_msg))) {
                            // Send string error
                            tracing::warn!(
                                "Failed to send tool not found error over channel: {}",
                                e
                            );
                        }
                    } else {
                        tracing::debug!(
                            "Stream sender not available when sending tool error message."
                        );
                    }
                    // Update thread and push the error result for the next LLM call
                    agent.update_current_thread(error_result.clone()).await?;
                    // Continue processing other tool calls if any
                    // --- Added: Consider returning error here if hallucinated tool is fatal ---
                    // return Err(anyhow::anyhow!(err_msg)); // Uncomment if hallucinated tools should stop processing
                    // --- End Added ---
                }
            }

            // If a tool signaled termination, finish trace, send Done and exit.
            if should_terminate {
                return Ok(()); // Exit the function, preventing recursion
            }

            // Add the tool results to the thread state for the recursive call
            updated_thread_for_recursion.messages.extend(results);
        } else {
            // Log the final assistant response span only if NO tools were called
            // Braintrust logging for final assistant response (no tools) REMOVED
            // Braintrust logging for final output to parent span (no tools) REMOVED
            // --- End Logging for Text-Only Response ---
        }

        // Continue the conversation recursively using the updated thread state,
        // unless a terminating tool caused an early return above.
        // This call happens regardless of whether tools were executed in this step.
        let agent_for_recursion = agent.clone();
        Box::pin(Agent::process_thread_with_depth(
            agent_for_recursion,
            updated_thread_for_recursion.clone(),
            &updated_thread_for_recursion,
            recursion_depth + 1,
        ))
        .await
    }

    /// Get a receiver for the shutdown signal
    pub async fn get_shutdown_receiver(&self) -> broadcast::Receiver<()> {
        self.shutdown_tx.read().await.subscribe()
    }

    /// Signal shutdown to all receivers
    pub async fn shutdown(&self) -> Result<()> {
        // Send shutdown signal
        self.shutdown_tx.read().await.send(())?;
        Ok(())
    }

    /// Get a read lock on the tools map (Exposes RegisteredTool now)
    pub async fn get_tools_map(
        &self,
    ) -> tokio::sync::RwLockReadGuard<'_, HashMap<String, RegisteredTool>> {
        self.tools.read().await
    }

    // Add this new method alongside other channel-related methods
    pub async fn close(&self) {
        let mut tx = self.stream_tx.write().await;
        *tx = None;
    }
}

#[derive(Debug, Default, Clone)]
struct PendingToolCall {
    id: Option<String>,
    call_type: Option<String>,
    function_name: Option<String>,
    arguments: String,
    code_interpreter: Option<Value>,
    retrieval: Option<Value>,
}

impl PendingToolCall {
    #[allow(dead_code)]
    fn new() -> Self {
        Self::default()
    }

    fn update_from_delta(&mut self, tool_call: &DeltaToolCall) {
        if let Some(id) = &tool_call.id {
            self.id = Some(id.clone());
        }
        if let Some(call_type) = &tool_call.call_type {
            self.call_type = Some(call_type.clone());
        }
        if let Some(function) = &tool_call.function {
            if let Some(name) = &function.name {
                self.function_name = Some(name.clone());
            }
            if let Some(args) = &function.arguments {
                self.arguments.push_str(args);
            }
        }
        if tool_call.code_interpreter.is_some() {
            self.code_interpreter = None;
        }
        if tool_call.retrieval.is_some() {
            self.retrieval = None;
        }
    }

    fn into_tool_call(self) -> ToolCall {
        ToolCall {
            id: self.id.unwrap_or_default(),
            function: FunctionCall {
                name: self.function_name.unwrap_or_default(),
                arguments: self.arguments,
            },
            call_type: self.call_type.unwrap_or_default(),
            code_interpreter: None,
            retrieval: None,
        }
    }
}

/// A trait that provides convenient access to Agent functionality
/// when the agent is stored behind an Arc
#[async_trait::async_trait]
pub trait AgentExt {
    fn get_agent_arc(&self) -> &Arc<Agent>;

    async fn stream_process_thread(
        &self,
        thread: &AgentThread,
    ) -> Result<broadcast::Receiver<MessageResult>> {
        self.get_agent_arc().process_thread_streaming(thread).await
    }

    async fn process_thread(&self, thread: &AgentThread) -> Result<AgentMessage> {
        self.get_agent_arc().process_thread(thread).await
    }

    async fn get_current_thread(&self) -> Option<AgentThread> {
        (*self.get_agent_arc()).get_current_thread().await
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use crate::tools::ToolExecutor;
    use async_trait::async_trait;
    use litellm::MessageProgress;
    use serde_json::{json, Value};
    use uuid::Uuid;

    // --- Mock Mode Provider for Testing ---
    struct MockModeProvider;

    impl MockModeProvider {
        fn new() -> Self {
            Self
        }
    }

    #[async_trait::async_trait]
    impl ModeProvider for MockModeProvider {
        async fn get_configuration_for_state(
            &self,
            _state: &HashMap<String, Value>,
        ) -> Result<ModeConfiguration> {
            // Return a default/empty configuration for testing basic agent functions
            Ok(ModeConfiguration {
                prompt: "Test Prompt".to_string(),
                model: "test-model".to_string(),
                tool_loader: Box::new(|_agent_arc| Box::pin(async { Ok(()) })), // No-op loader
                terminating_tools: vec![],
            })
        }
    }
    // --- End Mock Mode Provider ---

    fn setup() {
        dotenv::dotenv().ok();
    }

    struct WeatherTool {
        agent: Arc<Agent>,
    }

    impl WeatherTool {
        fn new(agent: Arc<Agent>) -> Self {
            Self { agent }
        }
    }

    impl WeatherTool {
        async fn send_progress(
            &self,
            content: String,
            tool_id: String,
            progress: MessageProgress,
        ) -> Result<()> {
            let message =
                AgentMessage::tool(None, content, tool_id, Some(self.get_name()), progress);
            self.agent.get_stream_sender().await?.send(Ok(message))?;
            Ok(())
        }
    }

    #[async_trait]
    impl ToolExecutor for WeatherTool {
        type Output = Value;
        type Params = Value;

        async fn execute(
            &self,
            params: Self::Params,
            tool_call_id: String,
        ) -> Result<Self::Output> {
            self.send_progress(
                "Fetching weather data...".to_string(),
                tool_call_id.clone(), // Use the actual tool_call_id
                MessageProgress::InProgress,
            )
            .await?;

            let _params = params.as_object().unwrap();

            // Simulate a delay
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

            let result = json!({
                "temperature": 20,
                "unit": "fahrenheit"
            });

            // Tool itself should just return the result, Agent handles sending the final tool message
            Ok(result)
        }

        async fn get_schema(&self) -> Value {
            json!({
                "name": "get_weather",
                "description": "Get current weather information for a specific location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g., San Francisco, CA"
                        },
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"],
                            "description": "The temperature unit to use"
                        }
                    },
                    "required": ["location"]
                }
            })
        }

        fn get_name(&self) -> String {
            "get_weather".to_string()
        }
    }

    #[tokio::test]
    async fn test_agent_convo_no_tools() {
        setup();

        // Use MockModeProvider
        let mock_provider = Arc::new(MockModeProvider::new());
        let agent = Arc::new(Agent::new(
            "o1".to_string(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "test_agent_no_tools".to_string(),
            get_secret_sync("LLM_API_KEY").ok(),
            get_secret_sync("LLM_BASE_URL").ok(),
            mock_provider,
        ));

        let thread = AgentThread::new(
            None,
            Uuid::new_v4(),
            vec![AgentMessage::user("Hello, world!".to_string())],
        );

        // Use Arc<Agent> for process_thread call
        let _response = match agent.process_thread(&thread).await {
            Ok(response) => {
                println!("Response (no tools): {:?}", response);
                response
            }
            Err(e) => panic!("Error processing thread: {:?}", e),
        };
    }

    #[tokio::test]
    async fn test_agent_convo_with_tools() {
        setup();

        // Use MockModeProvider
        let mock_provider = Arc::new(MockModeProvider::new());
        let agent = Arc::new(Agent::new(
            "o1".to_string(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "test_agent_with_tools".to_string(),
            get_secret_sync("LLM_API_KEY").ok(),
            get_secret_sync("LLM_BASE_URL").ok(),
            mock_provider,
        ));

        // Create weather tool with reference to agent
        let weather_tool = WeatherTool::new(Arc::clone(&agent));
        let tool_name = weather_tool.get_name();
        let condition = |_state: &HashMap<String, Value>| true; // Always enabled

        // Add tool to agent
        agent
            .add_tool(tool_name, weather_tool, Some(condition))
            .await;

        let thread = AgentThread::new(
            None,
            Uuid::new_v4(),
            vec![AgentMessage::user(
                "What is the weather in vineyard ut?".to_string(),
            )],
        );

        // Use Arc<Agent> for process_thread call
        let _response = match agent.process_thread(&thread).await {
            Ok(response) => {
                println!("Response (with tools): {:?}", response);
                response
            }
            Err(e) => panic!("Error processing thread: {:?}", e),
        };
    }

    #[tokio::test]
    async fn test_agent_with_multiple_steps() {
        setup();

        // Use MockModeProvider
        let mock_provider = Arc::new(MockModeProvider::new());
        let agent = Arc::new(Agent::new(
            "o1".to_string(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "test_agent_multi_step".to_string(),
            get_secret_sync("LLM_API_KEY").ok(),
            get_secret_sync("LLM_BASE_URL").ok(),
            mock_provider,
        ));

        let weather_tool = WeatherTool::new(Arc::clone(&agent));

        let tool_name = weather_tool.get_name();
        let condition = |_state: &HashMap<String, Value>| true; // Always enabled

        agent
            .add_tool(tool_name, weather_tool, Some(condition))
            .await;

        let thread = AgentThread::new(
            None,
            Uuid::new_v4(),
            vec![AgentMessage::user(
                "What is the weather in vineyard ut and san francisco?".to_string(),
            )],
        );

        // Use Arc<Agent> for process_thread call
        let _response = match agent.process_thread(&thread).await {
            Ok(response) => {
                println!("Response (multi-step): {:?}", response);
                response
            }
            Err(e) => panic!("Error processing thread: {:?}", e),
        };
    }

    #[tokio::test]
    async fn test_agent_disabled_tool() {
        setup();

        // Use MockModeProvider
        let mock_provider = Arc::new(MockModeProvider::new());
        let agent = Arc::new(Agent::new(
            "o1".to_string(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "test_agent_disabled".to_string(),
            get_secret_sync("LLM_API_KEY").ok(),
            get_secret_sync("LLM_BASE_URL").ok(),
            mock_provider,
        ));

        // Create weather tool
        let weather_tool = WeatherTool::new(Arc::clone(&agent));
        let tool_name = weather_tool.get_name();
        // Condition: only enabled if "weather_enabled" state is true
        let condition = |state: &HashMap<String, Value>| -> bool {
            state
                .get("weather_enabled")
                .and_then(|v| v.as_bool())
                .unwrap_or(false)
        };

        // Add tool with the condition
        agent
            .add_tool(tool_name, weather_tool, Some(condition))
            .await;

        // --- Test case 1: Tool disabled ---
        let thread_disabled = AgentThread::new(
            None,
            Uuid::new_v4(),
            vec![AgentMessage::user(
                "What is the weather in Provo?".to_string(),
            )],
        );
        // Ensure state doesn't enable the tool
        agent
            .set_state_value("weather_enabled".to_string(), json!(false))
            .await;

        // Use Arc<Agent> for process_thread call
        let response_disabled = match agent.process_thread(&thread_disabled).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread (disabled): {:?}", e),
        };
        // Expect response without tool call
        if let AgentMessage::Assistant {
            tool_calls: Some(_),
            ..
        } = response_disabled
        {
            panic!("Tool call occurred even when disabled");
        }
        println!("Response (disabled tool): {:?}", response_disabled);

        // --- Test case 2: Tool enabled ---
        let thread_enabled = AgentThread::new(
            None,
            Uuid::new_v4(),
            vec![AgentMessage::user(
                "What is the weather in Orem?".to_string(),
            )],
        );
        // Set state to enable the tool
        agent
            .set_state_value("weather_enabled".to_string(), json!(true))
            .await;

        // Use Arc<Agent> for process_thread call
        let _response_enabled = match agent.process_thread(&thread_enabled).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread (enabled): {:?}", e),
        };
        // Expect response *with* tool call (or final answer after tool call)
        // We can't easily check the intermediate step here, but the test should run without panic
        println!("Response (enabled tool): {:?}", _response_enabled);
    }

    #[tokio::test]
    async fn test_agent_state_management() {
        setup();

        // Use MockModeProvider
        let mock_provider = Arc::new(MockModeProvider::new());
        let agent = Arc::new(Agent::new(
            "o1".to_string(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "test_agent_state".to_string(),
            get_secret_sync("LLM_API_KEY").ok(),
            get_secret_sync("LLM_BASE_URL").ok(),
            mock_provider,
        ));

        // Test setting single values
        agent
            .set_state_value("test_key".to_string(), json!("test_value"))
            .await;
        let value = agent.get_state_value("test_key").await;
        assert_eq!(value, Some(json!("test_value")));
        assert!(agent.state_key_exists("test_key").await);
        assert_eq!(agent.get_state_bool("test_key").await, None); // Not a bool

        // Test setting boolean value
        agent
            .set_state_value("bool_key".to_string(), json!(true))
            .await;
        assert_eq!(agent.get_state_bool("bool_key").await, Some(true));

        // Test updating multiple values
        agent
            .update_state(|state| {
                state.insert("key1".to_string(), json!(1));
                state.insert("key2".to_string(), json!({"nested": "value"}));
            })
            .await;

        assert_eq!(agent.get_state_value("key1").await, Some(json!(1)));
        assert_eq!(
            agent.get_state_value("key2").await,
            Some(json!({"nested": "value"}))
        );

        // Test clearing state
        agent.clear_state().await;
        assert_eq!(agent.get_state_value("test_key").await, None);
        assert_eq!(agent.get_state_value("key1").await, None);
        assert_eq!(agent.get_state_value("key2").await, None);
        assert!(!agent.state_key_exists("test_key").await);
        assert_eq!(agent.get_state_bool("bool_key").await, None);
    }
}
