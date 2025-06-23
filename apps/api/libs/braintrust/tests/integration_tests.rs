use anyhow::Result;
use braintrust::{BraintrustClient, TraceBuilder};
use dotenv::dotenv;
use serde_json::json;
use std::env;
use std::time::Duration;
use tokio::time::sleep;

// Helper function to initialize environment from .env file
fn init_env() -> Result<()> {
    // Load environment variables from .env file
    dotenv().ok();
    
    // Verify that the API key is set
    if env::var("BRAINTRUST_API_KEY").is_err() {
        println!("Warning: BRAINTRUST_API_KEY not found in environment or .env file");
        println!("Some tests may fail if they require a valid API key");
    }
    
    Ok(())
}

#[tokio::test]
async fn test_real_client_initialization() -> Result<()> {
    // Initialize environment
    init_env()?;
    
    // Create client with environment API key (None means use env var)
    let client = BraintrustClient::new(None, "c7b996a6-1c7c-482d-b23f-3d39de16f433")?;
    
    // Simple verification that client was created
    assert!(client.project_id() == "c7b996a6-1c7c-482d-b23f-3d39de16f433");
    
    Ok(())
}

#[tokio::test]
async fn test_real_span_logging() -> Result<()> {
    // Initialize environment
    init_env()?;
    
    // Skip test if no API key is available
    if env::var("BRAINTRUST_API_KEY").is_err() {
        println!("Skipping test_real_span_logging: No API key available");
        return Ok(());
    }
    
    // Create client (None means use env var)
    let client = BraintrustClient::new(None, "c7b996a6-1c7c-482d-b23f-3d39de16f433")?;
    
    // Create a span
    let span = client.create_span("Integration Test Span", "test", None, None);
    
    // Add data to the span
    let span = span
        .with_input(json!({
            "test_input": "This is a test input for integration testing",
            "timestamp": chrono::Utc::now().to_rfc3339()
        }))
        .with_output(json!({
            "test_output": "This is a test output for integration testing",
            "timestamp": chrono::Utc::now().to_rfc3339()
        }))
        .with_metadata("test_source", "integration_test")
        .with_metadata("test_id", uuid::Uuid::new_v4().to_string());
    
    // Log the span
    client.log_span(span).await?;
    
    // Allow some time for async processing
    sleep(Duration::from_millis(100)).await;
    
    Ok(())
}

#[tokio::test]
async fn test_real_trace_with_spans() -> Result<()> {
    // Initialize environment
    init_env()?;
    
    // Skip test if no API key is available
    if env::var("BRAINTRUST_API_KEY").is_err() {
        println!("Skipping test_real_trace_with_spans: No API key available");
        return Ok(());
    }
    
    // Create client (None means use env var)
    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff")?;
    
    // Create a trace
    let trace_id = uuid::Uuid::new_v4().to_string();
    let trace = TraceBuilder::new(
        client.clone(),
        &format!("Integration Test Trace {}", trace_id)
    );
    
    // Add a root span
    let root_span = trace.add_span("Root Operation", "function").await?;
    let mut root_span = root_span
        .with_input(json!({
            "operation": "root",
            "parameters": {
                "test": true,
                "timestamp": chrono::Utc::now().to_rfc3339()
            }
        }))
        .with_metadata("test_id", trace_id.clone());
    
    // Log the root span
    client.log_span(root_span.clone()).await?;

    sleep(Duration::from_secs(10)).await;

    root_span = root_span
    .with_output(json!({
        "result": "success",
        "parameters": {
            "test": true,
            "timestamp": chrono::Utc::now().to_rfc3339()
        }
    }));

    client.log_span(root_span).await?;
    
    // Add an LLM span
    let llm_span = trace.add_span("LLM Call", "llm").await?;
    let mut llm_span = llm_span
        .with_input(json!({
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, this is a test message for integration testing"
                }
            ]
        }))
        .with_metadata("model", "test-model");
    
    // Log the LLM span
    client.log_span(llm_span.clone()).await?;
    
    sleep(Duration::from_secs(15)).await;

    llm_span = llm_span
    .with_output(json!({
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Hello! I'm responding to your integration test message."
                }
            }
        ]
    }));

    client.log_span(llm_span).await?;

    // Add a tool span
    let tool_span = trace.add_span("Tool Execution", "tool").await?;
    let tool_span = tool_span
        .with_input(json!({
            "function": {
                "name": "test_tool",
                "arguments": {
                    "param1": "value1",
                    "param2": 42
                }
            },
            "id": uuid::Uuid::new_v4().to_string()
        }))
        .with_output(json!({
            "result": "Tool execution successful",
            "data": {
                "value": "test result",
                "timestamp": chrono::Utc::now().to_rfc3339()
            }
        }));
    
    // Log the tool span
    client.log_span(tool_span).await?;
    
    // Finish the trace
    trace.finish().await?;
    
    // Allow some time for async processing
    sleep(Duration::from_secs(30)).await;
    
    Ok(())
}

