use std::env;

use anyhow::{anyhow, Result};
use litellm::{
    types::{ChatCompletionRequest, LiteLlmMessage, Metadata, ResponseFormat},
    LiteLLMClient,
};
use serde_json::Value;
use tracing::{error, warn};
use uuid::Uuid;

// ---------------------------------------------------------------------------
// Public API – generate_todos_from_plan
// ---------------------------------------------------------------------------

/// Generate todo objects (for agent state) from a natural-language plan.
/// – In test builds we short-circuit with a deterministic mock list so the
///   unit-tests run offline.
/// – In normal builds we proxy to the LLM, replicating the v1 logic.

#[cfg(test)]
pub async fn generate_todos_from_plan(_plan: &str, _user: Uuid, _session: Uuid) -> Result<Vec<Value>> {
    Ok(vec![serde_json::json!({"completed": false, "todo": "Mock todo from test."})])
}

#[cfg(not(test))]
pub async fn generate_todos_from_plan(
    plan: &str,
    user_id: Uuid,
    session_id: Uuid,
) -> Result<Vec<Value>> {
    let llm_client = LiteLLMClient::default();

    // Build the prompt (verbatim copy from v1 implementation)
    let prompt = format!(
        r#"
Given the following plan, identify the main high-level objects (e.g., dashboards, visualizations) being created or modified. Return these as a JSON list of descriptive todo strings. Each todo item should summarize the primary creation or modification goal for one object.

**IMPORTANT**: Do not include granular implementation steps (like adding specific filters or fields), review steps, verification steps, summarization steps, or steps about responding to the user. Focus solely on the final artifact being built or changed.

Plan:
"""
{}
"""

Return ONLY a valid JSON array of strings, where each string is a descriptive todo item corresponding to a main object being created or modified in the plan.

Example Plan:
**Thought**
The user wants to see the daily transaction volume trend over the past month.
I'll sum the transaction amounts per day from the `transactions` dataset, filtering for the last 30 days.
I will present this as a line chart.

**Step-by-Step Plan**
1. **Create 1 Visualization**:
+- **Title**: "Daily Transaction Volume (Last 30 Days)"
+- **Type**: Line Chart
+- **Datasets**: transactions
+- **X-Axis**: Day (from transaction timestamp)
+- **Y-Axis**: Sum of transaction amount
+- **Filter**: Transaction timestamp within the last 30 days.
+- **Expected Output**: A line chart showing the total transaction volume for each day over the past 30 days.

2. **Review & Finish**:
+- Verify the date filter correctly captures the last 30 days.
+- Ensure the axes are labeled clearly.

Example Output for the above plan: `["Create line chart visualization 'Daily Transaction Volume (Last 30 Days)'"]`
+"#,        plan
    );

    // Choose model depending on environment (mirrors v1 behaviour)
    let model = if env::var("ENVIRONMENT").unwrap_or_else(|_| "development".into()) == "local" {
        "gpt-4.1-nano".to_string()
    } else {
        "gemini-2.0-flash-001".to_string()
    };

    let request = ChatCompletionRequest {
        model,
        messages: vec![LiteLlmMessage::User { id: None, content: prompt, name: None }],
        stream: Some(false),
        response_format: Some(ResponseFormat { type_: "json_object".to_string(), json_schema: None }),
        store: Some(true),
        metadata: Some(Metadata {
            generation_name: "generate_todos_from_plan".to_string(),
            user_id: user_id.to_string(),
            session_id: session_id.to_string(),
            trace_id: Uuid::new_v4().to_string(),
        }),
        max_completion_tokens: Some(1024),
        temperature: Some(0.0),
        ..Default::default()
    };

    let response = llm_client.chat_completion(request).await?;

    let content = response
        .choices
        .get(0)
        .and_then(|c| c.message.get_content())
        .ok_or_else(|| anyhow!("LLM response for todo generation was empty or malformed"))?;

    // Parse the LLM output (array or object-with-todos)
    let parsed_value: Value = serde_json::from_str(&content).map_err(|e| {
        error!("Failed to parse LLM JSON response for todos: {}. Content: {}", e, content);
        anyhow!("Failed to parse LLM JSON response for todos: {}", e)
    })?;

    let todo_strings: Vec<String> = match parsed_value {
        Value::Array(arr) => arr
            .into_iter()
            .filter_map(|v| v.as_str().map(String::from))
            .collect(),
        Value::Object(mut map) => map
            .remove("todos")
            .and_then(|v| v.as_array().cloned())
            .map(|arr| arr.into_iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_else(|| {
                warn!("LLM todo response was object but did not contain a 'todos' array or it was not an array of strings. Content: {}", content);
                vec![]
            }),
        _ => {
            warn!("Unexpected JSON structure for todos from LLM. Content: {}", content);
            return Err(anyhow!("Unexpected JSON structure for todos from LLM"));
        }
    };

    // Convert into the agent-state friendly array of objects
    let todos_state_objects: Vec<Value> = todo_strings
        .into_iter()
        .map(|item| serde_json::json!({"completed": false, "todo": item}))
        .collect();

    Ok(todos_state_objects)
} 