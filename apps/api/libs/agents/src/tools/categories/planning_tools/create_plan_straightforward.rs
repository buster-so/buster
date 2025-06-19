use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use tracing::warn;

use super::helpers::generate_todos_from_plan;
use crate::{agent::Agent, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlanStraightforwardOutput {
    pub success: bool,
    pub todos: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlanStraightforwardInput {
    plan: String,
}

pub struct CreatePlanStraightforward {
    agent: Arc<Agent>,
}

impl CreatePlanStraightforward {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for CreatePlanStraightforward {
    type Output = CreatePlanStraightforwardOutput;
    type Params = CreatePlanStraightforwardInput;

    fn get_name(&self) -> String {
        "create_plan_straightforward".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        self.agent
            .set_state_value(String::from("plan_available"), Value::Bool(true))
            .await;

        let mut todos_string = String::new();

        match generate_todos_from_plan(
            &params.plan,
            self.agent.get_user_id(),
            self.agent.get_session_id(),
        )
        .await
        {
            Ok(todos_state_objects) => {
                let formatted_todos: Vec<String> = todos_state_objects
                    .iter()
                    .filter_map(|val| val.as_object())
                    .filter_map(|obj| obj.get("todo"))
                    .filter_map(|todo_val| todo_val.as_str())
                    .map(|todo_str| format!("[ ] {}", todo_str))
                    .collect();
                todos_string = formatted_todos.join("\n");

                self.agent
                    .set_state_value(String::from("todos"), Value::Array(todos_state_objects))
                    .await;
            }
            Err(e) => {
                warn!(
                    "Failed to generate todos from plan using LLM: {}. Proceeding without todos.",
                    e
                );
                self.agent
                    .set_state_value(String::from("todos"), Value::Array(vec![]))
                    .await;
            }
        }

        Ok(CreatePlanStraightforwardOutput { success: true, todos: todos_string })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": get_create_plan_straightforward_description().await,
            "strict": true,
            "parameters": {
                "type": "object",
                "required": [
                    "plan"
                ],
                "properties": {
                    "plan": {
                        "type": "string",
                        "description": get_plan_straightforward_description().await
                    }
                },
                "additionalProperties": false
            }
        })
    }
}

async fn get_create_plan_straightforward_description() -> String {
    // TODO: Integrate Braintrust prompt fetching if needed
    // if env::var("USE_BRAINTRUST_PROMPTS").is_ok() {
    //     let client = BraintrustClient::new(None, "BRAINTRUST_API_KEY").unwrap();
    //     match get_prompt_system_message(&client, "YOUR_PROMPT_ID").await {
    //         Ok(message) => return message,
    //         Err(e) => eprintln!("Failed to get prompt system message: {}", e),
    //     }
    // }
    "Use to create a a plan for an analytical workflow.".to_string()
}

async fn get_plan_straightforward_description() -> String {
    // TODO: Integrate Braintrust prompt fetching if needed
    // if env::var("USE_BRAINTRUST_PROMPTS").is_ok() {
    //     let client = BraintrustClient::new(None, "BRAINTRUST_API_KEY").unwrap();
    //     match get_prompt_system_message(&client, "YOUR_PROMPT_ID").await {
    //         Ok(message) => return message,
    //         Err(e) => eprintln!("Failed to get prompt system message: {}", e),
    //     }
    // }
    PLAN_STRAIGHTFORWARD_TEMPLATE.to_string()
}

const PLAN_STRAIGHTFORWARD_TEMPLATE: &str = r##"

Use this template to create a clear and actionable plan tailored to the user's request.
Ensure the final plan output is well-formatted with markdown for readability.

**Thought**  
Analyze the user's request **and the conversation history**. Outline your approach. Keep it simple. Use a clear, direct style to communicate your thoughts in a simple and natural tone. Consider the goal, the types of visualizations needed, the specific datasets that will be used, **and how this relates to previous interactions**. For broad or summary requests (e.g., "summarize sales"), plan to create lots of visualizations (8-12 total) to provide a comprehensive view of the data. **If this is a follow-up, explain how you are incorporating previous context or modifying the prior plan/results.**

**Step-by-Step Plan**  
*Outline actionable steps. If modifying a previous plan, clearly indicate which steps are being changed or added.* 
1. **Create [number] visualization(s)** (or **Modify existing visualization(s)** or **Add [number] visualization(s)**):
   - **Title**: [Simple title for the visualization]
   - **Type**: [e.g., Bar Chart, Line Chart, Number Card, Grouped Bar Chart, Stacked Bar Chart, Multi-Line Chart, etc.]
   - **Datasets**: [Relevant datasets]
   - **Expected Output**: [Describe the visualization, e.g., axes and key elements. For grouped/stacked bars or multi-line charts, explicitly state the grouping/stacking/splitting method and the field used. See guidelines below.]
   - [Repeat for each visualization if multiple]
2. **[(Optional) Create dashboard]** (or **[(Optional) Update dashboard]**):  
   If creating multiple visualizations, specify how they should be organized into a dashboard (e.g., title, layout) or how an existing one should be updated.
3. **Review & Finish**:  
   Verify that visualizations display data correctly (e.g., no empty results, correct timeframes) and meet the user's request, **considering the full conversation context**. Adjust the plan if needed.

**Notes** (Optional)  
Add context like assumptions, limitations, or acknowledge unsupported aspects of the user request. **Reference any necessary context from previous turns.**

---

#### Guidelines
- **Handling Follow-ups**: When the user asks a follow-up question:
    - **Modify Existing Assets**: If the request is to change an existing visualization (e.g., change timeframe, add filter), the step should be "**Modify existing visualization(s)**" and describe the changes.
    - **Add to Existing Assets**: If the request adds related analysis, use "**Add [number] visualization(s)**" and potentially "**Update dashboard**".
    - **Leverage Context**: Use the existing data context and plan structure where possible.
    - **Acknowledge**: Briefly note in the `Thought` section how the follow-up is being handled.
- **Visualizations**: Describe what the visualization should show (e.g., "a bar chart with months on the x-axis and sales on the y-axis"). Avoid SQL or technical details. Do not define names for axes labels, just state what data should go on each axis.
   - **For Grouped/Stacked Bars**: Explicitly state if it's a `grouped bar chart` or `stacked bar chart` (or `100% stacked`). Clearly name the field used for splitting/stacking (e.g., "grouped bars side-by-side split by `[field_name]`", "bars stacked by `[field_name]`").
   - **For Multi-Line Charts**: Explicitly state it's a `multi-line chart`. Describe *how* the multiple lines are generated: either by splitting a single metric using a category field (e.g., "split into separate lines by `[field_name]`") OR by plotting multiple distinct metrics (e.g., "plotting separate lines for `[metric1]` and `[metric2]`").
   - **For Combo Charts**: Describe which fields are on which Y-axis and their corresponding chart type (line or bar).
- **Dashboard Requirement**: If the plan involves creating more than one visualization, these **must** be compiled into a dashboard. Unless the user explicitly requests the metrics only.
- **Create Visualizations in One Step**: All visualizations should be created in a single, bulk step (typically the first step) titled "Create [specify the number] visualizations".
- **Modify Visualizations in One Step**: Similarly, if the user requests modifications to multiple existing visualizations in a single turn, group all these modifications under one "**Modify existing visualization(s)**" step.
- **Broad Requests**: For broad or summary requests (e.g., "summarize assembly line performance", "show me important stuff", "how is the sales team doing?"), you must create at least 8 visualizations to ensure a comprehensive overview. Creating fewer than five visualizations is inadequate for such requests. Aim for 8-12 visualizations to cover various aspects of the data, such as sales trends, order metrics, customer behavior, or product performance, depending on the available datasets. Include lots of trends (time-series data), groupings, segments, etc. This ensures the user receives a thorough view of the requested information.
- **Review**: Always include a review step to ensure accuracy and relevance.
- **Referencing SQL:** Do not include any specific SQL statements with your plan. The details of the SQL statement will be decided during the workflow. When outlining visualizations, only refer to the visualization title, type, datasets, and expected output.
- **Use Names instead of IDs**: When visualizations or tables include things like people, customers, vendors, products, categories, etc, you should display names instead of IDs (if names are included in the available datasets). IDs are not meaningful to users. For people, you should combine first and last names if they are available. State this clearly in the `Expected Output` (e.g., "...split into separate lines by sales rep full names").
- **Default to Top 10**: If the user requests the "top", "best", etc of any entity (e.g., products, regions, employees) without specifying a number, default to showing the top 10 in the visualization.
- **Default Time Range**: If the user does not specify a time range for a visualization, default to the last 12 months.
- **Visual Modifications**: If the user requests visual changes (e.g., "make charts green"), describe the *intended change* (e.g., "Modify chart color to green") rather than specifying technical details or parameter names.
- **Include Specified Filters in Titles**: When a user requests specific filters (e.g., specific individuals, teams, regions, or time periods), incorporate those filters directly into the titles of visualizations or dashboards to reflect the filtered context. Ensure titles remain concise while clearly reflecting the specified filters. Examples:
  - **Initial Request:** "Show me monthly sales for Doug Smith."  
    - Title: *Monthly Sales for Doug Smith*  
      *(Only the metric and Doug Smith filter are included at this stage.)*
  - **Follow-up Request:** "Only show his online sales."  
    - Updated Title: *Monthly Online Sales for Doug Smith*  
      *(Now reflects the cumulative state: monthly sales + Doug Smith + online only.)*
  - **Modify Dashboard Request:** "Change the Sales Overview dashboard to only show sales from the northwest team." 
    - **Dashboard Title:** *Sales Overview, Northwest Team*  
    - **Visualization Titles:** *[Metric Name] for Northwest Team* (e.g., *Total Sales for Northwest Team*)  
      *(The dashboard and its visualizations now reflect the northwest team filter applied to the entire context.)*
  - **Time-Specific Request:** "Show Q1 2023 data only."  
    - **Dashboard Title:** *Sales Overview, Northwest Team, Q1 2023*  
    - **Visualization Titles:**  
      - *Total Sales for Northwest Team, Q1 2023*  
      *(Titles now include the time filter layered onto the existing state.)*

---

#### Examples

**Example 1: Single Visualization**  
*User Request*: "Show me our total new customers per month over the last year with a bar chart."  

```
**Thought**: 
The user wants a bar chart showing total new customers per month over the last year. I'll use the `sem.entity_customer` dataset. I'll calculate "new customers" as those with their first purchase in each month. The time frame is the past 12 months, with months on the x-axis and customer counts on the y-axis.

**Step-by-Step Plan**:  
1. **Create 1 Visualization**:  
    - **Title**: "Monthly New Customers"  
    - **Type**: Bar Chart  
    - **Datasets**: `sem.entity_customer`  
    - **Expected Output**: A bar chart with the last 12 months on the x-axis and the count of new customers on the y-axis.
2. **Review & Finish**:  
    - Confirm non-empty results and accurate counts. Respond to the user.
```

---

**Example 2: Multiple Visualizations with Dashboard**  
*User Request*: "Build a dashboard with monthly sales, total sales, and monthly sales by sales rep for the last 12 months."  

```
**Thought**: 
The user wants a dashboard with three specific visualizations to see sales performance over the last 12 months (monthly sales, total sales, and monthly sales by sales rep). I'll use the `sales_data` dataset to create a line chart for monthly sales, a number card for total sales, and a multi-line line chart for sales by rep.

**Step-by-Step Plan**:  
1. **Create 3 Visualizations**:  
   - **Title**: Monthly Sales  
     - **Type**: Line Chart  
     - **Datasets**: `sales_data`  
     - **Expected Output**: A line chart with the last 12 months on the x-axis and total sales amounts on the y-axis.
   - **Title**: Total Sales  
     - **Type**: Number Card  
     - **Datasets**: `sales_data`  
     - **Expected Output**: A single-value card showing cumulative sales from the last 12 months, formatted as currency.
   - **Title**: Monthly Sales by Sales Rep  
     - **Type**: Multi-Line Chart  
     - **Datasets**: `sales_data`  
     - **Expected Output**: A multi-line chart with the last 12 months on the x-axis and sales amounts on the y-axis, split into separate lines by sales rep full names.
2. **Create Dashboard**:  
   - Title: "Sales Performance"  
   - Add all three visualizations.
3. **Review & Finish**:  
   - Ensure no empty results and correct segmentation. Respond to the user.
```

---

**Example 3: Broad Request**  
*User Request*: "Summarize our product performance."  

```
**Thought**:  
The user is asking for a summary of product performance. This is an ambiguous, overview request. I'll create 9 robust visualizations to summarize product performance comprehensively, covering revenue, sales volume, profitability, etc., using datasets like `entity_transaction_history` and `entity_product`. I'll focus on the last 12 months.

**Step-by-Step Plan**:  
1. **Create 9 Visualizations**:  
   - **Title**: Monthly Revenue Trend  
     - **Type**: Line Chart  
     - **Datasets**: `entity_transaction_history`  
     - **Expected Output**: A line chart with months on the x-axis and total revenue on the y-axis for the last 12 months.
   - **Title**: Revenue and Units Sold by Product Category  
     - **Type**: Bar Chart  
     - **Datasets**: `entity_transaction_history`, `entity_product`  
     - **Expected Output**: A bar chart with product categories on the x-axis and bars for revenue and units sold.
   - **Title**: Profit Margin by Product Category  
     - **Type**: Bar Chart  
     - **Datasets**: `entity_transaction_history`, `entity_product`, `entity_inventory`  
     - **Expected Output**: A bar chart with product category names on the x-axis and profit margin percentage on the y-axis.
   - **Title**: Top 10 Products by Revenue  
     - **Type**: Bar Chart  
     - **Datasets**: `entity_transaction_history`, `entity_product`  
     - **Expected Output**: A bar chart with product names on the x-axis and revenue on the y-axis, showing only the top 10 products.
   - **Title**: New vs. Returning Customers by Product Category  
     - **Type**: Stacked Bar Chart  
     - **Datasets**: `entity_transaction_history`, `entity_customer`, `entity_product`  
     - **Expected Output**: A stacked bar chart with product category names on the x-axis and revenue percentage on the y-axis, with bars stacked by customer type (New/Returning).
   - **Title**: Revenue by Sales Channel, Stacked by Product Category  
     - **Type**: Stacked Bar Chart  
     - **Datasets**: `entity_transaction_history`, `entity_product`, `entity_sales_channel`  
     - **Expected Output**: A stacked bar chart with sales channel names on the x-axis and revenue on the y-axis, with bars stacked by product category names.
   - **Title**: Revenue Trend by Product Category  
     - **Type**: Multi-Line Chart  
     - **Datasets**: `entity_transaction_history`, `entity_product`  
     - **Expected Output**: A multi-line chart with months on the x-axis and revenue on the y-axis, split into separate lines by product category names.
   - **Title**: Percentage Change in Revenue by Product Category  
     - **Type**: Bar Chart  
     - **Datasets**: `entity_transaction_history`, `entity_product`  
     - **Expected Output**: A bar chart with product category names on the x-axis and percentage change in revenue on the y-axis.
   - **Title**: Average Customer Satisfaction by Product Category  
     - **Type**: Bar Chart  
     - **Datasets**: `entity_customer_feedback`, `entity_product`  
     - **Expected Output**: A bar chart with product category names on the x-axis and average satisfaction scores on the y-axis.
2. **Create Dashboard**:  
   - Title: "Product Performance Summary"  
   - Add all visualizations.
3. **Review & Finish**:  
   - Verify data for the last 12 months and respond to the user.

**Notes**:  
- The request was vague; clarify if other metrics are needed.
```
"##;
