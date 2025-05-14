use anyhow::Result;
use bytes::Bytes;
use futures_util::stream;
use futures_util::StreamExt;
use reqwest::{header, Client};
use std::env;
use std::io;
use tokio::sync::mpsc;
use tracing;

use super::types::*;

// New LiteLLMConfig struct
#[derive(Clone, Debug)]
pub struct LiteLLMConfig {
    pub api_key: String,
    pub base_url: String,
    pub debug_logging_enabled: bool,
}

impl LiteLLMConfig {
    pub fn new(
        api_key: Option<String>,
        base_url: Option<String>,
        debug_logging_enabled: Option<bool>,
    ) -> Self {
        let final_debug_logging_enabled = debug_logging_enabled.unwrap_or_else(|| {
            env::var("LITELLM_DEBUG")
                .map(|val| val.to_lowercase() == "true" || val == "1")
                .unwrap_or(false)
        });

        let final_api_key = api_key
            .or_else(|| env::var("LLM_API_KEY").ok())
            .unwrap_or_else(|| {
                if env::var("LITELLM_CONFIG_PATH").is_ok() {
                    if final_debug_logging_enabled {
                        tracing::debug!("Using LiteLLM config from environment, API key in config file.");
                    }
                    "dummy-key-not-used".to_string()
                } else {
                    panic!("LLM_API_KEY must be provided either through parameter, environment variable, or LITELLM_CONFIG_PATH must be set");
                }
            });

        let final_base_url = base_url
            .or_else(|| env::var("LLM_BASE_URL").ok())
            .unwrap_or_else(|| "http://localhost:8000".to_string());

        LiteLLMConfig {
            api_key: final_api_key,
            base_url: final_base_url,
            debug_logging_enabled: final_debug_logging_enabled,
        }
    }

    /// Creates a default configuration, primarily reading from environment variables.
    pub fn from_env() -> Self {
        Self::new(None, None, None)
    }
}

#[derive(Clone)]
pub struct LiteLLMClient {
    client: Client,
    base_url: String, // Changed: no longer pub(crate)
    debug_logging_enabled: bool,
}

impl LiteLLMClient {
    // Modified constructor to accept LiteLLMConfig and reqwest::Client
    pub fn new(config: LiteLLMConfig, client: Client) -> Self {
        // API key is now part of config and used to build the client externally
        // or headers are set on the client externally.
        // For this example, we assume the client passed in is already configured with necessary headers.
        // If default headers specific to LiteLLM are still desired on every request,
        // they should be added here or ensured by the client provider.
        // However, the original code set Authorization and Content-Type, Accept.
        // For robust DI, the client should come pre-configured.
        // If we MUST set default headers here, it implies the injected client is not fully ready.
        // Let's assume for now the injected client is either pre-configured or we
        // will build a new client here if one isn't provided, but that slightly defeats the purpose of pure DI.
        // For now, we'll stick to using the provided client as-is.

        // The original code built a client with default headers.
        // To maintain that while allowing injection, we could:
        // 1. Expect the injected client to have these headers.
        // 2. Add them if not present (complex).
        // 3. Construct a new client if one isn't provided (as in Default impl).

        // For simplicity in this refactor, let's assume the provided client is configured.
        // The `Default` impl will handle creating a default client with headers.

        Self {
            client,
            base_url: config.base_url,
            debug_logging_enabled: config.debug_logging_enabled,
        }
    }

    // Helper to build a reqwest::Client with default LiteLLM headers
    fn build_default_reqwest_client(api_key: &str) -> reqwest::Client {
        let mut headers = header::HeaderMap::new();
        headers.insert(
            "Authorization",
            header::HeaderValue::from_str(&format!("Bearer {}", api_key)).unwrap(),
        );
        headers.insert(
            "Content-Type",
            header::HeaderValue::from_static("application/json"),
        );
        headers.insert(
            "Accept",
            header::HeaderValue::from_static("application/json"),
        );
        reqwest::Client::builder()
            .default_headers(headers)
            .build()
            .expect("Failed to create default HTTP client")
    }

    pub async fn chat_completion(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<ChatCompletionResponse> {
        let url = format!("{}/chat/completions", self.base_url);

        if self.debug_logging_enabled {
            tracing::debug!(%url, "Sending chat completion request");
            tracing::debug!(
                payload = %serde_json::to_string_pretty(&request).unwrap_or_else(|e| format!("Serialization Error: {}",e)),
                "Request payload"
            );
        }

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to send chat completion request to {}: {:?}", url, e);
                anyhow::Error::from(e)
                    .context(format!("Failed to send chat completion request to {}", url))
            })?;

