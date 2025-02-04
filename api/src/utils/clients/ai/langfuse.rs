use anyhow::{anyhow, Result};
use axum::http::HeaderMap;
use base64::Engine;
use reqwest::Method;
use std::env;
use tiktoken_rs::o200k_base;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::utils::clients::sentry_utils::send_sentry_error;

use super::{anthropic::AnthropicChatModel, llm_router::LlmModel, openai::OpenAiChatModel};

lazy_static::lazy_static! {
    static ref LANGFUSE_API_URL: String = env::var("LANGFUSE_API_URL").unwrap_or("https://us.cloud.langfuse.com".to_string());
    static ref LANGFUSE_API_PUBLIC_KEY: String = env::var("LANGFUSE_PUBLIC_API_KEY").expect("LANGFUSE_PUBLIC_API_KEY must be set");
    static ref LANGFUSE_API_PRIVATE_KEY: String = env::var("LANGFUSE_PRIVATE_API_KEY").expect("LANGFUSE_PRIVATE_API_KEY must be set");
}

impl LlmModel {
    pub fn generate_usage(&self, input: &String, output: &String) -> Usage {
        let bpe = o200k_base().unwrap();

        let input_token = bpe.encode_with_special_tokens(&input);
        let output_token = bpe.encode_with_special_tokens(&output);

        match self {
            LlmModel::OpenAi(OpenAiChatModel::O3Mini) => Usage {
                input: input_token.len() as u32,
                output: output_token.len() as u32,
                unit: "TOKENS".to_string(),
                input_cost: (input_token.len() as f64 / 1_000_000.0) * 2.5,
                output_cost: (output_token.len() as f64 / 1_000_000.0) * 10.0,
                total_cost: (input_token.len() as f64 / 1_000_000.0) * 2.5
                    + (output_token.len() as f64 / 1_000_000.0) * 10.0,
            },
            LlmModel::OpenAi(OpenAiChatModel::Gpt35Turbo) => Usage {
                input: input_token.len() as u32,
                output: output_token.len() as u32,
                unit: "TOKENS".to_string(),
                input_cost: (input_token.len() as f64 / 1_000_000.0) * 0.5,
                output_cost: (output_token.len() as f64 / 1_000_000.0) * 1.5,
                total_cost: (input_token.len() as f64 / 1_000_000.0) * 0.5
                    + (output_token.len() as f64 / 1_000_000.0) * 1.5,
            },
            LlmModel::OpenAi(OpenAiChatModel::Gpt4o) => Usage {
                input: input_token.len() as u32,
                output: output_token.len() as u32,
                unit: "TOKENS".to_string(),
                input_cost: (input_token.len() as f64 / 1_000_000.0) * 0.15,
                output_cost: (output_token.len() as f64 / 1_000_000.0) * 0.6,
                total_cost: (input_token.len() as f64 / 1_000_000.0) * 0.15
                    + (output_token.len() as f64 / 1_000_000.0) * 0.6,
            },
            LlmModel::Anthropic(AnthropicChatModel::Claude3Opus20240229) => Usage {
                input: input_token.len() as u32,
                output: output_token.len() as u32,
                unit: "TOKENS".to_string(),
                input_cost: (input_token.len() as f64 / 1_000_000.0) * 3.0,
                output_cost: (output_token.len() as f64 / 1_000_000.0) * 15.0,
                total_cost: (input_token.len() as f64 / 1_000_000.0) * 3.0
                    + (output_token.len() as f64 / 1_000_000.0) * 15.0,
            },
        }
    }
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum PromptName {
    SelectDataset,
    GenerateSql,
    SelectTerm,
    DataSummary,
    AutoChartConfig,
    LineChartConfig,
    BarChartConfig,
    ScatterChartConfig,
    PieChartConfig,
    MetricChartConfig,
    TableConfig,
    ColumnLabelFormat,
    AdvancedVisualizationConfig,
    NoDataReturnedResponse,
    DataExplanation,
    MetricTitle,
    TimeFrame,
    FixSqlPlanner,
    FixSql,
    GenerateColDescriptions,
    GenerateDatasetDescription,
    SummaryQuestion,
    CustomPrompt(String),
}

impl PromptName {
    fn to_string(&self) -> String {
        match self {
            PromptName::SelectDataset => "select_dataset".to_string(),
            PromptName::GenerateSql => "generate_sql".to_string(),
            PromptName::SelectTerm => "select_term".to_string(),
            PromptName::DataSummary => "data_summary".to_string(),
            PromptName::AutoChartConfig => "auto_chart_config".to_string(),
            PromptName::LineChartConfig => "line_chart_config".to_string(),
            PromptName::BarChartConfig => "bar_chart_config".to_string(),
            PromptName::ScatterChartConfig => "scatter_chart_config".to_string(),
            PromptName::PieChartConfig => "pie_chart_config".to_string(),
            PromptName::MetricChartConfig => "metric_chart_config".to_string(),
            PromptName::TableConfig => "table_config".to_string(),
            PromptName::ColumnLabelFormat => "column_label_format".to_string(),
            PromptName::AdvancedVisualizationConfig => "advanced_visualization_config".to_string(),
            PromptName::NoDataReturnedResponse => "no_data_returned_response".to_string(),
            PromptName::DataExplanation => "data_explanation".to_string(),
            PromptName::MetricTitle => "metric_title".to_string(),
            PromptName::TimeFrame => "time_frame".to_string(),
            PromptName::FixSqlPlanner => "fix_sql_planner".to_string(),
            PromptName::FixSql => "fix_sql".to_string(),
            PromptName::GenerateColDescriptions => "generate_col_descriptions".to_string(),
            PromptName::GenerateDatasetDescription => "generate_dataset_description".to_string(),
            PromptName::SummaryQuestion => "summary_question".to_string(),
            PromptName::CustomPrompt(prompt) => prompt.clone(),
        }
    }
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "kebab-case")]
enum LangfuseIngestionType {
    TraceCreate,
    GenerationCreate,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct CreateTraceBody {
    id: Uuid,
    timestamp: DateTime<Utc>,
    name: String,
    user_id: Uuid,
    input: String,
    output: String,
    session_id: Uuid,
    release: String,
    version: String,
    metadata: Metadata,
    tags: Vec<String>,
    public: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GenerationCreateBody {
    trace_id: Uuid,
    name: String,
    start_time: DateTime<Utc>,
    completion_start_time: DateTime<Utc>,
    input: String,
    output: String,
    level: String,
    end_time: DateTime<Utc>,
    model: LlmModel,
    id: Uuid,
    usage: Usage,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Usage {
    input: u32,
    output: u32,
    unit: String,
    input_cost: f64,
    output_cost: f64,
    total_cost: f64,
}

#[derive(Serialize, Debug)]
struct Metadata {}

#[derive(Serialize)]
#[serde(untagged)]
enum LangfuseRequestBody {
    CreateTraceBody(CreateTraceBody),
    GenerationCreateBody(GenerationCreateBody),
}

#[derive(Serialize)]
struct LangfuseBatchItem {
    id: Uuid,
    r#type: LangfuseIngestionType,
    body: LangfuseRequestBody,
    timestamp: DateTime<Utc>,
}

#[derive(Serialize)]
struct LangfuseBatch {
    batch: Vec<LangfuseBatchItem>,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct LangfuseError {
    id: String,
    status: u16,
    message: String,
    error: String,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct LangfuseSuccess {
    id: String,
    status: u16,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct LangfuseResponse {
    successes: Vec<LangfuseSuccess>,
    errors: Vec<LangfuseError>,
}

/// Args:
/// - session_id: this can be a thread_id or any other type of chain event we have
///

pub async fn send_langfuse_request(
    session_id: &Uuid,
    prompt_name: PromptName,
    context: Option<String>,
    start_time: DateTime<Utc>,
    end_time: DateTime<Utc>,
    input: String,
    output: String,
    user_id: &Uuid,
    langfuse_model: &LlmModel,
) -> () {
    let session_id = session_id.clone();
    let user_id = user_id.clone();
    let langfuse_model = langfuse_model.clone();

    tokio::spawn(async move {
        match langfuse_handler(
            session_id,
            prompt_name,
            context,
            start_time,
            end_time,
            input,
            output,
            user_id,
            langfuse_model,
        )
        .await
        {
            Ok(_) => (),
            Err(e) => {
                let err = anyhow!("Error sending Langfuse request: {:?}", e);
                send_sentry_error(&err.to_string(), Some(&user_id));
            }
        }
    });
}

async fn langfuse_handler(
    session_id: Uuid,
    prompt_name: PromptName,
    context: Option<String>,
    start_time: DateTime<Utc>,
    end_time: DateTime<Utc>,
    input: String,
    output: String,
    user_id: Uuid,
    langfuse_model: LlmModel,
) -> Result<()> {
    let input = match context {
        Some(context) => format!("{} \n\n {}", context, input),
        None => input,
    };

    let trace_id = Uuid::new_v4();

    let langfuse_trace = LangfuseBatchItem {
        id: Uuid::new_v4(),
        r#type: LangfuseIngestionType::TraceCreate,
        body: LangfuseRequestBody::CreateTraceBody(CreateTraceBody {
            id: trace_id.clone(),
            timestamp: Utc::now(),
            name: prompt_name.clone().to_string(),
            user_id: user_id,
            input: serde_json::to_string(&input).unwrap(),
            output: serde_json::to_string(&output).unwrap(),
            session_id: session_id,
            release: "1.0.0".to_string(),
            version: "1.0.0".to_string(),
            metadata: Metadata {},
            tags: vec![],
            public: false,
        }),
        timestamp: Utc::now(),
    };

    let langfuse_generation = LangfuseBatchItem {
        id: Uuid::new_v4(),
        r#type: LangfuseIngestionType::GenerationCreate,
        body: LangfuseRequestBody::GenerationCreateBody(GenerationCreateBody {
            id: Uuid::new_v4(),
            name: prompt_name.to_string(),
            input: serde_json::to_string(&input).unwrap(),
            output: serde_json::to_string(&output).unwrap(),
            trace_id,
            start_time,
            completion_start_time: start_time,
            level: "DEBUG".to_string(),
            end_time,
            model: langfuse_model.clone(),
            usage: langfuse_model.generate_usage(&input, &output),
        }),
        timestamp: Utc::now(),
    };

    let langfuse_batch = LangfuseBatch {
        batch: vec![langfuse_trace, langfuse_generation],
    };

    let client = match reqwest::Client::builder().build() {
        Ok(client) => client,
        Err(e) => {
            send_sentry_error(&e.to_string(), Some(&user_id));
            return Err(anyhow!("Error creating reqwest client: {:?}", e));
        }
    };

    let mut headers = HeaderMap::new();
    headers.insert(
        reqwest::header::CONTENT_TYPE,
        "application/json".parse().unwrap(),
    );
    headers.insert(
        reqwest::header::AUTHORIZATION,
        format!(
            "Basic {}",
            base64::engine::general_purpose::STANDARD.encode(format!(
                "{}:{}",
                *LANGFUSE_API_PUBLIC_KEY, *LANGFUSE_API_PRIVATE_KEY
            ))
        )
        .parse()
        .unwrap(),
    );

    let res = match client
        .request(
            Method::POST,
            LANGFUSE_API_URL.to_string() + "/api/public/ingestion",
        )
        .headers(headers)
        .json(&langfuse_batch)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            tracing::debug!("Error sending Langfuse request: {:?}", e);
            send_sentry_error(&e.to_string(), Some(&user_id));
            return Err(anyhow!("Error sending Langfuse request: {:?}", e));
        }
    };

    let langfuse_res: LangfuseResponse = match res.json::<LangfuseResponse>().await {
        Ok(res) => res,
        Err(e) => {
            tracing::debug!("Error parsing Langfuse response: {:?}", e);
            send_sentry_error(&e.to_string(), Some(&user_id));
            return Err(anyhow!("Error parsing Langfuse response: {:?}", e));
        }
    };

    if langfuse_res.errors.len() > 0 {
        for err in &langfuse_res.errors {
            tracing::debug!("Langfuse error: {:?}", err);
            send_sentry_error(&err.message, Some(&user_id));
        }

        return Err(anyhow::anyhow!(
            "Langfuse errors: {:?}",
            langfuse_res.errors
        ));
    }

    Ok(())
}
