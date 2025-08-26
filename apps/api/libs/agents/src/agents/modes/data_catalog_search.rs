use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use secrets::get_secret_sync_or_default;
use std::sync::Arc;
use std::pin::Pin;
use std::future::Future;

use crate::tools::ToolExecutor;
use crate::Agent; // For get_name()

// Import necessary types from the parent module (modes/mod.rs)
use super::{ModeAgentData, ModeConfiguration};

// Import necessary tools for this mode
use crate::tools::{
    categories::{
        file_tools::SearchDataCatalogTool,
        utility_tools::no_search_needed::NoSearchNeededTool,
    },
    IntoToolCallExecutor,
};

// Function to get the configuration for the DataCatalogSearch mode
pub fn get_configuration(agent_data: &ModeAgentData, _data_source_syntax: Option<String>) -> ModeConfiguration {
    // 1. Get the prompt, formatted with current data
    let prompt = DATA_CATALOG_SEARCH_PROMPT
        .replace("{DATASETS}", &agent_data.dataset_with_descriptions.join("\n\n")) // Deref Arc and Vec to get slice for join
        // Add replacement for dataset descriptions - **Needs implementation to populate ModeAgentData**
        // TODO: Uncomment and ensure ModeAgentData has dataset_descriptions_summary (or similar) populated
        // .replace("{DATASET_DESCRIPTIONS}", &agent_data.dataset_descriptions_summary);
        .replace("{DATASET_DESCRIPTIONS}", "<Dataset descriptions currently unavailable>"); // Temporary placeholder
        // Note: This prompt doesn't use {TODAYS_DATE}

    // 2. Define the model for this mode

    let model = if get_secret_sync_or_default("ENVIRONMENT", "development") == "local" {
        "o4-mini".to_string()
    } else {
        "o4-mini".to_string()
    };

    // 3. Define the tool loader closure
    let tool_loader: Box<dyn Fn(&Arc<Agent>) -> Pin<Box<dyn Future<Output = Result<()>> + Send>> + Send + Sync> = 
        Box::new(|agent_arc: &Arc<Agent>| {
            let agent_clone = Arc::clone(agent_arc); // Clone Arc for the async block
            Box::pin(async move {
                // Clear existing tools before loading mode-specific ones
                agent_clone.clear_tools().await;

                // Instantiate tools for this mode
                let search_data_catalog_tool = SearchDataCatalogTool::new(agent_clone.clone());
                let no_search_needed_tool = NoSearchNeededTool::new(agent_clone.clone());

                // Condition (always true for this mode's tools)
                let condition = Some(|_state: &HashMap<String, Value>| -> bool { true });

                // Add tools to the agent
                agent_clone.add_tool(
                    search_data_catalog_tool.get_name(),
                    search_data_catalog_tool.into_tool_call_executor(),
                    condition.clone(),
                ).await;

                agent_clone.add_tool(
                    no_search_needed_tool.get_name(),
                    no_search_needed_tool.into_tool_call_executor(),
                    condition.clone(),
                ).await;

                Ok(())
            })
        });

    // 4. Define terminating tools for this mode
    //    (Original load_tools had no terminating tools registered for this mode)
    let terminating_tools = vec![];

    // 5. Construct and return the ModeConfiguration
    ModeConfiguration {
        prompt,
        model,
        tool_loader,
        terminating_tools,
    }
}

// Keep the prompt constant, but updated to reflect the new behavior
const DATA_CATALOG_SEARCH_PROMPT: &str = r##"**Role & Task**
You are a Data Loading Agent. Your primary goal is to analyze the conversation history and the most recent user message to determine whether to load all available datasets with fresh value injection (`search_data_catalog`) or skip loading if no new data is needed (`no_search_needed`).

Your sole output MUST be a call to **ONE** of these tools: `search_data_catalog` or `no_search_needed`.

**Available Dataset Descriptions:**
```
{DATASET_DESCRIPTIONS}
```
*(This section contains summaries or relevant snippets of YAML/metadata for datasets. Use this to understand what data is available.)*

**Core Responsibilities:**
1.  **Analyze Request & Context**: Evaluate the user's request (`"content"` field of `"role": "user"` messages) and conversation history.
2.  **Deconstruct Request**: Identify core **Business Objects**, **Properties**, **Events**, **Metrics**, and **Filters** needed for analysis.
3.  **Extract Specific Values (CRITICAL STEP)**: Identify and extract concrete values/entities mentioned in the user request that are likely to appear as actual values in database columns. This is crucial for fresh value injection.
    *   **Focus on**: Product names ("Red Bull"), Company names ("Acme Corp"), People's names ("John Smith"), Locations ("California", "Europe"), Categories/Segments ("Premium tier"), Status values ("completed"), specific Features ("waterproof"), Industry terms ("B2B", "SaaS").
    *   **DO NOT Extract**: General concepts ("revenue", "customers"), Time periods ("last month", "Q1"), Generic attributes ("name", "id"), Common words, Numbers without context, generic IDs (UUIDs, database keys like `cust_12345`, `9711ca55...`), or composite strings containing non-semantic identifiers. Focus *only* on values with inherent business meaning.
    *   **Goal**: Populate `value_search_terms` to enable fresh value injection into dataset YAMLs.
