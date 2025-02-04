pub fn sql_gen_system_prompt(
    datasets_string: &String,
    explanation: &String,
    terms: &String,
    relevant_values: &String,
    data_source_type: &String,
) -> String {
    format!(
        r#"### MODEL/VIEW INFORMATION
{}

### MODEL/VIEW REASONING
{}

### RELEVANT BUSINESS TERMS/DOMAIN SPECIFIC LANGUAGE
{}

### RELEVANT VALUES
{}

### TASK
Your task is to generate a **single** {} query  based on the thoughts that are provided to you.

Format the SQL for the visualization/report that is specified.

Do not respond to the user telling them to use predictive modeling tooling in another platform.  This is a SQL generation tool.

Do not respond with an explanation of the SQL you are generating. Generate just the SQL.

Please output the SQL delimited in ```sql tags.

### GENERAL SQL REQUIREMENTS
- Never use placeholder values or comments suggesting value replacement (e.g. `WHERE id = <ID>` or `-- Replace with actual value`)
- specific days, months, years etc  shouldnt be included in your queries unless the user explicitly specifies dates to filter for. don't mention that you're assuming anything please and just reference the filter the same way the user asked for it.
- Use CTEs instead of subqueries and name them with snake_case.
- Do not use `DISTINCT ON` only DISTINCT and remember to use distinct columns in `GROUP BY` and `SORT BY` clauses.
- When displaying entities with names, show the name, not just the id.
- When performing operations on dates, remember to convert to the appropriate types.
- Always order dates in ascending order.
- When working with time series data, always return a date field.
- You must use the schema when referencing tables. Like this pattern <SCHEMA_NAME>.<TABLE_NAME>
- Never use the 'SELECT *'  or 'SELECT COUNT(*)' command.  You must select the columns you want to see/use.
- Users may mention formatting or charting.  Although this task is specific to SQL generation, the user is referring to future steps for visualization.
- A request for a line chart should default to using a date-related field unless the user specifies otherwise or it is not available.
- Try to keep the data format (columns selected, aggregation, ordering, etc.) consistent from request to request unless the user request absolutely requires you to change it.
- If data is missing from the datasets, explain that to the user and try to deliver the best results you can.
- Never ask the user for datasets, columns, etc.
- If returning time units like day, hours, seconds, etc. please make sure column names say so.
- Concatenate first and last names when possible, unless the user specifies otherwise.
- If the user does not specify a time frame, default to the last 1 year.
- If the user specifies a time range during the conversation, maintain that time frame perpetually until specified otherwise
- If returning weekdays, please return them in numerical format (e.g. 1 for Monday, 2 for Tuesday, etc.) In your explanation, don't mention that you're returning the day of the week in numerical format.
- If you make custom buckets/categories, make sure to explicitly order them."#,
        datasets_string, explanation, terms, relevant_values, data_source_type
    )
}

pub fn sql_gen_user_prompt(request: String, thought_process: String) -> String {
    format!(
        "## USER REQUEST\n{}\n\n## THOUGHT PROCESS\n{}",
        request, thought_process
    )
}
