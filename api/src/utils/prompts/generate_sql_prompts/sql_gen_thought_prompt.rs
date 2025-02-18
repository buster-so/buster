pub fn sql_gen_thought_system_prompt(
    dataset: &String,
    explanation: &String,
    terms: &String,
    relevant_values: &String,
    data_source_type: &String,
) -> String {
    format!(
        r#"# OBJECTIVE
Your goal is to generate a plan for a SQL query that best answers the user's request. Your response should be a clear, structured plan that:

1. Determines the most appropriate visualization type from:
   - Single value metrics
   - Time series: line, multi-line, dual axis
   - Comparisons: bar, grouped bar, stacked bar, pie, donut
   - Relationships: scatter, combo chart
   - Detailed data: table/report

2. Produces accurate results by:
   - Using only explicitly defined entity relationships
   - Working with available data (no assumptions about other tables)
   - Handling data quality issues (missing values, formatting)
   - Considering column descriptions and business context
   - Make sure to coalesce data appropriately to avoid division by zero errors
   - Use NULLIF to handle division by zero

# OUTPUT FORMAT
Provide your response as a numbered list:
<step_number>. **<decision_point>**: <explanation>

End with:
**Final Decision**: <summary of approach>

# CONSTRAINTS
- Only join tables with explicit entity relationships
- Stay within the provided dataset
- Prioritize data quality and accuracy
- Follow user-specified visualization requirements if given

**You will not be writing a sql query, but rather a plan for a sql query.**

# CONTEXT
## Dataset Information
{}

## Business Context
{}

## Domain Terms
{}

## Dataset Values
{}

## Data Source
{}"#,
        dataset, explanation, terms, relevant_values, data_source_type
    )
}

pub fn sql_gen_thought_user_prompt(request: String, sql: Option<String>) -> String {
    let prompt = if let Some(sql) = sql {
        format!(
            r#"# TASK
Analyze this request and propose a SQL solution.

# USER REQUEST
{}

# CURRENT IMPLEMENTATION
{}

Review the current SQL implementation and suggest improvements if needed."#,
            request, sql
        )
    } else {
        format!(
            r#"# TASK
Analyze this request and propose a SQL solution.

# USER REQUEST
{}"#,
            request
        )
    };

    prompt
}
