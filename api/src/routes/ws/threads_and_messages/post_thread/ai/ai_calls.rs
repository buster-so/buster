use anyhow::{anyhow, Result};
use chrono::Datelike;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use tokio::{sync::mpsc::Receiver, task::JoinHandle};
use uuid::Uuid;

use crate::{
    database::{
        enums::DataSourceType,
        lib::DataMetadataJsonBody,
        models::{Dataset, User},
    },
    routes::ws::threads_and_messages::{
        post_thread::sql_gen::sql_gen_handlers::RelevantTerm, thread_utils::ThreadState,
    },
    utils::{
        clients::ai::{
            langfuse::PromptName,
            llm_router::{llm_chat, llm_chat_stream, LlmMessage, LlmModel, LlmRole},
            openai::OpenAiChatModel,
        },
        query_engine::data_types::DataType,
    },
};

use super::data_source_sql_instructions::*;

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct SelectDatasetResponse {
    pub dataset: String,
}

pub async fn select_dataset_ai_call(
    user: &User,
    prompt: &String,
    datasets: &Vec<Dataset>,
    thread_id: &Uuid,
) -> Result<String> {
    let formatted_datasets = datasets
        .iter()
        .map(|d| {
            format!(
                "`{}`:\n - When to use: {}\n - When not to use: {}",
                d.database_name,
                d.when_to_use.as_deref().unwrap_or("No Description Yet"),
                d.when_not_to_use.as_deref().unwrap_or("No Description Yet")
            )
        })
        .collect::<Vec<String>>();

    let dataset_options = datasets
        .iter()
        .map(|d| d.database_name.clone())
        .collect::<Vec<String>>()
        .join(", ");

    let system_prompt = format!(
        "### DATASET/MODEL INFORMATION
{datasets}

### TASK
Your task is to pick a **single** dataset that best answers the user question/request.

### OUTPUT
Output in json with the key of 'dataset' and the value of the dataset name. Your enum options are [{dataset_options}]",
        datasets = formatted_datasets.join("\n\n"),
        dataset_options = dataset_options,
    );

    let user_prompt = format!(
        "### REQUEST
{}",
        prompt.clone()
    );

    let messages_to_be_sent = vec![
        LlmMessage {
            role: LlmRole::System,
            content: system_prompt.clone(),
        },
        LlmMessage {
            role: LlmRole::User,
            content: user_prompt.clone(),
        },
    ];

    let response = match llm_chat(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        &messages_to_be_sent,
        0.0,
        50,
        10,
        None,
        true,
        None,
        thread_id,
        &user.id,
        PromptName::SelectDataset,
    )
    .await
    {
        Ok(response) => response,
        Err(e) => return Err(e),
    };

    let dataset = match serde_json::from_str::<SelectDatasetResponse>(&response) {
        Ok(dataset) => dataset,
        Err(e) => return Err(anyhow!("Unable to parse response from OpenAI: {}", e)),
    };

    Ok(dataset.dataset)
}

pub async fn generate_sql_ai_call(
    ddl: &String,
    thread: &ThreadState,
    terms_context_string: &String,
    data_source_type: &DataSourceType,
    thread_id: &Uuid,
    user_id: &Uuid,
) -> Result<(Receiver<String>, JoinHandle<Result<String>>)> {
    let system_prompt = format!(
        "### MODEL/VIEW INFORMATION
{ddl}


{terms_context_string}


### TASK
Your task is to generate a single **{data_source_type}** syntax SQL statement to best answer the user question based on the model/view and domain specific language definitions you have above.
Duplicate records exist in this model so you MUST deduplicate the results using `distinct`.  DO NOT DEDUP THE ENTIRE VIEW/MODEL.
Try to return the most simple results for the user.  Do not include any columns that are not necessary.
The current year is {current_year}. In most cases, you should use date functions to get dynamic date ranges.
Use CTEs instead of subqueries.
When getting unique values, try to use id's as the distinct key.
When displaying entities with names, show the name, not just the id.
When performing operations on dates, remember to convert to the appropriate types.
Always order dates in ascending order.
When working with time series data, always return a date field.
Always use the schema when referencing tables.
Never use the `SELECT *` or `SELECT COUNT(*)` command.  You must select the columns you want to see/use.
Users may mention formatting or charting.  Although this task is specific to SQL generation, the user is referring to future steps for visualization.
A request for a line chart should default to using a date-related field unless the user specifies otherwise or it is not available.
Try to keep the data format (columns selected, aggregation, ordering, etc.) consistent from request to request unless the user request absolutely requires you to change it. 



### OUTPUT
Output in markdown (```sql```) format. Make sure to close the SQL statement with ';'.  Only output the SQL.",
        data_source_type = data_source_type.to_string(),
        ddl = ddl,
        terms_context_string = terms_context_string,
        current_year = chrono::Local::now().year(),
    );

    let mut messages_to_be_sent = vec![LlmMessage {
        role: LlmRole::System,
        content: system_prompt,
    }];

    for message in &thread.messages {
        messages_to_be_sent.push(LlmMessage {
            role: LlmRole::User,
            content: message.message.message.clone(),
        });

        if let Some(code) = &message.message.code {
            messages_to_be_sent.push(LlmMessage {
                role: LlmRole::Assistant,
                content: code.clone(),
            });
        }
    }

    let stream_response = match llm_chat_stream(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        messages_to_be_sent,
        0.0,
        1000,
        25,
        Some(vec!["\n```".to_string()]),
        thread_id,
        user_id,
        PromptName::GenerateSql,
    )
    .await
    {
        Ok(stream) => stream,
        Err(e) => return Err(e),
    };

    Ok(stream_response)
}

