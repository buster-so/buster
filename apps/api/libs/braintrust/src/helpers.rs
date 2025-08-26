use anyhow::{Result, anyhow};
use crate::BraintrustClient;

/// Fetch a prompt from Braintrust and extract its system message
///
/// # Returns
/// The system message content from the prompt's messages
///
/// # Errors
/// Returns an error if:
/// - The prompt cannot be fetched
/// - The prompt has no prompt_data
/// - The prompt has no messages
/// - No system message is found in the messages
pub async fn get_prompt_system_message(client: &BraintrustClient, prompt_id: &str) -> Result<String> {
    // Fetch the prompt
    let prompt = client.get_prompt(prompt_id).await?;
    
    // Extract the prompt data
    let prompt_data = prompt.prompt_data
        .ok_or_else(|| anyhow!("Prompt has no prompt_data"))?;
    
    // Get the prompt content
    let prompt_content = prompt_data.prompt
        .ok_or_else(|| anyhow!("Prompt has no content"))?;
    
    // Get the messages
    let messages = prompt_content.messages
        .ok_or_else(|| anyhow!("Prompt has no messages"))?;
    
    // Find the system message
    let system_message = messages.iter()
        .find(|msg| msg.role == "system")
        .ok_or_else(|| anyhow!("No system message found in prompt"))?;
    
    Ok(system_message.content.clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    use secrets::get_secret_sync;
    use dotenv::dotenv;
    
    #[tokio::test]
    async fn test_get_prompt_system_message() -> Result<()> {
        // Load environment variables
        dotenv().ok();
        
        // Skip test if no API key is available
        if get_secret_sync("BRAINTRUST_API_KEY").is_err() {
            println!("Skipping test_get_prompt_system_message: No API key available");
            return Ok(());
        }
        
        // Create client
        let client = BraintrustClient::new(None, "c7b996a6-1c7c-482d-b23f-3d39de16f433")?;
        
        // Test with known prompt ID
        let prompt_id = "7f6fbd7a-d03a-42e7-a115-b87f5e9f86ee";
        let system_message = get_prompt_system_message(&client, prompt_id).await?;
        
        // Verify the message content
        assert_eq!(system_message, "this is just a test {{input}}\n\n{{other_variable}}");
        
        Ok(())
    }
}