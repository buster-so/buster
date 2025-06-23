use anyhow::Result;
use mockito;
use serde_json::json;
use tokio::time::sleep;
use std::time::Duration;
use std::env;

use braintrust::{BraintrustClient, TraceBuilder};

#[tokio::test]
async fn test_trace_builder_creation() -> Result<()> {
    let client = BraintrustClient::new(Some("test_api_key"), "test_project_id")?;
    let trace = TraceBuilder::new(client, "Test Trace");
    
    // Verify the root span ID is set correctly
    assert!(!trace.root_span_id().is_empty());
    
    Ok(())
}

#[tokio::test]
async fn test_add_span() -> Result<()> {
    // Create a mock server
    let mut server = mockito::Server::new_async().await;
    
    // Override the API_BASE constant for testing
    env::set_var("BRAINTRUST_API_BASE", &server.url());
    
    // Create a mock for the API endpoint
    let m = server.mock("POST", "/project_logs/test_project/insert")
        .match_header("Authorization", "Bearer test_api_key")
        .match_header("Content-Type", "application/json")
        .with_status(200)
        .with_body(r#"{"success": true}"#)
        .create_async()
        .await;
    
    // Create a test client and trace
    let client = BraintrustClient::new(Some("test_api_key"), "test_project")?;
    let trace = TraceBuilder::new(client.clone(), "Test Trace");
    
    // Add a span
    let span = trace.add_span("Test Span", "test").await?;
    
    // Update and log the span
    let updated_span = span
        .with_input(json!({"test": "input"}))
        .with_output(json!({"test": "output"}))
        .with_metadata("test_key", "test_value");
    
    client.log_span_sync(updated_span).await?;
    
    // Finish the trace
    trace.finish().await?;
    
    // Wait a bit for the background task to process
    sleep(Duration::from_millis(100)).await;
    
    // Verify the mock was called
    m.assert_async().await;
    
    // Reset the environment variable
    env::remove_var("BRAINTRUST_API_BASE");
    
    Ok(())
}

#[tokio::test]
async fn test_nested_spans() -> Result<()> {
    // Create a mock server
    let mut server = mockito::Server::new_async().await;
    
    // Override the API_BASE constant for testing
    env::set_var("BRAINTRUST_API_BASE", &server.url());
    
    // Create a mock for the API endpoint
    let m = server.mock("POST", "/project_logs/test_project/insert")
        .match_header("Authorization", "Bearer test_api_key")
        .match_header("Content-Type", "application/json")
        .with_status(200)
        .with_body(r#"{"success": true}"#)
        .expect(3)  // We expect 3 calls: parent span, child span, and trace finish
        .create_async()
        .await;
    
    // Create a test client and trace
    let client = BraintrustClient::new(Some("test_api_key"), "test_project")?;
    let trace = TraceBuilder::new(client.clone(), "Test Trace");
    
    // Add a parent span
    let parent_span = trace.add_span("Parent Span", "test").await?;
    
    // Update and log the parent span
    let updated_parent_span = parent_span
        .with_input(json!({"parent": "input"}))
        .with_output(json!({"parent": "output"}));
    
    client.log_span_sync(updated_parent_span.clone()).await?;
    
    // Add a child span with parent reference
    let child_span = trace.add_span("Child Span", "test").await?;
    
    // Get the parent span ID
    let parent_span_id = updated_parent_span.span_id().to_string();
    
    // Update and log the child span with parent reference
    let updated_child_span = child_span
        .with_input(json!({"child": "input"}))
        .with_output(json!({"child": "output"}))
        .with_metadata("parent_span_id", &parent_span_id);
    
    client.log_span_sync(updated_child_span).await?;
    
    // Finish the trace
    trace.finish().await?;
    
    // Wait a bit for the background task to process
    sleep(Duration::from_millis(100)).await;
    
    // Verify the mock was called
    m.assert_async().await;
    
    // Reset the environment variable
    env::remove_var("BRAINTRUST_API_BASE");
    
    Ok(())
}

#[tokio::test]
async fn test_complete_workflow() -> Result<()> {
    // Create a mock server
    let mut server = mockito::Server::new_async().await;
    
    // Override the API_BASE constant for testing
    env::set_var("BRAINTRUST_API_BASE", &server.url());
    
    // Create a mock for the API endpoint
    let m = server.mock("POST", "/project_logs/test_project/insert")
        .match_header("Authorization", "Bearer test_api_key")
        .match_header("Content-Type", "application/json")
        .with_status(200)
        .with_body(r#"{"success": true}"#)
        .expect(3)  // We expect 3 calls: 2 spans and trace finish
        .create_async()
        .await;
    
    // Create a test client and trace
    let client = BraintrustClient::new(Some("test_api_key"), "test_project")?;
    let trace = TraceBuilder::new(client.clone(), "Complete Workflow Test");
    
    // Add first span
    let span1 = trace.add_span("First Operation", "function").await?
        .with_input(json!({"operation": "first"}))
        .with_output(json!({"result": "success"}))
        .with_metadata("duration", "10ms");
    
    // Log the updated span
    client.log_span_sync(span1).await?;
    
    // Add second span
    let span2 = trace.add_span("Second Operation", "function").await?
        .with_input(json!({"operation": "second"}))
        .with_output(json!({"result": "success"}))
        .with_metadata("duration", "15ms");
    
    // Log the updated span
    client.log_span_sync(span2).await?;
    
    // Finish the trace
    trace.finish().await?;
    
    // Wait a bit for the background task to process
    sleep(Duration::from_millis(100)).await;
    
    // Verify the mock was called
    m.assert_async().await;
    
    // Reset the environment variable
    env::remove_var("BRAINTRUST_API_BASE");
    
    Ok(())
}
