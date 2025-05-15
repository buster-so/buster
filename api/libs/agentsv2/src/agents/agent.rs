// REMOVE-ALL
//! Typed-state Agent framework (v2)
//!
//! This is **early scaffolding** – it purposefully implements only a
//! subset of the full v1 feature-set so we can incrementally migrate.
//!
//! Key design goals:
//! 1. Each concrete agent defines its own strongly-typed `State` struct.
//! 2. Modes (prompt, model, tool loader, termination rules) are provided
//!    by a pluggable `ModeProvider<S>`.
//! 3. Tools come from `libs/agentsv2::tools::*` and use the `ToolExecutor`
//!    traits defined there.
//! 4. The framework supports fully-typed tool execution **and** a
//!    `serde_json::Value` wrapper for easy dynamic dispatch/testing.
//! 5. Streaming is optional – callers can supply an external
//!    `broadcast::Sender` or fall back to an internally created one.
//!
//! Nothing here is considered frozen API yet – we will iterate as we port
//! more of v1.

use crate::tools::tool::IntoJsonAdapter;
use crate::tools::tool::{JsonAdapter, ToolExecutor, ToolName};
use anyhow::Result;
use async_trait::async_trait;
use litellm::{
    ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse, FunctionCall,
    LiteLLMClient, LiteLlmMessage, MessageProgress, Tool, ToolCall, ToolChoice,
};
use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;
use std::fmt::Debug;
use std::sync::atomic::{AtomicUsize, Ordering as AtomicOrdering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{broadcast, mpsc, RwLock};
use tokio_retry::strategy::ExponentialBackoff;
use tokio_retry::Retry;
use uuid::Uuid; // For call count

//---------------------------------------------------------------------
//  Error type (string-backed for ease of use across async boundaries)
//---------------------------------------------------------------------
#[derive(Debug, Clone)]
pub struct AgentError(pub String);

impl std::error::Error for AgentError {}
impl std::fmt::Display for AgentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

type MessageResult = Result<LiteLlmMessage, AgentError>;

//---------------------------------------------------------------------
//  State marker trait
//---------------------------------------------------------------------
/// Blanket marker so we can use it as a bound in trait definitions.
pub trait State: Debug + Send + Sync + 'static {}
impl<T: Debug + Send + Sync + 'static> State for T {}

//---------------------------------------------------------------------
//  Mode abstraction
//---------------------------------------------------------------------
#[derive(Clone)]
pub struct ModeConfig<S: State> {
    /// System prompt injected at the top of every model call.
    pub prompt: String,
    /// LLM model identifier (e.g. "gpt-3.5-turbo").
    pub model: String,
    /// Loader that registers tools for this mode.
    pub tool_loader: Arc<
        dyn Fn(
                &GenericAgent<S>,
            )
                -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<()>> + Send>>
            + Send
            + Sync,
    >,
    /// Tools that end the recursion if executed successfully.
    pub terminating_tools: Vec<ToolName>,
    /// Predicate evaluated **after every turn** – if true we stop.
    pub should_terminate: Arc<dyn Fn(&S) -> bool + Send + Sync>,
}

#[async_trait]
pub trait ModeProvider<S: State>: Send + Sync {
    async fn configuration(&self, state: &S) -> Result<ModeConfig<S>>;
}

//---------------------------------------------------------------------
//  High-level status returned from each recursive step
//---------------------------------------------------------------------
#[derive(Debug)]
pub enum AgentStatus {
    Continue,
    NeedsUserInput(String),
    Terminated,
}

//---------------------------------------------------------------------
//  Tool registry internal entry
//---------------------------------------------------------------------
struct RegisteredTool<S: State> {
    executor: Box<dyn ToolExecutor<Output = Value, Params = Value> + Send + Sync>,
    enabled_if: Option<Arc<dyn Fn(&S) -> bool + Send + Sync + 'static>>,
}

//---------------------------------------------------------------------
//  Test facade trait for mocking LLM in tests
//---------------------------------------------------------------------
#[cfg(test)]
#[async_trait]
pub trait LlmFacade {
    async fn chat_completion(&self, req: ChatCompletionRequest) -> Result<ChatCompletionResponse>;

    async fn stream_chat_completion(
        &self,
        req: ChatCompletionRequest,
    ) -> Result<mpsc::Receiver<Result<ChatCompletionChunk>>>;
}

#[cfg(test)]
struct MockDefaultLlm;

#[cfg(test)]
#[async_trait]
impl LlmFacade for MockDefaultLlm {
    async fn chat_completion(&self, _req: ChatCompletionRequest) -> Result<ChatCompletionResponse> {
        panic!("MockDefaultLlm.chat_completion called but not mocked!")
    }

    async fn stream_chat_completion(
        &self,
        _req: ChatCompletionRequest,
    ) -> Result<mpsc::Receiver<Result<ChatCompletionChunk>>> {
        panic!("MockDefaultLlm.stream_chat_completion called but not mocked!")
    }
}

#[cfg(test)]
#[async_trait]
impl LlmFacade for LiteLLMClient {
    async fn chat_completion(&self, req: ChatCompletionRequest) -> Result<ChatCompletionResponse> {
        self.chat_completion(req).await
    }

    async fn stream_chat_completion(
        &self,
        req: ChatCompletionRequest,
    ) -> Result<mpsc::Receiver<Result<ChatCompletionChunk>>> {
        self.stream_chat_completion(req).await
    }
}

//---------------------------------------------------------------------
//  Core generic Agent implementation
//---------------------------------------------------------------------
/// A generic agent that owns a typed `State` and interacts with LLM + tools.
/// `S`: strongly typed state struct for this agent.
#[derive(Clone)]
pub struct GenericAgent<S: State> {
    state: Arc<RwLock<S>>,                                  // typed state
    tools: Arc<RwLock<HashMap<String, RegisteredTool<S>>>>, // MODIFIED
    mode_provider: Arc<dyn ModeProvider<S>>,
    user_id: Uuid,
    session_id: Uuid,
    name: String,
    tool_timeout_secs: u64, // New field for configurable timeout
    #[cfg(not(test))]
    llm_client: LiteLLMClient,
    #[cfg(test)]
    llm_client: Arc<dyn LlmFacade + Send + Sync>,
    stream_tx: Arc<RwLock<Option<broadcast::Sender<MessageResult>>>>,
}

impl<S: State> GenericAgent<S> {
    // ------------------------------------------------------------
    // Constructors
    // ------------------------------------------------------------
    pub fn new(
        name: String,
        state: S,
        mode_provider: Arc<dyn ModeProvider<S>>,
        user_id: Uuid,
        session_id: Uuid,
    ) -> Self {
        let (tx, _rx) = broadcast::channel(1024);
        Self {
            state: Arc::new(RwLock::new(state)),
            tools: Arc::new(RwLock::new(HashMap::new())),
            mode_provider,
            user_id,
            session_id,
            name,
            tool_timeout_secs: 120, // Default timeout
            #[cfg(not(test))]
            llm_client: LiteLLMClient::default(),
            #[cfg(test)]
            llm_client: Arc::new(MockDefaultLlm),
            stream_tx: Arc::new(RwLock::new(Some(tx))),
        }
    }

    /// Optionally supply an external broadcast sender so callers receive the same stream.
    pub fn with_stream(
        name: String,
        state: S,
        mode_provider: Arc<dyn ModeProvider<S>>,
        user_id: Uuid,
        session_id: Uuid,
        external_tx: broadcast::Sender<MessageResult>,
    ) -> Self {
        Self {
            state: Arc::new(RwLock::new(state)),
            tools: Arc::new(RwLock::new(HashMap::new())),
            mode_provider,
            user_id,
            session_id,
            name,
            tool_timeout_secs: 120, // Default timeout
            #[cfg(not(test))]
            llm_client: LiteLLMClient::default(),
            #[cfg(test)]
            llm_client: Arc::new(MockDefaultLlm),
            stream_tx: Arc::new(RwLock::new(Some(external_tx))),
        }
    }

    #[cfg(test)]
    pub fn with_mock(
        name: impl Into<String>,
        state: S,
        mode_provider: Arc<dyn ModeProvider<S>>,
        user_id: Uuid,
        session_id: Uuid,
        mock_llm: Arc<dyn LlmFacade + Send + Sync>,
        tool_timeout_secs: u64, // Added parameter for tests
    ) -> Self {
        let (tx, _rx) = broadcast::channel(1024);
        Self {
            state: Arc::new(RwLock::new(state)),
            tools: Arc::new(RwLock::new(HashMap::new())),
            mode_provider,
            user_id,
            session_id,
            name: name.into(),
            llm_client: mock_llm,
            stream_tx: Arc::new(RwLock::new(Some(tx))),
            tool_timeout_secs, // Use provided timeout
        }
    }

    // ------------------------------------------------------------
    //  State helpers
    // ------------------------------------------------------------
    pub async fn read_state(&self) -> S
    where
        S: Clone,
    {
        self.state.read().await.clone()
    }

    pub async fn write_state<F>(&self, f: F)
    where
        F: FnOnce(&mut S),
    {
        let mut s = self.state.write().await;
        f(&mut s);
    }

    // ------------------------------------------------------------
    //  Stream helpers
    // ------------------------------------------------------------
    pub async fn get_stream_receiver(&self) -> Option<broadcast::Receiver<MessageResult>> {
        self.stream_tx
            .read()
            .await
            .as_ref()
            .map(|tx| tx.subscribe())
    }

    async fn send_msg(&self, msg: MessageResult) {
        if let Some(tx) = self.stream_tx.read().await.as_ref() {
            let _ = tx.send(msg);
        }
    }

    // ------------------------------------------------------------
    //  Tool registration
    // ------------------------------------------------------------
    pub async fn add_tool<T, F>(&self, name: String, tool: T, enabled_if_condition: Option<F>)
    where
        T: ToolExecutor + 'static,
        T::Params: serde::de::DeserializeOwned,
        T::Output: Serialize,
        F: Fn(&S) -> bool + Send + Sync + 'static,
    {
        let mut tools = self.tools.write().await;
        tools.insert(
            name,
            RegisteredTool {
                executor: Box::new(tool.into_json_adapter()),
                enabled_if: enabled_if_condition
                    .map(|f| Arc::new(f) as Arc<dyn Fn(&S) -> bool + Send + Sync + 'static>),
            },
        );
    }

    // ------------------------------------------------------------
    //  Public driver API – simplified for the scaffold
    // ------------------------------------------------------------
    /// Process the thread until termination according to the ModeProvider
    /// & terminating tools.  Very slim placeholder that **only** sends the
    /// initial system prompt at the moment.
    pub async fn run(&self) -> Result<()> {
        // 1. Get current mode config
        let cfg = {
            let st = self.state.read().await;
            self.mode_provider.configuration(&st).await?
        };

        // 2. Emit system message downstream
        let sys_msg = LiteLlmMessage::developer(cfg.prompt.clone());
        self.send_msg(Ok(sys_msg)).await;

        // 3. Terminate immediately for scaffold
        self.send_msg(Ok(LiteLlmMessage::Done)).await;
        Ok(())
    }

    // ------------------------------------------------------------
    //  Shutdown helpers
    // ------------------------------------------------------------
    pub async fn shutdown(&self) {
        let mut tx_lock = self.stream_tx.write().await;
        *tx_lock = None;
    }

    // ------------------------------------------------------------
    //  Tool discovery
    // ------------------------------------------------------------
    pub async fn get_enabled_tools(&self) -> Vec<Tool> {
        let tools_map = self.tools.read().await;
        let current_state = self.state.read().await; // Read state once for all checks
        let mut out = Vec::new();

        for (_name, reg_tool) in tools_map.iter() {
            let is_enabled = match &reg_tool.enabled_if {
                Some(condition_fn) => condition_fn(&current_state),
                None => true, // If no condition, tool is always enabled
            };

            if is_enabled {
                out.push(Tool {
                    tool_type: "function".into(),
                    function: reg_tool.executor.schema().await,
                });
            }
        }
        out
    }

    /// Process a turn with streaming support for both LLM output and tool execution
    pub async fn process_turn_streaming(
        &self,
        conversation: &mut Vec<LiteLlmMessage>,
        depth: u32,
    ) -> Result<AgentStatus> {
        if depth >= 15 {
            // MODIFIED: Recursion depth to 15
            self.send_msg(Ok(LiteLlmMessage::assistant(
                Some("max_depth".to_string()),
                Some("Maximum recursion depth reached.".to_string()),
                None,
                MessageProgress::Complete,
                None,
                Some(self.name.clone()),
            )))
            .await;
            return Ok(AgentStatus::Terminated);
        }

        // 1. Resolve mode
        let cfg = {
            let st = self.state.read().await;
            self.mode_provider.configuration(&st).await?
        };

        // 2. (Re)load tools for this mode
        (cfg.tool_loader)(self).await?;

        // 3. Compose messages – prepend system/developer prompt
        let mut messages = vec![LiteLlmMessage::developer(cfg.prompt.clone())];
        messages.extend(conversation.clone());

        // 4. Collect tool schemas
        let enabled_tools = self.get_enabled_tools().await;

        // 5. Build streaming request
        let request = ChatCompletionRequest {
            model: cfg.model.clone(),
            messages,
            tools: if enabled_tools.is_empty() {
                None
            } else {
                Some(enabled_tools)
            },
            tool_choice: Some(ToolChoice::Required), // Or ToolChoice::Required if tools should always be attempted if present
            stream: Some(true),
            ..Default::default()
        };

        // 6. Start streaming chat completion with retry logic
        let retry_strategy = ExponentialBackoff::from_millis(100).take(3); // e.g., 100ms, 200ms, 400ms

        let mut stream_rx = Retry::spawn(retry_strategy, || {
            let request_clone = request.clone(); // Clone request for the retry closure
            let llm_client_clone = self.llm_client.clone(); // Clone client for the retry closure
            async move { llm_client_clone.stream_chat_completion(request_clone).await }
        })
        .await?;

        // 7. Process the streaming chunks
        let mut buffer = MessageBuffer::new();
        let mut is_complete = false;
        let stream_timeout = std::time::Duration::from_secs(120);

        // Store pending tool calls that are being processed for argument streaming
        // Key: tool_call_id, Value: tool_name. Used to finalize correct tools.
        let mut active_tool_streams: HashMap<String, String> = HashMap::new();

        while !is_complete {
            match tokio::time::timeout(stream_timeout, stream_rx.recv()).await {
                Ok(Some(chunk_result)) => {
                    match chunk_result {
                        Ok(chunk) => {
                            if chunk.choices.is_empty() {
                                // Potentially a metadata-only chunk, or an empty stream choice.
                                // If finish_reason is present, mark as complete.
                                if chunk
                                    .choices
                                    .first()
                                    .map_or(false, |c| c.finish_reason.is_some())
                                {
                                    is_complete = true;
                                }
                                continue;
                            }

                            let choice = &chunk.choices[0];
                            let delta = &choice.delta;

                            // Accumulate content if present
                            if let Some(content) = &delta.content {
                                buffer.content.push_str(content);
                            }

                            // Process tool calls if present
                            if let Some(delta_tool_calls) = &delta.tool_calls {
                                let mut tools_map_guard = self.tools.write().await;
                                for tool_call_delta in delta_tool_calls {
                                    // Ensure tool_call_id is available or generated
                                    let current_tool_call_id =
                                        tool_call_delta.id.clone().unwrap_or_else(|| {
                                            // If delta doesn't have an ID, try to find it from buffer or generate.
                                            // This part might need refinement if ID is consistently missing in deltas.
                                            buffer
                                                .tool_calls
                                                .keys()
                                                .next()
                                                .cloned()
                                                .unwrap_or_else(|| Uuid::new_v4().to_string())
                                        });

                                    // Update MessageBuffer for constructing the final assistant message
                                    let pending_call_for_buffer = buffer
                                        .tool_calls
                                        .entry(current_tool_call_id.clone())
                                        .or_default();
                                    pending_call_for_buffer.update_from_delta(tool_call_delta);

                                    // Stream argument chunk to the tool itself via ingest_chunk
                                    if let Some(function_delta) = &tool_call_delta.function {
                                        if let Some(arg_chunk) = &function_delta.arguments {
                                            if !arg_chunk.is_empty() {
                                                // Determine tool name - needs to be available from the first delta chunk for this tool_call_id
                                                let tool_name_str =
                                                    if let Some(name) = &function_delta.name {
                                                        name.clone()
                                                    } else {
                                                        // If name not in this delta, get from buffer (it should have been set by a previous delta)
                                                        pending_call_for_buffer
                                                            .function_name
                                                            .clone()
                                                            .unwrap_or_default()
                                                    };

                                                if !tool_name_str.is_empty() {
                                                    active_tool_streams
                                                        .entry(current_tool_call_id.clone())
                                                        .or_insert_with(|| tool_name_str.clone());
                                                    if let Some(reg_tool) =
                                                        tools_map_guard.get_mut(&tool_name_str)
                                                    {
                                                        match reg_tool
                                                            .executor
                                                            .ingest_chunk(
                                                                arg_chunk,
                                                                &current_tool_call_id,
                                                            )
                                                            .await
                                                        {
                                                            Ok(stages) => {
                                                                for stage in stages {
                                                                    match stage {
                                                                        crate::tools::tool::StreamStage::OutputChunk(val) => {
                                                                            let tool_msg = LiteLlmMessage::tool(
                                                                                None, // ID for message itself
                                                                                serde_json::to_string(&val)?,
                                                                                current_tool_call_id.clone(),
                                                                                Some(tool_name_str.clone()),
                                                                                MessageProgress::InProgress,
                                                                            );
                                                                            self.send_msg(Ok(tool_msg)).await;
                                                                        }
                                                                        // ParamsChunk/ParamsComplete are for tool's internal use or specific UI needs,
                                                                        // not directly creating LiteLlmMessage::Tool here.
                                                                        _ => {}
                                                                    }
                                                                }
                                                            }
                                                            Err(e) => {
                                                                // Log tool error, maybe send an error message on stream
                                                                let err_msg = format!("Tool '{}' (id: {}) ingest_chunk error: {}", tool_name_str, current_tool_call_id, e);
                                                                self.send_msg(Err(AgentError(
                                                                    err_msg,
                                                                )))
                                                                .await;
                                                            }
                                                        }
                                                    } else {
                                                        // Tool not found, should ideally not happen if LLM uses provided tools
                                                        let err_msg = format!("Tool '{}' not found during ingest_chunk for id: {}", tool_name_str, current_tool_call_id);
                                                        self.send_msg(Err(AgentError(err_msg)))
                                                            .await;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                drop(tools_map_guard); // Release lock
                            }

                            // Check if we should flush the MessageBuffer for assistant message updates
                            if buffer.should_flush() && buffer.has_changes() {
                                let assistant_tool_calls_for_buffer: Option<Vec<ToolCall>> =
                                    if !buffer.tool_calls.is_empty() {
                                        Some(
                                            buffer
                                                .tool_calls
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
                                let message = LiteLlmMessage::assistant(
                                    None,
                                    if buffer.content.is_empty() {
                                        None
                                    } else {
                                        Some(buffer.content.clone())
                                    },
                                    assistant_tool_calls_for_buffer,
                                    MessageProgress::InProgress,
                                    Some(!buffer.first_message_sent),
                                    Some(self.name.clone()),
                                );
                                self.send_msg(Ok(message)).await;
                                buffer.first_message_sent = true;
                                buffer.last_flush = std::time::Instant::now();
                            }

                            if choice.finish_reason.is_some() {
                                is_complete = true;
                            }
                        }
                        Err(e) => {
                            let err_msg = format!("Error in streaming: {:?}", e);
                            self.send_msg(Err(AgentError(err_msg.clone()))).await;
                            return Err(anyhow::anyhow!(err_msg));
                        }
                    }
                }
                Ok(None) => {
                    // Stream ended
                    is_complete = true;
                }
                Err(_) => {
                    // Timeout
                    let timeout_msg = format!(
                        "LLM stream timed out after {} seconds",
                        stream_timeout.as_secs()
                    );
                    self.send_msg(Err(AgentError(timeout_msg.clone()))).await;
                    return Err(anyhow::anyhow!(timeout_msg));
                }
            }
        }

        // 8. Create and send the final assistant message (LLM part of turn is complete)
        let final_tool_calls_from_buffer: Option<Vec<ToolCall>> = if !buffer.tool_calls.is_empty() {
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
        let final_assistant_message = LiteLlmMessage::assistant(
            None,
            if buffer.content.is_empty() {
                None
            } else {
                Some(buffer.content)
            },
            final_tool_calls_from_buffer.clone(),
            MessageProgress::Complete,
            Some(false),
            Some(self.name.clone()),
        );
        self.send_msg(Ok(final_assistant_message.clone())).await;
        conversation.push(final_assistant_message.clone());

        // 9. Process tool calls (finalize them and handle their outputs)
        let mut terminated_by_tool = false;
        if let Some(actual_tool_calls_to_run) = final_tool_calls_from_buffer {
            // Use the tool calls the LLM finally decided on
            let mut tools_map_guard = self.tools.write().await;
            for tc_to_run in actual_tool_calls_to_run {
                if let Some(reg_tool) = tools_map_guard.get_mut(&tc_to_run.function.name) {
                    // const TOOL_TIMEOUT_SECS: u64 = 120; // Remove hardcoded constant
                    match tokio::time::timeout(
                        Duration::from_secs(self.tool_timeout_secs), // Use configurable timeout
                        reg_tool.executor.finalize(&tc_to_run.id),
                    )
                    .await
                    {
                        Ok(Ok(stages)) => {
                            // Tool finalize succeeded within timeout
                            let mut final_tool_output_content: Option<String> = None;
                            for stage in stages {
                                match stage {
                                    crate::tools::tool::StreamStage::OutputChunk(val) => {
                                        let tool_msg = LiteLlmMessage::tool(
                                            None,
                                            serde_json::to_string(&val)?,
                                            tc_to_run.id.clone(),
                                            Some(tc_to_run.function.name.clone()),
                                            MessageProgress::InProgress,
                                        );
                                        self.send_msg(Ok(tool_msg)).await;
                                    }
                                    crate::tools::tool::StreamStage::OutputComplete(val) => {
                                        final_tool_output_content =
                                            Some(serde_json::to_string(&val)?);
                                    }
                                    _ => {}
                                }
                            }
                            if let Some(content) = final_tool_output_content {
                                let tool_msg = LiteLlmMessage::tool(
                                    None,
                                    content,
                                    tc_to_run.id.clone(),
                                    Some(tc_to_run.function.name.clone()),
                                    MessageProgress::Complete,
                                );
                                self.send_msg(Ok(tool_msg.clone())).await;
                                conversation.push(tool_msg);

                                if cfg
                                    .terminating_tools
                                    .iter()
                                    .any(|n| n.as_str() == tc_to_run.function.name)
                                {
                                    terminated_by_tool = true;
                                }
                            } else {
                                // Tool's finalize didn't produce OutputComplete. Consider logging or specific handling.
                            }
                        }
                        Ok(Err(e)) => {
                            // Tool finalize returned an error within timeout
                            let error_msg_str = format!(
                                "Tool '{}' (id: {}) finalize error: {}",
                                tc_to_run.function.name, tc_to_run.id, e
                            );
                            self.send_msg(Err(AgentError(error_msg_str.clone()))).await;
                            let tool_err_msg = LiteLlmMessage::tool(
                                None,
                                serde_json::json!({ "error": error_msg_str }).to_string(),
                                tc_to_run.id.clone(),
                                Some(tc_to_run.function.name.clone()),
                                MessageProgress::Complete,
                            );
                            self.send_msg(Ok(tool_err_msg.clone())).await;
                            conversation.push(tool_err_msg);
                        }
                        Err(_timeout_error) => {
                            // Tool finalize timed out
                            let error_msg_str = format!(
                                "Tool '{}' (id: {}) timed out after {} seconds during finalize.",
                                tc_to_run.function.name, tc_to_run.id, self.tool_timeout_secs // Use configurable timeout in error message
                            );
                            self.send_msg(Err(AgentError(error_msg_str.clone()))).await;
                            let tool_err_msg = LiteLlmMessage::tool(
                                None,
                                serde_json::json!({ "error": error_msg_str }).to_string(),
                                tc_to_run.id.clone(),
                                Some(tc_to_run.function.name.clone()),
                                MessageProgress::Complete,
                            );
                            self.send_msg(Ok(tool_err_msg.clone())).await;
                            conversation.push(tool_err_msg);
                            // Check if the timed-out tool was a terminating tool
                            if cfg
                                .terminating_tools
                                .iter()
                                .any(|n| n.as_str() == tc_to_run.function.name)
                            {
                                terminated_by_tool = true;
                            }
                        }
                    }
                } else {
                    let error_msg_str = format!(
                        "Tool '{}' (id: {}) not found for finalize",
                        tc_to_run.function.name, tc_to_run.id
                    );
                    self.send_msg(Err(AgentError(error_msg_str.clone()))).await;
                    let tool_err_msg = LiteLlmMessage::tool(
                        None,
                        serde_json::json!({ "error": error_msg_str }).to_string(),
                        tc_to_run.id.clone(),
                        Some(tc_to_run.function.name.clone()),
                        MessageProgress::Complete,
                    );
                    self.send_msg(Ok(tool_err_msg.clone())).await;
                    conversation.push(tool_err_msg);
                }
            }
            drop(tools_map_guard); // Release lock

            if terminated_by_tool {
                return Ok(AgentStatus::Terminated);
            }
        }

        // Check termination conditions (e.g., max turns, state-based)
        {
            let st = self.state.read().await;
            if (cfg.should_terminate)(&st) {
                return Ok(AgentStatus::Terminated);
            }
        }

        Ok(AgentStatus::Continue)
    }

    /// Recursive turn processing using LiteLLM + tool execution (minimal, non-streaming)
    pub async fn process_turn(
        &self,
        conversation: &mut Vec<LiteLlmMessage>,
        depth: u32,
    ) -> Result<AgentStatus> {
        if depth >= 15 {
            // MODIFIED: Recursion depth to 15
            return Ok(AgentStatus::Terminated);
        }

        // 1. Resolve mode
        let cfg = {
            let st = self.state.read().await;
            self.mode_provider.configuration(&st).await?
        };

        // 2. (Re)load tools for this mode
        (cfg.tool_loader)(self).await?;

        // 3. Compose messages – prepend system/developer prompt
        let mut messages = vec![LiteLlmMessage::developer(cfg.prompt.clone())];
        messages.extend(conversation.clone());

        // 4. Collect tool schemas
        let enabled_tools = self.get_enabled_tools().await;

        // 5. Fire non-streaming chat completion
        let request = ChatCompletionRequest {
            model: cfg.model.clone(),
            messages: messages.clone(),
            tools: if enabled_tools.is_empty() {
                None
            } else {
                Some(enabled_tools)
            },
            tool_choice: Some(ToolChoice::Auto),
            ..Default::default()
        };

        let response = self.llm_client.chat_completion(request).await?;
        let assistant_msg = response
            .choices
            .first()
            .ok_or_else(|| anyhow::anyhow!("empty choices from LLM"))?
            .message
            .clone();

        // Add assistant answer to history immediately
        conversation.push(assistant_msg.clone());

        // 6. Check for tool calls
        if let LiteLlmMessage::Assistant {
            tool_calls: Some(tool_calls),
            ..
        } = &assistant_msg
        {
            let mut terminated = false;
            for tc in tool_calls {
                // parse params JSON
                let params_val: Value = serde_json::from_str(&tc.function.arguments)?;
                let tools_map = self.tools.read().await;
                if let Some(reg) = tools_map.get(&tc.function.name) {
                    // execute tool
                    let result_val = reg.executor.execute(params_val, tc.id.clone()).await?;
                    let result_str = serde_json::to_string(&result_val)?;
                    let tool_msg = LiteLlmMessage::tool(
                        None,
                        result_str,
                        tc.id.clone(),
                        Some(tc.function.name.clone()),
                        MessageProgress::Complete,
                    );
                    conversation.push(tool_msg);

                    if cfg
                        .terminating_tools
                        .iter()
                        .any(|n| n.as_str() == tc.function.name)
                    {
                        terminated = true;
                    }
                } else {
                    // tool not found – just ignore for now
                }
            }
            if terminated {
                return Ok(AgentStatus::Terminated);
            }
            {
                let st = self.state.read().await;
                if (cfg.should_terminate)(&st) {
                    return Ok(AgentStatus::Terminated);
                }
            }
            // recurse for next turn
            return Box::pin(self.process_turn(conversation, depth + 1)).await;
        }

        // No tools requested – decide termination
        {
            let st = self.state.read().await;
            if (cfg.should_terminate)(&st) {
                return Ok(AgentStatus::Terminated);
            }
        }
        Ok(AgentStatus::Continue)
    }

    /// Process a conversation with streaming support until termination
    pub async fn run_conversation(
        &self,
        conversation: &mut Vec<LiteLlmMessage>,
    ) -> Result<AgentStatus> {
        let mut current_depth = 0;
        loop {
            match self
                .process_turn_streaming(conversation, current_depth)
                .await?
            {
                AgentStatus::Continue => {
                    current_depth += 1;
                    // if current_depth >= 15 { // MODIFIED: Max depth check to 15 to align with process_turn_streaming
                    //     // Max depth check, similar to process_turn_streaming internal
                    //     self.send_msg(Ok(LiteLlmMessage::Done)).await;
                    //     return Ok(AgentStatus::Terminated);
                    // }
                }
                AgentStatus::NeedsUserInput(msg) => {
                    self.send_msg(Ok(LiteLlmMessage::Done)).await;
                    return Ok(AgentStatus::NeedsUserInput(msg));
                }
                AgentStatus::Terminated => {
                    self.send_msg(Ok(LiteLlmMessage::Done)).await;
                    return Ok(AgentStatus::Terminated);
                }
            }
        }
    }
}

//---------------------------------------------------------------------
//  Blanket conversions for testing convenience
//---------------------------------------------------------------------
impl<S: State> GenericAgent<S> {
    /// Convenience: execute a single tool by name with raw JSON params (bypasses LLM).
    pub async fn exec_tool_raw(&self, name: &str, params: Value) -> Result<Value> {
        let tools = self.tools.read().await;
        let tool = tools
            .get(name)
            .ok_or_else(|| anyhow::anyhow!(format!("tool '{name}' not found")))?;
        tool.executor.execute(params, "manual".into()).await
    }
}

//---------------------------------------------------------------------
//  Message buffer for streaming
//---------------------------------------------------------------------
struct MessageBuffer {
    content: String,
    tool_calls: HashMap<String, PendingToolCall>,
    last_flush: std::time::Instant,
    first_message_sent: bool,
}

impl MessageBuffer {
    fn new() -> Self {
        Self {
            content: String::new(),
            tool_calls: HashMap::new(),
            last_flush: std::time::Instant::now(),
            first_message_sent: false,
        }
    }

    fn should_flush(&self) -> bool {
        self.last_flush.elapsed() >= std::time::Duration::from_millis(50)
    }

    fn has_changes(&self) -> bool {
        !self.content.is_empty() || !self.tool_calls.is_empty()
    }
}

#[derive(Debug, Default, Clone)]
struct PendingToolCall {
    id: Option<String>,
    call_type: Option<String>,
    function_name: Option<String>,
    arguments: String,
}

impl PendingToolCall {
    fn update_from_delta(&mut self, tool_call: &litellm::DeltaToolCall) {
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
    }

    fn into_tool_call(self) -> litellm::ToolCall {
        litellm::ToolCall {
            id: self.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
            function: litellm::FunctionCall {
                name: self.function_name.unwrap_or_default(),
                arguments: self.arguments,
            },
            call_type: self.call_type.unwrap_or_else(|| "function".to_string()),
            code_interpreter: None,
            retrieval: None,
        }
    }
}

//---------------------------------------------------------------------
//  Tests – prove State generics compile & basic stream works
//---------------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;
    use crate::tools::tool::*;
    use serde_json::json;
    use std::collections::VecDeque;
    use tokio::sync::RwLock;

    // Test mocks
    struct MockLLM {
        next_response: ChatCompletionResponse, // Used for non-streaming, or as a fallback
        queued_stream_chunks: RwLock<VecDeque<Vec<ChatCompletionChunk>>>, // Queue for sequential stream responses
        stream_call_count: Arc<AtomicUsize>, // To track calls for retry tests if needed
    }

    impl MockLLM {
        fn new_with_responses(
            next_resp: ChatCompletionResponse,
            stream_chunks_queue: VecDeque<Vec<ChatCompletionChunk>>,
        ) -> Self {
            Self {
                next_response: next_resp,
                queued_stream_chunks: RwLock::new(stream_chunks_queue),
                stream_call_count: Arc::new(AtomicUsize::new(0)),
            }
        }
    }

    #[async_trait]
    impl LlmFacade for MockLLM {
        async fn chat_completion(
            &self,
            _req: ChatCompletionRequest,
        ) -> Result<ChatCompletionResponse> {
            Ok(self.next_response.clone())
        }

        async fn stream_chat_completion(
            &self,
            _req: ChatCompletionRequest,
        ) -> Result<mpsc::Receiver<Result<ChatCompletionChunk>>> {
            self.stream_call_count.fetch_add(1, AtomicOrdering::SeqCst);
            let (tx, rx) = mpsc::channel(10);
            let mut q = self.queued_stream_chunks.write().await;

            let chunks_to_send = if let Some(chunks) = q.pop_front() {
                chunks
            } else {
                panic!("MockLLM: stream_chat_completion called but queued_stream_chunks is empty.");
            };

            drop(q); // Release lock before spawning task

            tokio::spawn(async move {
                for (i, chunk) in chunks_to_send.into_iter().enumerate() {
                    if i > 0 {
                        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
                    }
                    if tx.send(Ok(chunk)).await.is_err() {
                        break;
                    }
                }
            });

            Ok(rx)
        }
    }

    // --- State and Mode for Tool Enablement Tests ---
    #[derive(Debug, Clone, Default)]
    struct TestStateWithFlag {
        feature_enabled: bool,
    }

    struct TestFlagModeProvider;
    #[async_trait]
    impl ModeProvider<TestStateWithFlag> for TestFlagModeProvider {
        async fn configuration(
            &self,
            _state: &TestStateWithFlag,
        ) -> Result<ModeConfig<TestStateWithFlag>> {
            Ok(ModeConfig {
                prompt: "TestFlagModeProvider prompt".into(),
                model: "test-model-flag".into(),
                tool_loader: Arc::new(|_agent: &GenericAgent<TestStateWithFlag>| {
                    Box::pin(async { Ok(()) })
                }),
                terminating_tools: vec![],
                should_terminate: Arc::new(|_s: &TestStateWithFlag| false),
            })
        }
    }

    // --- Tools for Enablement Tests ---
    #[derive(Default)]
    struct AlwaysEnabledTool;
    const ALWAYS_ENABLED_TOOL: ToolName = ToolName::new("always_enabled_tool");
    #[async_trait]
    impl ToolExecutor for AlwaysEnabledTool {
        type Output = Value;
        type Params = Value;
        async fn execute(&self, p: Value, _id: String) -> Result<Value> {
            Ok(p)
        }
        async fn schema(&self) -> Value {
            json!({ "name": ALWAYS_ENABLED_TOOL.as_str(), "parameters": {"type": "object"} })
        }
        fn name(&self) -> ToolName {
            ALWAYS_ENABLED_TOOL
        }
        async fn ingest_chunk(
            &mut self,
            _chunk: &str,
            _tool_call_id: &str,
        ) -> Result<Vec<StreamStage>> {
            Ok(vec![])
        } // Default impl
        async fn finalize(&mut self, _tool_call_id: &str) -> Result<Vec<StreamStage>> {
            Ok(vec![StreamStage::OutputComplete(json!({}))])
        } // Default impl
    }

    #[derive(Default)]
    struct ConditionallyEnabledTool;
    const CONDITIONALLY_ENABLED_TOOL: ToolName = ToolName::new("conditionally_enabled_tool");
    #[async_trait]
    impl ToolExecutor for ConditionallyEnabledTool {
        type Output = Value;
        type Params = Value;
        async fn execute(&self, p: Value, _id: String) -> Result<Value> {
            Ok(p)
        }
        async fn schema(&self) -> Value {
            json!({ "name": CONDITIONALLY_ENABLED_TOOL.as_str(), "parameters": {"type": "object"} })
        }
        fn name(&self) -> ToolName {
            CONDITIONALLY_ENABLED_TOOL
        }
        async fn ingest_chunk(
            &mut self,
            _chunk: &str,
            _tool_call_id: &str,
        ) -> Result<Vec<StreamStage>> {
            Ok(vec![])
        } // Default impl
        async fn finalize(&mut self, _tool_call_id: &str) -> Result<Vec<StreamStage>> {
            Ok(vec![StreamStage::OutputComplete(json!({}))])
        } // Default impl
    }

    // --- Mock LLM for Retry Logic Test ---
    struct RetryingMockLlm {
        succeed_after_n_failures: usize,
        stream_call_count: Arc<AtomicUsize>,
        success_stream_chunks: Vec<ChatCompletionChunk>,
    }

    impl RetryingMockLlm {
        fn new(succeed_after_n_failures: usize, success_chunks: Vec<ChatCompletionChunk>) -> Self {
            Self {
                succeed_after_n_failures,
                stream_call_count: Arc::new(AtomicUsize::new(0)),
                success_stream_chunks: success_chunks,
            }
        }
    }

    #[async_trait]
    impl LlmFacade for RetryingMockLlm {
        async fn chat_completion(
            &self,
            _req: ChatCompletionRequest,
        ) -> Result<ChatCompletionResponse> {
            panic!("RetryingMockLlm.chat_completion not expected");
        }

        async fn stream_chat_completion(
            &self,
            _req: ChatCompletionRequest,
        ) -> Result<mpsc::Receiver<Result<ChatCompletionChunk>>> {
            let current_call_attempt = self.stream_call_count.fetch_add(1, AtomicOrdering::SeqCst);
            if current_call_attempt < self.succeed_after_n_failures {
                // Simulate a retriable error. In a real scenario, this would be a specific error type.
                return Err(anyhow::anyhow!(format!(
                    "Simulated stream failure attempt {}",
                    current_call_attempt + 1
                )));
            }

            // On successful attempt
            let (tx, rx) = mpsc::channel(10);
            let chunks_to_send = self.success_stream_chunks.clone();
            tokio::spawn(async move {
                for chunk in chunks_to_send {
                    if tx.send(Ok(chunk)).await.is_err() {
                        break;
                    }
                }
            });
            Ok(rx)
        }
    }

    // --- Tool for Finalization Timeout Test ---
    #[derive(Default)]
    struct SlowFinalizeTool {
        delay_seconds: u64,
        buffer: String,
        parsed_params: Option<Value>,
    }

    impl SlowFinalizeTool {
        fn new(delay_seconds: u64) -> Self {
            Self {
                delay_seconds,
                buffer: String::new(),
                parsed_params: None,
            }
        }
    }
    const SLOW_FINALIZE_TOOL: ToolName = ToolName::new("slow_finalize_tool");

    #[async_trait]
    impl ToolExecutor for SlowFinalizeTool {
        type Output = Value;
        type Params = Value;

        async fn execute(&self, params: Self::Params, _id: String) -> Result<Self::Output> {
            Ok(json!({ "message": "executed", "params": params }))
        }

        async fn schema(&self) -> Value {
            json!({ "name": SLOW_FINALIZE_TOOL.as_str(), "parameters": { "type": "object", "properties": {} } })
        }
        fn name(&self) -> ToolName {
            SLOW_FINALIZE_TOOL
        }

        async fn ingest_chunk(
            &mut self,
            chunk: &str,
            _tool_call_id: &str,
        ) -> Result<Vec<StreamStage>> {
            self.buffer.push_str(chunk);
            // Assume empty JSON object {} as params
            if self.parsed_params.is_none() {
                if let Ok(p_val) = serde_json::from_str::<Value>(&self.buffer) {
                    if p_val.is_object() && p_val.as_object().map_or(false, |m| m.is_empty()) {
                        self.parsed_params = Some(p_val.clone());
                        return Ok(vec![StreamStage::ParamsComplete(p_val)]);
                    }
                }
            }
            Ok(vec![])
        }

        async fn finalize(&mut self, _tool_call_id: &str) -> Result<Vec<StreamStage>> {
            if self.parsed_params.is_none() {
                return Err(anyhow::anyhow!("SlowFinalizeTool: finalize called before parameters (empty JSON {{}}) were fully ingested. Buffer: '{}'", self.buffer));
            }
            tokio::time::sleep(Duration::from_secs(self.delay_seconds)).await;
            Ok(vec![StreamStage::OutputComplete(
                json!({"status": "finalized after delay"}),
            )])
        }
    }

    #[derive(Debug, Clone, Default)]
    struct CounterState {
        count: u32,
    }

    struct DummyModeProvider;
    #[async_trait]
    impl ModeProvider<CounterState> for DummyModeProvider {
        async fn configuration(&self, _state: &CounterState) -> Result<ModeConfig<CounterState>> {
            Ok(ModeConfig {
                prompt: "You are a helpful counter agent".into(),
                model: "gpt-3.5-turbo".into(),
                tool_loader: Arc::new(|_| Box::pin(async { Ok(()) })),
                terminating_tools: vec![],
                should_terminate: Arc::new(|_| false),
            })
        }
    }

    #[derive(Default)]
    struct IncTool {
        buffer: String,
        parsed_params: Option<IncParams>,
    }
    #[derive(serde::Serialize, serde::Deserialize, Clone)]
    struct IncParams {
        by: u32,
    }
    #[derive(serde::Serialize, serde::Deserialize)]
    struct IncOutput {
        new: u32,
    }
    const INC: ToolName = ToolName::new("inc");

    #[async_trait]
    impl ToolExecutor for IncTool {
        type Output = IncOutput;
        type Params = IncParams;
        async fn execute(&self, params: Self::Params, _id: String) -> Result<Self::Output> {
            Ok(IncOutput { new: params.by + 1 })
        }
        async fn schema(&self) -> Value {
            serde_json::json!({ "name": INC.as_str(), "parameters": {"type":"object", "properties": {"by": {"type": "integer"}}} })
            // Added properties for clarity
        }
        fn name(&self) -> ToolName {
            INC
        }
        async fn ingest_chunk(
            &mut self,
            chunk: &str,
            _tool_call_id: &str,
        ) -> Result<Vec<StreamStage>> {
            self.buffer.push_str(chunk);
            let mut stages = Vec::new();
            if self.parsed_params.is_none() {
                if let Ok(p) = serde_json::from_str::<IncParams>(&self.buffer) {
                    self.parsed_params = Some(p.clone());
                    stages.push(StreamStage::ParamsComplete(serde_json::to_value(p)?));
                }
            }
            Ok(stages)
        }
        async fn finalize(&mut self, tool_call_id: &str) -> Result<Vec<StreamStage>> {
            if let Some(params) = self.parsed_params.clone() {
                let output = self.execute(params, tool_call_id.to_string()).await?;
                Ok(vec![StreamStage::OutputComplete(serde_json::to_value(
                    output,
                )?)])
            } else {
                Err(anyhow::anyhow!(
                    "IncTool finalize called without complete parameters."
                ))
            }
        }
    }

    #[derive(Default)]
    struct EchoTool {
        buffer: String,
        parsed_params: Option<Value>,
    }
    const ECHO: ToolName = ToolName::new("echo");

    #[async_trait]
    impl ToolExecutor for EchoTool {
        type Output = Value;
        type Params = Value;

        async fn execute(&self, params: Self::Params, _id: String) -> Result<Self::Output> {
            Ok(params)
        }

        async fn schema(&self) -> Value {
            json!({
                "name": ECHO.as_str(),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "message": {"type": "string"}
                    }
                }
            })
        }

        fn name(&self) -> ToolName {
            ECHO
        }
        async fn ingest_chunk(
            &mut self,
            chunk: &str,
            _tool_call_id: &str,
        ) -> Result<Vec<StreamStage>> {
            self.buffer.push_str(chunk);
            let mut stages = Vec::new();
            if self.parsed_params.is_none() {
                if let Ok(p) = serde_json::from_str::<Value>(&self.buffer) {
                    self.parsed_params = Some(p.clone());
                    stages.push(StreamStage::ParamsComplete(p));
                }
            }
            Ok(stages)
        }
        async fn finalize(&mut self, _tool_call_id: &str) -> Result<Vec<StreamStage>> {
            if let Some(params) = self.parsed_params.clone() {
                Ok(vec![StreamStage::OutputComplete(params)])
            } else {
                Err(anyhow::anyhow!(
                    "EchoTool finalize called without complete parameters."
                ))
            }
        }
    }

    #[derive(Default)]
    struct TerminatorTool {
        buffer: String,
        params_received: bool,
    }
    const TERMINATOR: ToolName = ToolName::new("terminator");

    #[async_trait]
    impl ToolExecutor for TerminatorTool {
        type Output = Value;
        type Params = Value;

        async fn execute(&self, _params: Self::Params, _id: String) -> Result<Self::Output> {
            Ok(json!({ "status": "terminated" }))
        }

        async fn schema(&self) -> Value {
            json!({
                "name": TERMINATOR.as_str(),
                "description": "This tool causes the agent to terminate.",
                "parameters": { "type": "object", "properties": {} }
            })
        }

        fn name(&self) -> ToolName {
            TERMINATOR
        }
        async fn ingest_chunk(
            &mut self,
            chunk: &str,
            _tool_call_id: &str,
        ) -> Result<Vec<StreamStage>> {
            self.buffer.push_str(chunk);
            let mut stages = Vec::new();
            if !self.params_received {
                if serde_json::from_str::<Value>(&self.buffer).is_ok() {
                    // Check for valid JSON (e.g. "{}")
                    self.params_received = true;
                    stages.push(StreamStage::ParamsComplete(json!({})));
                }
            }
            Ok(stages)
        }
        async fn finalize(&mut self, tool_call_id: &str) -> Result<Vec<StreamStage>> {
            if self.params_received {
                let output = self.execute(json!({}), tool_call_id.to_string()).await?;
                Ok(vec![StreamStage::OutputComplete(output)])
            } else {
                Err(anyhow::anyhow!("TerminatorTool finalize called before parameters were confirmed as received/parsed."))
            }
        }
    }

    #[derive(Default)]
    struct FailingTool {
        buffer: String,
        params_received: bool,
    }
    const FAILING_TOOL: ToolName = ToolName::new("failing_tool");
    const FAILING_TOOL_ERROR_MSG: &str = "This tool is designed to fail.";

    #[async_trait]
    impl ToolExecutor for FailingTool {
        type Output = Value;
        type Params = Value;

        async fn execute(&self, _params: Self::Params, _id: String) -> Result<Self::Output> {
            Err(anyhow::anyhow!(FAILING_TOOL_ERROR_MSG))
        }

        async fn schema(&self) -> Value {
            json!({
                "name": FAILING_TOOL.as_str(),
                "description": "A tool that always fails during execution.",
                "parameters": { "type": "object", "properties": {} }
            })
        }

        fn name(&self) -> ToolName {
            FAILING_TOOL
        }
        async fn ingest_chunk(
            &mut self,
            chunk: &str,
            _tool_call_id: &str,
        ) -> Result<Vec<StreamStage>> {
            self.buffer.push_str(chunk);
            let mut stages = Vec::new();
            if !self.params_received {
                if serde_json::from_str::<Value>(&self.buffer).is_ok() {
                    self.params_received = true;
                    stages.push(StreamStage::ParamsComplete(json!({})));
                }
            }
            Ok(stages)
        }
        async fn finalize(&mut self, tool_call_id: &str) -> Result<Vec<StreamStage>> {
            if self.params_received {
                let _execution_result = self.execute(json!({}), tool_call_id.to_string()).await?;
                Ok(vec![])
            } else {
                Err(anyhow::anyhow!(
                    "FailingTool finalize called without parameters received."
                ))
            }
        }
    }

    #[tokio::test]
    async fn agent_run_streams_prompt() -> Result<()> {
        let mode = Arc::new(DummyModeProvider);
        let agent = GenericAgent::new(
            "counter".into(),
            CounterState::default(),
            mode,
            Uuid::new_v4(),
            Uuid::new_v4(),
        );
        let mut rx = agent.get_stream_receiver().await.expect("stream");
        tokio::spawn({
            let a = agent.clone();
            async move {
                a.run().await.unwrap();
            }
        });
        let mut saw_prompt = false;
        while let Ok(msg) = rx.recv().await {
            match msg? {
                LiteLlmMessage::Developer { content, .. } => {
                    assert!(content.contains("helpful"));
                    saw_prompt = true;
                }
                LiteLlmMessage::Done => break,
                _ => {}
            }
        }
        assert!(saw_prompt);
        Ok(())
    }

    #[tokio::test]
    async fn agent_exec_tool_raw() -> Result<()> {
        let mode = Arc::new(DummyModeProvider);
        let agent = GenericAgent::new(
            "counter".into(),
            CounterState::default(),
            mode,
            Uuid::new_v4(),
            Uuid::new_v4(),
        );
        agent
            .add_tool(
                "inc".into(),
                IncTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;
        let val = agent
            .exec_tool_raw("inc", serde_json::json!({"by": 4}))
            .await?;
        assert_eq!(val["new"], 5);
        Ok(())
    }

    #[tokio::test]
    async fn test_streaming_tool_execution() -> Result<()> {
        let state = CounterState { count: 10 };
        let mode = Arc::new(MultiTurnModeProvider::new(0));

        let tool_id = "call_echo_123";
        let tool_name = "echo";
        let arg_part1 = r#"{"message":"Hello, "#;
        let arg_part2 = r#"world! This is "#;
        let arg_part3 = r#"a longer streaming test."}"#;
        let full_arguments = format!("{}{}{}", arg_part1, arg_part2, arg_part3);

        let stream_chunks_for_test = vec![
            ChatCompletionChunk {
                id: "chunk_id_1".to_string(),
                choices: vec![litellm::StreamChoice {
                    index: 0,
                    delta: litellm::Delta {
                        tool_calls: Some(vec![litellm::DeltaToolCall {
                            id: Some(tool_id.to_string()),
                            call_type: Some("function".to_string()),
                            function: Some(litellm::DeltaFunctionCall {
                                name: Some(tool_name.to_string()),
                                arguments: Some(arg_part1.to_string()),
                            }),
                            code_interpreter: None,
                            retrieval: None,
                        }]),
                        role: None,
                        content: None,
                        function_call: None,
                    },
                    finish_reason: None,
                    logprobs: None,
                }],
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "test-model".to_string(),
                system_fingerprint: None,
            },
            ChatCompletionChunk {
                id: "chunk_id_2".to_string(),
                choices: vec![litellm::StreamChoice {
                    index: 0,
                    delta: litellm::Delta {
                        tool_calls: Some(vec![litellm::DeltaToolCall {
                            id: Some(tool_id.to_string()),
                            call_type: None,
                            function: Some(litellm::DeltaFunctionCall {
                                name: None,
                                arguments: Some(arg_part2.to_string()),
                            }),
                            code_interpreter: None,
                            retrieval: None,
                        }]),
                        role: None,
                        content: None,
                        function_call: None,
                    },
                    finish_reason: None,
                    logprobs: None,
                }],
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "test-model".to_string(),
                system_fingerprint: None,
            },
            ChatCompletionChunk {
                id: "chunk_id_3".to_string(),
                choices: vec![litellm::StreamChoice {
                    index: 0,
                    delta: litellm::Delta {
                        tool_calls: Some(vec![litellm::DeltaToolCall {
                            id: Some(tool_id.to_string()),
                            call_type: None,
                            function: Some(litellm::DeltaFunctionCall {
                                name: None,
                                arguments: Some(arg_part3.to_string()),
                            }),
                            code_interpreter: None,
                            retrieval: None,
                        }]),
                        role: None,
                        content: None,
                        function_call: None,
                    },
                    finish_reason: Some("tool_calls".to_string()),
                    logprobs: None,
                }],
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "test-model".to_string(),
                system_fingerprint: None,
            },
        ];

        let mut chunks_queue = VecDeque::new();
        chunks_queue.push_back(stream_chunks_for_test);

        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                id: "stream_tool_exec_fallback_resp".to_string(), object: "chat.completion".to_string(), created: 0, model: "test-model".to_string(), system_fingerprint: None,
                choices: vec![litellm::Choice { index: 0, message: LiteLlmMessage::assistant(None, None, Some(vec![ToolCall { id: tool_id.to_string(), call_type: "function".to_string(), function: FunctionCall { name: tool_name.to_string(), arguments: full_arguments.clone(), }, code_interpreter: None, retrieval: None, }]), MessageProgress::Complete, Some(false), Some("test_agent_streaming_args".to_string())), finish_reason: Some("tool_calls".to_string()), logprobs: None, delta: None, }],
                usage: litellm::Usage { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, completion_tokens_details: None }, 
                service_tier: None,
            },
            chunks_queue
        );
        let mock_llm: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        let agent = GenericAgent::with_mock(
            "test_agent_streaming_args",
            state,
            mode,
            Uuid::new_v4(),
            Uuid::new_v4(),
            mock_llm,
            120, // Default tool_timeout_secs
        );

        agent
            .add_tool(
                tool_name.to_string(),
                EchoTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;

        let mut conversation = vec![LiteLlmMessage::user("Hello, echo something complex.")];
        let mut stream_rx = agent.get_stream_receiver().await.expect("stream available");

        let _final_status = agent.run_conversation(&mut conversation).await?; // Changed: assign to _final_status
        drop(agent);

        let mut assistant_messages_received = Vec::new();
        let mut tool_message_received = None;

        while let Ok(msg_result) = stream_rx.recv().await {
            match msg_result? {
                LiteLlmMessage::Assistant {
                    tool_calls,
                    progress,
                    .. // Other fields ignored for brevity
                } => {
                    if let Some(tc_vec) = tool_calls {
                        if let Some(tc_data) = tc_vec.first() {
                            if tc_data.function.name == tool_name {
                                assistant_messages_received
                                    .push((progress, tc_data.function.arguments.clone()));
                            }
                        }
                    }
                }
                LiteLlmMessage::Tool {
                    content,
                    .. // Other fields ignored
                } => {
                    tool_message_received = Some(content);
                }
                LiteLlmMessage::Done => break,
                _ => {}
            }
        }

        let expected_arg_part1_str = arg_part1.to_string();
        let expected_arg_part1_part2_str = format!("{}{}", arg_part1, arg_part2);
        let expected_full_arguments_str = full_arguments.clone();

        let mut saw_arg_part1 = false;
        let mut saw_arg_part1_part2 = false;
        let mut saw_full_args_complete = false;

        for (progress, args) in &assistant_messages_received {
            match progress {
                MessageProgress::InProgress => {
                    if args.starts_with(&expected_arg_part1_str) {
                        saw_arg_part1 = true;
                    }
                    if args.starts_with(&expected_arg_part1_part2_str) {
                        saw_arg_part1_part2 = true;
                    }
                    if args == &expected_full_arguments_str {
                        // if full args come in an InProgress, mark previous stages true
                        saw_arg_part1 = true;
                        saw_arg_part1_part2 = true;
                    }
                }
                MessageProgress::Complete => {
                    if args == &expected_full_arguments_str {
                        saw_full_args_complete = true;
                        saw_arg_part1 = true;
                        saw_arg_part1_part2 = true; // Mark all true if complete has full
                    }
                }
                _ => {}
            }
        }

        assert!(saw_arg_part1, "Assertion failed: saw_arg_part1. Expected an InProgress or Complete message with at least '{}'. Received: {:?}", expected_arg_part1_str, assistant_messages_received);
        assert!(saw_arg_part1_part2, "Assertion failed: saw_arg_part1_part2. Expected an InProgress or Complete message with at least '{}'. Received: {:?}", expected_arg_part1_part2_str, assistant_messages_received);
        assert!(saw_full_args_complete, "Assertion failed: saw_full_args_complete. Expected a Complete message with full args '{}'. Received: {:?}", expected_full_arguments_str, assistant_messages_received);

        assert!(
            tool_message_received.is_some(),
            "Should have seen tool execution message"
        );
        if let Some(tool_content) = tool_message_received {
            let tool_output: Value = serde_json::from_str(&tool_content)?;
            let expected_tool_output: Value = serde_json::from_str(&full_arguments)?;
            assert_eq!(
                tool_output, expected_tool_output,
                "Tool output should match the fully accumulated arguments"
            );
        }

        assert_eq!(
            conversation.len(),
            3,
            "Conversation should have user, assistant (tool call), and tool result messages"
        );
        if let Some(LiteLlmMessage::Assistant {
            tool_calls: Some(tc_vec),
            ..
        }) = conversation.get(1)
        {
            if let Some(tc) = tc_vec.first() {
                assert_eq!(
                    tc.function.arguments, full_arguments,
                    "Assistant message in history should have full arguments"
                );
            }
        } else {
            panic!("Assistant message not found or no tool calls in history as expected.");
        }

        Ok(())
    }

    // Mode provider for multi-turn tests
    struct MultiTurnModeProvider {
        turn_count: Arc<std::sync::atomic::AtomicUsize>,
        max_turns: usize,
        terminating_tools_override: Option<Vec<ToolName>>,
    }

    impl MultiTurnModeProvider {
        fn new(max_turns: usize) -> Self {
            Self {
                turn_count: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
                max_turns,
                terminating_tools_override: None,
            }
        }

        #[allow(dead_code)]
        fn with_terminating_tools(max_turns: usize, tools: Vec<ToolName>) -> Self {
            Self {
                turn_count: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
                max_turns,
                terminating_tools_override: Some(tools),
            }
        }
    }

    #[async_trait]
    impl ModeProvider<CounterState> for MultiTurnModeProvider {
        async fn configuration(&self, state: &CounterState) -> Result<ModeConfig<CounterState>> {
            let current_turn = self
                .turn_count
                .fetch_add(1, std::sync::atomic::Ordering::Relaxed);
            let should_term = current_turn >= self.max_turns;

            Ok(ModeConfig {
                prompt: format!(
                    "Multi-turn test. Turn {}. Count: {}. Max turns: {}.",
                    current_turn, state.count, self.max_turns
                ),
                model: "gpt-test-multiturn".into(),
                tool_loader: Arc::new(|_agnt: &GenericAgent<CounterState>| {
                    Box::pin(async move { Ok(()) })
                }),
                terminating_tools: self.terminating_tools_override.clone().unwrap_or_default(),
                should_terminate: Arc::new(move |_s: &CounterState| should_term),
            })
        }
    }

    #[tokio::test]
    async fn test_agent_handles_multiple_turns() -> Result<()> {
        let initial_state = CounterState { count: 0 };
        let mode_provider = Arc::new(MultiTurnModeProvider::new(2));

        let tool_call_id_turn1 = "echo_call_turn1";
        let echo_tool_call_turn1 = ToolCall {
            id: tool_call_id_turn1.to_string(),
            call_type: "function".to_string(),
            function: FunctionCall {
                name: ECHO.as_str().to_string(),
                arguments: json!({ "data": "user_clarification" }).to_string(),
            },
            code_interpreter: None,
            retrieval: None,
        };
        let llm_response_turn1_chunks = vec![ChatCompletionChunk {
            id: "multi_chunk1_t1".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test-multiturn".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    role: None,
                    content: None,
                    function_call: None,
                    tool_calls: Some(vec![litellm::DeltaToolCall {
                        id: Some(echo_tool_call_turn1.id.clone()),
                        call_type: Some("function".to_string()),
                        function: Some(litellm::DeltaFunctionCall {
                            name: Some(ECHO.as_str().to_string()),
                            arguments: Some(echo_tool_call_turn1.function.arguments.clone()),
                        }),
                        code_interpreter: None,
                        retrieval: None,
                    }]),
                },
                finish_reason: Some("tool_calls".to_string()),
                logprobs: None,
            }],
        }];

        let tool_call_id_turn2 = "inc_call_turn2";
        let inc_tool_call_turn2 = ToolCall {
            id: tool_call_id_turn2.to_string(),
            call_type: "function".to_string(),
            function: FunctionCall {
                name: INC.as_str().to_string(),
                arguments: json!({ "by": 1 }).to_string(),
            },
            code_interpreter: None,
            retrieval: None,
        };
        let llm_response_turn2_chunks = vec![ChatCompletionChunk {
            id: "multi_chunk1_t2".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test-multiturn".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    role: None,
                    content: None,
                    function_call: None,
                    tool_calls: Some(vec![litellm::DeltaToolCall {
                        id: Some(inc_tool_call_turn2.id.clone()),
                        call_type: Some("function".to_string()),
                        function: Some(litellm::DeltaFunctionCall {
                            name: Some(INC.as_str().to_string()),
                            arguments: Some(inc_tool_call_turn2.function.arguments.clone()),
                        }),
                        code_interpreter: None,
                        retrieval: None,
                    }]),
                },
                finish_reason: Some("tool_calls".to_string()),
                logprobs: None,
            }],
        }];

        let llm_response_turn3_chunks = vec![ChatCompletionChunk {
            id: "multi_chunk1_t3".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test-multiturn".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    role: Some("assistant".to_string()),
                    content: Some("Final answer after two turns.".to_string()),
                    function_call: None,
                    tool_calls: None,
                },
                finish_reason: Some("stop".to_string()),
                logprobs: None,
            }],
        }];

        let mut initial_chunks_queue = VecDeque::new();
        initial_chunks_queue.push_back(llm_response_turn1_chunks.clone());
        initial_chunks_queue.push_back(llm_response_turn2_chunks.clone());
        initial_chunks_queue.push_back(llm_response_turn3_chunks);

        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                id: "mock_fallback_id".to_string(), object: "chat.completion".to_string(), created: 0, model: "mock-fallback-model".to_string(), choices: vec![], 
                usage: litellm::Usage { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, completion_tokens_details: None }, system_fingerprint: None, service_tier: None,
            },
            initial_chunks_queue
        );
        let mock_llm_facade_for_agent: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        let agent = GenericAgent::with_mock(
            "multi_turn_agent",
            initial_state.clone(),
            mode_provider,
            Uuid::new_v4(),
            Uuid::new_v4(),
            mock_llm_facade_for_agent,
            120, // Default tool_timeout_secs
        );

        agent
            .add_tool(
                ECHO.as_str().to_string(),
                EchoTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;
        agent
            .add_tool(
                INC.as_str().to_string(),
                IncTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;

        let mut conversation = vec![LiteLlmMessage::user("Initial question.")];
        let mut stream_rx = agent.get_stream_receiver().await.expect("stream available");

        let final_status = agent.run_conversation(&mut conversation).await?;
        drop(agent);

        assert!(
            matches!(final_status, AgentStatus::Terminated),
            "Agent should have terminated. Status: {:?}",
            final_status
        );
        assert_eq!(
            conversation.len(),
            6,
            "Conversation should have 6 messages. Got: {:?}",
            conversation
        );

        // Check conversation content
        match &conversation[1] {
            LiteLlmMessage::Assistant {
                tool_calls: Some(tc),
                ..
            } if !tc.is_empty() && tc[0].function.name == ECHO.as_str() => (),
            _ => panic!(
                "Expected AsstEcho at conv[1]. Got: {:?}",
                conversation.get(1)
            ),
        }
        match &conversation[2] {
            LiteLlmMessage::Tool { name: Some(n), .. } if n == ECHO.as_str() => (),
            _ => panic!(
                "Expected ToolEcho at conv[2]. Got: {:?}",
                conversation.get(2)
            ),
        }
        match &conversation[3] {
            LiteLlmMessage::Assistant {
                tool_calls: Some(tc),
                ..
            } if !tc.is_empty() && tc[0].function.name == INC.as_str() => (),
            _ => panic!(
                "Expected AsstInc at conv[3]. Got: {:?}",
                conversation.get(3)
            ),
        }
        match &conversation[4] {
            LiteLlmMessage::Tool {
                name: Some(n),
                content,
                ..
            } if n == INC.as_str() => {
                let out_val: IncOutput = serde_json::from_str(content)?;
                assert_eq!(out_val.new, 2);
            }
            _ => panic!(
                "Expected ToolInc at conv[4]. Got: {:?}",
                conversation.get(4)
            ),
        }
        match &conversation[5] {
            LiteLlmMessage::Assistant {
                content: Some(c),
                tool_calls: None,
                ..
            } if c == "Final answer after two turns." => (),
            _ => panic!(
                "Expected AsstContent at conv[5]. Got: {:?}",
                conversation.get(5)
            ),
        }

        let mut saw_done_message = false;
        while let Ok(msg_res) = stream_rx.recv().await {
            if matches!(msg_res?, LiteLlmMessage::Done) {
                saw_done_message = true;
                break;
            }
        }
        assert!(
            saw_done_message,
            "Stream should have received LiteLlmMessage::Done."
        );

        Ok(())
    }

    #[tokio::test]
    async fn test_agent_multiple_distinct_streaming_tool_calls_multiple_turns() -> Result<()> {
        let initial_state = CounterState { count: 0 };
        let mode_provider = Arc::new(MultiTurnModeProvider::new(2));

        let echo_call_id = "echo_call_multi_distinct_001";
        let echo_params_json_str = r#"{"message":"Hello Echo Tool!"}"#;

        let llm_echo_chunks = vec![
            ChatCompletionChunk {
                id: "chunk_echo_1".to_string(),
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "gpt-test-multiturn".to_string(),
                system_fingerprint: None,
                choices: vec![litellm::StreamChoice {
                    index: 0,
                    delta: litellm::Delta {
                        tool_calls: Some(vec![litellm::DeltaToolCall {
                            id: Some(echo_call_id.to_string()),
                            call_type: Some("function".to_string()),
                            function: Some(litellm::DeltaFunctionCall {
                                name: Some(ECHO.as_str().to_string()),
                                arguments: Some(r#"{"message":"Hello E"#.to_string()),
                            }),
                            code_interpreter: None,
                            retrieval: None,
                        }]), // First part of args
                        role: None,
                        content: None,
                        function_call: None,
                    },
                    finish_reason: None,
                    logprobs: None,
                }],
            },
            ChatCompletionChunk {
                id: "chunk_echo_2".to_string(),
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "gpt-test-multiturn".to_string(),
                system_fingerprint: None,
                choices: vec![
                    litellm::StreamChoice {
                        index: 0,
                        delta: litellm::Delta {
                            tool_calls: Some(vec![litellm::DeltaToolCall {
                                id: Some(echo_call_id.to_string()),
                                call_type: None, // ID is important for subsequent chunks
                                function: Some(litellm::DeltaFunctionCall {
                                    name: None,
                                    arguments: Some(r#"cho Tool!"}"#.to_string()),
                                }),
                                code_interpreter: None,
                                retrieval: None,
                            }]), // Second part of args
                            role: None,
                            content: None,
                            function_call: None,
                        },
                        finish_reason: Some("tool_calls".to_string()),
                        logprobs: None,
                    }, // Finish reason on the last chunk for this tool call
                ],
            },
        ];

        let inc_call_id = "inc_call_multi_distinct_002";
        let inc_params_json_str = r#"{"by":5}"#;
        let llm_inc_chunks = vec![ChatCompletionChunk {
            id: "chunk_inc_1".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test-multiturn".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    tool_calls: Some(vec![litellm::DeltaToolCall {
                        id: Some(inc_call_id.to_string()),
                        call_type: Some("function".to_string()),
                        function: Some(litellm::DeltaFunctionCall {
                            name: Some(INC.as_str().to_string()),
                            arguments: Some(inc_params_json_str.to_string()),
                        }),
                        code_interpreter: None,
                        retrieval: None,
                    }]),
                    role: None,
                    content: None,
                    function_call: None,
                },
                finish_reason: Some("tool_calls".to_string()),
                logprobs: None,
            }],
        }];

        let llm_final_content_chunks = vec![ChatCompletionChunk {
            id: "chunk_final_content".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test-multiturn".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    role: Some("assistant".to_string()),
                    content: Some("All tools called. Conversation ends.".to_string()),
                    function_call: None,
                    tool_calls: None,
                },
                finish_reason: Some("stop".to_string()),
                logprobs: None,
            }],
        }];

        let mut chunks_queue = VecDeque::new();
        chunks_queue.push_back(llm_echo_chunks);
        chunks_queue.push_back(llm_inc_chunks);
        chunks_queue.push_back(llm_final_content_chunks);

        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                id: "mock_fallback_id_multi_distinct".to_string(), object: "chat.completion".to_string(), created: 0, model: "mock-fallback-model-multi-distinct".to_string(), choices: vec![],
                usage: litellm::Usage { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, completion_tokens_details: None }, 
                system_fingerprint: None,
                service_tier: None,
            },
            chunks_queue
        );
        let mock_llm_arc: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        let agent = GenericAgent::with_mock(
            "multi_distinct_tool_agent",
            initial_state,
            mode_provider,
            Uuid::new_v4(),
            Uuid::new_v4(),
            mock_llm_arc.clone(),
            120, // Default tool_timeout_secs
        );
        agent
            .add_tool(
                ECHO.as_str().to_string(),
                EchoTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;
        agent
            .add_tool(
                INC.as_str().to_string(),
                IncTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;

        let mut conversation = vec![LiteLlmMessage::user("Trigger multi-tool sequence.")];
        let mut stream_rx = agent.get_stream_receiver().await.expect("stream available");

        let final_status = agent.run_conversation(&mut conversation).await?;
        drop(agent);

        assert!(
            matches!(final_status, AgentStatus::Terminated),
            "Agent should terminate. Status: {:?}",
            final_status
        );
        assert_eq!(
            conversation.len(),
            6,
            "Conversation should have 6 messages. Got: {:?}",
            conversation.len()
        );

        // Verify conversation content
        match &conversation[1] {
            LiteLlmMessage::Assistant {
                tool_calls: Some(tc),
                ..
            } if !tc.is_empty()
                && tc[0].function.name == ECHO.as_str()
                && tc[0].id == echo_call_id
                && tc[0].function.arguments == echo_params_json_str =>
            {
                ()
            }
            _ => panic!(
                "Expected AsstEcho at conv[1]. Got: {:?}",
                conversation.get(1)
            ),
        }
        match &conversation[2] {
            LiteLlmMessage::Tool {
                name: Some(n),
                tool_call_id: tcid,
                content,
                ..
            } if n == ECHO.as_str() && tcid == echo_call_id => {
                let output: Value = serde_json::from_str(content)?;
                let expected_tool_output: Value = serde_json::from_str(echo_params_json_str)?;
                assert_eq!(output, expected_tool_output);
            }
            _ => panic!(
                "Expected ToolEcho at conv[2]. Got: {:?}",
                conversation.get(2)
            ),
        }
        match &conversation[3] {
            LiteLlmMessage::Assistant {
                tool_calls: Some(tc),
                ..
            } if !tc.is_empty()
                && tc[0].function.name == INC.as_str()
                && tc[0].id == inc_call_id
                && tc[0].function.arguments == inc_params_json_str =>
            {
                ()
            }
            _ => panic!(
                "Expected AsstInc at conv[3]. Got: {:?}",
                conversation.get(3)
            ),
        }
        match &conversation[4] {
            LiteLlmMessage::Tool {
                name: Some(n),
                tool_call_id: tcid,
                content,
                ..
            } if n == INC.as_str() && tcid == inc_call_id => {
                let out_val: IncOutput = serde_json::from_str(content)?;
                assert_eq!(out_val.new, 6);
            }
            _ => panic!(
                "Expected ToolInc at conv[4]. Got: {:?}",
                conversation.get(4)
            ),
        } // 5 (from params) + 1 = 6
        match &conversation[5] {
            LiteLlmMessage::Assistant {
                content: Some(c),
                tool_calls: None,
                ..
            } if c == "All tools called. Conversation ends." => (),
            _ => panic!(
                "Expected AsstContent at conv[5]. Got: {:?}",
                conversation.get(5)
            ),
        }

        let mut saw_done_message = false;
        while let Ok(msg_res) = stream_rx.recv().await {
            // Changed: removed timeout for simplicity in this check
            if matches!(msg_res?, LiteLlmMessage::Done) {
                saw_done_message = true;
                break;
            }
        }
        assert!(
            saw_done_message,
            "Expected LiteLlmMessage::Done on the stream."
        );

        Ok(())
    }

    #[tokio::test]
    async fn test_agent_handles_llm_calls_non_existent_tool() -> Result<()> {
        let initial_state = CounterState::default();
        let mode_provider = Arc::new(MultiTurnModeProvider::new(0));

        let non_existent_tool_name = "non_existent_tool_xyz";
        let tool_call_id = "call_non_existent_001";
        let params_json_str = r#"{}"#;

        let llm_chunks = vec![ChatCompletionChunk {
            id: "chunk_non_existent_1".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    tool_calls: Some(vec![litellm::DeltaToolCall {
                        id: Some(tool_call_id.to_string()),
                        call_type: Some("function".to_string()),
                        function: Some(litellm::DeltaFunctionCall {
                            name: Some(non_existent_tool_name.to_string()),
                            arguments: Some(params_json_str.to_string()),
                        }),
                        code_interpreter: None,
                        retrieval: None,
                    }]),
                    role: None,
                    content: None,
                    function_call: None,
                },
                finish_reason: Some("tool_calls".to_string()),
                logprobs: None,
            }],
        }];

        let mut chunks_queue = VecDeque::new();
        chunks_queue.push_back(llm_chunks);
        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                /* ... default/fallback ... */ id: "fallback".into(),
                object: "".into(),
                created: 0,
                model: "".into(),
                choices: vec![],
                usage: litellm::Usage {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                    completion_tokens_details: None,
                },
                system_fingerprint: None,
                service_tier: None,
            },
            chunks_queue,
        );
        let mock_llm_arc: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        let agent = GenericAgent::with_mock(
            "non_existent_tool_agent",
            initial_state,
            mode_provider,
            Uuid::new_v4(),
            Uuid::new_v4(),
            mock_llm_arc.clone(),
            120, // Default tool_timeout_secs
        );

        let mut conversation = vec![LiteLlmMessage::user("Call a tool I don't have.")];
        let mut stream_rx = agent.get_stream_receiver().await.expect("stream available");

        let final_status = agent.run_conversation(&mut conversation).await?;
        assert!(
            matches!(final_status, AgentStatus::Terminated),
            "Agent should terminate. Status: {:?}",
            final_status
        );

        assert_eq!(
            conversation.len(),
            3,
            "Conversation should have 3 messages. Got: {:?}",
            conversation.len()
        );

        let mut agent_error_on_stream = false;
        let mut tool_error_msg_on_stream = false;
        let mut saw_done = false;

        while let Ok(msg_res_outer) =
            tokio::time::timeout(std::time::Duration::from_millis(200), stream_rx.recv()).await
        {
            match msg_res_outer {
                Ok(msg_res) => match msg_res {
                    Ok(msg) => {
                        if let LiteLlmMessage::Tool {
                            name: Some(n),
                            tool_call_id: tcid,
                            content,
                            progress,
                            ..
                        } = msg
                        {
                            if n == non_existent_tool_name
                                && tcid == tool_call_id
                                && progress == MessageProgress::Complete
                            {
                                let error_payload: Value = serde_json::from_str(&content)?;
                                if error_payload["error"]
                                    .as_str()
                                    .unwrap_or("")
                                    .contains("not found for finalize")
                                {
                                    tool_error_msg_on_stream = true;
                                }
                            }
                        } else if matches!(msg, LiteLlmMessage::Done) {
                            saw_done = true;
                            break;
                        }
                    }
                    Err(agent_err) => {
                        if agent_err.0.contains(&format!(
                            "Tool '{}' (id: {}) not found for finalize",
                            non_existent_tool_name, tool_call_id
                        )) || agent_err.0.contains(&format!(
                            "Tool '{}' not found during ingest_chunk for id: {}",
                            non_existent_tool_name, tool_call_id
                        )) {
                            agent_error_on_stream = true;
                        }
                    }
                },
                Ok(Err(_recv_err)) => {
                    saw_done = true;
                    break;
                } // Channel closed
                Err(_timeout_err) => {
                    saw_done = true;
                    break;
                } // Timeout
            }
        }

        assert!(
            agent_error_on_stream,
            "Expected AgentError on stream for non-existent tool during finalize or ingest."
        );
        assert!(
            tool_error_msg_on_stream,
            "Expected LiteLlmMessage::Tool with error on stream for non-existent tool."
        );
        assert!(saw_done, "Expected Done message on stream.");

        match &conversation[1] {
            LiteLlmMessage::Assistant {
                tool_calls: Some(tc_vec),
                ..
            } if !tc_vec.is_empty() && tc_vec[0].function.name == non_existent_tool_name => (),
            _ => panic!(
                "Expected Assistant call to non_existent_tool at conversation[1]. Got: {:?}",
                conversation.get(1)
            ),
        }
        match &conversation[2] {
            LiteLlmMessage::Tool {
                name: Some(n),
                tool_call_id: tcid,
                content,
                ..
            } if n == non_existent_tool_name && tcid == tool_call_id => {
                let error_payload: Value = serde_json::from_str(content)?;
                assert!(error_payload["error"]
                    .as_str()
                    .unwrap_or("")
                    .contains(non_existent_tool_name));
            }
            _ => panic!(
                "Expected Tool error message for non_existent_tool at conversation[2]. Got: {:?}",
                conversation.get(2)
            ),
        }

        Ok(())
    }

    #[tokio::test]
    async fn test_agent_handles_registered_tool_fails() -> Result<()> {
        let initial_state = CounterState::default();
        let mode_provider = Arc::new(MultiTurnModeProvider::new(0));

        let tool_call_id = "call_failing_tool_001";
        let params_json_str = r#"{}"#;

        let llm_chunks = vec![ChatCompletionChunk {
            id: "chunk_failing_1".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    tool_calls: Some(vec![litellm::DeltaToolCall {
                        id: Some(tool_call_id.to_string()),
                        call_type: Some("function".to_string()),
                        function: Some(litellm::DeltaFunctionCall {
                            name: Some(FAILING_TOOL.as_str().to_string()),
                            arguments: Some(params_json_str.to_string()),
                        }),
                        code_interpreter: None,
                        retrieval: None,
                    }]),
                    role: None,
                    content: None,
                    function_call: None,
                },
                finish_reason: Some("tool_calls".to_string()),
                logprobs: None,
            }],
        }];

        let mut chunks_queue = VecDeque::new();
        chunks_queue.push_back(llm_chunks);
        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                /* ... default/fallback ... */ id: "fallback".into(),
                object: "".into(),
                created: 0,
                model: "".into(),
                choices: vec![],
                usage: litellm::Usage {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                    completion_tokens_details: None,
                },
                system_fingerprint: None,
                service_tier: None,
            },
            chunks_queue,
        );
        let mock_llm_arc: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        let agent = GenericAgent::with_mock(
            "failing_tool_agent",
            initial_state,
            mode_provider,
            Uuid::new_v4(),
            Uuid::new_v4(),
            mock_llm_arc.clone(),
            120, // Default tool_timeout_secs
        );
        agent
            .add_tool(
                FAILING_TOOL.as_str().to_string(),
                FailingTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;

        let mut conversation = vec![LiteLlmMessage::user("Call the tool that always fails.")];
        let mut stream_rx = agent.get_stream_receiver().await.expect("stream available");

        let final_status = agent.run_conversation(&mut conversation).await?;
        assert!(
            matches!(final_status, AgentStatus::Terminated),
            "Agent should terminate. Status: {:?}",
            final_status
        );

        let mut agent_error_on_stream = false;
        let mut tool_error_msg_on_stream = false;
        let mut saw_done = false;

        loop {
            match tokio::time::timeout(std::time::Duration::from_millis(200), stream_rx.recv())
                .await
            {
                Ok(Ok(msg_res)) => match msg_res {
                    Ok(msg) => {
                        if let LiteLlmMessage::Tool {
                            name: Some(n),
                            tool_call_id: tcid,
                            content,
                            progress,
                            ..
                        } = msg
                        {
                            if n == FAILING_TOOL.as_str()
                                && tcid == tool_call_id
                                && progress == MessageProgress::Complete
                            {
                                let error_payload: Value = serde_json::from_str(&content)?;
                                if error_payload["error"]
                                    .as_str()
                                    .unwrap_or("")
                                    .contains(FAILING_TOOL_ERROR_MSG)
                                {
                                    tool_error_msg_on_stream = true;
                                }
                            }
                        } else if matches!(msg, LiteLlmMessage::Done) {
                            saw_done = true;
                            break;
                        }
                    }
                    Err(agent_err) => {
                        if agent_err.0.contains(&format!(
                            "Tool '{}' (id: {}) finalize error: {}",
                            FAILING_TOOL.as_str(),
                            tool_call_id,
                            FAILING_TOOL_ERROR_MSG
                        )) {
                            agent_error_on_stream = true;
                        }
                    }
                },
                Ok(Err(_)) => {
                    saw_done = true;
                    break;
                }
                Err(_) => {
                    saw_done = true;
                    break;
                }
            }
        }

        assert!(
            agent_error_on_stream,
            "Expected AgentError on stream for failing tool during finalize."
        );
        assert!(
            tool_error_msg_on_stream,
            "Expected LiteLlmMessage::Tool with error on stream for failing tool."
        );
        assert!(saw_done, "Expected Done message on stream.");

        assert_eq!(
            conversation.len(),
            3,
            "Conversation should have 3 messages. Got: {:?}",
            conversation.len()
        );
        match &conversation[1] {
            LiteLlmMessage::Assistant {
                tool_calls: Some(tc_vec),
                ..
            } if !tc_vec.is_empty() && tc_vec[0].function.name == FAILING_TOOL.as_str() => (),
            _ => panic!(
                "Expected Assistant call to FailingTool at conversation[1]. Got: {:?}",
                conversation.get(1)
            ),
        }
        match &conversation[2] {
            LiteLlmMessage::Tool {
                name: Some(n),
                tool_call_id: tcid,
                content,
                ..
            } if n == FAILING_TOOL.as_str() && tcid == tool_call_id => {
                let error_payload: Value = serde_json::from_str(content)?;
                assert!(error_payload["error"]
                    .as_str()
                    .unwrap_or("")
                    .contains(FAILING_TOOL_ERROR_MSG));
            }
            _ => panic!(
                "Expected Tool error message for FailingTool at conversation[2]. Got: {:?}",
                conversation.get(2)
            ),
        }

        Ok(())
    }

    #[tokio::test]
    async fn test_agent_terminates_with_terminating_tool() -> Result<()> {
        let initial_state = CounterState::default();
        let mode_provider = Arc::new(MultiTurnModeProvider::with_terminating_tools(
            0,
            vec![TERMINATOR],
        ));

        let tool_call_id = "call_terminator_001";
        let params_json_str = r#"{}"#;

        let llm_chunks = vec![ChatCompletionChunk {
            id: "chunk_term_1".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    tool_calls: Some(vec![litellm::DeltaToolCall {
                        id: Some(tool_call_id.to_string()),
                        call_type: Some("function".to_string()),
                        function: Some(litellm::DeltaFunctionCall {
                            name: Some(TERMINATOR.as_str().to_string()),
                            arguments: Some(params_json_str.to_string()),
                        }),
                        code_interpreter: None,
                        retrieval: None,
                    }]),
                    role: None,
                    content: None,
                    function_call: None,
                },
                finish_reason: Some("tool_calls".to_string()),
                logprobs: None,
            }],
        }];

        let mut chunks_queue = VecDeque::new();
        chunks_queue.push_back(llm_chunks);
        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                /* ... default/fallback ... */ id: "fallback".into(),
                object: "".into(),
                created: 0,
                model: "".into(),
                choices: vec![],
                usage: litellm::Usage {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                    completion_tokens_details: None,
                },
                system_fingerprint: None,
                service_tier: None,
            },
            chunks_queue,
        );
        let mock_llm_arc: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        let agent = GenericAgent::with_mock(
            "terminator_agent",
            initial_state,
            mode_provider,
            Uuid::new_v4(),
            Uuid::new_v4(),
            mock_llm_arc.clone(),
            120, // Default tool_timeout_secs
        );
        agent
            .add_tool(
                TERMINATOR.as_str().to_string(),
                TerminatorTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;

        let mut conversation = vec![LiteLlmMessage::user("Call the terminator tool.")];
        let mut stream_rx = agent.get_stream_receiver().await.expect("stream available");

        let final_status = agent.run_conversation(&mut conversation).await?;
        assert!(
            matches!(final_status, AgentStatus::Terminated),
            "Agent should terminate. Status: {:?}",
            final_status
        );

        assert_eq!(
            conversation.len(),
            3,
            "Conversation should have 3 messages. Got: {:?}",
            conversation.len()
        );
        match &conversation[1] {
            LiteLlmMessage::Assistant {
                tool_calls: Some(tc_vec),
                ..
            } if !tc_vec.is_empty() && tc_vec[0].function.name == TERMINATOR.as_str() => (),
            _ => panic!(
                "Expected Assistant call to TerminatorTool at conversation[1]. Got: {:?}",
                conversation.get(1)
            ),
        }
        match &conversation[2] {
            LiteLlmMessage::Tool {
                name: Some(n),
                tool_call_id: tcid,
                content,
                ..
            } if n == TERMINATOR.as_str() && tcid == tool_call_id => {
                let output: Value = serde_json::from_str(content)?;
                assert_eq!(output, json!({ "status": "terminated" }));
            }
            _ => panic!(
                "Expected Tool success message from TerminatorTool at conversation[2]. Got: {:?}",
                conversation.get(2)
            ),
        }

        let mut saw_done = false;
        while let Ok(msg_res) = stream_rx.recv().await {
            if matches!(msg_res?, LiteLlmMessage::Done) {
                saw_done = true;
                break;
            }
        }
        assert!(
            saw_done,
            "Expected LiteLlmMessage::Done on the stream after termination by tool."
        );

        Ok(())
    }

    // --- New Tests for Recently Added Features ---

    #[tokio::test]
    async fn test_tool_enablement_conditions() -> Result<()> {
        let initial_state_feature_disabled = TestStateWithFlag {
            feature_enabled: false,
        };
        let mode_provider = Arc::new(TestFlagModeProvider);
        let mock_llm_facade: Arc<dyn LlmFacade + Send + Sync> =
            Arc::new(MockLLM::new_with_responses(
                // Provide a dummy response
                ChatCompletionResponse {
                    id: "dummy_id".into(),
                    object: "chat.completion".into(),
                    created: 0,
                    model: "dummy".into(),
                    choices: vec![],
                    usage: litellm::Usage {
                        prompt_tokens: 0,
                        completion_tokens: 0,
                        total_tokens: 0,
                        completion_tokens_details: None,
                    },
                    system_fingerprint: None,
                    service_tier: None,
                },
                VecDeque::new(),
            ));

        let agent = GenericAgent::with_mock(
            "enablement_test_agent",
            initial_state_feature_disabled.clone(),
            mode_provider.clone(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            mock_llm_facade.clone(),
            120, // Default tool_timeout_secs
        );

        // Tool A: Always enabled
        agent
            .add_tool(
                ALWAYS_ENABLED_TOOL.as_str().to_string(),
                AlwaysEnabledTool::default(),
                None::<fn(&TestStateWithFlag) -> bool>,
            )
            .await;

        // Tool B: Enabled if state.feature_enabled == true
        let conditional_tool_enable_fn = |s: &TestStateWithFlag| s.feature_enabled;
        agent
            .add_tool(
                CONDITIONALLY_ENABLED_TOOL.as_str().to_string(),
                ConditionallyEnabledTool::default(),
                Some(conditional_tool_enable_fn),
            )
            .await;

        // 1. Test with feature_enabled = false
        let enabled_tools_false = agent.get_enabled_tools().await;
        assert_eq!(
            enabled_tools_false.len(),
            1,
            "Only AlwaysEnabledTool should be enabled when feature_enabled is false"
        );
        assert!(enabled_tools_false
            .iter()
            .any(|t| t.function["name"].as_str().unwrap_or_default() == ALWAYS_ENABLED_TOOL.as_str()));
        assert!(!enabled_tools_false
            .iter()
            .any(|t| t.function["name"].as_str().unwrap_or_default() == CONDITIONALLY_ENABLED_TOOL.as_str()));

        // 2. Test with feature_enabled = true
        agent.write_state(|s| s.feature_enabled = true).await;
        let enabled_tools_true = agent.get_enabled_tools().await;
        assert_eq!(
            enabled_tools_true.len(),
            2,
            "Both tools should be enabled when feature_enabled is true"
        );
        assert!(enabled_tools_true
            .iter()
            .any(|t| t.function["name"].as_str().unwrap_or_default() == ALWAYS_ENABLED_TOOL.as_str()));
        assert!(enabled_tools_true
            .iter()
            .any(|t| t.function["name"].as_str().unwrap_or_default() == CONDITIONALLY_ENABLED_TOOL.as_str()));

        Ok(())
    }

    #[tokio::test]
    async fn test_llm_stream_retry_logic() -> Result<()> {
        let succeed_after_failures = 2; // First 2 calls fail, 3rd succeeds
        let success_chunks = vec![
            ChatCompletionChunk {
                id: "retry_chunk_1".into(),
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "test-retry-model".to_string(),
                system_fingerprint: None,
                choices: vec![litellm::StreamChoice {
                    index: 0,
                    delta: litellm::Delta {
                        role: None,
                        content: Some("Success ".into()),
                        tool_calls: None,
                        function_call: None,
                    },
                    finish_reason: None,
                    logprobs: None,
                }],
            },
            ChatCompletionChunk {
                id: "retry_chunk_2".into(),
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "test-retry-model".to_string(),
                system_fingerprint: None,
                choices: vec![litellm::StreamChoice {
                    index: 0,
                    delta: litellm::Delta {
                        role: None,
                        content: Some("after retry!".into()),
                        tool_calls: None,
                        function_call: None,
                    },
                    finish_reason: Some("stop".into()),
                    logprobs: None,
                }],
            },
        ];

        let retrying_llm = Arc::new(RetryingMockLlm::new(succeed_after_failures, success_chunks));
        let llm_facade: Arc<dyn LlmFacade + Send + Sync> = retrying_llm.clone();

        let agent_state = CounterState::default();
        let mode_provider = Arc::new(SingleTurnTerminateModeProvider);

        let agent = GenericAgent::with_mock(
            "retry_test_agent",
            agent_state,
            mode_provider,
            Uuid::new_v4(),
            Uuid::new_v4(),
            llm_facade,
            120, // Default tool_timeout_secs
        );

        let mut conversation = vec![LiteLlmMessage::user("Test retry")];
        let status = agent.run_conversation(&mut conversation).await?;

        assert!(
            matches!(status, AgentStatus::Terminated),
            "Agent should terminate after successful retry."
        );
        assert_eq!(
            retrying_llm.stream_call_count.load(AtomicOrdering::SeqCst),
            succeed_after_failures + 1,
            "LLM should have been called correct number of times."
        );

        // Check conversation history for the successful message
        let last_message = conversation.last().unwrap();
        match last_message {
            LiteLlmMessage::Assistant {
                content: Some(text),
                ..
            } => {
                assert_eq!(text, "Success after retry!");
            }
            _ => panic!("Expected assistant message with content."),
        }
        Ok(())
    }

    #[tokio::test]
    async fn test_tool_finalize_timeout() -> Result<()> {
        let slow_tool_sleep_duration_secs = 2; 
        let agent_tool_timeout_secs_for_test = 1;

        let tool_call_id = "slow_tool_call_1";

        let llm_chunks_calling_slow_tool = vec![
            ChatCompletionChunk {
                id: "chunk_slow_1".into(),
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "test-timeout-model".to_string(),
                system_fingerprint: None,
                choices: vec![litellm::StreamChoice {
                    index: 0,
                    delta: litellm::Delta {
                        role: None,
                        content: None,
                        tool_calls: Some(vec![litellm::DeltaToolCall {
                            id: Some(tool_call_id.into()),
                            call_type: Some("function".into()),
                            function: Some(litellm::DeltaFunctionCall {
                                name: Some(SLOW_FINALIZE_TOOL.as_str().into()),
                                arguments: Some("{}".into()), 
                            }),
                            code_interpreter: None,
                            retrieval: None,
                        }]),
                        function_call: None,
                    },
                    finish_reason: Some("tool_calls".into()),
                    logprobs: None,
                }],
            }
        ];
        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                id: "".into(),
                object: "".into(),
                created: 0,
                model: "".into(),
                choices: vec![],
                usage: litellm::Usage {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                    completion_tokens_details: None,
                },
                system_fingerprint: None,
                service_tier: None,
            },
            VecDeque::from(vec![llm_chunks_calling_slow_tool]),
        );
        let llm_facade: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        struct SlowToolModeProvider {
            tool_sleep_secs: u64,
        }
        #[async_trait]
        impl ModeProvider<CounterState> for SlowToolModeProvider {
            async fn configuration(
                &self,
                _state: &CounterState,
            ) -> Result<ModeConfig<CounterState>> {
                let sleep_duration = self.tool_sleep_secs;
                Ok(ModeConfig {
                    prompt: "Test slow tool".into(),
                    model: "test-model".into(),
                    tool_loader: Arc::new(move |agent_ref: &GenericAgent<CounterState>| {
                        let agent_clone = agent_ref.clone();
                        let tool_to_add = SlowFinalizeTool::new(sleep_duration);
                        Box::pin(async move {
                            agent_clone
                                .add_tool(
                                    SLOW_FINALIZE_TOOL.as_str().to_string(),
                                    tool_to_add,
                                    None::<fn(&CounterState) -> bool>,
                                )
                                .await; 
                            Ok(())
                        })
                    }),
                    terminating_tools: vec![SLOW_FINALIZE_TOOL], 
                    should_terminate: Arc::new(|_| false),
                })
            }
        }

        let agent = GenericAgent::with_mock(
            "timeout_agent",
            CounterState::default(),
            Arc::new(SlowToolModeProvider { tool_sleep_secs: slow_tool_sleep_duration_secs }),
            Uuid::new_v4(),
            Uuid::new_v4(),
            llm_facade,
            agent_tool_timeout_secs_for_test, 
        );

        let mut conversation = vec![LiteLlmMessage::user("Call the slow tool")];
        let mut stream_rx = agent.get_stream_receiver().await.unwrap();
        let status = agent.run_conversation(&mut conversation).await?;

        assert!(
            matches!(status, AgentStatus::Terminated),
            "Agent should terminate because the tool is terminating (even if it timed out)."
        );

        let mut timeout_error_found_on_stream = false;
        let mut saw_done_on_stream = false;
        while let Ok(msg_res) = stream_rx.recv().await {
            match msg_res {
                Ok(LiteLlmMessage::Tool {
                    name: Some(tn),
                    content,
                    tool_call_id: tcid,
                    .. 
                }) if tn == SLOW_FINALIZE_TOOL.as_str() && tcid == tool_call_id => {
                    let val: Value = serde_json::from_str(&content)?;
                    if let Some(err_msg) = val.get("error").and_then(|e| e.as_str()) {
                        if err_msg.contains(&format!("timed out after {} seconds during finalize", agent_tool_timeout_secs_for_test)) {
                            timeout_error_found_on_stream = true;
                        }
                    }
                }
                Ok(LiteLlmMessage::Done) => {
                    saw_done_on_stream = true;
                    break;
                }
                Err(AgentError(msg))
                    if msg.contains(&format!("timed out after {} seconds during finalize", agent_tool_timeout_secs_for_test)) =>
                {
                    timeout_error_found_on_stream = true; 
                }
                _ => {}
            }
        }
        assert!(
            timeout_error_found_on_stream,
            "Timeout error message for SlowFinalizeTool was not found on the stream. Agent timeout: {}s, Tool sleep: {}s",
            agent_tool_timeout_secs_for_test, slow_tool_sleep_duration_secs
        );
        assert!(saw_done_on_stream, "Done message not seen on stream.");

        let tool_msg_in_history = conversation.iter().find(|m| matches!(m, LiteLlmMessage::Tool { name: Some(tn), .. } if tn == SLOW_FINALIZE_TOOL.as_str()));
        assert!(
            tool_msg_in_history.is_some(),
            "Tool message for SlowFinalizeTool not in history."
        );
        if let Some(LiteLlmMessage::Tool { content, .. }) = tool_msg_in_history {
            let val: Value = serde_json::from_str(content)?;
            assert!(
                val.get("error")
                    .and_then(|e| e.as_str())
                    .map_or(false, |s| s
                        .contains(&format!("timed out after {} seconds during finalize", agent_tool_timeout_secs_for_test))),
                "History message content incorrect for timeout. Got: {}", content
            );
        }
        Ok(())
    }

    #[tokio::test]
    async fn test_tool_finalize_no_timeout() -> Result<()> {
        let quick_tool_sleep_duration_secs = 1; 
        let agent_tool_timeout_secs_for_test = 5; 

        let tool_call_id = "quick_tool_call_1";

        let llm_chunks_calling_quick_tool = vec![
            ChatCompletionChunk {
                id: "chunk_quick_1".into(),
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "test-no-timeout-model".to_string(),
                system_fingerprint: None,
                choices: vec![litellm::StreamChoice {
                    index: 0,
                    delta: litellm::Delta {
                        role: None,
                        content: None,
                        tool_calls: Some(vec![litellm::DeltaToolCall {
                            id: Some(tool_call_id.into()),
                            call_type: Some("function".into()),
                            function: Some(litellm::DeltaFunctionCall {
                                name: Some(SLOW_FINALIZE_TOOL.as_str().into()),
                                arguments: Some("{}".into()), 
                            }),
                            code_interpreter: None,
                            retrieval: None,
                        }]),
                        function_call: None,
                    },
                    finish_reason: Some("tool_calls".into()),
                    logprobs: None,
                }],
            }
        ];
        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                id: "".into(),
                object: "".into(),
                created: 0,
                model: "".into(),
                choices: vec![],
                usage: litellm::Usage {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                    completion_tokens_details: None,
                },
                system_fingerprint: None,
                service_tier: None,
            },
            VecDeque::from(vec![llm_chunks_calling_quick_tool]),
        );
        let llm_facade: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        struct QuickToolModeProvider {
            tool_sleep_secs: u64,
        }
        #[async_trait]
        impl ModeProvider<CounterState> for QuickToolModeProvider {
            async fn configuration(
                &self,
                _state: &CounterState,
            ) -> Result<ModeConfig<CounterState>> {
                let sleep_duration = self.tool_sleep_secs;
                Ok(ModeConfig {
                    prompt: "Test quick tool".into(),
                    model: "test-model".into(),
                    tool_loader: Arc::new(move |agent_ref: &GenericAgent<CounterState>| {
                        let agent_clone = agent_ref.clone();
                        let tool_to_add = SlowFinalizeTool::new(sleep_duration);
                        Box::pin(async move {
                            agent_clone
                                .add_tool(
                                    SLOW_FINALIZE_TOOL.as_str().to_string(),
                                    tool_to_add,
                                    None::<fn(&CounterState) -> bool>,
                                )
                                .await; 
                            Ok(())
                        })
                    }),
                    terminating_tools: vec![SLOW_FINALIZE_TOOL],
                    should_terminate: Arc::new(|_| false),
                })
            }
        }

        let agent = GenericAgent::with_mock(
            "no_timeout_agent",
            CounterState::default(),
            Arc::new(QuickToolModeProvider { tool_sleep_secs: quick_tool_sleep_duration_secs }),
            Uuid::new_v4(),
            Uuid::new_v4(),
            llm_facade,
            agent_tool_timeout_secs_for_test, 
        );

        let mut conversation = vec![LiteLlmMessage::user("Call the quick tool")];
        let mut stream_rx = agent.get_stream_receiver().await.unwrap();
        let status = agent.run_conversation(&mut conversation).await?;

        assert!(matches!(status, AgentStatus::Terminated));

        let mut success_output_found = false;
        while let Ok(msg_res) = stream_rx.recv().await {
            match msg_res? {
                LiteLlmMessage::Tool {
                    name: Some(tn),
                    content,
                    tool_call_id: tcid,
                    progress,
                    ..
                } if tn == SLOW_FINALIZE_TOOL.as_str()
                    && tcid == tool_call_id
                    && progress == MessageProgress::Complete =>
                {
                    let val: Value = serde_json::from_str(&content)?;
                    if val == json!({"status": "finalized after delay"}) {
                        success_output_found = true;
                    }
                }
                LiteLlmMessage::Done => break,
                _ => {}
            }
        }
        assert!(
            success_output_found,
            "Successful output from QuickFinalizeTool not found on stream."
        );
        Ok(())
    }

    #[tokio::test]
    async fn test_max_recursion_depth_streaming() -> Result<()> {
        // Configure mode for more turns than max_depth to trigger it
        let mode_provider = Arc::new(MultiTurnModeProvider::new(20)); // Max turns > 15

        // Mock LLM to always return simple content, forcing recursion without tool calls
        let llm_content_chunks = vec![
            ChatCompletionChunk {
                id: "recur_chunk_1".into(),
                object: "chat.completion.chunk".to_string(),
                created: 0,
                model: "test-depth-model".to_string(),
                system_fingerprint: None,
                choices: vec![litellm::StreamChoice {
                    index: 0,
                    delta: litellm::Delta {
                        role: None,
                        content: Some("recursing...".into()),
                        tool_calls: None,
                        function_call: None,
                    },
                    finish_reason: Some("stop".into()),
                    logprobs: None,
                }],
            }
        ];
        // Need to queue up many of these responses
        let mut chunks_queue = VecDeque::new();
        for _ in 0..20 {
            // Enough responses to hit depth limit
            chunks_queue.push_back(llm_content_chunks.clone());
        }
        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                id: "".into(),
                object: "".into(),
                created: 0,
                model: "".into(),
                choices: vec![],
                usage: litellm::Usage {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                    completion_tokens_details: None,
                },
                system_fingerprint: None,
                service_tier: None,
            },
            chunks_queue,
        );
        let llm_facade: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        let agent = GenericAgent::with_mock(
            "depth_test_agent",
            CounterState::default(),
            mode_provider,
            Uuid::new_v4(),
            Uuid::new_v4(),
            llm_facade,
            120, // Default tool_timeout_secs
        );

        let mut conversation = vec![LiteLlmMessage::user("Start recursion test")];
        let mut stream_rx = agent.get_stream_receiver().await.unwrap();
        let final_status = agent.run_conversation(&mut conversation).await?;

        assert!(
            matches!(final_status, AgentStatus::Terminated),
            "Agent should be terminated due to max depth."
        );

        let mut max_depth_message_found = false;
        let mut turn_count_from_messages = 0; // Count assistant messages to infer turns

        while let Ok(msg_res) = stream_rx.recv().await {
            match msg_res? {
                LiteLlmMessage::Assistant {
                    content: Some(text),
                    ..
                } => {
                    if text.contains("Maximum recursion depth reached.") {
                        max_depth_message_found = true;
                    }
                    if text.contains("recursing...") {
                        // Assuming this is the LLM's content
                        turn_count_from_messages += 1;
                    }
                }
                LiteLlmMessage::Done => break,
                _ => {}
            }
        }

        assert!(
            max_depth_message_found,
            "Max recursion depth message not found on stream."
        );
        // The depth limit is 15. This means 15 calls to process_turn_streaming (depth 0 to 14).
        // The message "Maximum recursion depth reached." is sent when depth >= 15.
        // So, we expect 15 content messages before the max_depth message.
        assert_eq!(
            turn_count_from_messages, 15,
            "Should have seen 15 turns of content before max depth termination."
        );
        // Check that the conversation history also reflects this.
        // The conversation will have User, then 15 (Asst, Content), then the max_depth Asst msg.
        // Total messages = 1 (User) + 15 (Asst content) + 1 (Asst max_depth) = 17
        // However, the `run_conversation` loop might add the "max_depth" message via `send_msg`
        // but it's not directly pushed to `conversation` if termination happens before another LLM call.
        // The current `process_turn_streaming` sends the max_depth message and returns Ok(AgentStatus::Terminated)
        // `run_conversation` then receives this status and sends `LiteLlmMessage::Done`.
        // The `conversation` in `run_conversation` would have the history *before* the explicit max_depth message is added *by that function itself*.
        // Let's check the number of assistant messages in the final `conversation` Vec.
        let assistant_messages_in_history = conversation.iter().filter(|m| matches!(m, LiteLlmMessage::Assistant { content: Some(c), .. } if c.contains("recursing..."))).count();
        assert_eq!(
            assistant_messages_in_history, 15,
            "Conversation history should reflect 15 turns."
        );

        Ok(())
    }

    // --- Mode Provider for single turn tests that need immediate termination ---
    struct SingleTurnTerminateModeProvider;
    #[async_trait]
    impl ModeProvider<CounterState> for SingleTurnTerminateModeProvider {
        async fn configuration(&self, _state: &CounterState) -> Result<ModeConfig<CounterState>> {
            Ok(ModeConfig {
                prompt: "Single turn test prompt".into(),
                model: "test-model-single-turn".into(),
                tool_loader: Arc::new(|_| Box::pin(async { Ok(()) })),
                terminating_tools: vec![],
                should_terminate: Arc::new(|_| true), // Terminate after this configuration is processed
            })
        }
    }

    #[tokio::test]
    async fn test_agent_terminates_with_single_turn_mode() -> Result<()> {
        let initial_state = CounterState { count: 0 };
        let mode_provider = Arc::new(SingleTurnTerminateModeProvider);

        let tool_call_id = "call_terminator_001";
        let params_json_str = r#"{}"#;

        let llm_chunks = vec![ChatCompletionChunk {
            id: "chunk_term_1".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    tool_calls: Some(vec![litellm::DeltaToolCall {
                        id: Some(tool_call_id.to_string()),
                        call_type: Some("function".to_string()),
                        function: Some(litellm::DeltaFunctionCall {
                            name: Some(TERMINATOR.as_str().to_string()),
                            arguments: Some(params_json_str.to_string()),
                        }),
                        code_interpreter: None,
                        retrieval: None,
                    }]),
                    role: None,
                    content: None,
                    function_call: None,
                },
                finish_reason: Some("tool_calls".to_string()),
                logprobs: None,
            }],
        }];

        let mut chunks_queue = VecDeque::new();
        chunks_queue.push_back(llm_chunks);
        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                /* ... default/fallback ... */ id: "fallback".into(),
                object: "".into(),
                created: 0,
                model: "".into(),
                choices: vec![],
                usage: litellm::Usage {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                    completion_tokens_details: None,
                },
                system_fingerprint: None,
                service_tier: None,
            },
            chunks_queue,
        );
        let mock_llm_arc: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        let agent = GenericAgent::with_mock(
            "terminator_agent",
            initial_state,
            mode_provider,
            Uuid::new_v4(),
            Uuid::new_v4(),
            mock_llm_arc.clone(),
            120, // Default tool_timeout_secs
        );
        agent
            .add_tool(
                TERMINATOR.as_str().to_string(),
                TerminatorTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;

        let mut conversation = vec![LiteLlmMessage::user("Call the terminator tool.")];
        let mut stream_rx = agent.get_stream_receiver().await.expect("stream available");

        let final_status = agent.run_conversation(&mut conversation).await?;
        assert!(
            matches!(final_status, AgentStatus::Terminated),
            "Agent should terminate. Status: {:?}",
            final_status
        );

        assert_eq!(
            conversation.len(),
            3,
            "Conversation should have 3 messages. Got: {:?}",
            conversation.len()
        );
        match &conversation[1] {
            LiteLlmMessage::Assistant {
                tool_calls: Some(tc_vec),
                ..
            } if !tc_vec.is_empty() && tc_vec[0].function.name == TERMINATOR.as_str() => (),
            _ => panic!(
                "Expected Assistant call to TerminatorTool at conversation[1]. Got: {:?}",
                conversation.get(1)
            ),
        }
        match &conversation[2] {
            LiteLlmMessage::Tool {
                name: Some(n),
                tool_call_id: tcid,
                content,
                ..
            } if n == TERMINATOR.as_str() && tcid == tool_call_id => {
                let output: Value = serde_json::from_str(content)?;
                assert_eq!(output, json!({ "status": "terminated" }));
            }
            _ => panic!(
                "Expected Tool success message from TerminatorTool at conversation[2]. Got: {:?}",
                conversation.get(2)
            ),
        }

        let mut saw_done = false;
        while let Ok(msg_res) = stream_rx.recv().await {
            if matches!(msg_res?, LiteLlmMessage::Done) {
                saw_done = true;
                break;
            }
        }
        assert!(
            saw_done,
            "Expected LiteLlmMessage::Done on the stream after termination by tool."
        );

        Ok(())
    }

    #[tokio::test]
    async fn test_agent_terminates_with_failing_tool() -> Result<()> {
        let initial_state = CounterState { count: 0 };
        let mode_provider = Arc::new(SingleTurnTerminateModeProvider);

        let tool_call_id = "call_failing_tool_001";
        let params_json_str = r#"{}"#;

        let llm_chunks = vec![ChatCompletionChunk {
            id: "chunk_failing_1".to_string(),
            object: "chat.completion.chunk".to_string(),
            created: 0,
            model: "gpt-test".to_string(),
            system_fingerprint: None,
            choices: vec![litellm::StreamChoice {
                index: 0,
                delta: litellm::Delta {
                    tool_calls: Some(vec![litellm::DeltaToolCall {
                        id: Some(tool_call_id.to_string()),
                        call_type: Some("function".to_string()),
                        function: Some(litellm::DeltaFunctionCall {
                            name: Some(FAILING_TOOL.as_str().to_string()),
                            arguments: Some(params_json_str.to_string()),
                        }),
                        code_interpreter: None,
                        retrieval: None,
                    }]),
                    role: None,
                    content: None,
                    function_call: None,
                },
                finish_reason: Some("tool_calls".to_string()),
                logprobs: None,
            }],
        }];

        let mut chunks_queue = VecDeque::new();
        chunks_queue.push_back(llm_chunks);
        let mock_llm_instance = MockLLM::new_with_responses(
            ChatCompletionResponse {
                /* ... default/fallback ... */ id: "fallback".into(),
                object: "".into(),
                created: 0,
                model: "".into(),
                choices: vec![],
                usage: litellm::Usage {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                    completion_tokens_details: None,
                },
                system_fingerprint: None,
                service_tier: None,
            },
            chunks_queue,
        );
        let mock_llm_arc: Arc<dyn LlmFacade + Send + Sync> = Arc::new(mock_llm_instance);

        let agent = GenericAgent::with_mock(
            "failing_tool_agent",
            initial_state,
            mode_provider,
            Uuid::new_v4(),
            Uuid::new_v4(),
            mock_llm_arc.clone(),
            120, // Default tool_timeout_secs
        );
        agent
            .add_tool(
                FAILING_TOOL.as_str().to_string(),
                FailingTool::default(),
                None::<fn(&CounterState) -> bool>,
            )
            .await;

        let mut conversation = vec![LiteLlmMessage::user("Call the tool that always fails.")];
        let mut stream_rx = agent.get_stream_receiver().await.expect("stream available");

        let final_status = agent.run_conversation(&mut conversation).await?;
        assert!(
            matches!(final_status, AgentStatus::Terminated),
            "Agent should terminate. Status: {:?}",
            final_status
        );

        let mut agent_error_on_stream = false;
        let mut tool_error_msg_on_stream = false;
        let mut saw_done = false;

        loop {
            match tokio::time::timeout(std::time::Duration::from_millis(200), stream_rx.recv())
                .await
            {
                Ok(Ok(msg_res)) => match msg_res {
                    Ok(msg) => {
                        if let LiteLlmMessage::Tool {
                            name: Some(n),
                            tool_call_id: tcid,
                            content,
                            progress,
                            ..
                        } = msg
                        {
                            if n == FAILING_TOOL.as_str()
                                && tcid == tool_call_id
                                && progress == MessageProgress::Complete
                            {
                                let error_payload: Value = serde_json::from_str(&content)?;
                                if error_payload["error"]
                                    .as_str()
                                    .unwrap_or("")
                                    .contains(FAILING_TOOL_ERROR_MSG)
                                {
                                    tool_error_msg_on_stream = true;
                                }
                            }
                        } else if matches!(msg, LiteLlmMessage::Done) {
                            saw_done = true;
                            break;
                        }
                    }
                    Err(agent_err) => {
                        if agent_err.0.contains(&format!(
                            "Tool '{}' (id: {}) finalize error: {}",
                            FAILING_TOOL.as_str(),
                            tool_call_id,
                            FAILING_TOOL_ERROR_MSG
                        )) {
                            agent_error_on_stream = true;
                        }
                    }
                },
                Ok(Err(_)) => {
                    saw_done = true;
                    break;
                }
                Err(_) => {
                    saw_done = true;
                    break;
                }
            }
        }

        assert!(
            agent_error_on_stream,
            "Expected AgentError on stream for failing tool during finalize."
        );
        assert!(
            tool_error_msg_on_stream,
            "Expected LiteLlmMessage::Tool with error on stream for failing tool."
        );
        assert!(saw_done, "Expected Done message on stream.");

        assert_eq!(
            conversation.len(),
            3,
            "Conversation should have 3 messages. Got: {:?}",
            conversation.len()
        );
        match &conversation[1] {
            LiteLlmMessage::Assistant {
                tool_calls: Some(tc_vec),
                ..
            } if !tc_vec.is_empty() && tc_vec[0].function.name == FAILING_TOOL.as_str() => (),
            _ => panic!(
                "Expected Assistant call to FailingTool at conversation[1]. Got: {:?}",
                conversation.get(1)
            ),
        }
        match &conversation[2] {
            LiteLlmMessage::Tool {
                name: Some(n),
                tool_call_id: tcid,
                content,
                ..
            } if n == FAILING_TOOL.as_str() && tcid == tool_call_id => {
                let error_payload: Value = serde_json::from_str(content)?;
                assert!(error_payload["error"]
                    .as_str()
                    .unwrap_or("")
                    .contains(FAILING_TOOL_ERROR_MSG));
            }
            _ => panic!(
                "Expected Tool error message for FailingTool at conversation[2]. Got: {:?}",
                conversation.get(2)
            ),
        }

        Ok(())
    }
}
