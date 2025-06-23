use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use tracing::warn;

use super::helpers::generate_todos_from_plan;
use crate::{agent::Agent, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlanInvestigativeOutput {
    pub success: bool,
    pub todos: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlanInvestigativeInput {
    plan: String,
}

pub struct CreatePlanInvestigative {
    agent: Arc<Agent>,
}

impl CreatePlanInvestigative {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for CreatePlanInvestigative {
    type Output = CreatePlanInvestigativeOutput;
    type Params = CreatePlanInvestigativeInput;

    fn get_name(&self) -> String {
        "create_plan_investigative".to_string()
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

        Ok(CreatePlanInvestigativeOutput {
            success: true,
            todos: todos_string,
        })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": get_create_plan_investigative_description().await,
            "strict": true,
            "parameters": {
                "type": "object",
                "required": [
                    "plan"
                ],
                "properties": {
                    "plan": {
                        "type": "string",
                        "description": get_plan_investigative_description().await
                    }
                },
                "additionalProperties": false
            }
        })
    }
}

async fn get_create_plan_investigative_description() -> String {
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

async fn get_plan_investigative_description() -> String {
    // TODO: Integrate Braintrust prompt fetching if needed
    // if env::var("USE_BRAINTRUST_PROMPTS").is_ok() {
    //     let client = BraintrustClient::new(None, "BRAINTRUST_API_KEY").unwrap();
    //     match get_prompt_system_message(&client, "YOUR_PROMPT_ID").await {
    //         Ok(message) => return message,
    //         Err(e) => eprintln!("Failed to get prompt system message: {}", e),
    //     }
    // }
    PLAN_INVESTIGATIVE_TEMPLATE.to_string()
}

const PLAN_INVESTIGATIVE_TEMPLATE: &str = r##"
Use this template to create a clear and actionable plan for investigative data requests using SQL.
Ensure the final plan output is well-formatted with markdown for readability.

**Thought**
Analyze the user's request **and the conversation history**. Outline your approach. Keep it simple. Use a clear, direct style to communicate your thoughts in a simple and natural tone. Consider the goal, the types of visualizations needed, the specific datasets that will be used, **and how this request relates to previous interactions**. You should aim to create lots of visualizations (more than 8) to assess which ones return valuable information, and then compile a dashboard. **If this is a follow-up, explain how you are incorporating previous context or modifying the prior plan/results.**

**Step-by-Step Plan**
*Outline actionable steps. If modifying a previous plan, clearly indicate which steps are being changed or added.* 
1. **Create [number] visualization(s)** (or **Modify existing visualization(s)** or **Add [number] visualization(s)**):
   - **Title**: [Simple title for the visualization]
     - **Type**: [e.g., Bar Chart, Line Chart, Number Card, Grouped Bar Chart, Stacked Bar Chart, Multi-Line Chart, etc.]
     - **Datasets**: [Relevant datasets]
     - **Expected Output**: [Describe the visualization, e.g., axes and key elements. For grouped/stacked bars or multi-line charts, explicitly state the grouping/stacking/splitting method and the field used. See guidelines below.]
   - [Repeat for each visualization]

2. **Create dashboard** (or **Update dashboard**):
   - Compile the visualizations into a dashboard (or update the existing one).
   - Do not include visualizations that didn't return any records/data.

3. **Review & Finish**:
   - Verify that the analysis, visualizations, and dashboard accurately represent the data and provide the required insights, **considering the full conversation context**.
   - Adjust the plan if necessary based on the review.

**Notes** (Optional)
Add any assumptions, limitations, or clarifications about the analysis and findings. **Reference any necessary context from previous turns.**

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
- **Review**: Always include a review step to ensure accuracy and relevance.
- **Referencing SQL:** Do not include any specific SQL statements with your plan. The details of the SQL statement will be decided during the workflow. When outlining visualizations, only refer to the visualization title, type, datasets, and expected output.
- **Use Names instead of IDs**: When visualizations or tables include things like people, customers, vendors, products, categories, etc, you should display names instead of IDs (if names are included in the available datasets). IDs are not meaningful to users. For people, you should combine first and last names if they are available. State this clearly in the `Expected Output` (e.g., "...split into separate lines by sales rep full names").
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

#### Example

*User Request*: "why do we have such high employee turnover?"

```
**Thought**
[1-2 paragraphs of thoughts here]

**Step-by-Step Plan**
1. **Create 11 Visualizations**
   - **Title:** Turnover Rate Over Time
     - **Type:** Line Chart
     - **Datasets:** turnover_data, employee_records
     - **Expected Output:** A line chart showing the overall turnover rate trend over the last 12 months, with months on the x-axis and turnover rate (percentage of employees who left) on the y-axis. This visualization helps the user identify patterns or spikes in turnover, indicating when the issue became significant or if seasonal trends contribute to the problem.
   - **Title:** Turnover by Department
     - **Type:** Bar Chart
     - **Datasets:** turnover_data, employee_records
     - **Expected Output:** A bar chart with departments on the x-axis and the number of employees who left (turnover count) on the y-axis, to identify departments with the highest turnover. This highlights which departments are most affected, allowing the user to focus efforts where turnover is most severe.
   - **Title:** Turnover Rate by Department Over Time
     - **Type:** Multi-Line Chart
     - **Datasets:** turnover_data, employee_records
     - **Expected Output:** A multi-line chart with months on the x-axis and turnover rate (percentage of employees who left) on the y-axis, split into separate lines by department name. This allows the user to compare turnover trends across departments, revealing whether issues are persistent or emerging in specific areas.
   - **Title:** Average Tenure by Department
     - **Type:** Bar Chart
     - **Datasets:** employee_records
     - **Expected Output:** A bar chart displaying the average tenure of employees by department, with departments on the x-axis and average tenure (in years or months) on the y-axis. This helps the user determine if shorter tenure correlates with higher turnover, suggesting potential issues with onboarding, engagement, or job satisfaction in specific departments.
   - **Title:** Satisfaction Scores vs. Turnover
     - **Type:** Scatter Plot
     - **Datasets:** satisfaction_surveys, turnover_data
     - **Expected Output:** A scatter plot where each point represents a bin of satisfaction scores, with the bin's average satisfaction score on the x-axis and the turnover rate for employees in that bin on the y-axis. This directly explores whether lower satisfaction is associated with higher turnover, helping the user confirm if satisfaction is a key driver of the issue.
   - **Title:** Turnover by Job Role
     - **Type:** Bar Chart
     - **Datasets:** turnover_data, employee_records
     - **Expected Output:** A bar chart with job roles on the x-axis and the number of employees who left (turnover count) on the y-axis, to identify job roles with the highest turnover. This reveals which roles are most affected, guiding the user in developing role-specific retention strategies.
   - **Title:** Turnover Rate by Age Group
     - **Type:** Bar Chart
     - **Datasets:** turnover_data, employee_records
     - **Expected Output:** A bar chart with age groups on the x-axis and turnover rate (percentage of employees who left) on the y-axis. This uncovers if certain age groups are more likely to leave, pointing to generational or life-stage factors influencing turnover.
   - **Title:** Turnover Rate by Performance Rating
     - **Type:** Bar Chart
     - **Datasets:** turnover_data, employee_records
     - **Expected Output:** A bar chart with performance rating categories on the x-axis and turnover rate (percentage of employees who left) on the y-axis. This helps the user determine if high or low performers are leaving at higher rates, indicating potential issues with recognition, career development, or management practices.
   - **Title:** Total Recruitment and Training Costs
     - **Type:** Number Card
     - **Datasets:** recruitment_costs, training_costs
     - **Expected Output:** A number card displaying the total costs incurred for recruitment and training due to employee turnover over the last year, summed across all departments. This highlights the financial impact of turnover, emphasizing the business case for addressing the issue and providing context for its severity.
   - **Title:** Turnover Rate and Average Satisfaction by Department
     - **Type:** Grouped Bar Chart
     - **Datasets:** turnover_data, employee_records, satisfaction_surveys
     - **Expected Output:** A grouped bar chart with departments on the x-axis, displaying turnover rate and average satisfaction score side by side for each department. This allows the user to compare these metrics directly, identifying departments where low satisfaction might be driving high turnover.
   - **Title:** Turnover by Department, Segmented by Reason for Leaving
     - **Type:** Stacked Bar Chart
     - **Datasets:** turnover_data, employee_records
     - **Expected Output:** A stacked bar chart with departments on the x-axis and turnover count on the y-axis, with bars stacked by reason for leaving (e.g., salary, growth, culture). This highlights the primary reasons employees leave within each department, directly addressing the "why" behind turnover.

2. **Create Dashboard**
   - Save all relevant visualizations to a dashboard titled: Employee Turnover Analysis
   - Do not include any visualizations that didn't return records/data.

3. **Review & Finish**
   - Verify visualizations reveal key turnover factors and patterns.
   - Review work and respond to the user.
```
"##;