pub async fn fix_sql_ai_call(
    ddl: &String,
    sql: &String,
    errors: &String,
    terms_context_string: &String,
    data_source_type: &DataSourceType,
    thread_id: &Uuid,
    user_id: &Uuid,
) -> Result<(Receiver<String>, JoinHandle<Result<String>>)> {
    let system_prompt = format!(
        "### MODEL/VIEW INFORMATION
{ddl}


{terms_context_string}


### TASK
Your task is to **fix** this {data_source_type} statement.  The user will supply the errors and the sql statement.  Your task is to fix the sql statement based on the errors.
Think through how to fix the errors and then come up with a new sql statement.


### OUTPUT
SQL should be escaped with backticks (```sql```) like in markdown format.",
        data_source_type = data_source_type.to_string(),
        ddl = ddl,
        terms_context_string = terms_context_string,
    );

    let user_message = format!(
        "### SQL
```sql
{sql}
```


### ERROR MESSAGES
{errors}",
        sql = sql,
        errors = errors,
    );

    let messages_to_be_sent = vec![
        LlmMessage {
            role: LlmRole::System,
            content: system_prompt,
        },
        LlmMessage {
            role: LlmRole::User,
            content: user_message,
        },
    ];

    let stream_response = match llm_chat_stream(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        messages_to_be_sent,
        0.0,
        1000,
        25,
        None,
        thread_id,
        user_id,
        PromptName::FixSql,
    )
    .await
    {
        Ok(stream) => stream,
        Err(e) => return Err(e),
    };

    Ok(stream_response)
}

pub fn route_to_data_source_instructions(data_source_type: &DataSourceType) -> &'static str {
    let instructions = match data_source_type {
        DataSourceType::BigQuery => BIGQUERY_INSTRUCTIONS,
        DataSourceType::Databricks => DATABRICKS_INSTRUCTIONS,
        DataSourceType::MySql => MYSQL_INSTRUCTIONS,
        DataSourceType::Mariadb => MARIADB_INSTRUCTIONS,
        DataSourceType::Postgres => POSTGRES_INSTRUCTIONS,
        DataSourceType::Redshift => REDSHIFT_INSTRUCTIONS,
        DataSourceType::Snowflake => SNOWFLAKE_INSTRUCTIONS,
        DataSourceType::SqlServer => SQLSERVER_INSTRUCTIONS,
        DataSourceType::Supabase => SUPABASE_INSTRUCTIONS,
    };

    instructions
}

#[derive(Deserialize, Debug, Clone)]
pub struct GenerateMessageTitleResponse {
    pub title: String,
}

pub async fn generate_data_summary_ai_call(
    prompt: &String,
    sql: &String,
    data: &Vec<IndexMap<String, DataType>>,
    data_metadata: &DataMetadataJsonBody,
    thread_id: &Uuid,
    user_id: &Uuid,
) -> Result<(Receiver<String>, JoinHandle<Result<String>>)> {
    let truncation_instructions = match data_metadata.row_count > 25 {
        true => "**Due to the size of the data, we have truncated the results to 25 rows.**\n",
        false => "",
    };

    let user_message = format!(
        "### DATA
{truncation_instructions}{data}


### REQUEST/QUESTION
{prompt}


### SQL
{sql}

### TASK
Based on the sql and request/question as context.  Give me a natural language explanation of the data.
Focus on the data, do not explain the sql to me.  I'm looking at the data right now, but I just want a simple explanation of what I'm looking at.
Speak to me business casually.
If data is truncated, don't mention that you truncated it.
If data is truncated, make sure to not make any assumptions about the rest of the data.
No longer than 2 sentences.",
        data = serde_json::to_string(&data).unwrap(),
        prompt = prompt,
        sql = sql,
        truncation_instructions = truncation_instructions,
    );

    let messages_to_be_sent = vec![LlmMessage {
        role: LlmRole::User,
        content: user_message,
    }];

    let response = match llm_chat_stream(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        messages_to_be_sent,
        0.0,
        250,
        10,
        None,
        thread_id,
        user_id,
        PromptName::DataSummary,
    )
    .await
    {
        Ok(response) => response,
        Err(e) => return Err(e),
    };

    Ok(response)
}

