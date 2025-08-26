use anyhow::Result;
use futures_util::StreamExt;
use reqwest::{header, Client};
use tokio::sync::mpsc;
use once_cell::sync::Lazy;
use tracing;
use secrets::{get_secret_sync, get_secret_sync_or_default};

use super::types::*;

// Debug flag controlled by environment variable
static DEBUG_ENABLED: Lazy<bool> = Lazy::new(|| {
    get_secret_sync("LITELLM_DEBUG")
        .map(|val| val.to_lowercase() == "true" || val == "1")
        .unwrap_or(false)
});

#[derive(Clone)]
pub struct LiteLLMClient {
    client: Client,
    pub(crate) base_url: String,
}

impl LiteLLMClient {
    // Helper function for conditional debug logging
    fn debug_log(msg: &str) {
        if *DEBUG_ENABLED {
            println!("DEBUG: {}", msg);
        }
    }
    
    pub fn new(api_key: Option<String>, base_url: Option<String>) -> Self {
        // Check for API key - when using LiteLLM with a config file, the API key is typically
        // already in the config file, so we just need a dummy value here for the client
        let api_key = api_key
            .or_else(|| get_secret_sync("LLM_API_KEY").ok())
            .unwrap_or_else(|| {
                // If we have a LiteLLM config path, we can use a placeholder API key
                // since auth will be handled by the LiteLLM server using the config
                if get_secret_sync("LITELLM_CONFIG_PATH").is_ok() {
                    Self::debug_log("Using LiteLLM config from environment");
                    "dummy-key-not-used".to_string()
                } else {
                    panic!("LLM_API_KEY must be provided either through parameter, environment variable, or LITELLM_CONFIG_PATH must be set");
                }
            });

        let base_url = base_url
            .or_else(|| get_secret_sync("LLM_BASE_URL").ok())
            .unwrap_or_else(|| "http://localhost:8000".to_string());

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

        let client = Client::builder()
            .default_headers(headers)
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            base_url,
        }
    }

    pub async fn chat_completion(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<ChatCompletionResponse> {
        let url = format!("{}/chat/completions", self.base_url);

        Self::debug_log(&format!("Sending chat completion request to URL: {}", url));
        if *DEBUG_ENABLED {
            Self::debug_log(&format!(
                "Request payload: {}",
                serde_json::to_string_pretty(&request).unwrap()
            ));
        }

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to send chat completion request: {:?}", e);
                anyhow::Error::from(e)
            })?;

        // Get the raw response text
        let response_text = response.text().await.map_err(|e| {
            tracing::error!("Failed to read chat completion response text: {:?}", e);
            anyhow::Error::from(e)
        })?;
        if *DEBUG_ENABLED {
            Self::debug_log(&format!("Raw response payload: {}", response_text));
        }

        // Parse the response text into the expected type
        let response: ChatCompletionResponse = serde_json::from_str(&response_text).map_err(|e| {
            tracing::error!(
                "Failed to parse chat completion response. Text: {}, Error: {:?}",
                response_text,
                e
            );
            anyhow::Error::from(e)
        })?;

        // Log tool calls if present and debug is enabled
        if *DEBUG_ENABLED {
            if let Some(AgentMessage::Assistant {
                tool_calls: Some(tool_calls),
                ..
            }) = response.choices.first().map(|c| &c.message)
            {
                Self::debug_log("Tool calls in response:");
                for tool_call in tool_calls {
                    Self::debug_log(&format!("Tool Call ID: {}", tool_call.id));
                    Self::debug_log(&format!("Tool Name: {}", tool_call.function.name));
                    Self::debug_log(&format!("Tool Arguments: {}", tool_call.function.arguments));
                }
            }

            Self::debug_log(&format!(
                "Received chat completion response: {}",
                serde_json::to_string_pretty(&response).unwrap()
            ));
        }

        Ok(response)
    }

    pub async fn stream_chat_completion(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<mpsc::Receiver<Result<ChatCompletionChunk>>> {
        let url = format!("{}/chat/completions", self.base_url);

        Self::debug_log(&format!(
            "Starting stream chat completion request to URL: {}",
            url
        ));
        if *DEBUG_ENABLED {
            Self::debug_log(&format!(
                "Stream request payload: {}",
                serde_json::to_string_pretty(&request).unwrap()
            ));
        }

        let mut stream = self
            .client
            .post(&url)
            .json(&ChatCompletionRequest {
                stream: Some(true),
                ..request
            })
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to send stream chat completion request: {:?}", e);
                anyhow::Error::from(e)
            })?
            .bytes_stream();

        let (tx, rx) = mpsc::channel(100);
        let debug_enabled = *DEBUG_ENABLED; // Capture for the async block

        tokio::spawn(async move {
            let mut buffer = String::new();
            if debug_enabled {
                Self::debug_log("Stream processing started");
            }

            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        let chunk_str = String::from_utf8_lossy(&chunk);
                        if debug_enabled {
                            Self::debug_log(&format!("Raw response payload: {}", chunk_str));
                        }
                        buffer.push_str(&chunk_str);

                        while let Some(pos) = buffer.find("\n\n") {
                            let line = buffer[..pos].trim().to_string();
                            buffer = buffer[pos + 2..].to_string();

                            if let Some(data) = line.strip_prefix("data: ") {
                                if debug_enabled {
                                    Self::debug_log(&format!("Processing stream data: {}", data));
                                }
                                if data == "[DONE]" {
                                    if debug_enabled {
                                        Self::debug_log("Stream completed with [DONE] signal");
                                    }
                                    return;
                                }

                                match serde_json::from_str::<ChatCompletionChunk>(data) {
                                    Ok(response) => {
                                        // Log tool calls if present and debug is enabled
                                        if debug_enabled {
                                            if let Some(tool_calls) = &response.choices[0].delta.tool_calls
                                            {
                                                Self::debug_log("Tool calls in stream chunk:");
                                                for tool_call in tool_calls {
                                                    if let (Some(id), Some(function)) =
                                                        (tool_call.id.clone(), tool_call.function.clone())
                                                    {
                                                        Self::debug_log(&format!("Tool Call ID: {}", id));
                                                        if let Some(name) = function.name {
                                                            Self::debug_log(&format!("Tool Name: {}", name));
                                                        }
                                                        if let Some(arguments) = function.arguments {
                                                            Self::debug_log(&format!(
                                                                "Tool Arguments: {}",
                                                                arguments
                                                            ));
                                                        }
                                                    }
                                                }
                                            }
                                            Self::debug_log(&format!("Parsed stream chunk: {:?}", response));
                                        }
                                        
                                        // Use try_send instead of send to avoid blocking
                                        if tx.try_send(Ok(response)).is_err() {
                                            // If the channel is full, log it but continue processing
                                            if debug_enabled {
                                                Self::debug_log("Warning: Channel full, receiver not keeping up");
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        if debug_enabled {
                                            Self::debug_log(&format!("Error in stream processing: {:?}", e));
                                        }
                                        tracing::error!("Error receiving chunk from stream: {:?}", e);
                                        // Use try_send to avoid blocking
                                        let _ = tx.try_send(Err(anyhow::Error::from(e)));
                                    }
                                }
                            } else if !line.is_empty() {
                                tracing::warn!("Received unexpected line in stream: {}", line);
                            }
                        }
                    }
                    Err(e) => {
                        if debug_enabled {
                            Self::debug_log(&format!("Error in stream processing: {:?}", e));
                        }
                        tracing::error!("Error receiving chunk from stream: {:?}", e);
                        // Use try_send to avoid blocking
                        let _ = tx.try_send(Err(anyhow::Error::from(e)));
                    }
                }
            }
            if debug_enabled {
                Self::debug_log("Stream processing completed");
            }
        });

        if debug_enabled {
            Self::debug_log("Returning stream receiver");
        }
        Ok(rx)
    }

    pub async fn generate_embeddings(
        &self,
        request: EmbeddingRequest,
    ) -> Result<EmbeddingResponse> {
        let url = format!("{}/embeddings", self.base_url);

        Self::debug_log(&format!("Sending embedding request to URL: {}", url));
        if *DEBUG_ENABLED {
            Self::debug_log(&format!(
                "Embedding request payload: {}",
                serde_json::to_string_pretty(&request).unwrap_or_else(|e| format!("Serialization Error: {}", e))
            ));
        }

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await?;

        // Check for non-success status codes first
        let status = response.status();
        let response_text = response.text().await?;
        if !status.is_success() {
            Self::debug_log(&format!(
                "Error response from embedding endpoint (Status: {}): {}",
                status,
                response_text
            ));
            return Err(anyhow::anyhow!(
                "Embedding request failed with status {}: {}",
                status,
                response_text
            ));
        }
        
        if *DEBUG_ENABLED {
            Self::debug_log(&format!("Raw embedding response payload: {}", response_text));
        }

        // Parse the response text into the expected type
        let response: EmbeddingResponse = serde_json::from_str(&response_text)
            .map_err(|e| anyhow::anyhow!("Failed to deserialize embedding response: {}. Response text: {}", e, response_text))?;


        if *DEBUG_ENABLED {
             Self::debug_log(&format!(
                "Received embedding response: {}",
                serde_json::to_string_pretty(&response).unwrap_or_else(|e| format!("Serialization Error: {}", e))
            ));
        }

        Ok(response)
    }
}