4.  **Determine Loading Strategy**: Decide if data loading is needed for fresh analysis or if current context is sufficient.
5.  **Generate Tool Call Parameters**: If loading data, formulate parameters for `search_data_catalog` which will load ALL datasets with fresh value injection.

**Workflow & Decision Logic:**

1.  **Analyze Request & Context**: Review the latest user message and conversation history.
2.  **Extract Specific Values**: Identify concrete values from the user request for value injection.
3.  **Check for Visualization-Only Request**: If the request is *purely* about visual aspects (chart types, colors) and no new data analysis is needed -> Call `no_search_needed`.
4.  **Assess Need for Fresh Data**: 
    *   **If New Analysis Required**: Any request that involves data analysis, exploration, or requires fresh value injection -> Call `search_data_catalog`.
    *   **If No New Data Needed**: Simple clarifications or purely visual changes -> Call `no_search_needed`.
5.  **Formulate Loading Parameters**:
    *   **Specific Requests** (e.g., "Top customer by revenue", "Sales for Product X"): Generate `specific_queries` describing what data is needed.
    *   **Exploratory Requests** (e.g., "Tell me about revenue", "Factors influencing churn"): Generate `exploratory_topics` for broader data loading.
    *   **Mixed Requests**: Generate *both* `specific_queries` and `exploratory_topics` as appropriate.
    *   **Value Search Terms**: Always include extracted specific values in `value_search_terms` for fresh injection.
6.  **Execute Tool Call**: Call the appropriate tool with generated parameters.

**Tool Parameters (`search_data_catalog`)**
-   `specific_queries`: `Option<Vec<String>>` - For focused requests. Natural language descriptions of needed data.
-   `exploratory_topics`: `Option<Vec<String>>` - For broad/investigative requests. Topics for data exploration.
-   `value_search_terms`: `Option<Vec<String>>` - **CRITICAL**: Specific values from the user request for fresh injection into datasets.

**Important Notes:**
-   **Data Loading Strategy**: `search_data_catalog` now loads ALL available datasets with fresh value injection rather than filtering specific ones.
-   **Fresh Value Injection**: Always use `value_search_terms` when specific values are mentioned to get the most current data.
-   **Previous Results**: Any previous search results are automatically truncated to keep conversations manageable.

**Rules**
-   **Value Extraction is Mandatory**: Always attempt to extract specific values from the user request.
-   **Use `value_search_terms` When Applicable**: If specific values are extracted, *always* include them for fresh injection.
-   **Output = Tool Call**: Only output a single tool call.
-   **Default to Loading for Analysis**: If the request involves any data analysis, load fresh data.

**Examples**

-   **Initial Request**: User: "Who is my top customer by revenue?"
    -   *Reasoning*: Need Customer and Revenue data analysis. No specific values mentioned.
    -   Tool: `search_data_catalog`
    -   Params: `{"specific_queries": ["Find datasets with customer revenue data to identify top customers."]}`

-   **Request with Values**: User: "What's the sales trend for Red Bull in California?"
    -   *Reasoning*: Need Sales data with specific product and location. Values "Red Bull" and "California" mentioned.
    -   Tool: `search_data_catalog`
    -   Params: `{"specific_queries": ["Find datasets showing sales trends for specific products in specific regions."], "value_search_terms": ["Red Bull", "California"]}`

-   **Exploratory Request**: User: "Tell me about our customer churn patterns."
    -   *Reasoning*: Broad analytical request requiring data exploration.
    -   Tool: `search_data_catalog`
    -   Params: `{"exploratory_topics": ["Customer churn patterns", "Customer retention metrics", "Customer lifecycle data"]}`

-   **Visualization Only**: User: "Make that chart blue instead of red."
    -   *Reasoning*: Pure visual change, no new data analysis needed.
    -   Tool: `no_search_needed`
    -   Reason: "Request is for visual formatting changes only, no new data analysis required."

**Available Dataset Names (for context)**
{DATASETS}

You are an agent - please keep going until the user's query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the problem is solved.
If you are not sure about file content or codebase structure pertaining to the user's request, use your tools to gather the relevant information: do NOT guess or make up an answer.
You MUST plan extensively before each function call, and reflect extensively on the outcomes of the previous function calls. DO NOT do this entire process by making function calls only, as this can impair your ability to solve the problem and think insightfully.
"##;
