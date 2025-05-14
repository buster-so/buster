use dotenv::dotenv;
use litellm::{ChatCompletionRequest, ChatCompletionChunk, EmbeddingRequest, LiteLLMClient, LiteLlmMessage, MessageProgress, Tool, ToolChoice, LiteLLMConfig};
use reqwest::header;
use serde_json::json;
use std::env;
use std::time::Duration;
use tokio::time::timeout;
use anyhow::Result;

// Helper function to set up test environment
async fn setup_test_env() -> Result<(LiteLLMClient, String)> {
    // Load environment variables from .env file
    dotenv().ok();
    
    // Get API key and base URL from environment
    let api_key = env::var("LLM_API_KEY")
        .map_err(|_| anyhow::anyhow!("LLM_API_KEY must be set for integration tests"))?;
    
    let base_url = env::var("LLM_BASE_URL")
        .map_err(|_| anyhow::anyhow!("LLM_BASE_URL must be set for integration tests"))?;
    
    // Set debug mode for verbose logging during tests
    env::set_var("LITELLM_DEBUG", "true");
    
    // Create LiteLLMConfig
    let config = LiteLLMConfig::new(
        Some(api_key.clone()),
        Some(base_url.clone()),
        Some(true) // LITELLM_DEBUG is set to true
    );

    // Create reqwest::Client
    let mut headers_map = header::HeaderMap::new();
    headers_map.insert(
        header::AUTHORIZATION,
        header::HeaderValue::from_str(&format!("Bearer {}", api_key)).unwrap(),
    );
    headers_map.insert(
        header::CONTENT_TYPE,
        header::HeaderValue::from_static("application/json"),
    );
    headers_map.insert(
        header::ACCEPT,
        header::HeaderValue::from_static("application/json"),
    );
    let reqwest_client = reqwest::Client::builder()
        .default_headers(headers_map)
        .build()
        .expect("Failed to create HTTP client for tests");

    // Create LiteLLMClient
    let client = LiteLLMClient::new(config, reqwest_client);
    
    // Return client and model ID to use for chat
    Ok((client, env::var("TEST_MODEL_ID").unwrap_or_else(|_| "o4-mini".to_string())))
}

// Helper function to create a weather tool for testing tool calls
fn create_weather_tool() -> Tool {
    Tool {
        tool_type: "function".to_string(),
        function: json!({
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The temperature unit to use"
                    }
                },
                "required": ["location"]
            }
        }),
    }
}

#[tokio::test]
async fn test_basic_chat_completion() -> Result<()> {
    // Set up test environment
    let (client, model) = setup_test_env().await?;
    
    // Create a simple non-tool request
    let request = ChatCompletionRequest {
        model: model.clone(),
        messages: vec![
            LiteLlmMessage::developer("You are a helpful assistant."),
            LiteLlmMessage::user("Hello! What's your name?"),
        ],
        ..Default::default()
    };
    
    // Send the request
    let response = client.chat_completion(request).await?;
    
    // Validate response
    assert!(!response.id.is_empty(), "Response should have a valid ID");
    assert_eq!(response.choices.len(), 1, "Should have exactly one choice");
    
    // Check message content
    if let LiteLlmMessage::Assistant { content: assistant_content, tool_calls, .. } = &response.choices[0].message {
        assert!(assistant_content.is_some(), "Content should be present");
        assert!(tool_calls.is_none(), "Tool calls should not be present");
        println!("Response content: {:?}", assistant_content);
    } else {
        panic!("Expected assistant message");
    }
    
    // Check usage
    assert!(response.usage.prompt_tokens > 0, "Should have prompt tokens");
    assert!(response.usage.completion_tokens > 0, "Should have completion tokens");
    
    Ok(())
}

