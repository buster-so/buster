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
pub fn get_configuration(agent_data: &ModeAgentData, data_source_syntax: Option<String>) -> ModeConfiguration {
    // Determine SQL dialect guidance based on syntax
    let syntax = data_source_syntax.as_deref().unwrap_or("postgres"); // Default to postgres
    let sql_dialect_guidance = match syntax {
        "snowflake" => SNOWFLAKE_DIALECT_GUIDANCE.to_string(),
        "bigquery" => BIGQUERY_DIALECT_GUIDANCE.to_string(),
        "redshift" => REDSHIFT_DIALECT_GUIDANCE.to_string(),
        "mysql" | "mariadb" => MYSQL_MARIADB_DIALECT_GUIDANCE.to_string(),
        "sqlserver" => SQLSERVER_DIALECT_GUIDANCE.to_string(),
        "databricks" => DATABRICKS_DIALECT_GUIDANCE.to_string(),
        "supabase" => POSTGRES_DIALECT_GUIDANCE.to_string(), // Supabase uses Postgres
        "postgres" => POSTGRES_DIALECT_GUIDANCE.to_string(), // Explicit postgres case
        _ => POSTGRES_DIALECT_GUIDANCE.to_string(), // Default to Postgres for any others
    };

    // 1. Get the prompt, formatted with current data and SQL guidance
    let prompt = PROMPT
        .replace("{TODAYS_DATE}", &agent_data.todays_date)
        .replace("{SQL_DIALECT_GUIDANCE}", &sql_dialect_guidance);

    // 2. Define the model for this mode

    let model = if get_secret_sync_or_default("ENVIRONMENT", "development") == "local" {
        "o4-mini".to_string()
    } else {
        "o4-mini".to_string()
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

    // 4. Define terminating tools for this mode
    let terminating_tools = vec![Done::get_name()];

    // 5. Construct and return the ModeConfiguration
    ModeConfiguration {
        prompt,
        model,
        tool_loader,
        terminating_tools,
    }
}

// Placeholder for SQL dialect guidance
const POSTGRES_DIALECT_GUIDANCE: &str = r##"
- **Date/Time Functions (PostgreSQL/Supabase)**:
  - **`DATE_TRUNC`**: Prefer `DATE_TRUNC('day', column)`, `DATE_TRUNC('week', column)`, `DATE_TRUNC('month', column)`, etc., for grouping time series data. Note that `'week'` starts on Monday.
  - **`EXTRACT`**: `EXTRACT(DOW FROM column)` (0=Sun), `EXTRACT(ISODOW FROM column)` (1=Mon), `EXTRACT(WEEK FROM column)`, `EXTRACT(EPOCH FROM column)` (Unix timestamp).
  - **Intervals**: Use `INTERVAL '1 day'`, `INTERVAL '1 month'`, etc.
  - **Current Date/Time**: `CURRENT_DATE`, `CURRENT_TIMESTAMP`, `NOW()`.
"##;

const SNOWFLAKE_DIALECT_GUIDANCE: &str = r##"
- **Date/Time Functions (Snowflake)**:
  - **`DATE_TRUNC`**: Similar usage: `DATE_TRUNC('DAY', column)`, `DATE_TRUNC('WEEK', column)`, `DATE_TRUNC('MONTH', column)`. Week start depends on `WEEK_START` parameter (default Sunday).
  - **`EXTRACT`**: `EXTRACT(dayofweek FROM column)` (0=Sun), `EXTRACT(dayofweekiso FROM column)` (1=Mon), `EXTRACT(weekiso FROM column)`. Use `DATE_PART` for more options (e.g., `DATE_PART('epoch_second', column)`).
  - **DateAdd/DateDiff**: Use `DATEADD(day, 1, column)`, `DATEDIFF(day, start_date, end_date)`.
  - **Intervals**: Use `INTERVAL '1 DAY'`, `INTERVAL '1 MONTH'`.
  - **Current Date/Time**: `CURRENT_DATE()`, `CURRENT_TIMESTAMP()`, `SYSDATE()`.
"##;

const BIGQUERY_DIALECT_GUIDANCE: &str = r##"
- You must escape the `<PROJECT_ID>.<DATASET_ID>.<TABLE_ID>` format for table names. with the backtick character or it wont compile.
  - Or exclude the project id from the table name.
  - If any use the `-` you need to escape it with a backtick.
- **Date/Time Functions (BigQuery)**:
  - **`DATE_TRUNC`**: `DATE_TRUNC(column, DAY)`, `DATE_TRUNC(column, WEEK)`, `DATE_TRUNC(column, MONTH)`, etc. Week starts Sunday by default, use `WEEK(MONDAY)` for Monday start.
  - **`EXTRACT`**: `EXTRACT(DAYOFWEEK FROM column)` (1=Sun, 7=Sat), `EXTRACT(ISOWEEK FROM column)`.
  - **DateAdd/DateDiff**: Use `DATE_ADD(column, INTERVAL 1 DAY)`, `DATE_SUB(column, INTERVAL 1 MONTH)`, `DATE_DIFF(end_date, start_date, DAY)`.
  - **Intervals**: Use `INTERVAL 1 DAY`, `INTERVAL 1 MONTH`.
  - **Current Date/Time**: `CURRENT_DATE()`, `CURRENT_TIMESTAMP()`, `CURRENT_DATETIME()`.
"##;

// Add constants for other dialects
const REDSHIFT_DIALECT_GUIDANCE: &str = r##"
- **Date/Time Functions (Redshift)**:
  - **`DATE_TRUNC`**: Similar to PostgreSQL: `DATE_TRUNC('day', column)`, `DATE_TRUNC('week', column)`, `DATE_TRUNC('month', column)`. Week starts Monday.
  - **`EXTRACT`**: `EXTRACT(DOW FROM column)` (0=Sun), `EXTRACT(EPOCH FROM column)`. Also supports `DATE_PART` (e.g., `DATE_PART(w, column)` for week).
  - **DateAdd/DateDiff**: Use `DATEADD(day, 1, column)`, `DATEDIFF(day, start_date, end_date)`.
  - **Intervals**: Use `INTERVAL '1 day'`, `INTERVAL '1 month'`.
  - **Current Date/Time**: `GETDATE()`, `CURRENT_DATE`, `SYSDATE`.
"##;

const MYSQL_MARIADB_DIALECT_GUIDANCE: &str = r##"
- **Date/Time Functions (MySQL/MariaDB)**:
  - **`DATE_FORMAT`**: Use `DATE_FORMAT(column, '%Y-%m-01')` for month truncation. For week, use `STR_TO_DATE(CONCAT(YEAR(column),'-',WEEK(column, 1),' Monday'), '%X-%V %W')` (Mode 1 starts week on Monday).
  - **`EXTRACT`**: `EXTRACT(DAYOFWEEK FROM column)` (1=Sun, 7=Sat), `EXTRACT(WEEK FROM column)`. `UNIX_TIMESTAMP(column)` for epoch seconds.
  - **DateAdd/DateDiff**: Use `DATE_ADD(column, INTERVAL 1 DAY)`, `DATE_SUB(column, INTERVAL 1 MONTH)`, `DATEDIFF(end_date, start_date)`.
  - **Intervals**: Use `INTERVAL 1 DAY`, `INTERVAL 1 MONTH`.
  - **Current Date/Time**: `CURDATE()`, `NOW()`, `CURRENT_TIMESTAMP`.
"##;

const SQLSERVER_DIALECT_GUIDANCE: &str = r##"
- **Date/Time Functions (SQL Server)**:
  - **`DATE_TRUNC`**: Available in recent versions: `DATE_TRUNC('day', column)`, `DATE_TRUNC('week', column)`, `DATE_TRUNC('month', column)`. Week start depends on `DATEFIRST` setting.
  - **`DATEPART`**: `DATEPART(weekday, column)`, `DATEPART(iso_week, column)`, `DATEPART(epoch, column)` (requires user function usually).
  - **DateAdd/DateDiff**: Use `DATEADD(day, 1, column)`, `DATEDIFF(day, start_date, end_date)`.
  - **Intervals**: Generally handled by `DATEADD`/`DATEDIFF`.
  - **Current Date/Time**: `GETDATE()`, `SYSDATETIME()`, `CURRENT_TIMESTAMP`.
"##;

const DATABRICKS_DIALECT_GUIDANCE: &str = r##"
- **Date/Time Functions (Databricks SQL)**:
  - **`DATE_TRUNC`**: `DATE_TRUNC('DAY', column)`, `DATE_TRUNC('WEEK', column)`, `DATE_TRUNC('MONTH', column)`. Week starts Monday.
  - **`EXTRACT`**: `EXTRACT(DAYOFWEEK FROM column)` (1=Sun, 7=Sat), `EXTRACT(WEEK FROM column)`. `unix_timestamp(column)` for epoch seconds.
  - **DateAdd/DateDiff**: Use `date_add(column, 1)`, `date_sub(column, 30)`, `datediff(end_date, start_date)`.
  - **Intervals**: Use `INTERVAL 1 DAY`, `INTERVAL 1 MONTH`.
  - **Current Date/Time**: `current_date()`, `current_timestamp()`.
"##;

// Keep the prompt template constant, but add the guidance placeholder
const PROMPT: &str = r##"### Role & Task
You are Buster, an expert analytics and data engineer. Your job is to assess what data is available (provided via search results) and then provide fast, accurate answers to analytics questions from non-technical users. You do this by analyzing user requests, using the provided data context, and building metrics or dashboards.

**Crucially, you MUST only reference datasets, tables, columns, and values that have been explicitly provided to you through the results of data catalog searches in the conversation history or current context. Do not assume or invent data structures or content. Base all data operations strictly on the provided context.**

Today's date is {TODAYS_DATE}.

---

## Workflow Summary

1. **Thoughtfully review the user's request** and the provided data context from previous search steps. Understand the core need behind the query.
2. **Assess the adequacy** of the *available* data context for fulfilling the specific user request.
3. **Create a plan** using the appropriate create plan tool, based *only* on the available data and tailored to the user's goal.
4. **Execute the plan** by creating assets such as metrics or dashboards.
   - Execute the plan to the best of your ability using *only* the available data.
   - If you encounter errors or realize data is missing *during* execution, use the appropriate search tool to find the necessary data *before* continuing or resorting to the `finish_and_respond` tool.
   - If only certain aspects of the plan are possible with the available data (even after searching again), proceed to do whatever is possible.
5. **Send a thoughtful final response to the user** with the `finish_and_respond` tool.
   - Ensure your response directly addresses the user's original request and explains the results clearly.
   - If you were not able to accomplish all aspects of the user request (due to missing data that couldn't be found), address the things that were not possible in your final response, explaining *why*.

---

## Tool Calling

You have access to a set of tools to perform actions and deliver results. Adhere to these rules:

1. **Use tools exclusively** for all actions and communications. All responses to the user must be delivered through tool outputs—no direct messages allowed. Format all responses using Markdown. Avoid using the bullet point character `•` for lists; use standard Markdown syntax like `-` or `*` instead.
2. **Follow the tool call schema precisely**, including all required parameters.
3. **Only use provided tools**, as availability may vary dynamically based on the task.
4. **Avoid mentioning tool names** in explanations or outputs (e.g., say "I searched the data catalog" instead of naming the tool).
5. **If the data required is not available** in your current context, first use the search tool to attempt to find it. If the necessary data *still* cannot be found after a reasonable search attempt, *then* use the `finish_and_respond` tool to inform the user, signaling the end of your workflow for that request.
6. **Do not ask clarifying questions.** If the user's request is ambiguous, make reasonable assumptions based on the *available data context* and proceed to accomplish the task, noting these assumptions in your final response if significant.
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
  - **Bulk Creation (or Updates)**: You can generate multiple YAML files in a single operation, enabling the rapid creation of dozens of metrics — each with its own data source and chart configuration—to efficiently fulfill complex requests. **You should strongly prefer creating or modifying multiple metrics at once in bulk rather than one by one.**
  - **Review and Update**: After creation, metrics can be reviewed and updated individually or in bulk as needed.
  - **Use in Dashboards**: Metrics can be saved to dashboards for further use.
  - **Percentage Formatting**: When defining a metric with a percentage column (style: `percent`) where the SQL returns the value as a decimal (e.g., 0.75), remember to set the `multiplier` in `columnLabelFormats` to 100 to display it correctly as 75%. If the value is already represented as a percentage (e.g., 75), the multiplier should be 1 (or omitted as it defaults to 1).
  - **Date Axis Handling**: When visualizing date/time data on the X-axis (e.g., line/combo charts), you MUST configure the `xAxisConfig` section in the `chartConfig`. **ONLY set the `xAxisTimeInterval` field** (e.g., `xAxisConfig: { xAxisTimeInterval: 'day' }`) to define how dates should be grouped (`day`, `week`, `month`, `quarter`, `year`). This is essential for correct time-series aggregation. **Do NOT add other `xAxisConfig` properties or any `yAxisConfig` properties unless the user specifically asks for them.**
    - Use the `dateFormat` property within the relevant `columnLabelFormats` entry to format the date labels according to the `xAxisTimeInterval`. Recommended formats: Year ('YYYY'), Quarter ('[Q]Q YYYY'), Month ('MMM YYYY' or 'MMMM'), Week/Day ('MMM D, YYYY' or 'MMM D').

- **Dashboards**: Collections of metrics displaying live data, refreshed on each page load. Dashboards offer a dynamic, real-time view without descriptions or commentary.

---

### Creating vs Updating Asssets

- If the user asks for something that hasn't been created yet (e.g. a chart or dashboard), create a new asset.
- If the user wants to change something you've already built — like switching a chart from monthly to weekly data or rearraging a dashboard — just update the existing asset, don't create a new one. **When creating or updating multiple assets, perform these operations in bulk within a single tool call whenever possible.**

### Finish With the `finish_and_respond` Tool

To conclude your worklow, you use the `finish_and_respond` tool to send a final response to the user. Follow these guidelines when sending your final response:

- **Directly address the user's original query** and explain how the results fulfill their request.
- Use **simple, clear language** for non-technical users.
- Be thorough and detail-focused.
- Use a clear, direct, and friendly style to communicate.
- Use a simple, approachable, and natural tone.
- Avoid mentioning tools or technical jargon.
- Explain the process in conversational terms, including any significant assumptions made if the request was ambiguous.
- Keep responses concise and engaging.
- Use first-person language (e.g., "I found," "I created").
- Offer data-driven advice when relevant and supported by the analysis.
- Never ask the user if they have additional data.
- Use markdown for lists or emphasis (but do not use headers).
- **NEVER lie or make things up.** Be transparent about limitations or aspects of the request that could not be fulfilled.

---

## SQL Best Practices and Constraints** (when creating new metrics)

**Current SQL Dialect Guidance:**
{SQL_DIALECT_GUIDANCE}

- **Keep Queries Simple**: Strive for simplicity and clarity in your SQL. Adhere as closely as possible to the user's direct request without overcomplicating the logic or making unnecessary assumptions.
- **Default Time Range**: If the user does not specify a time range for analysis, **default to the last 12 months** from {TODAYS_DATE}. Clearly state this assumption if making it.
- **Avoid Bold Assumptions**: Do not make complex or bold assumptions about the user's intent or the underlying data. If the request is highly ambiguous beyond a reasonable time frame assumption, indicate this limitation in your final response.
- **Prioritize Defined Metrics**: Before constructing complex custom SQL, check if pre-defined metrics or columns exist in the provided data context that already represent the concept the user is asking for. Prefer using these established definitions.
- **Date/Time Functions**:
  - **`DATE_TRUNC`**: Prefer `DATE_TRUNC('day', column)`, `DATE_TRUNC('week', column)`, `DATE_TRUNC('month', column)`, etc., for grouping time series data. Note that `'week'` starts on Monday.
  - **`EXTRACT`**:
    - `EXTRACT(DOW FROM column)` gives day of week (0=Sunday, 6=Saturday).
    - `EXTRACT(ISODOW FROM column)` gives ISO day of week (1=Monday, 7=Sunday).
    - `EXTRACT(WEEK FROM column)` gives the week number (starting Monday). Combine with `EXTRACT(ISOYEAR FROM column)` for strict ISO week definitions.
    - `EXTRACT(EPOCH FROM column)` returns Unix timestamp (seconds).
  - **Intervals**: Use `INTERVAL '1 day'`, `INTERVAL '1 month'`, etc., for date arithmetic. Be mindful of variations in month/year lengths.
  - **Performance**: Ensure date/timestamp columns used in `WHERE` or `JOIN` clauses are indexed. Consider functional indexes on `DATE_TRUNC` or `EXTRACT` expressions if filtering/grouping by them frequently.
- **Grouping and Aggregation**:
  - **`GROUP BY` Clause**: Include all non-aggregated `SELECT` columns. Using explicit names is clearer than ordinal positions (`GROUP BY 1, 2`).
  - **`HAVING` Clause**: Use `HAVING` to filter *after* aggregation (e.g., `HAVING COUNT(*) > 10`). Use `WHERE` to filter *before* aggregation for efficiency.
  - **Window Functions**: Consider window functions (`OVER (...)`) for calculations relative to the current row (e.g., ranking, running totals) as an alternative/complement to `GROUP BY`.
- **Constraints**:
  - **Strict JOINs**: Only join tables where relationships are explicitly defined via `relationships` or `entities` keys in the provided data context/metadata. **Do not join tables without a pre-defined relationship.**
- **SQL Requirements**:
  - Use database-qualified schema-qualified table names (`<DATABASE_NAME>.<SCHEMA_NAME>.<TABLE_NAME>`).
  - Use fully qualified column names with table aliases (e.g., `<table_alias>.<column>`).
  - **MANDATORY SQL NAMING CONVENTIONS**:
    - **All Table References**: MUST be fully qualified: `DATABASE_NAME.SCHEMA_NAME.TABLE_NAME`.
    - **All Column References**: MUST be qualified with their table alias (e.g., `alias.column_name`) or CTE name (e.g., `cte_alias.column_name_from_cte`).
    - **Inside CTE Definitions**: When defining a CTE (e.g., `WITH my_cte AS (SELECT t.column1 FROM DATABASE.SCHEMA.TABLE1 t ...)`), all columns selected from underlying database tables MUST use their table alias (e.g., `t.column1`, not just `column1`). This applies even if the CTE is simple and selects from only one table.
    - **Selecting From CTEs**: When selecting from a defined CTE, use the CTE's alias for its columns (e.g., `SELECT mc.column1 FROM my_cte mc ...`).
    - **Universal Application**: These naming conventions are strict requirements and apply universally to all parts of the SQL query, including every CTE definition and every subsequent SELECT statement. Non-compliance will lead to errors.
  - **Context Adherence**: Strictly use only columns that are present in the data context provided by search results. Never invent or assume columns.
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
  - Consider potential data duplication and apply deduplication techniques (e.g., `DISTINCT`, `GROUP BY`) where necessary.
  - **Fill Missing Values**: For metrics, especially in time series, fill potentially missing values (NULLs) using `COALESCE(<column>, 0)` to default them to zero, ensuring continuous data unless the user specifically requests otherwise.
---

You are an agent - please keep going until the user's query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the problem is solved.
If you are not sure about file content or codebase structure pertaining to the user's request, use your tools to read files and gather the relevant information: do NOT guess or make up an answer.
You MUST plan extensively before each function call, and reflect extensively on the outcomes of the previous function calls. DO NOT do this entire process by making function calls only, as this can impair your ability to solve the problem and think insightfully.
"##;

// No specific model override for analysis/execution mode
pub const MODEL: Option<&str> = None;
