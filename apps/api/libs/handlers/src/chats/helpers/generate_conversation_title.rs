use anyhow::Result;
use agents::LiteLlmMessage;
use litellm::{ChatCompletionRequest, LiteLLMClient, Metadata, LiteLlmMessage as LiteLLMAgentMessage};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use secrets::get_secret_sync_or_default;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum BusterGeneratingTitleProgress {
    Completed,
    InProgress,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterGeneratingTitle {
    pub chat_id: Uuid,
    pub message_id: Uuid,
    pub title: Option<String>,
    pub title_chunk: Option<String>,
    pub progress: BusterGeneratingTitleProgress,
}

// Conversation title generation functionality
// -----------------------------------------

// Constants for title generation
const TITLE_GENERATION_PROMPT: &str = r#"
You are a conversation title generator. Your task is to generate a clear, concise, and descriptive title for a conversation based on the user messages and assistant responses provided.

Guidelines:
1. The title should be 3-10 words and should capture the core topic or intent of the conversation
2. Focus on key topics, questions, or themes from the conversation
3. Be specific rather than generic when possible
4. Avoid phrases like "Conversation about..." or "Discussion on..."
5. Don't include mentions of yourself in the title
6. The title should make sense out of context
7. Pay attention to the most recent messages to guide topic changes, etc.

Conversation:
{conversation_messages}

Return only the title text with no additional formatting, explanation, quotes, new lines, special characters, etc.
"#;

pub async fn generate_conversation_title(
    messages: &[LiteLlmMessage],
    message_id: &Uuid,
    user_id: &Uuid,
    session_id: &Uuid,
) -> Result<BusterGeneratingTitle> {
    // Format conversation messages for the prompt
    let mut formatted_messages = vec![];
    for message in messages {
        if message.get_role() == "user"
            || (message.get_role() == "assistant" && message.get_content().is_some())
        {
            formatted_messages.push(format!(
                "{}: {}",
                message.get_role(),
                message.get_content().unwrap_or_default()
            ));
        }
    }

    let formatted_messages = formatted_messages.join("\n\n");
    // Create the prompt with the formatted messages
    let prompt = TITLE_GENERATION_PROMPT.replace("{conversation_messages}", &formatted_messages);

    // Set up LiteLLM client
    let llm_client = LiteLLMClient::new(None, None);

    let model = if get_secret_sync_or_default("ENVIRONMENT", "development") == "local" {
        "gpt-4.1-nano".to_string()
    } else {
        "gemini-2.0-flash-001".to_string()
    };

    // Create the request
    let request = ChatCompletionRequest {
        model,
        messages: vec![LiteLLMAgentMessage::User {
            id: None,
            content: prompt,
            name: None,
        }],
        store: Some(true),
        metadata: Some(Metadata {
            generation_name: "conversation_title".to_string(),
            user_id: user_id.to_string(),
            session_id: session_id.to_string(),
            trace_id: session_id.to_string(),
        }),
        ..Default::default()
    };

    // Get streaming response - use chat_completion with stream parameter set to true
    let response = match llm_client.chat_completion(request).await {
        Ok(response) => response,
        Err(e) => {
            return Err(anyhow::anyhow!("Failed to start title generation: {}", e));
        }
    };

    // Parse LLM response
    let content = match &response.choices[0].message {
        LiteLlmMessage::Assistant {
            content: Some(content),
            ..
        } => content,
        _ => {
            tracing::error!("LLM response missing content");
            return Err(anyhow::anyhow!("LLM response missing content"));
        }
    };

    let title = BusterGeneratingTitle {
        chat_id: session_id.clone(),
        message_id: message_id.clone(),
        title: Some(content.clone().replace("\n", "")),
        title_chunk: None,
        progress: BusterGeneratingTitleProgress::Completed,
    };

    Ok(title)
}