#[tokio::test]
async fn test_tool_call_chat_completion() -> Result<()> {
    // Set up test environment
    let (client, model) = setup_test_env().await?;
    
    // Create a tool call request
    let request = ChatCompletionRequest {
        model: model.clone(),
        messages: vec![
            LiteLlmMessage::developer("You are a helpful assistant."),
            LiteLlmMessage::user("What's the weather like in Boston right now?"),
        ],
        tools: Some(vec![create_weather_tool()]),
        tool_choice: Some(ToolChoice::Auto),
        ..Default::default()
    };
    
    // Send the request
    let response = client.chat_completion(request).await?;
    
    // Validate response
    assert!(!response.id.is_empty(), "Response should have a valid ID");
    assert_eq!(response.choices.len(), 1, "Should have exactly one choice");
    
    // Check tool call response
    if let LiteLlmMessage::Assistant { content: _, tool_calls, .. } = &response.choices[0].message {
        assert!(tool_calls.is_some(), "Tool calls should be present");
        let tool_calls = tool_calls.as_ref().unwrap();
        assert!(!tool_calls.is_empty(), "Tool calls should not be empty");
        
        // Validate the first tool call
        let tool_call = &tool_calls[0];
        assert_eq!(tool_call.call_type, "function", "Tool call type should be function");
        assert_eq!(tool_call.function.name, "get_current_weather", "Function name should match");
        
        // Check function arguments - should contain location
        let args = tool_call.function.arguments.to_lowercase();
        assert!(args.contains("boston"), "Arguments should contain Boston");
        
        println!("Tool call ID: {}", tool_call.id);
        println!("Tool call function: {}", tool_call.function.name);
        println!("Tool call arguments: {}", tool_call.function.arguments);
    } else {
        panic!("Expected assistant message");
    }
    
    Ok(())
}

#[tokio::test]
async fn test_follow_up_chat_completion() -> Result<()> {
    // Set up test environment
    let (client, model) = setup_test_env().await?;
    
    // Initial request
    let initial_request = ChatCompletionRequest {
        model: model.clone(),
        messages: vec![
            LiteLlmMessage::developer("You are a helpful assistant."),
            LiteLlmMessage::user("Tell me about the solar system."),
        ],
        ..Default::default()
    };
    
    // Send initial request
    let initial_response = client.chat_completion(initial_request).await?;
    
    // Extract assistant's response
    let assistant_message = match &initial_response.choices[0].message {
        LiteLlmMessage::Assistant { content, .. } => {
            content.clone().unwrap_or_default()
        },
        _ => panic!("Expected assistant message"),
    };
    
    // Follow-up request using the conversation history
    let follow_up_request = ChatCompletionRequest {
        model: model.clone(),
        messages: vec![
            LiteLlmMessage::developer("You are a helpful assistant."),
            LiteLlmMessage::user("Tell me about the solar system."),
            LiteLlmMessage::assistant(
                None,
                Some(assistant_message),
                None,
                MessageProgress::Complete,
                None,
                None,
            ),
            LiteLlmMessage::user("How many planets are there?"),
        ],
        ..Default::default()
    };
    
    // Send follow-up request
    let follow_up_response = client.chat_completion(follow_up_request).await?;
    
    // Validate follow-up response
    assert!(!follow_up_response.id.is_empty(), "Response should have a valid ID");
    
    // Check message content
    if let LiteLlmMessage::Assistant { content, .. } = &follow_up_response.choices[0].message {
        assert!(content.is_some(), "Content should be present");
        println!("Follow-up response: {:?}", content);
        
        // The response should likely mention 8 planets (or possibly 9 if including Pluto)
        let response_text = content.as_ref().unwrap().to_lowercase();
        assert!(
            response_text.contains("8") || 
            response_text.contains("eight") || 
            response_text.contains("9") || 
            response_text.contains("nine"),
            "Response should mention the number of planets"
        );
    } else {
        panic!("Expected assistant message");
    }
    
    Ok(())
}