        let response_text = response.text().await.map_err(|e| {
            tracing::error!(
                "Failed to read chat completion response text from {}: {:?}",
                url,
                e
            );
            anyhow::Error::from(e).context(format!(
                "Failed to read chat completion response text from {}",
                url
            ))
        })?;

        if self.debug_logging_enabled {
            tracing::debug!(response_text = %response_text, "Raw response payload");
        }

        let parsed_response: ChatCompletionResponse = serde_json::from_str(&response_text)
            .map_err(|e| {
                tracing::error!(
                    response_text = %response_text,
                    error = ?e,
                    "Failed to parse chat completion response"
                );
                anyhow::Error::from(e).context(format!(
                    "Failed to parse chat completion response. Text: '{}'",
                    response_text
                ))
            })?;

        if self.debug_logging_enabled {
            if let Some(LiteLlmMessage::Assistant {
                tool_calls: Some(tool_calls),
                ..
            }) = parsed_response.choices.first().map(|c| &c.message)
            {
                tracing::debug!("Tool calls in response:");
                for tool_call in tool_calls {
                    tracing::debug!(tool_call_id = %tool_call.id, tool_name = %tool_call.function.name, tool_arguments = %tool_call.function.arguments, "Tool Call");
                }
            }
            tracing::debug!(
                response = %serde_json::to_string_pretty(&parsed_response).unwrap_or_else(|e| format!("Serialization Error: {}",e)),
                "Received chat completion response"
            );
        }

