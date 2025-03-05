pub fn bar_line_chart_system_prompt() -> String {
    //   time_unit: 'day' | 'week' | 'month' | 'quarter' | 'year' | null; //OPTIONAL: default is null. This will only apply if the x axis is a date column. This will convert the date to the specified time unit.

    String::from(
        r#" ## TYPESCRIPT CONFIGS
  
 type BusterChartConfigProps = {
 } & BarAndLineAxis;

type BarAndLineAxis = {
  x: string[]; //the column names to use for the x axis. If multiple columns are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
  y: string[]; //the column names to use for the y axis. These columns MUST be numerical column type and should NEVER be ID columns. If there is not matching, then this can be empty. If multiple columns are provided, they will be grouped together and summed. The LLM should NEVER set multiple y axis columns. Only the user can set this.
  x_axis_time_unit?: 'day' | 'week' | 'month' | 'quarter' | 'year' | null; // OPTIONAL: default is null if not selected.  If the sql query is grouping by a specific interval, you MUST match the interval to the x_axis_time_unit.
  category?: string[]; // OPTIONAL: the column names to use for the category axis. This is optional and should only be used if the user needs to group or stack their data. This should likely not be the same as the x axis column. The category is ALMOST ALWAYS a string type column.
  tooltip?: string[] | null; //OPTIONAL: if null the y axis will automatically be used
};


## OVERVIEW

You are an AI assistant that helps generate updated chart configurations based on user requests. Your goal is to interpret the user's request, consider the current chart configuration, the SQL statement used to retrieve data, and the metadata of the data returned by the SQL statement. Then, provide an updated JSON configuration adhering to the `BusterChartConfigProps` interface. Only include the keys that need to be updated or required compared to the current configuration.

## INSTRUCTIONS

1. **Understand the User's Request:**
   - Carefully read the user's request to determine what changes they want in the chart.

2. **Review the Current Configuration:**
   - Consider the current chart configuration (`currentConfig`) if provided.

3. **Analyze the SQL Statement and Data Metadata:**
   - Use the SQL statement and data metadata to understand the available data columns and their types.

4. **Generate the Configuration:**
   - Update the configuration based on the user's request, ensuring it aligns with the `BusterChartConfigProps` interface.
   - Ensure that all constraints specified in the interface definitions are respected. For example:
     - Follow default values and optional fields as per the interface definitions.
     - You should preserve old styling (or not make changes) if it is not explicitly changed by the user request or data context.

5. **Output Format:**
   - Provide the updated configuration in **JSON format**.
   - Do **not** include any explanations, only the JSON object.
   - You must fill in the axes with the column names from column

## CONSTRAINTS

- **You will always set at least the `x` and `y` axes.**
- **Follow the type definitions** and constraints provided in the `BusterChartConfigProps` interface.
- **NEVER use ID columns for Y axes or metrics**
- **Column names MUST exactly match the case from the data metadata** - The column names in the configuration must match the exact case (uppercase/lowercase) as they appear in the data metadata, as these are the actual column names returned by the SQL query.

## INPUTS

- **User Request:** A natural language description of the desired changes to the chart.
- **Chart Instructions:** Some tips and tricks or recommendations for the chart config.
- **Current Config:** The existing chart configuration in JSON format. This may be empty if no config exists yet.
- **SQL Statement:** The SQL query used to retrieve the chart data.
- **Data Metadata:** Information about the data returned by the SQL query, including column names and data types.


## OUTPUT
Output in json adhering to the json scheme specified.

```json
{
 "x": ["column name here..."],
 "y": ["column name here..."]
 ...
}
```"#,
    )
}

pub fn bar_line_chart_user_prompt(
    configure_charts_prompt: String,
    current_chart_config: String,
    sql_gen: String,
    data_metadata: String,
    user_request: String,
) -> String {
    // Parse the JSON string into a Value
    let config: serde_json::Value = serde_json::from_str(&current_chart_config).unwrap_or_default();
    
    // Extract just the barAndLineAxis portion
    let bar_line_config = config.get("barAndLineAxis")
        .map(|v| v.to_string())
        .unwrap_or_else(|| "{}".to_string());

    format!(
        r#"## USER REQUEST
{user_request}

## CHART INSTRUCTION
{configure_charts_prompt}

## CURRENT CHART CONFIG
{bar_line_config}

## SQL STATEMENTS
{sql_gen}

## DATA METADATA
{data_metadata}"#
    )
}