#[tokio::test]
async fn test_recursive_tool_call() -> Result<()> {
    // Set up test environment
    let (client, model) = setup_test_env().await?;
    
    // Initial tool call request
    let initial_request = ChatCompletionRequest {
        model: model.clone(),
        messages: vec![
            LiteLlmMessage::developer("You are a helpful assistant that uses tools effectively."),
            LiteLlmMessage::user("I want to know the weather in Boston and then in Seattle."),
        ],
        tools: Some(vec![create_weather_tool()]),
        tool_choice: Some(ToolChoice::Auto),
        ..Default::default()
    };
    
    // Send initial request
    let initial_response = client.chat_completion(initial_request).await?;
    
    // Extract tool call info
    let tool_call_id = match &initial_response.choices[0].message {
        LiteLlmMessage::Assistant { tool_calls, .. } => {
            let tool_calls = tool_calls.as_ref().expect("Tool calls should be present");
            tool_calls[0].id.clone()
        },
        _ => panic!("Expected assistant message with tool calls"),
    };
    
    // Create a follow-up request with tool response
    let follow_up_request = ChatCompletionRequest {
        model: model.clone(),
        messages: vec![
            LiteLlmMessage::developer("You are a helpful assistant that uses tools effectively."),
            LiteLlmMessage::user("I want to know the weather in Boston and then in Seattle."),
            LiteLlmMessage::assistant(
                None,
                None,
                Some(vec![initial_response.choices[0].message.get_tool_calls().unwrap()[0].clone()]),
                MessageProgress::Complete,
                None,
                None,
            ),
            LiteLlmMessage::tool(
                None,
                json!({
                    "temperature": 52,
                    "unit": "fahrenheit",
                    "description": "Partly cloudy"
                }).to_string(),
                tool_call_id,
                None,
                MessageProgress::Complete,
            ),
        ],
        tools: Some(vec![create_weather_tool()]),
        tool_choice: Some(ToolChoice::Auto),
        ..Default::default()
    };
    
    // Send follow-up request
    let follow_up_response = client.chat_completion(follow_up_request).await?;
    
    // Check for second tool call (for Seattle weather)
    if let LiteLlmMessage::Assistant { tool_calls, content, .. } = &follow_up_response.choices[0].message {
        // May have content or tool calls
        if let Some(tool_calls) = tool_calls {
            assert!(!tool_calls.is_empty(), "Tool calls should not be empty");
            
            // Validate the tool call is for Seattle
            let tool_call = &tool_calls[0];
            let args = tool_call.function.arguments.to_lowercase();
            assert!(args.contains("seattle"), "Second tool call should be for Seattle");
            
            println!("Second tool call function: {}", tool_call.function.name);
            println!("Second tool call arguments: {}", tool_call.function.arguments);
        } else {
            // If no tool calls, the content should mention both Boston and Seattle
            let content_text = content.as_ref().expect("Content should be present");
            assert!(
                content_text.to_lowercase().contains("boston") && 
                content_text.to_lowercase().contains("seattle"),
                "Response should mention both cities"
            );
        }
    } else {
        panic!("Expected assistant message");
    }
    
    Ok(())
}

#[tokio::test]
async fn test_error_handling() -> Result<()> {
    // Create LiteLLMConfig with an invalid base URL and dummy API key
    let dummy_api_key = "dummy-key-for-error-test".to_string();
    let config = LiteLLMConfig::new(
        Some(dummy_api_key.clone()),
        Some("https://invalid-url-that-doesnt-exist.example.com".to_string()),
        Some(false) // Debug logging not critical for this test
    );

    // Create reqwest::Client with the dummy API key
    let mut headers_map = header::HeaderMap::new();
    headers_map.insert(
        header::AUTHORIZATION,
        header::HeaderValue::from_str(&format!("Bearer {}", dummy_api_key)).unwrap(),
    );
    headers_map.insert(
        header::CONTENT_TYPE,
        header::HeaderValue::from_static("application/json"),
    );
    headers_map.insert(
        header::ACCEPT,
        header::HeaderValue::from_static("application/json"),
    );
    let reqwest_client = reqwest::Client::builder()
        .default_headers(headers_map)
        .build()
        .expect("Failed to create HTTP client for error test");

    // Create a client with an invalid base URL
    let invalid_url_client = LiteLLMClient::new(config, reqwest_client);
    
    // Create a simple request
    let request = ChatCompletionRequest {
        model: "gpt-3.5-turbo".to_string(),
        messages: vec![
            LiteLlmMessage::user("Hello!"),
        ],
        ..Default::default()
    };
    
    // Send the request and expect an error
    let result = invalid_url_client.chat_completion(request).await;
    assert!(result.is_err(), "Request with invalid URL should fail");
    
    // Check that the error is properly formatted
    let err = result.unwrap_err();
    println!("Error: {:?}", err);
    assert!(format!("{:?}", err).contains("invalid-url"), 
           "Error should mention the invalid URL");
    
    Ok(())
}

