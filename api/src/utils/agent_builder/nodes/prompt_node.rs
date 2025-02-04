use std::fmt;

use serde_json::{json, Value};
use tokio::sync::mpsc::Sender;
use uuid::Uuid;

use crate::utils::clients::ai::{
    langfuse::PromptName,
    llm_router::{llm_chat, llm_chat_stream, LlmMessage, LlmModel},
    openai::OpenAiChatModel,
};

use super::error_node::ErrorNode;

pub struct PromptNodeMessage {
    pub role: String,
    pub content: String,
}

pub struct PromptNodeSettings {
    pub messages: Vec<PromptNodeMessage>,
    pub model: String,
    pub temperature: f32,
    pub max_tokens: u32,
    pub stop: Option<Vec<String>>,
    pub stream: Option<Sender<Value>>,
    pub stream_name: Option<String>,
    pub json_mode: bool,
    pub json_schema: Option<Value>,
    pub user_id: Uuid,
    pub session_id: Uuid,
    pub prompt_name: String,
}

impl Default for PromptNodeSettings {
    fn default() -> Self {
        Self {
            messages: vec![],
            model: String::new(),
            temperature: 0.0,
            max_tokens: 2048,
            stop: None,
            stream: None,
            stream_name: None,
            json_mode: false,
            json_schema: None,
            user_id: Uuid::new_v4(),
            session_id: Uuid::new_v4(),
            prompt_name: String::from("Unknown Prompt"),
        }
    }
}

pub enum PromptNodeError {
    LlmError,
}

impl fmt::Display for PromptNodeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::LlmError => write!(f, "llm_error"),
        }
    }
}

pub async fn prompt_node(settings: PromptNodeSettings) -> Result<Value, ErrorNode> {
    let model = match settings.model.as_str() {
        "gpt-4o" => LlmModel::OpenAi(OpenAiChatModel::Gpt4o),
        "gpt-3.5-turbo" => LlmModel::OpenAi(OpenAiChatModel::Gpt35Turbo),
        _ => LlmModel::OpenAi(OpenAiChatModel::O3Mini),
    };

    let llm_response = if let Some(stream) = settings.stream {
        let (mut llm_stream, response_future) = match llm_chat_stream(
            model,
            settings
                .messages
                .into_iter()
                .map(|m| LlmMessage::new(m.role, m.content))
                .collect(),
            settings.temperature,
            settings.max_tokens,
            30,
            settings.stop,
            &settings.session_id,
            &settings.user_id,
            PromptName::CustomPrompt(settings.prompt_name.clone()),
        )
        .await
        {
            Ok(response) => response,
            Err(e) => {
                return Err(ErrorNode::new(
                    PromptNodeError::LlmError.to_string(),
                    e.to_string(),
                ))
            }
        };

        while let Some(chunk) = llm_stream.recv().await {
            if let Some(stream_name) = &settings.stream_name {
                let stream_message = json!({
                    "name": *stream_name,
                    "value": chunk
                });

                match stream.send(stream_message).await {
                    Ok(_) => (),
                    Err(e) => {
                        return Err(ErrorNode::new(
                            PromptNodeError::LlmError.to_string(),
                            e.to_string(),
                        ));
                    }
                }
            } else {
                match stream.send(Value::String(chunk)).await {
                    Ok(_) => (),
                    Err(e) => {
                        return Err(ErrorNode::new(
                            PromptNodeError::LlmError.to_string(),
                            e.to_string(),
                        ));
                    }
                }
            }
        }

        match response_future.await {
            Ok(Ok(response)) => response,
            Ok(Err(e)) => {
                return Err(ErrorNode::new(
                    PromptNodeError::LlmError.to_string(),
                    e.to_string(),
                ))
            }
            Err(e) => {
                return Err(ErrorNode::new(
                    PromptNodeError::LlmError.to_string(),
                    e.to_string(),
                ))
            }
        }
    } else {
        let response = match llm_chat(
            model,
            &settings
                .messages
                .into_iter()
                .map(|m| LlmMessage::new(m.role, m.content))
                .collect(),
            settings.temperature,
            settings.max_tokens,
            30,
            settings.stop,
            settings.json_mode,
            settings.json_schema.clone(),
            &settings.session_id,
            &settings.user_id,
            PromptName::CustomPrompt(settings.prompt_name.clone()),
        )
        .await
        {
            Ok(response) => response,
            Err(e) => {
                return Err(ErrorNode::new(
                    PromptNodeError::LlmError.to_string(),
                    e.to_string(),
                ))
            }
        };

        response
    };

    let response = if settings.json_schema.is_some() {
        match serde_json::from_str::<Value>(&llm_response) {
            Ok(value) => value,
            Err(e) => {
                return Err(ErrorNode::new(
                    PromptNodeError::LlmError.to_string(),
                    e.to_string(),
                ))
            }
        }
    } else if settings.json_mode {
        match serde_json::from_str::<Value>(&llm_response) {
            Ok(value) => value,
            Err(e) => {
                return Err(ErrorNode::new(
                    PromptNodeError::LlmError.to_string(),
                    e.to_string(),
                ))
            }
        }
    } else {
        Value::String(llm_response)
    };

    Ok(response)
}