#[tokio::test]
async fn test_real_error_handling() -> Result<()> {
    // Initialize environment
    init_env()?;
    
    // Skip test if no API key is available
    if env::var("BRAINTRUST_API_KEY").is_err() {
        println!("Skipping test_real_error_handling: No API key available");
        return Ok(());
    }
    
    // Create client (None means use env var)
    let client = BraintrustClient::new(None, "c7b996a6-1c7c-482d-b23f-3d39de16f433")?;
    
    // Create a trace for error testing
    let trace = TraceBuilder::new(
        client.clone(),
        "Integration Test Error Handling"
    );
    
    // Add a span that will contain an error
    let error_span = trace.add_span("Error Operation", "function").await?;
    
    // Simulate an operation that results in an error
    let error_message = "This is a simulated error for testing";
    let error_span = error_span
        .with_input(json!({
            "operation": "error_test",
            "should_fail": true
        }))
        .with_output(json!({
            "error": error_message,
            "stack_trace": "simulated stack trace for testing",
            "timestamp": chrono::Utc::now().to_rfc3339()
        }))
        .with_metadata("error", true)
        .with_metadata("error_type", "SimulatedError");
    
    // Log the error span
    client.log_span(error_span).await?;
    
    // Finish the trace
    trace.finish().await?;
    
    // Allow some time for async processing
    sleep(Duration::from_millis(100)).await;
    
    Ok(())
}

#[tokio::test]
async fn test_real_get_prompt() -> Result<()> {
    // Initialize environment
    init_env()?;
    
    // Skip test if no API key is available
    if env::var("BRAINTRUST_API_KEY").is_err() {
        println!("Skipping test_real_get_prompt: No API key available");
        return Ok(());
    }
    
    // Create client (None means use env var)
    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff")?;
    
    // Attempt to fetch the prompt with ID "7f6fbd7a-d03a-42e7-a115-b87f5e9f86ee"
    let prompt_id = "7f6fbd7a-d03a-42e7-a115-b87f5e9f86ee";
    
    println!("Fetching prompt with ID: {}", prompt_id);
    
    match client.get_prompt(prompt_id).await {
        Ok(prompt) => {
            println!("Successfully fetched prompt: {}", prompt.name);
            println!("Prompt ID: {}", prompt.id);
            println!("Project ID: {}", prompt.project_id);
            
            // Verify the prompt ID matches what we requested
            assert_eq!(prompt.id, prompt_id, "Prompt ID should match the requested ID");
            
            if let Some(description) = &prompt.description {
                println!("Description: {}", description);
            }
            
            if let Some(prompt_data) = &prompt.prompt_data {
                if let Some(content) = &prompt_data.prompt {
                    println!("Prompt type: {}", content.content_type);
                    println!("Prompt content: {:?}", content.content);
                    println!("Prompt messages: {:?}", content.messages);
                }
                
                if let Some(options) = &prompt_data.options {
                    if let Some(model) = &options.model {
                        println!("Model: {}", model);
                    }
                }
            }
            
            if let Some(tags) = &prompt.tags {
                println!("Tags: {:?}", tags);
            }
        },
        Err(e) => {
            println!("Failed to fetch prompt '{}': {}", prompt_id, e);
            println!("This is expected if the prompt doesn't exist in your Braintrust project");
            println!("You can create a prompt with this ID in your Braintrust project for this test to pass");
            
            // Fail the test if we can't fetch the prompt
            panic!("Could not fetch prompt with ID: {}", prompt_id);
        }
    }
    
    Ok(())
}
