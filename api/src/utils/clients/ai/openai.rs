use anyhow::{anyhow, Result};
use futures::StreamExt;
use serde_json::{json, Value};
use std::{env, time::Duration};
use tokio::sync::mpsc::{self, Receiver, Sender};
use tokio_stream::wrappers::ReceiverStream;

use serde::{Deserialize, Serialize};

use crate::utils::clients::sentry_utils::send_sentry_error;

const OPENAI_EMBEDDING_URL: &str = "https://api.openai.com/v1/embeddings";

lazy_static::lazy_static! {
    static ref OPENAI_API_KEY: String = env::var("OPENAI_API_KEY")
        .expect("OPENAI_API_KEY must be set");
    static ref OPENAI_CHAT_URL: String = env::var("OPENAI_CHAT_URL").unwrap_or("https://api.openai.com/v1/chat/completions".to_string());
}

#[derive(Serialize, Clone)]
pub enum OpenAiChatModel {
    #[serde(rename = "gpt-4o-2024-11-20")]
    Gpt4o,
    #[serde(rename = "o3-mini")]
    O3Mini,
    #[serde(rename = "gpt-3.5-turbo")]
    Gpt35Turbo,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum OpenAiChatRole {
    System,
    Developer,
    User,
    Assistant,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ReasoningEffort {
    Low,
    Medium,
    High,
}

#[derive(Serialize, Clone)]
pub struct OpenAiChatContent {
    #[serde(rename = "type")]
    pub type_: String,
    pub text: String,
}

#[derive(Serialize, Clone)]
pub struct OpenAiChatMessage {
    pub role: OpenAiChatRole,
    pub content: Vec<OpenAiChatContent>,
}

// Helper functions for conditional serialization
fn is_o3_model(model: &OpenAiChatModel) -> bool {
    matches!(model, OpenAiChatModel::O3Mini)
}

fn should_skip_temperature(val: &(&f32, &OpenAiChatModel)) -> bool {
    is_o3_model(val.1)
}

fn should_skip_max_tokens(val: &(&u32, &OpenAiChatModel)) -> bool {
    is_o3_model(val.1)
}

fn should_skip_top_p(val: &(&f32, &OpenAiChatModel)) -> bool {
    is_o3_model(val.1)
}

fn should_skip_reasoning_effort(val: &(&Option<ReasoningEffort>, &OpenAiChatModel)) -> bool {
    !is_o3_model(val.1)
}

#[derive(Serialize, Clone)]
pub struct OpenAiChatRequest {
    model: OpenAiChatModel,
    messages: Vec<OpenAiChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    reasoning_effort: Option<ReasoningEffort>,
    frequency_penalty: f32,
    presence_penalty: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    stop: Option<Vec<String>>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    response_format: Option<Value>,
}

impl OpenAiChatRequest {
    pub fn new(
        model: OpenAiChatModel,
        messages: Vec<OpenAiChatMessage>,
        temperature: f32,
        max_tokens: u32,
        stop: Option<Vec<String>>,
        stream: bool,
        response_format: Option<Value>,
    ) -> Self {
        let (temperature, max_tokens, top_p, reasoning_effort) = if is_o3_model(&model) {
            (None, None, None, Some(ReasoningEffort::Low))
        } else {
            (Some(temperature), Some(max_tokens), Some(1.0), None)
        };

        Self {
            model,
            messages,
            temperature,
            max_tokens,
            top_p,
            reasoning_effort,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
            stop,
            stream,
            response_format,
        }
    }
}

#[derive(Deserialize, Debug, Clone)]
pub struct ChatCompletionResponse {
    pub choices: Vec<Choice>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct Choice {
    pub message: Message,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Message {
    pub content: String,
}

pub async fn openai_chat(
    model: &OpenAiChatModel,
    messages: Vec<OpenAiChatMessage>,
    temperature: f32,
    max_tokens: u32,
    timeout: u64,
    stop: Option<Vec<String>>,
    json_mode: bool,
    json_schema: Option<Value>,
) -> Result<String> {
    let response_format = match json_mode {
        true => Some(json!({"type": "json_object"})),
        false => None,
    };

    let response_format = match json_schema {
        Some(schema) => Some(json!({"type": "json_schema", "json_schema": schema})),
        None => response_format,
    };

    let chat_request = OpenAiChatRequest::new(
        model.clone(),
        messages,
        temperature,
        max_tokens,
        stop,
        false,
        response_format,
    );

    let client = reqwest::Client::new();

    let headers = {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::AUTHORIZATION,
            format!("Bearer {}", OPENAI_API_KEY.to_string())
                .parse()
                .unwrap(),
        );
        headers
    };

    let response = match client
        .post(OPENAI_CHAT_URL.to_string())
        .headers(headers)
        .json(&chat_request)
        .timeout(Duration::from_secs(timeout))
        .send()
        .await
    {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Unable to send request to OpenAI: {:?}", e);
            let err = anyhow!("Unable to send request to OpenAI: {}", e);
            send_sentry_error(&err.to_string(), None);
            return Err(err);
        }
    };

    let response_text = response.text().await.unwrap();

    let completion_res = match serde_json::from_str::<ChatCompletionResponse>(&response_text) {
        Ok(res) => res,
        Err(e) => {
            tracing::error!("Unable to parse response from OpenAI: {:?}", e);
            let err = anyhow!("Unable to parse response from OpenAI: {}", e);
            send_sentry_error(&err.to_string(), None);
            return Err(err);
        }
    };

    let content = match completion_res.choices.get(0) {
        Some(choice) => choice.message.content.clone(),
        None => return Err(anyhow!("No content returned from OpenAI")),
    };

    Ok(content)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OpenAiChatDelta {
    pub content: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OpenAiChatChoice {
    pub delta: OpenAiChatDelta,
    pub index: u32,
    pub finish_reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OpenAiChatStreamResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub system_fingerprint: String,
    pub choices: Vec<OpenAiChatChoice>,
}

/// We can't do Langfuse traces directly in the stream function.
/// This is mainly because I'm too lazy to figure out how to set up all the passing with the stream reciever
/// Langfuse traces must be written directly on the stream call.

pub async fn openai_chat_stream(
    model: &OpenAiChatModel,
    messages: &Vec<OpenAiChatMessage>,
    temperature: f32,
    max_tokens: u32,
    timeout: u64,
    stop: Option<Vec<String>>,
) -> Result<ReceiverStream<String>> {
    let chat_request = OpenAiChatRequest::new(
        model.clone(),
        messages.clone(),
        temperature,
        max_tokens,
        stop,
        true,
        None,
    );

    let client = reqwest::Client::new();

    let headers = {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::AUTHORIZATION,
            format!("Bearer {}", OPENAI_API_KEY.to_string())
                .parse()
                .unwrap(),
        );
        headers
    };

    let (tx, rx): (Sender<String>, Receiver<String>) = mpsc::channel(100);

    tokio::spawn(async move {
        let response = client
            .post(OPENAI_CHAT_URL.to_string())
            .headers(headers)
            .json(&chat_request)
            .timeout(Duration::from_secs(timeout))
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Unable to send request to OpenAI: {:?}", e);
                let err = anyhow!("Unable to send request to OpenAI: {}", e);
                send_sentry_error(&err.to_string(), None);
                err
            });

        if let Err(_e) = response {
            return;
        }

        let response = response.unwrap();
        let mut stream = response.bytes_stream();

        let mut buffer = String::new();

        while let Some(item) = stream.next().await {
            match item {
                Ok(bytes) => {
                    let chunk = String::from_utf8(bytes.to_vec()).unwrap();
                    buffer.push_str(&chunk);

                    while let Some(pos) = buffer.find("}\n") {
                        let (json_str, rest) = {
                            let (json_str, rest) = buffer.split_at(pos + 1);
                            (json_str.to_string(), rest.to_string())
                        };
                        buffer = rest;

                        let json_str_trimmed = json_str.replace("data: ", "");
                        match serde_json::from_str::<OpenAiChatStreamResponse>(
                            &json_str_trimmed.trim(),
                        ) {
                            Ok(response) => {
                                if let Some(content) = &response.choices[0].delta.content {
                                    if tx.send(content.clone()).await.is_err() {
                                        break;
                                    }
                                }
                            }
                            Err(e) => {
                                tracing::error!("Error parsing JSON response: {:?}", e);
                                let err = anyhow!("Error parsing JSON response: {}", e);
                                send_sentry_error(&err.to_string(), None);
                            }
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Error while streaming response: {:?}", e);
                    let err = anyhow!("Error while streaming response: {}", e);
                    send_sentry_error(&err.to_string(), None);
                    break;
                }
            }
        }
    });

    Ok(ReceiverStream::new(rx))
}

#[derive(Serialize, Debug)]
pub struct AdaBulkEmbedding {
    pub model: String,
    pub input: Vec<String>,
    pub dimensions: u32,
}

#[derive(Deserialize, Debug)]
pub struct AdaEmbeddingArray {
    pub embedding: Vec<f32>,
}

#[derive(Deserialize, Debug)]
pub struct AdaEmbeddingResponse {
    pub data: Vec<AdaEmbeddingArray>,
}

pub async fn ada_bulk_embedding(text_list: Vec<String>) -> Result<Vec<Vec<f32>>> {
    let embedding_model = env::var("EMBEDDING_MODEL").expect("EMBEDDING_MODEL must be set");

    let client = reqwest::Client::new();

    let ada_bulk_embedding = AdaBulkEmbedding {
        model: embedding_model,
        input: text_list,
        dimensions: 1024,
    };

    let embeddings_result = match client
        .post(OPENAI_EMBEDDING_URL)
        .headers({
            let mut headers = reqwest::header::HeaderMap::new();
            headers.insert(
                reqwest::header::AUTHORIZATION,
                format!("Bearer {}", OPENAI_API_KEY.to_string())
                    .parse()
                    .unwrap(),
            );
            headers
        })
        .timeout(Duration::from_secs(60))
        .json(&ada_bulk_embedding)
        .send()
        .await
    {
        Ok(res) => {
            if !res.status().is_success() {
                tracing::error!(
                    "There was an issue while getting the data source: {}",
                    res.text().await.unwrap()
                );
                return Err(anyhow!("Error getting data source"));
            }

            Ok(res)
        }
        Err(e) => Err(anyhow!(e.to_string())),
    };

    let embedding_text = embeddings_result.unwrap().text().await.unwrap();

    let embeddings: AdaEmbeddingResponse =
        match serde_json::from_str(embedding_text.clone().as_str()) {
            Ok(embeddings) => embeddings,
            Err(e) => {
                tracing::error!(
                    "There was an issue decoding the bulk embedding json response: {}",
                    e
                );
                return Err(anyhow!(e.to_string()));
            }
        };

    let result: Vec<Vec<f32>> = embeddings.data.into_iter().map(|x| x.embedding).collect();

    Ok(result)
}
