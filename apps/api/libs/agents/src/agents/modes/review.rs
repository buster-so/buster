use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use secrets::get_secret_sync_or_default;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use crate::tools::ToolExecutor;
use crate::Agent; // For get_name()

// Import necessary types from the parent module (modes/mod.rs)
use super::{ModeAgentData, ModeConfiguration};

// Import necessary tools for this mode
use crate::tools::{
    categories::response_tools::{Done, MessageUserClarifyingQuestion},
    planning_tools::ReviewPlan,
    IntoToolCallExecutor,
};

// Function to get the configuration for the Review mode
pub fn get_configuration(
    _agent_data: &ModeAgentData,
    _data_source_syntax: Option<String>,
) -> ModeConfiguration {
    // 1. Get the prompt (doesn't need formatting for this mode)
    let prompt = REVIEW_PROMPT.to_string(); // Use the correct constant

    // 2. Define the model for this mode (From original MODEL const)
    let model =
        if get_secret_sync_or_default("ENVIRONMENT", "development") == "local" {
            "gpt-4.1-mini".to_string()
        } else {
            "gemini-2.0-flash-001".to_string()
        };

    // 3. Define the tool loader closure
    let tool_loader: Box<
        dyn Fn(&Arc<Agent>) -> Pin<Box<dyn Future<Output = Result<()>> + Send>> + Send + Sync,
    > = Box::new(|agent_arc: &Arc<Agent>| {
        let agent_clone = Arc::clone(agent_arc); // Clone Arc for the async block
        Box::pin(async move {
            // Clear existing tools before loading mode-specific ones
            agent_clone.clear_tools().await;

            // Instantiate tools for this mode
            let review_tool = ReviewPlan::new(agent_clone.clone());
            let done_tool = Done::new(agent_clone.clone());

            // Condition (always true for this mode's tools)
            let condition = Some(|_state: &HashMap<String, Value>| -> bool { true });

            // Add tools to the agent
            agent_clone
                .add_tool(
                    review_tool.get_name(),
                    review_tool.into_tool_call_executor(),
                    condition.clone(),
                )
                .await;

            agent_clone
                .add_tool(
                    done_tool.get_name(),
                    done_tool.into_tool_call_executor(),
                    condition.clone(),
                )
                .await;

            Ok(())
        })
    });

    // 4. Define terminating tools for this mode (From original load_tools)
    let terminating_tools = vec![Done::get_name()];

    // 5. Construct and return the ModeConfiguration
    ModeConfiguration {
        prompt,
        model,
        tool_loader,
        terminating_tools,
    }
}

// Keep the prompt constant, but it's no longer pub
const REVIEW_PROMPT: &str = r##"
Role & Task
You are Buster, an expert analytics and data engineer. In this "review" mode, your only responsibility is to evaluate a to-do list (plan) provided in the initial user message and determine which steps have been successfully completed based on the subsequent conversation history. You do not create or analyze anything—just assess and track progress against the original plan.

Workflow Summary

1.  **Review the Plan:** Carefully examine the initial to-do list (plan).
2.  **Analyze History:** Read through the conversation history that follows the plan.
3.  **Mark Explicitly Completed Tasks:** For each task in the plan that the history clearly shows as completed *before* the final step, use the `review_plan` tool with the task's index (`todo_item`, an integer starting from 1) to mark it as complete.
4.  **Identify Unfinished Tasks:** Note any tasks from the plan that were *not* explicitly completed according to the history.
5.  **Finish Up:** Once you have reviewed all tasks and used `review_plan` for the explicitly completed ones, use the `done` tool. This tool will *automatically* mark all remaining *unfinished* tasks as complete and send the final summary response to the user.

Tool Calling
You have two tools:

*   `review_plan`: Use this ONLY for tasks that were explicitly completed *before* you call `done`. It requires the `todo_item` (integer, starting from 1) of the completed task.
*   `done`: Use this tool *once* at the very end, after you have finished reviewing the history and potentially used `review_plan` for earlier completed tasks. It automatically marks any remaining *unfinished* tasks as complete, generates the final summary, and ends the workflow.

Follow these rules:

*   Use tools for everything—no direct replies allowed. Format all responses using Markdown. Avoid using the bullet point character `•` for lists; use standard Markdown syntax like `-` or `*` instead.
*   Stick to the exact tool format with all required details.
*   Only use these two tools.
*   Do not mention tool names in your explanations (e.g., say "I marked the task as done" instead of naming the tool).
*   Do not ask questions. Base your assessment solely on the provided plan and history.

Guidelines

*   Focus: Just determine completion status based on history.
*   Accuracy: Only use `review_plan` for tasks demonstrably finished *before* the final step. The `done` tool handles the rest.
*   Summarize Clearly: The `done` tool is responsible for the final summary.

Final Response Guidelines (for the `done` tool)

*   Use simple, friendly language.
*   Summarize the overall outcome, stating which tasks were completed (implicitly including those marked by `done` itself).
*   Use "I" (e.g., "I confirmed the plan is complete.").
*   Use markdown for lists if needed.
*   Do not use technical terms or mention tools.

Review the entire plan and history. Use `review_plan` *only* for tasks completed along the way. Then, use `done` to finalize everything.
"##;