pub async fn generate_no_data_returned_response_ai_call(
    prompt: &String,
    sql: &String,
    thread_id: &Uuid,
    user_id: &Uuid,
) -> Result<(Receiver<String>, JoinHandle<Result<String>>)> {
    let user_message = format!(
        "### REQUEST/QUESTION
{prompt}


### SQL
{sql}

### TASK
No data was returned for my request.
Give me a natural language explanation explaining how you tried to retrieve the data and that none was found.
Give me a suggestion of what I should do next.
Im non-technical, so explain simply. 
The data is completely correct, the issue likely has to do with my search parameters.
Speak to me business casually.
No longer than 2 sentences.",
        prompt = prompt,
        sql = sql,
    );

    let messages_to_be_sent = vec![LlmMessage {
        role: LlmRole::User,
        content: user_message,
    }];

    let stream_response = match llm_chat_stream(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        messages_to_be_sent,
        0.0,
        250,
        10,
        None,
        thread_id,
        user_id,
        PromptName::NoDataReturnedResponse,
    )
    .await
    {
        Ok(response) => response,
        Err(e) => return Err(e),
    };

    Ok(stream_response)
}

pub async fn generate_data_explanation_ai_call(
    prompt: &String,
    sql: &String,
    thread_id: &Uuid,
    user_id: &Uuid,
) -> Result<(Receiver<String>, JoinHandle<Result<String>>)> {
    let user_message = format!(
        "### SQL
```sql
{sql}
```

### REQUEST/QUESTION
{prompt}

### TASK
Explain to me how you got the data I asked for.  You used this sql query to get it.
Some important things you should explain is the logic around assumptions you made.
This is not from a database table, it is from a `dataset`.
Do not mention specifics or technical jargon around database syntax, etc.
Do not mention deduplication or uniques.
Speak casually.
3 sentences max.",
        prompt = prompt,
        sql = sql,
    );

    let messages_to_be_sent = vec![LlmMessage {
        role: LlmRole::User,
        content: user_message,
    }];

    let stream_response = match llm_chat_stream(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        messages_to_be_sent,
        0.0,
        250,
        10,
        None,
        thread_id,
        user_id,
        PromptName::DataExplanation,
    )
    .await
    {
        Ok(response) => response,
        Err(e) => return Err(e),
    };

    Ok(stream_response)
}

pub async fn generate_metric_title_ai_call(
    prompt: &String,
    sql: &String,
    thread_id: &Uuid,
    user_id: &Uuid,
) -> Result<(Receiver<String>, JoinHandle<Result<String>>)> {
    let user_message = format!(
        "### SQL
```sql
{sql}
```

### REQUEST/QUESTION
{prompt}

### TASK
Your task is to give me a simple metric title for this request/question and the sql.
Just respond to me with the metric name.
Try to make the metric title descriptive, but try to match terminology with the users request/question.
Ignore charting and visualization requests in the metric title and focus on the data being requested.
The title should contain no special characters.",
        prompt = prompt,
        sql = sql,
    );

    let messages_to_be_sent = vec![LlmMessage {
        role: LlmRole::User,
        content: user_message,
    }];

    let stream_response = match llm_chat_stream(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        messages_to_be_sent,
        0.0,
        50,
        10,
        None,
        thread_id,
        user_id,
        PromptName::MetricTitle,
    )
    .await
    {
        Ok(response) => response,
        Err(e) => return Err(e),
    };

    Ok(stream_response)
}

pub async fn generate_summary_question_ai_call(
    prompt: &String,
    sql: &String,
    thread_id: &Uuid,
    user_id: &Uuid,
) -> Result<(Receiver<String>, JoinHandle<Result<String>>)> {
    let user_message = format!(
        "### SQL
```sql
{sql}
```

### REQUEST/QUESTION
{prompt}

### TASK
Your task is to give me a simple 'summary question' for this request/question and the sql.
Just respond to me with the summary question.
Try to make the question descriptive, but try to match terminology with the users request/question.
Ignore charting and visualization requests in the summary question and focus on the data being requested.
The question should contain no special characters.",
        prompt = prompt,
        sql = sql,
    );

    let messages_to_be_sent = vec![LlmMessage {
        role: LlmRole::User,
        content: user_message,
    }];

    let stream_response = match llm_chat_stream(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        messages_to_be_sent,
        0.0,
        50,
        10,
        None,
        thread_id,
        user_id,
        PromptName::SummaryQuestion,
    )
    .await
    {
        Ok(response) => response,
        Err(e) => return Err(e),
    };

    Ok(stream_response)
}

