use anyhow::Result;
use braintrust::{BraintrustClient, TraceBuilder};
use serde_json::json;
use tokio::time::sleep;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<()> {
    // Get API key from environment variable or use a provided one
    // You can set BRAINTRUST_API_KEY environment variable or provide it directly
    let client = BraintrustClient::new(
        Some("YOUR_API_KEY"), // Or use None to get from environment: None
        "YOUR_PROJECT_ID"
    )?;

    // Start a trace for the entire process
    let trace = TraceBuilder::new(client.clone(), "AI Orchestration Example");
    println!("Created trace with root span ID: {}", trace.root_span_id());

    // Create a span for the first LLM call
    let mut span1 = trace
        .add_span("GPT-4 Call", "llm")
        .await?;
    println!("Created LLM span with ID: {}", span1.span_id());

    // Simulate work (in a real app, this would be an actual LLM call)
    sleep(Duration::from_millis(500)).await;
    
    // Update the span with input, output, and metadata
    span1 = span1
        .set_input(json!({
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Summarize the key features of Rust programming language."}
            ]
        }))
        .set_output(json!({
            "choices": [{
                "message": {
                    "role": "assistant", 
                    "content": "Rust offers memory safety without garbage collection, concurrency without data races, abstraction without overhead, and stability without stagnation."
                }
            }]
        }))
        .set_tokens(120, 45)
        .add_metadata("model", "gpt-4")
        .add_metadata("temperature", "0.7");
    
    // Log the updated span
    client.log_span(span1.clone()).await?;

    // Create a child span for processing the LLM output
    let mut processing_span = trace
        .add_child_span("Process LLM Response", "function", &span1)
        .await?;
    
    // Simulate processing work
    sleep(Duration::from_millis(200)).await;
    
    // Update the processing span
    processing_span = processing_span
        .set_input(json!({
            "llm_response": "Rust offers memory safety without garbage collection, concurrency without data races, abstraction without overhead, and stability without stagnation."
        }))
        .set_output(json!({
            "processed_result": "Successfully extracted key features: memory safety, concurrency, abstraction, stability"
        }))
        .add_metadata("processor", "feature_extractor");
    
    // Log the updated processing span
    client.log_span(processing_span).await?;

    // Create a second LLM call span
    let mut span2 = trace
        .add_span("Claude Call", "llm")
        .await?;
    println!("Created second LLM span with ID: {}", span2.span_id());

    // Simulate second LLM call
    sleep(Duration::from_millis(700)).await;
    
    // Update the second span
    span2 = span2
        .set_input(json!({
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Compare Rust with Python in terms of performance."}
            ]
        }))
        .set_output(json!({
            "choices": [{
                "message": {
                    "role": "assistant", 
                    "content": "Rust typically offers significantly better performance than Python for CPU-bound tasks due to its compiled nature, lack of garbage collection, and fine-grained memory control."
                }
            }]
        }))
        .set_tokens(100, 60)
        .add_metadata("model", "claude-3-opus")
        .add_metadata("temperature", "0.5");
    
    // Log the updated span
    client.log_span(span2).await?;

    // Finish the trace
    trace.finish().await?;
    println!("Trace completed and logged to Braintrust!");

    // Wait a moment to ensure all background logging completes
    sleep(Duration::from_millis(500)).await;
    
    Ok(())
}