        Ok(parsed_response)
    }

    pub async fn stream_chat_completion(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<mpsc::Receiver<Result<ChatCompletionChunk>>> {
        let url = format!("{}/chat/completions", self.base_url);

        if self.debug_logging_enabled {
            tracing::debug!(%url, "Starting stream chat completion request");
            tracing::debug!(
                payload = %serde_json::to_string_pretty(&request).unwrap_or_else(|e| format!("Serialization Error: {}",e)),
                "Stream request payload"
            );
        }

        let http_response_result = self
            .client
            .post(&url)
            .json(&ChatCompletionRequest {
                stream: Some(true),
                ..request
            })
            .send()
            .await;

        let http_response = match http_response_result {
            Ok(resp) => resp,
            Err(e) => {
                tracing::error!(
                    "Failed to send stream chat completion request to {}: {:?}",
                    url,
                    e
                );
                return Err(anyhow::Error::from(e).context(format!(
                    "Failed to send stream chat completion request to {}",
                    url
                )));
            }
        };

        let stream = http_response.bytes_stream();
        let (tx, rx) = mpsc::channel(100);

        // Use captured debug_logging_enabled for the async block
        let debug_logging_enabled = self.debug_logging_enabled;

        tokio::spawn(Self::process_chat_completion_stream(
            stream,
            tx,
            debug_logging_enabled,
        ));

        if self.debug_logging_enabled {
            tracing::debug!("Returning stream receiver");
        }
        Ok(rx)
    }

    // Extracted stream processing logic
    async fn process_chat_completion_stream(
        mut stream: impl StreamExt<Item = reqwest::Result<bytes::Bytes>> + Unpin, // Changed back to bytes::Bytes
        tx: mpsc::Sender<Result<ChatCompletionChunk>>,
        debug_logging_enabled: bool,
    ) {
        let mut buffer = String::new();
        if debug_logging_enabled {
            tracing::debug!("Stream processing started");
        }

        while let Some(chunk_result) = stream.next().await {
            match chunk_result {
                Ok(chunk) => {
                    let chunk_str = String::from_utf8_lossy(&chunk);
                    if debug_logging_enabled {
                        tracing::debug!(raw_chunk = %chunk_str, "Raw stream chunk received");
                    }
                    buffer.push_str(&chunk_str);

                    while let Some(pos) = buffer.find("\n\n") {
                        // Corrected to find literal \n\n in SSE
                        let line_block = buffer[..pos].to_string();
                        buffer = buffer[pos + 2..].to_string(); // Consume "\n\n"

                        // Process potentially multiple "data: " lines within this block
                        for line in line_block.lines() {
                            let trimmed_line = line.trim();
                            if let Some(data) = trimmed_line.strip_prefix("data: ") {
                                if debug_logging_enabled {
                                    tracing::debug!(stream_data = %data, "Processing stream data line");
                                }
                                if data == "[DONE]" {
                                    if debug_logging_enabled {
                                        tracing::debug!("Stream completed with [DONE] signal");
                                    }
                                    return; // Exit the outer function process_chat_completion_stream
                                }

                                match serde_json::from_str::<ChatCompletionChunk>(data) {
                                    Ok(response_chunk) => {
                                        if debug_logging_enabled {
                                            if let Some(tool_calls) =
                                                &response_chunk.choices[0].delta.tool_calls
                                            {
                                                tracing::debug!("Tool calls in stream chunk:");
                                                for tool_call in tool_calls {
                                                    let id_str =
                                                        tool_call.id.as_deref().unwrap_or("N/A");
                                                    let name_str = tool_call
                                                        .function
                                                        .as_ref()
                                                        .and_then(|f| f.name.as_deref())
                                                        .unwrap_or("N/A");
                                                    let args_str = tool_call
                                                        .function
                                                        .as_ref()
                                                        .and_then(|f| f.arguments.as_deref())
                                                        .unwrap_or("N/A");
                                                    tracing::debug!(tool_call_id = %id_str, tool_name = %name_str, tool_arguments = %args_str, "Stream Tool Call");
                                                }
                                            }
                                            tracing::debug!(parsed_chunk = ?response_chunk, "Parsed stream chunk");
                                        }

                                        if tx.try_send(Ok(response_chunk)).is_err() {
                                            if debug_logging_enabled {
                                                tracing::warn!("Stream channel full, receiver may not be keeping up. Chunk dropped.");
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        if debug_logging_enabled {
                                            tracing::error!(error = ?e, data_payload = %data, "Error parsing stream data line");
                                        }
                                        if tx
                                            .try_send(Err(anyhow::Error::from(e).context(format!(
                                                "Error parsing stream data line: '{}'",
                                                data
                                            ))))
                                            .is_err()
                                        {
                                            if debug_logging_enabled {
                                                tracing::warn!("Stream channel full while trying to send parsing error. Error dropped.");
                                            }
                                        }
                                    }
                                }
                            } else if !trimmed_line.is_empty() && debug_logging_enabled {
                                tracing::warn!(unexpected_line = %trimmed_line, "Received unexpected line in stream block");
                            }
                        }
                    }
                }
                Err(e) => {
                    if debug_logging_enabled {
                        tracing::error!(error = ?e, "Error receiving chunk from byte stream");
                    }
                    if tx
                        .try_send(Err(anyhow::Error::from(e)
                            .context("Error receiving chunk from byte stream")))
                        .is_err()
                    {
                        if debug_logging_enabled {
                            tracing::warn!("Stream channel full while trying to send byte stream error. Error dropped.");
                        }
                    }
                }
            }
        }

        // After the main stream loop, process any remaining data in the buffer.
        if debug_logging_enabled {
            tracing::debug!(remaining_buffer = %buffer, "Byte stream ended. Processing any remaining buffer content.");
        }

        if !buffer.is_empty() {
            for line in buffer.lines() {
                let trimmed_line = line.trim();
                if let Some(data) = trimmed_line.strip_prefix("data: ") {
                    if debug_logging_enabled {
                        tracing::debug!(stream_data = %data, "Processing stream data line from final buffer");
                    }
                    if data == "[DONE]" {
                        if debug_logging_enabled {
                            tracing::debug!("Stream completed with [DONE] signal in final buffer");
                        }
                        // No need to return; tx drop will signal completion.
                        break; // Stop processing if [DONE] is found in the final buffer lines.
                    }

                    match serde_json::from_str::<ChatCompletionChunk>(data) {
                        Ok(response_chunk) => {
                            if debug_logging_enabled {
                                // Simplified logging for brevity, can be expanded if needed
                                tracing::debug!(parsed_chunk = ?response_chunk, "Parsed final buffer chunk");
                            }
                            if tx.try_send(Ok(response_chunk)).is_err() {
                                if debug_logging_enabled {
                                    tracing::warn!(
                                        "Final buffer: Stream channel full. Chunk dropped."
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            if debug_logging_enabled {
                                tracing::error!(error = ?e, data_payload = %data, "Final buffer: Error parsing stream data line");
                            }
                            if tx
                                .try_send(Err(anyhow::Error::from(e).context(format!(
                                    "Final buffer: Error parsing stream data line: '{}'",
                                    data
                                ))))
                                .is_err()
                            {
                                if debug_logging_enabled {
                                    tracing::warn!("Final buffer: Stream channel full while trying to send parsing error. Error dropped.");
                                }
                            }
                        }
                    }
                } else if !trimmed_line.is_empty() && debug_logging_enabled {
                    tracing::warn!(unexpected_line = %trimmed_line, "Final buffer: Received unexpected line");
                }
            }
        }

        if debug_logging_enabled {
            tracing::debug!(
                "Stream processing completed (end of stream reached and final buffer processed)"
            );
        }
    }

    pub async fn generate_embeddings(
        &self,
        request: EmbeddingRequest,
    ) -> Result<EmbeddingResponse> {
        let url = format!("{}/embeddings", self.base_url);

        if self.debug_logging_enabled {
            tracing::debug!(%url, "Sending embedding request");
            tracing::debug!(
                payload = %serde_json::to_string_pretty(&request).unwrap_or_else(|e| format!("Serialization Error: {}", e)),
                "Embedding request payload"
            );
        }

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to send embedding request to {}: {:?}", url, e);
                anyhow::Error::from(e)
                    .context(format!("Failed to send embedding request to {}", url))
            })?;

        let status = response.status();
        let response_text = response.text().await.map_err(|e| {
            tracing::error!(
                "Failed to read embedding response text from {}: {:?}",
                url,
                e
            );
            anyhow::Error::from(e).context(format!(
                "Failed to read embedding response text from {}",
                url
            ))
        })?;

        if !status.is_success() {
            if self.debug_logging_enabled {
                tracing::error!(
                    status = %status,
                    response_text = %response_text,
                    "Error response from embedding endpoint"
                );
            }
            return Err(anyhow::anyhow!(
                "Embedding request to {} failed with status {}: {}",
                url,
                status,
                response_text
            ));
        }

        if self.debug_logging_enabled {
            tracing::debug!(response_text = %response_text, "Raw embedding response payload");
        }

        let parsed_response: EmbeddingResponse = serde_json::from_str(&response_text)
            .map_err(|e| {
                tracing::error!(
                    response_text = %response_text,
                    error = ?e,
                    "Failed to deserialize embedding response"
                );
                anyhow::anyhow!("Failed to deserialize embedding response from {}. Error: {}. Response text: '{}'", url, e, response_text)
            })?;

        if self.debug_logging_enabled {
            tracing::debug!(
                response = %serde_json::to_string_pretty(&parsed_response).unwrap_or_else(|e| format!("Serialization Error: {}", e)),
                "Received embedding response"
            );
        }

        Ok(parsed_response)
    }
}

impl Default for LiteLLMClient {
    fn default() -> Self {
        let config = LiteLLMConfig::from_env();
        // Create a reqwest::Client with default headers using the API key from config
        let client = Self::build_default_reqwest_client(&config.api_key);
        Self::new(config, client)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bytes::Bytes;
    use futures_util::stream;
    use serial_test::serial;
    use std::env;
    use std::io; // For creating a mock error
    use tokio::sync::mpsc; // Ensured this is present

    // Helper to temporarily set an env var and restore it
    struct TempEnvVar {
        key: String,
        original_value: Option<String>,
    }

    impl TempEnvVar {
        fn new(key: &str, value: &str) -> Self {
            let key = key.to_string();
            let original_value = env::var(&key).ok();
            env::set_var(&key, value);
            Self {
                key,
                original_value,
            }
        }
    }

    impl Drop for TempEnvVar {
        fn drop(&mut self) {
            if let Some(val) = &self.original_value {
                env::set_var(&self.key, val);
            } else {
                env::remove_var(&self.key);
            }
        }
    }

    // Helper to temporarily remove an env var and restore it
    struct RemovedEnvVar {
        key: String,
        original_value: Option<String>,
    }

    impl RemovedEnvVar {
        fn new(key: &str) -> Self {
            let key = key.to_string();
            let original_value = env::var(&key).ok();
            env::remove_var(&key);
            Self {
                key,
                original_value,
            }
        }
    }

    impl Drop for RemovedEnvVar {
        fn drop(&mut self) {
            if let Some(val) = &self.original_value {
                env::set_var(&self.key, val);
            }
        }
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_litellm_config_new_all_params_provided() {
        let config = LiteLLMConfig::new(
            Some("test_api_key".to_string()),
            Some("http://custom.url:1234".to_string()),
            Some(true),
        );
        assert_eq!(config.api_key, "test_api_key");
        assert_eq!(config.base_url, "http://custom.url:1234");
        assert_eq!(config.debug_logging_enabled, true);

        let config_debug_false = LiteLLMConfig::new(
            Some("test_api_key_2".to_string()),
            Some("http://custom.url.two:5678".to_string()),
            Some(false),
        );
        assert_eq!(config_debug_false.api_key, "test_api_key_2");
        assert_eq!(config_debug_false.base_url, "http://custom.url.two:5678");
        assert_eq!(config_debug_false.debug_logging_enabled, false);
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    #[should_panic(expected = "LLM_API_KEY must be provided")]
    async fn test_litellm_config_new_api_key_panics_if_unresolvable() {
        // Ensure relevant env vars are not set for this test
        let _env_llm_api_key = RemovedEnvVar::new("LLM_API_KEY");
        let _env_litellm_config_path = RemovedEnvVar::new("LITELLM_CONFIG_PATH");

        // Expect panic because API key is None and not found in env or via LITELLM_CONFIG_PATH
        LiteLLMConfig::new(None, Some("http://some.url".to_string()), Some(false));
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_litellm_config_new_api_key_dummy_if_config_path_set() {
        let _env_llm_api_key = RemovedEnvVar::new("LLM_API_KEY"); // Ensure LLM_API_KEY is not interfering
        let _env_litellm_config_path =
            TempEnvVar::new("LITELLM_CONFIG_PATH", "/dummy/path/config.yaml");

        let config = LiteLLMConfig::new(None, Some("http://another.url".to_string()), Some(false));
        assert_eq!(config.api_key, "dummy-key-not-used");
        assert_eq!(config.base_url, "http://another.url");
        assert_eq!(config.debug_logging_enabled, false);
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_litellm_config_new_uses_env_vars_if_params_none() {
        let _env_llm_api_key = TempEnvVar::new("LLM_API_KEY", "env_api_key_123");
        let _env_llm_base_url = TempEnvVar::new("LLM_BASE_URL", "http://env.base.url:8080");
        let _env_litellm_debug = TempEnvVar::new("LITELLM_DEBUG", "true");
        // Ensure LITELLM_CONFIG_PATH is not set, so LLM_API_KEY is used
        let _env_litellm_config_path = RemovedEnvVar::new("LITELLM_CONFIG_PATH");

        let config = LiteLLMConfig::new(None, None, None);
        assert_eq!(config.api_key, "env_api_key_123");
        assert_eq!(config.base_url, "http://env.base.url:8080");
        assert_eq!(config.debug_logging_enabled, true);
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_litellm_config_new_param_override_env_vars() {
        let _env_llm_api_key = TempEnvVar::new("LLM_API_KEY", "env_api_key_ignored");
        let _env_llm_base_url = TempEnvVar::new("LLM_BASE_URL", "http://env.base.url.ignored");
        let _env_litellm_debug = TempEnvVar::new("LITELLM_DEBUG", "false"); // Env says false

        let config = LiteLLMConfig::new(
            Some("param_api_key".to_string()),
            Some("http://param.url".to_string()),
            Some(true), // Param says true
        );
        assert_eq!(config.api_key, "param_api_key");
        assert_eq!(config.base_url, "http://param.url");
        assert_eq!(config.debug_logging_enabled, true); // Param (true) should override env (false)
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_litellm_config_new_default_base_url_and_debug() {
        // This test relies on LLM_API_KEY being set, otherwise it would panic.
        // Or LITELLM_CONFIG_PATH can provide the dummy key.
        let _env_litellm_config_path = TempEnvVar::new("LITELLM_CONFIG_PATH", "/dummy/path");
        let _env_llm_base_url = RemovedEnvVar::new("LLM_BASE_URL");
        let _env_litellm_debug = RemovedEnvVar::new("LITELLM_DEBUG");

        let config = LiteLLMConfig::new(None, None, None); // API key from LITELLM_CONFIG_PATH, others default
        assert_eq!(config.api_key, "dummy-key-not-used");
        assert_eq!(config.base_url, "http://localhost:8000"); // Default base URL
        assert_eq!(config.debug_logging_enabled, false); // Default debug logging
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_litellm_config_new_debug_env_var_parsing_true_variations() {
        let _env_llm_api_key = TempEnvVar::new("LLM_API_KEY", "debug_test_key");
        let _env_litellm_config_path = RemovedEnvVar::new("LITELLM_CONFIG_PATH");

        let _env_litellm_debug_true_str = TempEnvVar::new("LITELLM_DEBUG", "true");
        let config_true_str = LiteLLMConfig::new(None, None, None);
        assert_eq!(
            config_true_str.debug_logging_enabled, true,
            "LITELLM_DEBUG='true'"
        );
        drop(_env_litellm_debug_true_str); // release this TempEnvVar so the next one can take effect

        let _env_litellm_debug_1_str = TempEnvVar::new("LITELLM_DEBUG", "1");
        let config_1_str = LiteLLMConfig::new(None, None, None);
        assert_eq!(
            config_1_str.debug_logging_enabled, true,
            "LITELLM_DEBUG='1'"
        );
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_litellm_config_new_debug_env_var_parsing_false_variations() {
        let _env_llm_api_key = TempEnvVar::new("LLM_API_KEY", "debug_test_key_false");
        let _env_litellm_config_path = RemovedEnvVar::new("LITELLM_CONFIG_PATH");

        let _env_litellm_debug_false_str = TempEnvVar::new("LITELLM_DEBUG", "false");
        let config_false_str = LiteLLMConfig::new(None, None, None);
        assert_eq!(
            config_false_str.debug_logging_enabled, false,
            "LITELLM_DEBUG='false'"
        );
        drop(_env_litellm_debug_false_str);

        let _env_litellm_debug_0_str = TempEnvVar::new("LITELLM_DEBUG", "0");
        let config_0_str = LiteLLMConfig::new(None, None, None);
        assert_eq!(
            config_0_str.debug_logging_enabled, false,
            "LITELLM_DEBUG='0'"
        );
        drop(_env_litellm_debug_0_str);

        let _env_litellm_debug_other_str = TempEnvVar::new("LITELLM_DEBUG", "anything_else");
        let config_other_str = LiteLLMConfig::new(None, None, None);
        assert_eq!(
            config_other_str.debug_logging_enabled, false,
            "LITELLM_DEBUG='anything_else'"
        );
        drop(_env_litellm_debug_other_str);

        let _env_litellm_debug_empty_str = TempEnvVar::new("LITELLM_DEBUG", "");
        let config_empty_str = LiteLLMConfig::new(None, None, None);
        assert_eq!(
            config_empty_str.debug_logging_enabled, false,
            "LITELLM_DEBUG=''"
        );
        drop(_env_litellm_debug_empty_str);

        // Ensure if LITELLM_DEBUG is not set at all, it defaults to false
        let _env_litellm_debug_removed = RemovedEnvVar::new("LITELLM_DEBUG");
        let config_no_env = LiteLLMConfig::new(None, None, None);
        assert_eq!(
            config_no_env.debug_logging_enabled, false,
            "LITELLM_DEBUG not set"
        );
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_litellm_config_from_env_uses_env_vars() {
        let _env_llm_api_key = TempEnvVar::new("LLM_API_KEY", "env_api_for_from_env");
        let _env_llm_base_url = TempEnvVar::new("LLM_BASE_URL", "http://env.base.url.from_env");
        let _env_litellm_debug = TempEnvVar::new("LITELLM_DEBUG", "true");
        let _env_litellm_config_path = RemovedEnvVar::new("LITELLM_CONFIG_PATH");

        let config = LiteLLMConfig::from_env();
        assert_eq!(config.api_key, "env_api_for_from_env");
        assert_eq!(config.base_url, "http://env.base.url.from_env");
        assert_eq!(config.debug_logging_enabled, true);
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    #[should_panic(expected = "LLM_API_KEY must be provided")]
    async fn test_litellm_config_from_env_panics_if_api_key_unresolvable() {
        let _env_llm_api_key = RemovedEnvVar::new("LLM_API_KEY");
        let _env_litellm_config_path = RemovedEnvVar::new("LITELLM_CONFIG_PATH");

        LiteLLMConfig::from_env();
    }

    // Tests for LiteLLMClient helper methods (like stream processing)
    #[tokio::test]
    async fn test_process_stream_empty_stream() {
        let (tx, mut rx) = mpsc::channel(10);
        let empty_stream = stream::empty::<reqwest::Result<Bytes>>();

        LiteLLMClient::process_chat_completion_stream(empty_stream, tx, false).await;

        // Receiver should find the channel closed without any items
        assert!(rx.recv().await.is_none());
    }

    #[tokio::test]
    async fn test_process_stream_single_valid_chunk() {
        let (tx, mut rx) = mpsc::channel(10);
        let chunk_json = r#"{"id":"chunk1","object":"chat.completion.chunk","created":123,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}"#;
        let sse_event = format!("data: {}\n\n", chunk_json);
        let stream = Box::pin(stream::once(async { Ok(Bytes::from(sse_event)) }));

        LiteLLMClient::process_chat_completion_stream(stream, tx, false).await;

        match rx.recv().await {
            Some(Ok(chunk)) => {
                assert_eq!(chunk.id, "chunk1");
                assert_eq!(chunk.choices[0].delta.content.as_deref().unwrap(), "Hello");
            }
            other => panic!("Expected Ok(ChatCompletionChunk), got {:?}", other),
        }
        assert!(rx.recv().await.is_none(), "Stream should be exhausted");
    }

    #[tokio::test]
    async fn test_process_stream_multiple_valid_chunks() {
        let (tx, mut rx) = mpsc::channel(10);
        let chunk1_json = r#"{"id":"c1","object":"c","created":1,"model":"m","choices":[{"index":0,"delta":{"content":"A"}}]}"#;
        let chunk2_json = r#"{"id":"c2","object":"c","created":2,"model":"m","choices":[{"index":0,"delta":{"content":" B"}}]}"#;
        let sse_events = vec![
            Ok(Bytes::from(format!("data: {}\n\n", chunk1_json))),
            Ok(Bytes::from(format!("data: {}\n\n", chunk2_json))),
            Ok(Bytes::from("data: [DONE]\n\n".to_string())),
        ];
        let stream = stream::iter(sse_events);

        LiteLLMClient::process_chat_completion_stream(stream, tx, false).await;

        let res1 = rx.recv().await.unwrap().unwrap();
        assert_eq!(res1.id, "c1");
        assert_eq!(res1.choices[0].delta.content.as_deref(), Some("A"));

        let res2 = rx.recv().await.unwrap().unwrap();
        assert_eq!(res2.id, "c2");
        assert_eq!(res2.choices[0].delta.content.as_deref(), Some(" B"));

        assert!(
            rx.recv().await.is_none(),
            "Stream should be exhausted after [DONE]"
        );
    }

    #[tokio::test]
    async fn test_process_stream_handles_done_event() {
        let (tx, mut rx) = mpsc::channel(10);
        let stream = Box::pin(stream::once(async { Ok(Bytes::from("data: [DONE]\n\n")) }));

        LiteLLMClient::process_chat_completion_stream(stream, tx, false).await;

        assert!(rx.recv().await.is_none(), "Stream should end after [DONE]");
    }

    #[tokio::test]
    async fn test_process_stream_partial_chunks_reassembly() {
        let (tx, mut rx) = mpsc::channel(10);
        let part1 = "data: {\"id\":\"p1\",\"object\":\"c\",\"created\":1,\"model\":\"m\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"Part";
        let part2 = "ial Hello\"}}]}\n\n"; // Corrected JSON structure

        let sse_events = vec![
            Ok(Bytes::from(part1)),
            Ok(Bytes::from(part2)),
            Ok(Bytes::from("data: [DONE]\n\n")),
        ];
        let stream = stream::iter(sse_events);
        LiteLLMClient::process_chat_completion_stream(stream, tx, false).await;

        let res = rx.recv().await.unwrap().unwrap();
        assert_eq!(res.id, "p1");
        assert_eq!(
            res.choices[0].delta.content.as_deref(),
            Some("Partial Hello")
        );
        assert!(rx.recv().await.is_none());
    }

    #[tokio::test]
    async fn test_process_stream_ignores_comments_and_empty_lines() {
        let (tx, mut rx) = mpsc::channel(10);
        let chunk_json = r#"{"id":"chunk_data","object":"c","created":1,"model":"m","choices":[{"index":0,"delta":{"content":"Data"}}]}"#;
        let sse_events = vec![
            Ok(Bytes::from(": this is a comment\n")), // SSE Spec: lines starting with : are comments
            Ok(Bytes::from("\n")),                    // Empty line, should be ignored
            Ok(Bytes::from(format!("data: {}\n\n", chunk_json))),
            Ok(Bytes::from("data: [DONE]\n\n")),
        ];
        let stream = stream::iter(sse_events);

        LiteLLMClient::process_chat_completion_stream(stream, tx, false).await;

        let res = rx.recv().await.unwrap().unwrap();
        assert_eq!(res.id, "chunk_data");
        assert_eq!(res.choices[0].delta.content.as_deref(), Some("Data"));
        assert!(rx.recv().await.is_none());
    }

    #[tokio::test]
    async fn test_process_stream_handles_malformed_json() {
        let (tx, mut rx) = mpsc::channel(10);
        let malformed_sse = "data: {invalid json here\n\n";
        let stream = Box::pin(stream::once(async { Ok(Bytes::from(malformed_sse)) }));

        LiteLLMClient::process_chat_completion_stream(stream, tx, false).await;

        match rx.recv().await {
            Some(Err(e)) => {
                let err_msg = e.to_string().to_lowercase();
                assert!(
                    err_msg.contains("error parsing stream data line"),
                    "Error message mismatch: {}",
                    err_msg
                ); // Adjusted assertion
                assert!(err_msg.contains("invalid json here"));
            }
            other => panic!("Expected Err for malformed JSON, got {:?}", other),
        }
        assert!(rx.recv().await.is_none());
    }

    #[tokio::test]
    #[serial] // This will likely still cause issues if serial_test is not resolved
    async fn test_process_stream_handles_reqwest_error_in_stream() {
        let (tx, mut rx) = mpsc::channel(10);

        // Obtain a reqwest::Error by attempting an invalid request
        let error_generating_client = reqwest::Client::new();
        let mock_reqwest_error = error_generating_client
            .get("this_is_not_a_valid_url_at_all")
            .send()
            .await
            .expect_err(
                "Expected an error from invalid URL to construct a reqwest::Error for test",
            );

        let stream = Box::pin(stream::once(async { Err(mock_reqwest_error) }));

        LiteLLMClient::process_chat_completion_stream(stream, tx, false).await;

        match rx.recv().await {
            Some(Err(e)) => {
                let err_msg = e.to_string().to_lowercase();
                assert!(
                    err_msg.contains("error receiving chunk from byte stream"),
                    "Error message mismatch: {}",
                    err_msg
                ); // Adjusted assertion
            }
            other => panic!("Expected Err for reqwest stream error, got {:?}", other),
        }
        assert!(rx.recv().await.is_none());
    }

    #[tokio::test]
    async fn test_process_stream_multiple_data_lines_in_one_event_block() {
        let (tx, mut rx) = mpsc::channel(10);
        let chunk1_json = r#"{"id":"b_c1","object":"c","created":1,"model":"m","choices":[{"index":0,"delta":{"content":"Block1"}}]}"#;
        let chunk2_json = r#"{"id":"b_c2","object":"c","created":2,"model":"m","choices":[{"index":0,"delta":{"content":"Block2"}}]}"#;
        // SSE events can have multiple "data:" lines for a single event, but they are typically processed one line at a time by a parser.
        // Our specific parser splits by "\n\n", then processes lines starting with "data: ".
        // If an SSE event block is formatted like "data: {}\ndata: {}\n\n",
        // it implies two distinct JSON objects, each on its own data line, terminated by a single newline pair.
        // This test verifies that such a structure is correctly parsed into two separate chunks.
        let sse_event = format!("data: {}\ndata: {}\n\n", chunk1_json, chunk2_json);
        let stream = stream::iter(vec![
            Ok(Bytes::from(sse_event)),
            Ok(Bytes::from("data: [DONE]\n\n")),
        ]);

        LiteLLMClient::process_chat_completion_stream(stream, tx, false).await;

        let res1 = rx.recv().await.unwrap().unwrap();
        assert_eq!(res1.id, "b_c1");
        assert_eq!(res1.choices[0].delta.content.as_deref(), Some("Block1"));

        let res2 = rx.recv().await.unwrap().unwrap();
        assert_eq!(res2.id, "b_c2");
        assert_eq!(res2.choices[0].delta.content.as_deref(), Some("Block2"));

        assert!(rx.recv().await.is_none());
    }

    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_litellm_client_new_basic() {
        let config = LiteLLMConfig::new(
            Some("key".into()),
            Some("http://localhost:8000".into()),
            Some(false),
        );
        let reqwest_client = LiteLLMClient::build_default_reqwest_client("key");
        let client = LiteLLMClient::new(config.clone(), reqwest_client);
        assert_eq!(client.base_url, config.base_url);
        assert_eq!(client.debug_logging_enabled, config.debug_logging_enabled);
        // We can't easily inspect the reqwest::Client's default headers without making a call,
        // so testing build_default_reqwest_client separately (e.g. with a mock server) would be more robust for header checks.
    }

    // A more involved test for build_default_reqwest_client would use a mock HTTP server (e.g. wiremock or mockito)
    // to verify that the client sends the correct headers.
    // For now, we'll keep it simple and assume the header construction is correct if it builds.
    #[tokio::test]
    #[serial] // Relies on crate-level import of the macro
    async fn test_build_default_reqwest_client_builds() {
        let _client = LiteLLMClient::build_default_reqwest_client("test-api-key-for-build");
        // If it builds, that's a basic check. More would require a mock server.
        assert!(true); // Placeholder for successful build
    }
}
