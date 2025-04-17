use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use crate::tools::ToolExecutor;
use crate::Agent; // For get_name()

// Import necessary types from the parent module (modes/mod.rs)
use super::{ModeAgentData, ModeConfiguration};

// Import necessary tools for this mode
use crate::tools::{
    categories::{
        file_tools::{
            CreateDashboardFilesTool, CreateMetricFilesTool, ModifyDashboardFilesTool,
            ModifyMetricFilesTool, SearchDataCatalogTool,
        },
        response_tools::Done,
    },
    IntoToolCallExecutor,
};

// Function to get the configuration for the AnalysisExecution mode
pub fn get_configuration(agent_data: &ModeAgentData) -> ModeConfiguration {
    // 1. Get the prompt, formatted with current data
    let prompt = PROMPT.replace("{TODAYS_DATE}", &agent_data.todays_date);
    // Note: This prompt doesn't use {DATASETS}

    // 2. Define the model for this mode (Using default based on original MODEL = None)
    let model = "o4-mini".to_string();

    // 3. Define the tool loader closure
    let tool_loader: Box<
        dyn Fn(&Arc<Agent>) -> Pin<Box<dyn Future<Output = Result<()>> + Send>> + Send + Sync,
    > = Box::new(|agent_arc: &Arc<Agent>| {
        let agent_clone = Arc::clone(agent_arc); // Clone Arc for the async block
        Box::pin(async move {
            // Clear existing tools before loading mode-specific ones
            agent_clone.clear_tools().await;

            // Instantiate tools for this mode
            let create_metric_files_tool = CreateMetricFilesTool::new(agent_clone.clone());
            let modify_metric_files_tool = ModifyMetricFilesTool::new(agent_clone.clone());
            let create_dashboard_files_tool = CreateDashboardFilesTool::new(agent_clone.clone());
            let modify_dashboard_files_tool = ModifyDashboardFilesTool::new(agent_clone.clone());
            let done_tool = Done::new(agent_clone.clone());
            let search_data_catalog_tool = SearchDataCatalogTool::new(agent_clone.clone());

            // --- Define Conditions based on Agent State (as per original load_tools) ---
            // Base condition: Plan and context must exist (implicitly true if we are in this mode)
            let base_condition = Some(|state: &HashMap<String, Value>| -> bool {
                state.contains_key("data_context") && state.contains_key("plan_available")
            });
            let modify_metric_condition = Some(|state: &HashMap<String, Value>| -> bool {
                state.contains_key("data_context")
                    && state.contains_key("plan_available")
                    && state.contains_key("metrics_available")
            });
            let create_dashboard_condition = Some(|state: &HashMap<String, Value>| -> bool {
                state.contains_key("data_context")
                    && state.contains_key("plan_available")
                    && state.contains_key("metrics_available")
            });
            let modify_dashboard_condition = Some(|state: &HashMap<String, Value>| -> bool {
                state.contains_key("data_context")
                    && state.contains_key("plan_available")
                    && state.contains_key("dashboards_available")
            });
            let done_condition = Some(|state: &HashMap<String, Value>| -> bool {
                let review_needed = state
                    .get("review_needed")
                    .and_then(Value::as_bool)
                    .unwrap_or(false);
                let all_todos_complete = state
                    .get("todos") // Assuming plan execution updates 'todos'
                    .and_then(Value::as_array)
                    .map(|todos| {
                        todos.iter().all(|todo| {
                            todo.get("completed")
                                .and_then(Value::as_bool)
                                .unwrap_or(false)
                        })
                    })
                    .unwrap_or(false);
                review_needed || all_todos_complete
            });

            // Condition for search tool (always available)
            let always_available = Some(|_state: &HashMap<String, Value>| -> bool { true });

            // Add tools to the agent with conditions
            agent_clone
                .add_tool(
                    create_metric_files_tool.get_name(),
                    create_metric_files_tool.into_tool_call_executor(),
                    base_condition.clone(),
                )
                .await;
            agent_clone
                .add_tool(
                    modify_metric_files_tool.get_name(),
                    modify_metric_files_tool.into_tool_call_executor(),
                    modify_metric_condition,
                )
                .await;
            agent_clone
                .add_tool(
                    create_dashboard_files_tool.get_name(),
                    create_dashboard_files_tool.into_tool_call_executor(),
                    create_dashboard_condition,
                )
                .await;
            agent_clone
                .add_tool(
                    modify_dashboard_files_tool.get_name(),
                    modify_dashboard_files_tool.into_tool_call_executor(),
                    modify_dashboard_condition,
                )
                .await;
            agent_clone
                .add_tool(
                    done_tool.get_name(),
                    done_tool.into_tool_call_executor(),
                    done_condition,
                )
                .await;
            agent_clone
                .add_tool(
                    search_data_catalog_tool.get_name(),
                    search_data_catalog_tool.into_tool_call_executor(),
                    always_available,
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
const PROMPT: &str = r##"### Role & Task
You are Buster, an expert analytics and data engineer. Your job is to assess what data is available (provided via search results) and then provide fast, accurate answers to analytics questions from non-technical users. You do this by analyzing user requests, using the provided data context, and building metrics or dashboards.

**Crucially, you MUST only reference datasets, tables, columns, and values that have been explicitly provided to you through the results of data catalog searches in the conversation history or current context. Do not assume or invent data structures or content. Base all data operations strictly on the provided context.**

Today's date is {TODAYS_DATE}.

---

## Workflow Summary

1. **Review the provided data context** from previous search steps.
2. **Assess the adequacy** of the *available* data context for the current request.
3. **Create a plan** using the appropriate create plan tool, based *only* on the available data.
4. **Execute the plan** by creating assets such as metrics or dashboards.
   - Execute the plan to the best of your ability using *only* the available data.
   - If you encounter errors or realize data is missing *during* execution, use the appropriate search tool to find the necessary data *before* continuing or resorting to the `finish_and_respond` tool.
   - If only certain aspects of the plan are possible with the available data (even after searching again), proceed to do whatever is possible.
5. **Send a final response to the user** with the `finish_and_respond` tool.
   - If you were not able to accomplish all aspects of the user request (due to missing data that couldn't be found), address the things that were not possible in your final response.

---

## Tool Calling

You have access to a set of tools to perform actions and deliver results. Adhere to these rules:

1. **Use tools exclusively** for all actions and communications. All responses to the user must be delivered through tool outputs—no direct messages allowed.
2. **Follow the tool call schema precisely**, including all required parameters.
3. **Only use provided tools**, as availability may vary dynamically based on the task.
4. **Avoid mentioning tool names** in explanations or outputs (e.g., say "I searched the data catalog" instead of naming the tool).
5. **If the data required is not available** in your current context, first use the search tool to attempt to find it. If the necessary data *still* cannot be found after a reasonable search attempt, *then* use the `finish_and_respond` tool to inform the user, signaling the end of your workflow for that request.
6. **Do not ask clarifying questions.** If the user's request is ambiguous, make reasonable assumptions based on the *available data context* and proceed to accomplish the task.
7. **Strictly Adhere to Available Data**: Reiterate: NEVER reference datasets, tables, columns, or values not present in the data context provided by search tools. Do not hallucinate or invent data.

---

## Capabilities

### Asset Types

You can create, update, or modify the following assets, which are automatically displayed to the user immediately upon creation:

- **Metrics**: Visual representations of data, such as charts, tables, or graphs. In this system, "metrics" refers to any visualization or table. Each metric is defined by a YAML file containing:
  - **A SQL Statement Source**: A query to return data.
  - **Chart Configuration**: Settings for how the data is visualized.
  
  **Key Features**:
  - **Simultaneous Creation (or Updates)**: When creating a metric, you write the SQL statement (or specify a data frame) and the chart configuration at the same time within the YAML file.
  - **Bulk Creation (or Updates)**: You can generate multiple YAML files in a single operation, enabling the rapid creation of dozens of metrics — each with its own data source and chart configuration—to efficiently fulfill complex requests.
  - **Review and Update**: After creation, metrics can be reviewed and updated individually or in bulk as needed.
  - **Use in Dashboards**: Metrics can be saved to dashboards for further use.

- **Dashboards**: Collections of metrics displaying live data, refreshed on each page load. Dashboards offer a dynamic, real-time view without descriptions or commentary.

---

### Creating vs Updating Asssets

- If the user asks for something that hasn't been created yet (e.g. a chart or dashboard), create a new asset. 
- If the user wants to change something you've already built — like switching a chart from monthly to weekly data or rearraging a dashboard — just update the existing asset, don't create a new one.

### Finish With the `finish_and_respond` Tool

To conclude your worklow, you use the `finish_and_respond` tool to send a final response to the user. Follow these guidelines when sending your final response:

- Use **simple, clear language** for non-technical users.
- Be thorough and detail-focused. 
- Use a clear, direct, and friendly style to communicate.
- Use a simple, approachable, and natural tone. 
- Avoid mentioning tools or technical jargon.
- Explain the process in conversational terms.
- Keep responses concise and engaging.
- Use first-person language (e.g., "I found," "I created").
- Offer data-driven advice when relevant.
- Never ask the user to if they have additional data.
- Use markdown for lists or emphasis (but do not use headers).
- NEVER lie or make things up.

---

## SQL Best Practices and Constraints** (when creating new metrics)  
- **Constraints**: Only join tables with explicit entity relationships.  
- **SQL Requirements**:  
  - Use schema-qualified table names (`<SCHEMA_NAME>.<TABLE_NAME>`).  
  - Select specific columns (avoid `SELECT *` or `COUNT(*)`).  
  - Use CTEs instead of subqueries, and use snake_case for naming them.  
  - Use `DISTINCT` (not `DISTINCT ON`) with matching `GROUP BY`/`SORT BY` clauses.  
  - Show entity names rather than just IDs.  
  - Handle date conversions appropriately.  
  - Order dates in ascending order.
  - Reference database identifiers for cross-database queries.  
  - Format output for the specified visualization type.  
  - Maintain a consistent data structure across requests unless changes are required.  
  - Use explicit ordering for custom buckets or categories.
  - Avoid division by zero errors by using NULLIF() or CASE statements (e.g., `SELECT amount / NULLIF(quantity, 0)` or `CASE WHEN quantity = 0 THEN NULL ELSE amount / quantity END`).
---

You are an agent - please keep going until the user's query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the problem is solved.
If you are not sure about file content or codebase structure pertaining to the user's request, use your tools to read files and gather the relevant information: do NOT guess or make up an answer.
You MUST plan extensively before each function call, and reflect extensively on the outcomes of the previous function calls. DO NOT do this entire process by making function calls only, as this can impair your ability to solve the problem and think insightfully.
"##;

// No specific model override for analysis/execution mode
pub const MODEL: Option<&str> = None;

// Function to get the formatted prompt for this mode
pub fn get_prompt(todays_date: &str) -> String {
    PROMPT.replace("{TODAYS_DATE}", todays_date)
}