impl Default for LiteLLMClient {
    fn default() -> Self {
        Self::new(None, None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito;
    use std::env;
    use std::time::Duration;
    use tokio::time::timeout;

    use dotenv::dotenv;

    // Helper function to initialize environment before tests
    async fn setup() -> (String, String) {
        // Load environment variables from .env file
        dotenv().ok();

        // Get API key and base URL from environment
        let api_key = get_secret_sync("LLM_API_KEY").expect("LLM_API_KEY must be set");
        let base_url = get_secret_sync("LLM_BASE_URL").expect("LLM_API_BASE must be set");

        (api_key, base_url)
    }

    fn create_test_message() -> AgentMessage {
        AgentMessage::user("Hello".to_string())
    }

    fn create_test_request() -> ChatCompletionRequest {
        ChatCompletionRequest {
            model: "gpt-4".to_string(),
            messages: vec![create_test_message()],
            temperature: Some(0.7),
            ..Default::default()
        }
    }

    #[tokio::test]
    async fn test_chat_completion_success() {
        let mut server = mockito::Server::new_async().await;

        let request = create_test_request();
        let request_body = serde_json::to_string(&request).unwrap();

        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(
                r#"{
                "id": "test-id",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "gpt-4",
                "system_fingerprint": "fp_44709d6fcb",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Hello there!"
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 20,
                    "total_tokens": 30,
                    "completion_tokens_details": {
                        "reasoning_tokens": 0,
                        "accepted_prediction_tokens": 0,
                        "rejected_prediction_tokens": 0
                    }
                }
            }"#,
            )
            .create();

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url()));

        let response = client.chat_completion(request).await.unwrap();
        assert_eq!(response.id, "test-id");
        if let AgentMessage::Assistant { content, .. } = response.choices[0].message.clone() {
            assert_eq!(content.unwrap(), "Hello there!");
        } else {
            panic!("Expected assistant message");
        }

        mock.assert();
    }

    #[tokio::test]
    async fn test_chat_completion_error() {
        let mut server = mockito::Server::new_async().await;

        let request = create_test_request();
        let request_body = serde_json::to_string(&request).unwrap();

        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(400)
            .with_header("content-type", "application/json")
            .with_body(r#"{"error": "Invalid request"}"#)
            .create();

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url()));

        let result = client.chat_completion(request).await;
        assert!(result.is_err());

        mock.assert();
    }

    #[tokio::test]
    async fn test_stream_chat_completion() {
        let mut server = mockito::Server::new_async().await;

        let mut request = create_test_request();
        request.stream = Some(true);
        let request_body = serde_json::to_string(&request).unwrap();

        let mock = server.mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(200)
            .with_header("content-type", "text/event-stream")
            .with_body(
                "data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"system_fingerprint\":\"fp_44709d6fcb\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\",\"content\":\"Hello\"},\"finish_reason\":null}]}\n\n\
                 data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"system_fingerprint\":\"fp_44709d6fcb\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\" world\"},\"finish_reason\":null}]}\n\n\
                 data: [DONE]\n\n"
            )
            .create();

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url()));

        let mut stream = client.stream_chat_completion(request).await.unwrap();

        let mut chunks = Vec::new();
        while let Ok(Some(chunk)) = timeout(Duration::from_secs(1), stream.recv()).await {
            if let Ok(chunk) = chunk {
                chunks.push(chunk);
            }
        }

        assert_eq!(chunks.len(), 2);
        // First chunk assertions
        let first_chunk = &chunks[0].choices[0].delta;
        assert_eq!(first_chunk.content.as_ref().unwrap(), "Hello");

        // Second chunk assertions
        let second_chunk = &chunks[1].choices[0].delta;
        assert_eq!(second_chunk.content.as_ref().unwrap(), " world");
        assert!(second_chunk.role.is_none());
        assert!(second_chunk.tool_calls.is_none());

        mock.assert();
    }

    #[tokio::test]
    async fn test_tool_call_completion() {
        let mut server = mockito::Server::new_async().await;

        let request = create_test_request();
        let request_body = serde_json::to_string(&request).unwrap();

        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(
                r#"{
                "id": "test-id",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "gpt-4",
                "system_fingerprint": "fp_44709d6fcb",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": null,
                        "tool_calls": [{
                            "id": "call_123",
                            "type": "function",
                            "function": {
                                "name": "get_current_weather",
                                "arguments": "{\"location\":\"Boston, MA\"}"
                            }
                        }]
                    },
                    "finish_reason": "tool_calls"
                }],
                "usage": {
                    "prompt_tokens": 82,
                    "completion_tokens": 17,
                    "total_tokens": 99,
                    "completion_tokens_details": {
                        "reasoning_tokens": 0,
                        "accepted_prediction_tokens": 0,
                        "rejected_prediction_tokens": 0
                    }
                }
            }"#,
            )
            .create();

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url()));

        let response = client.chat_completion(request).await.unwrap();
        assert_eq!(response.id, "test-id");
        if let AgentMessage::Assistant {
            content,
            tool_calls,
            ..
        } = &response.choices[0].message
        {
            assert!(content.is_none());
            let tool_calls = tool_calls.as_ref().unwrap();
            assert_eq!(tool_calls[0].id, "call_123");
            assert_eq!(tool_calls[0].function.name, "get_current_weather");
            assert_eq!(
                tool_calls[0].function.arguments,
                "{\"location\":\"Boston, MA\"}"
            );
        } else {
            panic!("Expected assistant message");
        }

        mock.assert();
    }

    #[test]
    fn test_client_initialization_with_env_vars() {
        let test_api_key = "test-env-key";
        let test_base_url = "http://test-env-url";

        env::set_var("LLM_API_KEY", test_api_key);
        env::set_var("LLM_BASE_URL", test_base_url);

        // Test with no parameters (should use env vars)
        let client = LiteLLMClient::new(None, None);
        assert_eq!(client.base_url, test_base_url);

        // Test with parameters (should override env vars)
        let override_key = "override-key";
        let override_url = "http://override-url";
        let client = LiteLLMClient::new(
            Some(override_key.to_string()),
            Some(override_url.to_string()),
        );
        assert_eq!(client.base_url, override_url);

        env::remove_var("LLM_API_KEY");
        env::remove_var("LLM_BASE_URL");
    }

    #[tokio::test]
    async fn test_single_message_completion() {
        let (api_key, base_url) = setup().await;
        let client = LiteLLMClient::new(Some(api_key), Some(base_url));

        let request = ChatCompletionRequest {
            model: "o1".to_string(),
            messages: vec![AgentMessage::user("Hello, world!".to_string())],
            ..Default::default()
        };

        let response = match client.chat_completion(request).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread: {:?}", e),
        };

        assert!(response.choices.len() > 0);
    }
}
