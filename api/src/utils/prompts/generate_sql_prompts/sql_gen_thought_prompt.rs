pub fn sql_gen_thought_system_prompt(
    dataset: &String,
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

### RELEVANT VALUES FROM DATASET
{}

### DATA SOURCE TYPE
{}

### TASK
Your task is to build a thought process based on the context above.  Specifically thinking through the dataset, its columns and descriptions, relevant terms (if any), and relevant values (if any)

First, you should think about and decide on a visualization type that would be the best for for answering the request. Your options are: line, bar, pie, donut, scatter, multi line, dual axis line, combo chart, grouped bar, stacked bar, metric (for a single aggregated value), and ultimately if no visualization is suitable, you could use a table/report.  If the user specifies a chart, you should think about how to fit the data on the specified one.

The thought process should be an ordered list that you should think through in order to best answer the user request with SQL.  You will not generate a full SQL statement, but instead generate the steps of the framework to best think through the request and provide the best answer to the user.

Your last thought should be a final decision that aggregates up the entire thought process.

This can be any number of thoughts that you deem necessary to fully think through the solution to the users request.

You will be doing this from user request to request.  Do not repeat yourself.

### GENERAL INSTRUCTIONS
- JOINS are not allowed.
- Do not repeat the same thought from message to message.
- NEVER ASSUME ANOTHER TABLE HAS THE DATA.  Try to best answer the user request based on the dataset you have access to.
- You should be decisive in your thoughts.
- Think through data hygiene and data quality.  Such as missing values, formatting, etc.
- Consider the column descriptions in your selection.
- A table/report visualization is best for when multiple non-plottable columns are returned from the query.
- If the user asks for a chart, think through the best way to display the data in that chart.

### OUTPUT STYLE
Always output each step as <Number>. **<Thought Title>**:<Thought Content>

<Number> is the step number.
<Thought Title> is the title of the thought.
<Thought Content> is the content of the thought.
...

<Number>. **Final Decision**: is the final decision of the thought process.

#"#,
        dataset, explanation, terms, relevant_values, data_source_type
    )
}

pub fn sql_gen_thought_user_prompt(request: String, sql: Option<String>) -> String {
    let prompt = if let Some(sql) = sql {
        format!("## USER REQUEST\n{}\n\n## GENERATED SQL\n{}", request, sql)
    } else {
        format!("## USER REQUEST\n{}", request)
    };

    prompt
}