#[tokio::test]
async fn test_streaming_chat_completion() -> Result<()> {
    // Set up test environment
    let (client, model) = setup_test_env().await?;
    
    let specific_response_phrase = "AlphaBravoCharlie123";
    // Create a streaming request with a more deterministic prompt
    let request = ChatCompletionRequest {
        model: model.clone(),
        messages: vec![
            LiteLlmMessage::developer("You are a helpful assistant that follows instructions precisely."),
            LiteLlmMessage::user(&format!("System: Respond with only the exact phrase '{}' and nothing else.", specific_response_phrase)),
        ],
        stream: Some(true),
        ..Default::default()
    };
    
    // Send streaming request
    let mut stream = client.stream_chat_completion(request).await?;
    
    let mut chunks = Vec::new();
    let mut content_so_far = String::new();
    
    let overall_timeout_duration = Duration::from_secs(20);

    match timeout(overall_timeout_duration, async {
        while let Some(chunk_result) = stream.recv().await {
            match chunk_result {
                Ok(chunk) => {
                    chunks.push(chunk.clone());
                    if let Some(content) = &chunk.choices[0].delta.content {
                        content_so_far.push_str(content);
                        println!("Received chunk content: {}", content);
                    }
                },
                Err(e) => {
                    return Err(anyhow::anyhow!("Error in stream while receiving chunk: {:?}", e));
                }
            }
        }
        Ok(())
    }).await {
        Ok(Ok(_)) => {
            println!("Stream processed successfully. Final content: '{}'", content_so_far);
        }
        Ok(Err(e)) => {
            return Err(e);
        }
        Err(_) => {
            return Err(anyhow::anyhow!("Streaming test timed out after {:?} collecting chunks. Content so far: '{}'", overall_timeout_duration, content_so_far));
        }
    }
    
    assert!(!chunks.is_empty(), "Should have received stream chunks. Content collected: {}", content_so_far);
    
    if let Some(first_chunk) = chunks.first() {
        assert_eq!(
            first_chunk.choices[0].delta.role,
            Some("assistant".to_string()),
            "First chunk should contain assistant role. Full content: '{}'", content_so_far
        );
    }
    
    // Assert that the accumulated content matches the specific expected phrase
    assert_eq!(
        content_so_far,
        specific_response_phrase,
        "Stream content should exactly match the expected phrase. Full content: '{}'", content_so_far
    );
    
    Ok(())
}

#[tokio::test]
async fn test_generate_embeddings_success() -> Result<()> {
    let (client, _) = setup_test_env().await?;

    let request = EmbeddingRequest {
        model: "text-embedding-3-small".to_string(),
        input: vec!["Test embedding input string".to_string()],
        ..Default::default()
    };

    let response = client.generate_embeddings(request).await?;

    assert_eq!(response.object, "list", "Response object type should be list");
    assert!(!response.data.is_empty(), "Response data should not be empty");
    assert_eq!(response.data.len(), 1, "Should have one embedding object for single input");
    
    let embedding_data = &response.data[0];
    assert_eq!(embedding_data.object, "embedding", "Data object type should be embedding");
    assert!(!embedding_data.embedding.is_empty(), "Embedding vector should not be empty");
    assert_eq!(embedding_data.index, 0, "Index should be 0 for the first embedding");

    assert_eq!(response.model, "text-embedding-3-small".to_string(), "Response model should match requested model");
    assert!(response.usage.prompt_tokens > 0, "Prompt tokens should be greater than 0");
    // Total tokens might also include other types of tokens depending on the model/API
    assert!(response.usage.total_tokens >= response.usage.prompt_tokens, "Total tokens should be at least prompt tokens");

    println!("Successfully generated embedding for model: {}", "text-embedding-3-small");
    println!("Embedding vector (first 3 dims): {:?}...", &embedding_data.embedding.iter().take(3).collect::<Vec<_>>());
    Ok(())
}

