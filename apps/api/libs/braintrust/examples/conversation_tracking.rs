use anyhow::Result;
use braintrust::{BraintrustClient, TraceBuilder};
use serde_json::json;
use std::sync::Arc;
use tokio::time::sleep;
use std::time::Duration;
use uuid::Uuid;

// Simulate an LLM client
struct LlmClient {
    model: String,
    braintrust_client: Arc<BraintrustClient>,
}

impl LlmClient {
    fn new(model: &str, braintrust_client: Arc<BraintrustClient>) -> Self {
        Self {
            model: model.to_string(),
            braintrust_client,
        }
    }
    
    async fn generate(&self, prompt: &str, trace_builder: Option<&TraceBuilder>) -> Result<(String, u32, u32)> {
        // Create a span for this LLM call if we have a trace
        let span_option = if let Some(trace) = trace_builder {
            let span = trace.add_span(&format!("{} Call", self.model), "llm").await?;
            Some(span)
        } else {
            None
        };
        
        // Simulate LLM processing time
        sleep(Duration::from_millis(300)).await;
        
        // Simulate token counts based on input length
        let prompt_tokens = prompt.len() as u32 / 4;
        let completion_tokens = prompt.len() as u32 / 6;
        
        // Simulate a response
        let response = format!("This is a simulated response from {} for: {}", self.model, prompt);
        
        // If we have a span, update and log it
        if let Some(span) = span_option {
            let updated_span = span
                .set_input(json!({
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }))
                .set_output(json!({
                    "choices": [{
                        "message": {
                            "role": "assistant", 
                            "content": &response
                        }
                    }]
                }))
                .set_tokens(prompt_tokens, completion_tokens)
                .add_metadata("model", &self.model);
                
            self.braintrust_client.log_span(updated_span).await?;
        }
        
        Ok((response, prompt_tokens, completion_tokens))
    }
}

// Conversation manager that uses the LLM client
struct ConversationManager {
    conversation_id: String,
    llm_client: LlmClient,
    braintrust_client: Arc<BraintrustClient>,
}

impl ConversationManager {
    fn new(llm_client: LlmClient, braintrust_client: Arc<BraintrustClient>) -> Self {
        Self {
            conversation_id: Uuid::new_v4().to_string(),
            llm_client,
            braintrust_client,
        }
    }
    
    async fn process_message(&self, user_message: &str) -> Result<String> {
        // Create a trace for this conversation turn
        let trace = TraceBuilder::new(
            self.braintrust_client.clone(), 
            &format!("Conversation Turn: {}", self.conversation_id)
        );
        
        // Add a preprocessing span
        let preprocess_span = trace.add_span("Preprocess User Message", "function").await?;
        
        // Simulate preprocessing
        sleep(Duration::from_millis(100)).await;
        let processed_message = format!("Processed: {}", user_message);
        
        // Update preprocessing span
        let updated_preprocess_span = preprocess_span
            .set_input(json!({"raw_message": user_message}))
            .set_output(json!({"processed_message": &processed_message}));
        self.braintrust_client.log_span(updated_preprocess_span).await?;
        
        // Generate response using the LLM client
        let (response, _prompt_tokens, _completion_tokens) = 
            self.llm_client.generate(&processed_message, Some(&trace)).await?;
        
        // Add a postprocessing span
        let postprocess_span = trace.add_span("Postprocess LLM Response", "function").await?;
        
        // Simulate postprocessing
        sleep(Duration::from_millis(100)).await;
        let final_response = format!("Final: {}", response);
        
        // Update postprocessing span
        let updated_postprocess_span = postprocess_span
            .set_input(json!({"raw_response": response}))
            .set_output(json!({"final_response": &final_response}));
        self.braintrust_client.log_span(updated_postprocess_span).await?;
        
        // Finish the trace
        trace.finish().await?;
        
        Ok(final_response)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize Braintrust client
    // You can set BRAINTRUST_API_KEY environment variable or provide it directly
    let braintrust_client = BraintrustClient::new(
        Some("YOUR_API_KEY"), // Or use None to get from environment: None
        "YOUR_PROJECT_ID"
    )?;
    
    // Create an LLM client
    let llm_client = LlmClient::new("GPT-4", braintrust_client.clone());
    
    // Create a conversation manager
    let conversation_manager = ConversationManager::new(llm_client, braintrust_client.clone());
    
    // Process a few messages
    let messages = vec![
        "Hello, how are you today?",
        "Can you tell me about Rust programming?",
        "What are the benefits of using Braintrust for monitoring?",
    ];
    
    for (i, message) in messages.iter().enumerate() {
        println!("\nUser Message {}: {}", i+1, message);
        let response = conversation_manager.process_message(message).await?;
        println!("Assistant: {}", response);
        
        // Add a small delay between messages
        if i < messages.len() - 1 {
            sleep(Duration::from_millis(500)).await;
        }
    }
    
    // Wait for background tasks to complete
    sleep(Duration::from_millis(1000)).await;
    
    println!("\nAll conversations logged to Braintrust!");
    Ok(())
}