pub async fn generate_time_frame_ai_call(
    prompt: &String,
    sql: &String,
    thread_id: &Uuid,
    user_id: &Uuid,
) -> Result<(Receiver<String>, JoinHandle<Result<String>>)> {
    let system_message = "### TASK
You are the worlds most amazing data analyst. You have been given a SQL statement. Your task is to identify the time-frame that is being referenced in the SQL statement. 

There are two types of time periods: ['periodic_metric', 'rolling_metric']

periodic_metric: The time period is determined by a fixed span of time (from one particular date to another). This means that the data displayed will never change because the dates are fixed.

rolling_metric: The time period is determined by taking the present day as a starting point. This means that the data displayed will always correspond to the last 7, 15, 30 days (for example) and will change every day. If no time period is specified in the SQL statement, the metric will display it's all time data (this is still a rolling_metric).

Respond with the time period that the data will display. Do not explain anything. Only respond with the time period.

If the time period is a 'periodic_metric', your response should be formatted as: 'Jan 13, 2021 - Jan 18, 2022', 'Nov 1, 2023 - Nov 30, 2023', 'Jan 1, 2020 - Dec 30, 2020', 'Mar 29, 2011 - Jul 4, 2021', 'Comparison: Nov 1, 2024 - Nov 7, 2024 and Nov 8, 2024 - Nov 14, 2024', 'Comparison: 2000 and 2001', etc

If the time period is a 'rolling_metric', your response should be formatted as: 'Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last 2 months', 'Last year', 'Last 2 years', 'All time', 'Comparison: Last 7 days and 7 days prior', 'Comparison: This month and Last month', 'Comparison: September of this year and October of last year', etc";

    let user_message = format!(
        "### REQUEST/QUESTION
{prompt}

### SQL
```sql
{sql}
```

### OUTPUT
Just output the time frame in the format I mentioned above. Do not wrap in any special characters like `'` or `\"`",
        prompt = prompt,
        sql = sql,
    );

    let messages_to_be_sent = vec![
        LlmMessage {
            role: LlmRole::System,
            content: system_message.to_string(),
        },
        LlmMessage {
            role: LlmRole::User,
            content: user_message,
        },
    ];

    let stream_response = match llm_chat_stream(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        messages_to_be_sent,
        0.0,
        100,
        10,
        None,
        thread_id,
        user_id,
        PromptName::TimeFrame,
    )
    .await
    {
        Ok(response) => response,
        Err(e) => return Err(e),
    };

    Ok(stream_response)
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct SelectTermResponse {
    pub terms: Vec<String>,
}

pub async fn select_term_ai_call(
    prompt: &String,
    terms: &Vec<RelevantTerm>,
    thread_id: &Uuid,
    user_id: &Uuid,
) -> Result<SelectTermResponse> {
    let terms_string = terms
        .iter()
        .map(|t| {
            format!(
                "- `{name}`: {definition}",
                name = t.name,
                definition = t.definition
            )
        })
        .collect::<Vec<String>>()
        .join("\n");

    let terms_enums_string = terms
        .iter()
        .map(|t| t.name.clone())
        .collect::<Vec<String>>()
        .join(" | ");

    let user_message = format!("### TASK
Your task is to select relevant terms (if any) based on the user request.  Your options are:

{terms_string}

### OUTPUT
Output the results in a json object with 'terms' as the key and an array containing any of the following enums: {terms_enums_string}

### REQUEST
{prompt}",
        terms_string = terms_string,
        prompt = prompt,
        terms_enums_string = terms_enums_string,
    );

    let select_term_response = match llm_chat(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        &vec![LlmMessage {
            role: LlmRole::User,
            content: user_message.clone(),
        }],
        0.0,
        100,
        10,
        None,
        true,
        None,
        thread_id,
        user_id,
        PromptName::SelectTerm,
    )
    .await
    {
        Ok(response) => {
            let response_json: SelectTermResponse = match serde_json::from_str(&response) {
                Ok(select_term_response) => select_term_response,
                Err(e) => return Err(anyhow!(e)),
            };
            response_json
        }
        Err(e) => return Err(e),
    };

    Ok(select_term_response)
}