#[tokio::test]
async fn test_generate_embeddings_error_invalid_model() -> Result<()> {
    let (client, _) = setup_test_env().await?;
    let invalid_model_id = "this-model-does-not-exist-for-embeddings";

    let request = EmbeddingRequest {
        model: invalid_model_id.to_string(),
        input: vec!["Test input for invalid model".to_string()],
        ..Default::default()
    };

    let result = client.generate_embeddings(request).await;
    assert!(result.is_err(), "Request with invalid embedding model should fail");

    let err = result.unwrap_err();
    println!("Received expected error for invalid embedding model: {:?}", err);
    // You might want to assert parts of the error message if the API provides consistent error details
    assert!(format!("{:?}", err).to_lowercase().contains(invalid_model_id) || 
            format!("{:?}", err).to_lowercase().contains("invalid_request_error") ||
            format!("{:?}", err).to_lowercase().contains("model_not_found"),
            "Error message should indicate an issue with the model or request. Error: {:?}", err);

    Ok(())
}

#[tokio::test]
async fn test_streaming_tool_call() -> Result<()> {
    let (client, model) = setup_test_env().await?;

    let request = ChatCompletionRequest {
        model: model.clone(),
        messages: vec![
            LiteLlmMessage::developer("You are a helpful assistant that uses tools precisely."),
            LiteLlmMessage::user("What is the weather like in Boston, MA?"),
        ],
        tools: Some(vec![create_weather_tool()]),
        tool_choice: Some(ToolChoice::Auto), // Could also be ToolChoice::Tool { tool_type: "function", function: ToolFunctionChoice { name: "get_current_weather".to_string() } }
        stream: Some(true),
        ..Default::default()
    };

    let mut stream = client.stream_chat_completion(request).await?;
    let mut accumulated_chunks: Vec<ChatCompletionChunk> = Vec::new();
    let mut full_tool_calls_json = String::new();
    let mut complete_tool_call_id: Option<String> = None;
    let mut complete_tool_call_name: Option<String> = None;

    let overall_timeout_duration = Duration::from_secs(20);
    match timeout(overall_timeout_duration, async {
        while let Some(chunk_result) = stream.recv().await {
            match chunk_result {
                Ok(chunk) => {
                    println!("Streamed chunk: {:?}", chunk);
                    accumulated_chunks.push(chunk.clone());
                    if let Some(tool_calls_delta) = &chunk.choices[0].delta.tool_calls {
                        for tool_call_delta in tool_calls_delta {
                            if let Some(id) = &tool_call_delta.id {
                                complete_tool_call_id = Some(id.clone());
                            }
                            if let Some(function_delta) = &tool_call_delta.function {
                                if let Some(name) = &function_delta.name {
                                    complete_tool_call_name = Some(name.clone());
                                }
                                if let Some(args_chunk) = &function_delta.arguments {
                                    full_tool_calls_json.push_str(args_chunk);
                                }
                            }
                        }
                    }
                },
                Err(e) => return Err(anyhow::anyhow!("Error in stream: {:?}", e)),
            }
        }
        Ok(())
    }).await {
        Ok(Ok(_)) => println!("Stream processed for tool call test."),
        Ok(Err(e)) => return Err(e),
        Err(_) => return Err(anyhow::anyhow!("Streaming tool call test timed out after {:?}", overall_timeout_duration)),
    }

    assert!(!accumulated_chunks.is_empty(), "Should have received stream chunks for tool call");

    assert_eq!(complete_tool_call_name.as_deref(), Some("get_current_weather"), "Tool call name not accumulated correctly");
    assert!(complete_tool_call_id.is_some(), "Tool call ID not found in stream");

    // Deserialize the accumulated arguments
    let args_value: serde_json::Value = serde_json::from_str(&full_tool_calls_json)
        .map_err(|e| anyhow::anyhow!("Failed to parse accumulated tool call arguments: {}. Accumulated JSON: '{}'", e, full_tool_calls_json))?;
    
    assert_eq!(args_value["location"].as_str().unwrap_or_default().to_lowercase(), "boston, ma", "Location argument not found or incorrect in streamed tool call");

    println!("Streamed tool call ID: {:?}", complete_tool_call_id);
    println!("Streamed tool call Name: {:?}", complete_tool_call_name);
    println!("Streamed tool call Arguments JSON: {}", full_tool_calls_json);

    Ok(())
}