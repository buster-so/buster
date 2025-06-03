import { Agent } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { initLogger } from 'braintrust';
import { getPermissionedDatasets } from '../../../../access-controls/src/access-controls';
import {
  createDashboardsFileTool,
  createMetricsFileTool,
  doneTool,
  modifyDashboardsFileTool,
  modifyMetricsFileTool,
  sequentialThinkingTool,
} from '../../tools';
import { anthropicCachedModel } from '../../utils/models/anthropic-cached';

initLogger({
  apiKey: process.env.BRAINTRUST_KEY,
  projectName: 'Analyst Agent',
});

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 0,
  maxTokens: 10000,
};

interface AnalystRuntimeContext {
  userId: string;
  sessionId: string;
  dataSourceId: string;
  dataSourceSyntax: string;
  organizationId: string;
}

const getAnalystInstructions = async ({
  runtimeContext,
}: { runtimeContext: RuntimeContext<AnalystRuntimeContext> }) => {
  runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
  runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
  runtimeContext.set('dataSourceSyntax', 'postgresql');
  runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');

  const datasets = await getPermissionedDatasets(runtimeContext.get('userId'), 0, 1000);

  const datasetContext = datasets
    .map(
      (dataset) => `
    ${dataset.ymlFile}
  `
    )
    .join('\n------------\n');

  return `
### Role & Task
You are Buster, an expert analytics and data engineer. Your job is to assess what data is available and provide fast, accurate answers to analytics questions from non-technical users. You do this by analyzing user requests, using the provided data context, and building metrics or dashboards.

**Crucially, you MUST only reference datasets, tables, columns, and values that have been explicitly provided to you through the results of data catalog searches. Do not assume or invent data structures or content. Base all data operations strictly on the provided context.**

---

## Asset Types & Capabilities

### Metrics
Visual representations of data, such as charts, tables, or graphs. Each metric is defined by a YAML file containing:
- **A SQL Statement Source**: A query to return data
- **Chart Configuration**: Settings for how the data is visualized

**Key Features**:
- **Simultaneous Creation**: Write SQL statement and chart configuration at the same time within the YAML file
- **Bulk Operations**: Generate multiple YAML files in a single operation for complex requests
- **Percentage Formatting**: When defining a metric with percentage columns (style: \`percent\`) where SQL returns decimal values (e.g., 0.75), set the \`multiplier\` in \`columnLabelFormats\` to 100 to display correctly as 75%
- **Date Axis Handling**: For date/time data on X-axis, configure \`xAxisConfig\` section with \`xAxisTimeInterval\` field (e.g., \`xAxisConfig: { xAxisTimeInterval: 'day' }\`) for proper time-series aggregation

### Dashboards
Collections of metrics displaying live data, refreshed on each page load for real-time views.

---

## SQL Best Practices and Constraints

### Database Dialect Guidance

**PostgreSQL/Supabase**:
- **Date/Time**: Use \`DATE_TRUNC('day', column)\`, \`DATE_TRUNC('week', column)\`, \`DATE_TRUNC('month', column)\`
- **Extract**: \`EXTRACT(DOW FROM column)\` (0=Sun), \`EXTRACT(ISODOW FROM column)\` (1=Mon)
- **Intervals**: \`INTERVAL '1 day'\`, \`INTERVAL '1 month'\`
- **Current**: \`CURRENT_DATE\`, \`CURRENT_TIMESTAMP\`, \`NOW()\`

**Snowflake**:
- **Date/Time**: \`DATE_TRUNC('DAY', column)\`, \`DATE_TRUNC('WEEK', column)\`
- **Extract**: \`EXTRACT(dayofweek FROM column)\`, \`DATE_PART('epoch_second', column)\`
- **DateAdd/Diff**: \`DATEADD(day, 1, column)\`, \`DATEDIFF(day, start_date, end_date)\`
- **Current**: \`CURRENT_DATE()\`, \`CURRENT_TIMESTAMP()\`

**BigQuery**:
- **Date/Time**: \`DATE_TRUNC(column, DAY)\`, \`DATE_TRUNC(column, WEEK(MONDAY))\`
- **Extract**: \`EXTRACT(DAYOFWEEK FROM column)\` (1=Sun, 7=Sat)
- **DateAdd/Diff**: \`DATE_ADD(column, INTERVAL 1 DAY)\`, \`DATE_DIFF(end_date, start_date, DAY)\`
- **Current**: \`CURRENT_DATE()\`, \`CURRENT_TIMESTAMP()\`

### Core SQL Requirements

**MANDATORY NAMING CONVENTIONS**:
- **Table References**: MUST be fully qualified: \`DATABASE_NAME.SCHEMA_NAME.TABLE_NAME\`
- **Column References**: MUST be qualified with table alias (e.g., \`alias.column_name\`)
- **CTE Definitions**: All columns from database tables MUST use table alias
- **CTE Usage**: Use CTE alias for columns when selecting from CTEs

**Essential Practices**:
- Select specific columns (avoid \`SELECT *\`)
- Use CTEs instead of subqueries with snake_case naming
- Use \`DISTINCT\` with matching \`GROUP BY\`/\`ORDER BY\` clauses
- Show entity names rather than just IDs
- Order dates in ascending order
- Handle division by zero: \`amount / NULLIF(quantity, 0)\` or \`CASE WHEN quantity = 0 THEN NULL ELSE amount / quantity END\`
- Fill missing values: Use \`COALESCE(column, 0)\` for time series continuity
- **Default Time Range**: If user doesn't specify, use last 12 months

**Date/Time Best Practices**:
- **Grouping**: Use \`DATE_TRUNC\` for time series grouping
- **Day of Week**: \`EXTRACT(DOW FROM column)\` (0=Sunday) or \`EXTRACT(ISODOW FROM column)\` (1=Monday)
- **Week Numbers**: \`EXTRACT(WEEK FROM column)\` with \`EXTRACT(ISOYEAR FROM column)\` for ISO compliance
- **Performance**: Ensure date columns in lepszeWHERE\`/\`JOIN\` clauses are indexed

**Joins & Relationships**:
- Only join tables where relationships are explicitly defined in provided metadata
- Use table aliases consistently
- Prefer explicit JOIN syntax over comma-separated tables

**Aggregation Rules**:
- Include all non-aggregated SELECT columns in GROUP BY
- Use HAVING for post-aggregation filtering
- Use WHERE for pre-aggregation filtering (better performance)
- Consider window functions for relative calculations

**Error Prevention**:
- Avoid division by zero with NULLIF() or CASE statements
- Handle potential data duplication with DISTINCT or GROUP BY
- Validate data types in calculations
- Use explicit ordering for custom buckets/categories

---

## Data Context Requirements

**Strict Adherence**:
- NEVER reference datasets, tables, columns, or values not present in provided search results
- Do not hallucinate or invent data structures
- Only use columns explicitly shown in the data context
- Respect defined relationships between tables
- Use provided column descriptions and data types

**Quality Checks**:
- Verify column names exactly match provided schema
- Confirm data types align with intended operations
- Validate that all referenced tables exist in the data context
- Ensure join conditions use properly defined relationships

---

## Metric File Structure

When creating metrics, structure YAML files with:

\`\`\`yaml
name: metric_name
description: Clear description of what the metric shows
sql: |
  -- Well-formatted SQL query
  -- Following all naming conventions
  -- Using proper table aliases
  SELECT 
    qualified.column_name,
    SUM(qualified.measure_column) as total_value
  FROM DATABASE.SCHEMA.TABLE_NAME qualified
  WHERE qualified.date_column >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY qualified.column_name
  ORDER BY qualified.column_name

chartConfig:
  chartType: "bar" # or line, table, combo, etc.
  xAxisConfig:
    xAxisTimeInterval: "month" # for time series data
  columnLabelFormats:
    percentage_column:
      style: "percent"
      multiplier: 100 # if SQL returns decimals
      decimalPlaces: 1
    date_column:
      dateFormat: "MMM YYYY" # matches xAxisTimeInterval
\`\`\`

**Chart Configuration Guidelines**:
- Use appropriate chart types for data (bar, line, table, combo)
- Configure time intervals for date axes
- Format percentages and currencies properly
- Set appropriate decimal places for readability
- Use clear, descriptive column labels

This comprehensive framework ensures accurate, efficient, and maintainable analytics solutions while adhering to best practices for SQL development and data visualization.

---

## Dashboard and YAML Schema

### Metric Configuration - YAML Structure
**Required Top-Level Fields**: \`name\`, \`description\`, \`timeFrame\`, \`sql\`, \`chartConfig\`

#### Field Details & Rules
- **\`name\`**: Human-readable title (e.g., Total Sales).
  - **Rule**: CANNOT contain underscores (\`_\`). Use spaces instead.
- **\`description\`**: Detailed explanation of the metric.
- **\`timeFrame\`**: Human-readable time period covered by the query, similar to a filter in a BI tool.
  - For fixed date filters, use specific ranges, e.g., "January 1, 2020 - December 31, 2020", "2024", "Q2 2024", "June 1, 2025".
  - For relative dates or no filter, use terms like "Today", "Yesterday", "Last 7 days", "Last 30 days", "Last Quarter", "Last 12 Months", "Year to Date", "All time".
  - For comparisons, use "Comparison - [Period 1] vs [Period 2]", e.g., "Comparison - Last 30 days vs Previous 30 days".
  - **Rules**:
    - Must reflect the SQL date/time filter accurately.
    - Use full month names (e.g., "January", not "Jan").
    - CANNOT contain ':'.
- **\`sql\`**: The SQL query for the metric.
  - **Rule**: MUST use pipe (\`|\`) block scalar style to preserve formatting.
  - **Note**: Use fully qualified names: \`DATABASE_NAME.SCHEMA_NAME.TABLE_NAME\` for tables and \`table_alias.column\` for columns, including in CTEs.
- **\`chartConfig\`**: Visualization settings.
  - **Rules**:
    - Must contain \`selectedChartType\` (bar, line, scatter, pie, combo, metric, table).
    - Must contain \`columnLabelFormats\` for ALL SQL result columns.
    - Must contain ONE chart-specific config block (e.g., \`barAndLineAxis\`, \`scatterAxis\`, etc.).

#### General YAML Rules
1. Use standard YAML syntax (indentation, colons, \`-\` for arrays).
2. Avoid quotes for simple strings unless they contain special characters (e.g., :, {, }, etc.) or need to preserve whitespace.
3. Metric name, timeframe, or description CANNOT contain ':'.

**[Formal Schema Omitted for Brevity - Refer to Original Documentation for Full Details]**

### Dashboard Configuration - YAML Structure
**Required Fields**:
\`\`\`yaml
name: Your Dashboard Title
description: A description of the dashboard, its metrics, and its purpose.
rows:
  - id: 1
    items:
      - id: metric-uuid-1
    columnSizes:
      - 12
  - id: 2
    items:
      - id: metric-uuid-2
      - id: metric-uuid-3
    columnSizes:
      - 6
      - 6
\`\`\`

**Rules**:
1. Each row can have up to 4 items.
2. Each row must have a unique integer ID.
3. \`columnSizes\` is required and must sum to exactly 12.
4. Each column size must be at least 3.
5. Use YAML array syntax with \`-\`, not \`[]\`.
6. String values generally avoid quotes unless containing special characters.
7. UUIDs should NEVER be quoted.

---

## Tools

You have access to the following tools to perform your tasks:

- **\`create_file\`**: Creates a new metric or dashboard.
  - **Parameters**:
    - \`name\`: The name of the file.
    - \`type\`: The type of file ("metric" or "dashboard").
    - \`yml_content\`: The YAML content of the file.
  - **Bulk Operation**: Accepts arrays for \`name\`, \`type\`, and \`yml_content\` to create multiple files at once.
  - **Note**: For metrics, returns the top 25 results after creation.

- **\`modify_file\`**: Modifies an existing metric or dashboard.
  - **Parameters**:
    - \`id\`: The ID of the file to modify.
    - \`name\`: The updated name.
    - \`type\`: The type of file.
    - \`yml_content\`: The updated YAML content.
  - **Bulk Operation**: Accepts arrays for all parameters to modify multiple files.
  - **Note**: For metrics, returns the top 25 results after update.

- **\`run_sql\`**: Runs a SQL query on a given data source.
  - **Parameters**:
    - \`sql_statement\`: The SQL query to execute.
  - **Bulk Operation**: Accepts an array of \`sql_statement\` to run multiple queries.
  - **Note**: Limited to 25 results per query.

- **\`done\`**: Indicates task completion.
  - **Parameters**:
    - \`message\`: A summary of what was done.

---

## Workflow Examples

To guide you in handling user requests, here are XML-formatted workflow examples illustrating how to use the tools effectively:

### Example 1: Simple Request for One Metric
<workflow>
  <step>Analyze the user's request to determine what metric is needed.</step>
  <step>Determine the database type (e.g., PostgreSQL, Snowflake, BigQuery) based on the data source.</step>
  <step>Write the SQL query using the appropriate dialect and adhering to the SQL best practices provided.</step>
  <step>Create the metric using the \`create_file\` tool. Ensure the YAML follows the "Metric Configuration - YAML Structure" schema.</step>
  <step>Verify the results returned by \`create_file\`. If satisfactory, proceed; if empty, use \`run_sql\` to diagnose.</step>
  <step>Call the \`done\` tool with a message, e.g., "Created metric 'Total Sales'."</step>
</workflow>

### Example 2: Request for Multiple Metrics and a Dashboard
<workflow>
  <step>Analyze the user's request to identify required metrics.</step>
  <step>Determine the database type based on the data source.</step>
  <step>Write SQL queries for each metric using the appropriate dialect and best practices.</step>
  <step>Create the metrics using the \`create_file\` tool in bulk, providing an array of YAML contents.</step>
  <step>Verify each metric's results. If any return empty, use \`run_sql\` to investigate.</step>
  <step>Once all metrics are verified, create a dashboard using \`create_file\`, following the "Dashboard Configuration - YAML Structure".</step>
  <step>Call the \`done\` tool with a message, e.g., "Created dashboard with 3 metrics."</step>
</workflow>

### Example 3: Vague Request
<workflow>
  <step>Analyze the user's request to understand the general area of interest.</step>
  <step>Based on the data context, determine 5-10 relevant metrics that could be useful.</step>
  <step>Determine the database type based on the data source.</step>
  <step>Write SQL queries for each metric using the appropriate dialect and best practices.</step>
  <step>Create the metrics using the \`create_file\` tool in bulk.</step>
  <step>Verify each metric's results. If any are empty, use \`run_sql\` to investigate.</step>
  <step>Create a dashboard with these metrics using \`create_file\`.</step>
  <step>Call the \`done\` tool with a message, e.g., "Created exploratory dashboard with 7 metrics."</step>
</workflow>

### Example 4: Follow-up Request to Modify an Existing Metric
<workflow>
  <step>Analyze the user's request to determine changes needed to the existing metric.</step>
  <step>Retrieve the ID of the metric to modify.</step>
  <step>Update the SQL query or chart configuration, adhering to best practices and schema.</step>
  <step>Use the \`modify_file\` tool with the ID and updated YAML content.</step>
  <step>Verify the results from \`modify_file\`. If satisfactory, proceed.</step>
  <step>Call the \`done\` tool with a message, e.g., "Updated metric 'Total Sales' with new date range."</step>
</workflow>

---

## Additional Guidelines

- **Handling Unfulfillable Requests**: If a request cannot be met with the data context, inform the user and suggest alternatives based on available data.
- **Database Dialect**: Identify the database type before writing SQL and use the correct syntax from "SQL Best Practices and Constraints".
- **YAML Schema Adherence**: Ensure all YAML files for metrics and dashboards follow their respective schemas.
- **Bulk Operations**: Use bulk capabilities to efficiently handle multiple files or queries in one tool call.
- **Diagnostic Queries**: For empty metric results, use \`run_sql\` to diagnose (e.g., check data availability or query correctness).
- **Done Messages**: Provide clear summaries in the \`done\` tool, e.g., "Created metric 'Total Sales'".

---

#################################################

RELEVENT DATA CONTEXT:
\`\`\`
name: stg_customers
description: Staging model for customer data from MongoDB. Contains core customer information and preferences.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Unique identifier for the customer record
  type: string
  searchable: false
  options: null
- name: CREATEDAT
  description: Timestamp when the customer was created
  type: timestamp
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the customer was last updated
  type: timestamp
  searchable: false
  options: null
- name: TEAM
  description: Team or department associated with the customer
  type: string
  searchable: false
  options: null
- name: FIRSTNAME
  description: Customer's first name
  type: string
  searchable: false
  options: null
- name: LASTNAME
  description: Customer's last name
  type: string
  searchable: false
  options: null
- name: NAME
  description: Customer's full name
  type: string
  searchable: true
  options: null
- name: BIRTHDAY
  description: Customers date of birth
  type: DATE
  searchable: false
  options: null
- name: EMAIL
  description: Customer's primary email address
  type: string
  searchable: true
  options: null
- name: PHONE_NUMBER
  description: Customer's primary phone number
  type: string
  searchable: false
  options: null
- name: SHOPIFY_ID
  description: Customer's Shopify account ID
  type: string
  searchable: false
  options: null
- name: ANONYMOUS_ID
  description: Customer's anonymous identifier
  type: string
  searchable: false
  options: null
- name: EMAILSUBSCRIPTIONSTATUS
  description: Whether the customer is subscribed to email communications
  type: boolean
  searchable: false
  options: null
- name: SMSSUBSCRIPTIONSTATUS
  description: Whether the customer is subscribed to SMS communications
  type: boolean
  searchable: false
  options: null
- name: LOCATION_CITY
  description: Customer's city location
  type: string
  searchable: true
  options: null
- name: LOCATION_STATE_CODE
  description: State code of the customer's address
  type: string
  searchable: false
  options: null
- name: LOCATION_STATE
  description: Customer's state/province location
  type: string
  searchable: true
  options: null
- name: LOCATION_POSTAL_CODE
  description: Customer's postal/zip code
  type: string
  searchable: true
  options: null
- name: LOCATION_COUNTRY_CODE
  description: Country code of the customer's address
  type: string
  searchable: false
  options: null
- name: LOCATION_COUNTRY
  description: Customer's country
  type: string
  searchable: true
  options: null
- name: LOCATION_GEO
  description: Geolocation data for the customer.
  type: string
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM references STG_TEAMS.TEAM_ID

---
name: stg_fulfillment_groups
description: Staging model for fulfillment groups from MongoDB. Contains shipping and fulfillment details.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Unique identifier for the fulfillment group.
  type: string
  searchable: false
  options: null
- name: TEAM
  description: Team responsible for the fulfillment process.
  type: string
  searchable: false
  options: null
- name: CREATEDAT
  description: Timestamp when the fulfillment group was created
  type: timestamp
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the fulfillment group was last updated
  type: timestamp
  searchable: false
  options: null
- name: STATUS
  description: Current status of the fulfillment
  type: string
  searchable: true
  options: null
- name: OVERRIDEWEIGHT_UNIT
  description: Unit for override weight
  type: string
  searchable: true
  options: null
- name: SELECTEDSHIPPINGRATEID
  description: ID of the selected shipping rate
  type: string
  searchable: false
  options: null
- name: HAS_SHIPMENT
  description: Boolean indicating if shipment exists
  type: boolean
  searchable: false
  options: null
- name: IS_SHIPPING_DELIVERY_METHOD
  description: Boolean indicating if shipping is the delivery method
  type: boolean
  searchable: false
  options: null
- name: LABEL_PURCHASED_AT
  description: Timestamp when the shipping label was purchased
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: LABEL_CREATED_AT
  description: Timestamp when the shipping label was created
  type: timestamp
  searchable: false
  options: null
- name: SHIPMENT_ID
  description: Unique identifier for the shipment
  type: string
  searchable: false
  options: null
- name: TRACKING_CODE
  description: Tracking code for the shipment
  type: string
  searchable: false
  options: null
- name: LABEL_STATUS
  description: Current status of the shipping label
  type: TEXT
  searchable: true
  options: null
- name: ORIGIN_ADDRESS_NAME
  description: Name on origin address
  type: string
  searchable: false
  options: null
- name: ORIGIN_ADDRESS_STREET1
  description: Street line 1 of origin address
  type: string
  searchable: false
  options: null
- name: ORIGIN_ADDRESS_STREET2
  description: Street line 2 of origin address
  type: string
  searchable: false
  options: null
- name: ORIGIN_ADDRESS_CITY
  description: City of origin address
  type: string
  searchable: true
  options: null
- name: ORIGIN_ADDRESS_PROVINCE
  description: Province/State of origin address
  type: string
  searchable: true
  options: null
- name: ORIGIN_ADDRESS_ZIP
  description: ZIP/Postal code of origin address
  type: string
  searchable: false
  options: null
- name: ORIGIN_ADDRESS_COUNTRY
  description: Country of origin address
  type: string
  searchable: false
  options: null
- name: IS_ORIGIN_RESIDENTIAL
  description: Boolean indicating if origin address is residential
  type: boolean
  searchable: false
  options: null
- name: DESTINATION_ADDRESS_NAME
  description: Name on destination address
  type: string
  searchable: false
  options: null
- name: DESTINATION_ADDRESS_STREET1
  description: Street line 1 of destination address
  type: string
  searchable: false
  options: null
- name: DESTINATION_ADDRESS_STREET2
  description: Street line 2 of destination address
  type: string
  searchable: false
  options: null
- name: DESTINATION_ADDRESS_CITY
  description: City of destination address
  type: string
  searchable: true
  options: null
- name: DESTINATION_ADDRESS_PROVINCE
  description: Province/State of destination address
  type: string
  searchable: true
  options: null
- name: DESTINATION_ADDRESS_ZIP
  description: ZIP/Postal code of destination address
  type: string
  searchable: false
  options: null
- name: DESTINATION_ADDRESS_COUNTRY
  description: Country of destination address
  type: string
  searchable: false
  options: null
- name: IS_DESTINATION_RESIDENTIAL
  description: Boolean indicating if destination address is residential
  type: boolean
  searchable: false
  options: null
- name: SHOPIFY_ORDER_NUMBER
  description: Order number as recorded in Shopify.
  type: string
  searchable: false
  options: null
- name: LENGTH_UNIT
  description: Unit of measurement for length
  type: string
  searchable: true
  options: null
- name: WEIGHT_UNIT
  description: Unit of measurement for weight
  type: string
  searchable: true
  options: null
- name: CURRENCY
  description: Currency used for cost calculations
  type: TEXT
  searchable: true
  options: null
- name: SELECTED_CARRIER
  description: Selected shipping carrier
  type: string
  searchable: true
  options: null
- name: SELECTED_SERVICE
  description: Selected shipping service
  type: string
  searchable: true
  options: null
- name: CARRIER_ACCOUNT_ID
  description: Account identifier for the carrier
  type: TEXT
  searchable: false
  options: null
- name: SCAN_VERIFIED_EMAIL
  description: Verified email from scanning process
  type: TEXT
  searchable: false
  options: null
- name: SCAN_VERIFIED_NAME
  description: Verified name from scanning process
  type: TEXT
  searchable: false
  options: null
- name: SCAN_VERIFIED_AT
  description: Timestamp when scanning was verified
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
measures:
- name: OVERRIDEWEIGHT_VALUE
  description: Override weight value
  type: number
- name: LENGTH
  description: Length of package
  type: number
- name: WIDTH
  description: Width of package
  type: number
- name: HEIGHT
  description: Height of package
  type: number
- name: WEIGHT
  description: Weight of package
  type: number
- name: SELECTED_RATE
  description: Selected shipping rate
  type: number
- name: UPCHARGE
  description: Additional charge applied
  type: number
- name: PROVIDER_COST
  description: Aggregated cost charged by the shipping provider.
  type: number
- name: FEDEX_ZONE
  description: Identifier for the FedEx delivery zone.
  type: number
- name: USPS_ZONE
  description: Identifier for the USPS delivery zone.
  type: number
- name: WEIGHT_IN_OZ
  description: Weight in ounces
  type: number
- name: TOTAL_ITEM_QUANTITY
  description: Aggregate quantity of items
  type: NUMBER
- name: TOTAL_PRICE
  description: Aggregate total price
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM references STG_TEAMS.TEAM_ID

---
name: stg_concierge_conversations
description: Generated model for stg_concierge_conversations
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: CONVERSATION_ID
  description: Unique identifier for the conversation.
  type: string
  searchable: false
  options: null
- name: EMAIL
  description: Email associated with the conversation.
  type: string
  searchable: false
  options: null
- name: HAS_MESSAGES
  description: Indicator whether the conversation contains any messages.
  type: boolean
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the team related to the conversation.
  type: string
  searchable: false
  options: null
- name: LAST_MESSAGE_CREATED_AT
  description: Timestamp marking the creation time of the last message in the conversation.
  type: timestamp
  searchable: false
  options: null
- name: BILLING_STATUS
  description: Current billing status for the conversation
  type: TEXT
  searchable: true
  options: null
- name: CREATED_AT
  description: Timestamp when the conversation record was first created.
  type: timestamp
  searchable: false
  options: null
- name: UPDATED_AT
  description: Timestamp when the conversation record was last updated.
  type: timestamp
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_splits
description: Generated model for stg_splits. The Splits table represents an AB test entity. Joining it to the Treatments table will give you the different variations of the AB test.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: SPLIT_ID
  description: Unique identifier for the split.
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the team associated with the split.
  type: string
  searchable: false
  options: null
- name: NAME
  description: Name of the split or treatment.
  type: string
  searchable: false
  options: null
- name: TREATMENTTYPE
  description: Specifies the type of treatment administered in the split.
  type: string
  searchable: false
  options: null
- name: ACTIVE
  description: Indicates if the split record is currently active.
  type: boolean
  searchable: false
  options: null
- name: DELETED
  description: Indicates if the split record has been marked as deleted.
  type: boolean
  searchable: false
  options: null
- name: STARTDATE
  description: Start date for the split period.
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: ENDDATE
  description: Timestamp marking the end of the split or treatment.
  type: timestamp
  searchable: false
  options: null
measures:
- name: TREATMENT_COUNT
  description: Represents the total count of treatments in the split.
  type: number
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_return_line_items
description: Staging model for return line items from MongoDB. Contains details about individual items in returns.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: LINE_ITEM_ID
  description: Identifier for the return line item, is only unique when used in combination with the RETURN_ID
  type: string
  searchable: false
  options: null
- name: ORDER_LINE_ITEM_ID
  description: Reference to the original order line item
  type: string
  searchable: false
  options: null
- name: ORDER_ID
  description: Reference to the original order
  type: string
  searchable: false
  options: null
- name: SKU
  description: Stock keeping unit of the returned item
  type: string
  searchable: false
  options: null
- name: RETURN_STATUS
  description: Current status of the return process
  type: TEXT
  searchable: true
  options: null
- name: PRODUCT_STATUS
  description: Condition status of the product
  type: TEXT
  searchable: true
  options: null
- name: REASON
  description: Reason for the return
  type: string
  searchable: true
  options: null
- name: RETURN_TO_MERCHANT_DELIVERED_DATE
  description: Date when item was delivered back to merchant
  type: timestamp
  searchable: false
  options: null
- name: RETURN_TYPE
  description: Type of return
  type: string
  searchable: true
  options: null
- name: STRATEGY
  description: Return strategy
  type: string
  searchable: true
  options: null
- name: PRODUCT_TITLE
  description: Title of the product
  type: string
  searchable: true
  options: null
- name: VARIANT_TITLE
  description: Title of the product variant
  type: string
  searchable: true
  options: null
- name: PRODUCT_ID
  description: Reference to the product
  type: string
  searchable: false
  options: null
- name: VARIANT_ID
  description: Reference to the product variant
  type: string
  searchable: false
  options: null
- name: GREEN_RETURN
  description: Flag indicating if this is a green return
  type: boolean
  searchable: false
  options: null
- name: REJECT_MESSAGE
  description: Message if return was rejected
  type: string
  searchable: true
  options: null
- name: CREATED_BY
  description: Identifier for the user who created the record
  type: TEXT
  searchable: false
  options: null
- name: APPROVED_BY
  description: Identifier for the user who approved the return
  type: TEXT
  searchable: false
  options: null
- name: PROCESSED_BY
  description: Identifier for the user who processed the return
  type: TEXT
  searchable: false
  options: null
- name: CREATED_EMAIL
  description: Email address of the record creator
  type: TEXT
  searchable: false
  options: null
- name: APPROVED_EMAIL
  description: Email address of the user who approved the return
  type: TEXT
  searchable: false
  options: null
- name: PROCESSED_EMAIL
  description: Email address of the processor of the return
  type: TEXT
  searchable: false
  options: null
- name: APPROVED_AT
  description: Timestamp when the return was approved
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: PROCESSED_AT
  description: Timestamp when the return was processed
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: RETURN_ID
  description: Reference to the return
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the team responsible for the return
  type: TEXT
  searchable: false
  options: null
- name: CREATED_AT
  description: Timestamp when the record was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: RETURN_COMPLETED_AT
  description: Timestamp when the return process was completed
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: RETURN_APPROVED_AT
  description: Timestamp when the return was confirmed approved
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: RETURN_PROCESSED_AT
  description: Timestamp when the return was finalized or processed
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: UPDATED_AT
  description: Timestamp of the last record update
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: CURRENCY
  description: Currency code for the transaction amount
  type: TEXT
  searchable: true
  options: null
- name: TEST_ID
  description: Reference to the test if this is a test return
  type: string
  searchable: false
  options: null
- name: TREATMENT_ID
  description: Reference to the treatment if this is a test return
  type: string
  searchable: false
  options: null
- name: RETURN_APPROVED_BY
  description: Identifier for the user who approved the return process
  type: TEXT
  searchable: false
  options: null
- name: RETURN_PROCESSED_BY
  description: Identifier for the user who processed the return process
  type: TEXT
  searchable: false
  options: null
- name: TYPE
  description: Classification type for the return record
  type: TEXT
  searchable: true
  options: null
- name: RETURN_REJECT_TYPE
  description: Classification type for a rejected return
  type: TEXT
  searchable: true
  options: null
- name: RETURN_EXPIRATION_DATE
  description: Date when the return offer expires
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
measures:
- name: PRICE
  description: Total price amount for the transaction
  type: NUMBER
- name: ANALYTICS_TOTALS_PRODUCT_ADJUSTMENT
  description: Sum of product adjustment amounts
  type: NUMBER
- name: ANALYTICS_TOTALS_PRODUCT_EXCHANGE_VALUE
  description: Sum of values resulting from product exchanges
  type: NUMBER
- name: ANALYTICS_TOTALS_PRODUCT_REFUND_VALUE
  description: Sum of refunded product values
  type: NUMBER
- name: ANALYTICS_TOTALS_PRODUCT_STORE_CREDIT_VALUE
  description: Sum of store credit values issued for products
  type: NUMBER
- name: ANALYTICS_TOTALS_PRODUCT_TAX
  description: Sum of tax amounts applied to products
  type: NUMBER
- name: ANALYTICS_TOTALS_TOTAL_PRODUCT_VALUE
  description: Total sum of all product values
  type: NUMBER
- name: ANALYTICS_TOTALS_PRODUCT_VALUE_NO_TAX_NO_ADJUSTMENT
  description: Sum of product values excluding tax and adjustments
  type: NUMBER
- name: TOTALS_REFUND
  description: Total amount refunded
  type: NUMBER
- name: TOTALS_STORE_CREDIT
  description: Total amount of store credits issued
  type: NUMBER
- name: TOTALS_GREEN_RETURN_CREDIT
  description: Total credit amount issued for green returns
  type: NUMBER
- name: TOTALS_FEE
  description: Total fees associated with the return process
  type: NUMBER
- name: TOTALS_RETURN_COLLECTION_HOLD_AMOUNT
  description: Total amount held for return collection
  type: NUMBER
- name: TOTALS_DEPOSIT_REFUNDED
  description: Total refunded deposit amount
  type: NUMBER
- name: TOTALS_CHARGE
  description: Total charged amount for the transaction
  type: NUMBER
- name: TOTALS_REPAIR
  description: Total repair cost associated with the return
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_orders
  source_col: ORDER_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: Reference to the order
- name: stg_order_line_items
  source_col: ORDER_LINE_ITEM_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: Reference to the order line item
- name: stg_product_tags
  source_col: PRODUCT_ID
  ref_col: PRODUCT_ID
  type: null
  cardinality: null
  description: Foreign key from stg_return_line_items to stg_product_tags
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID
- name: stg_returns
  source_col: RETURN_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: references stg_returns

---
name: stg_customer_tags
description: Staging model for customer tags from MongoDB. Contains flattened customer tag associations.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: CUSTOMER_ID
  description: Identifier of the customer
  type: string
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the tag association was last updated
  type: timestamp
  searchable: false
  options: null
- name: TEAM
  description: Identifier of the team
  type: string
  searchable: false
  options: null
- name: TAG
  description: Tag value associated with the customer
  type: string
  searchable: true
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM references STG_TEAMS.TEAM_ID
- name: stg_customers
  source_col: CUSTOMER_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: CUSTOMER_ID references STG_CUSTOMERS._ID

---
version: 2
models:
- name: order_tracking_upsells
  data_source_name: null
  schema: null
  database: null
  description: Order tracking upsells model
  model: null
  entities:
  - name: order_tracking_upsells
    ref_: null
    expr: TEAM
    type: primary
    description: Team identifier
    project_path: null
  - name: stg_teams
    ref_: null
    expr: TEAM
    type: foreign
    description: Team identifier
    project_path: ../../staging/mongodb/buster_ymls
  dimensions:
  - name: TEAM_NAME
    expr: TEAM_NAME
    type: string
    description: Name of the team
    searchable: true
  - name: TEAM
    expr: TEAM
    type: string
    description: Team identifier
    searchable: false
  - name: PLATFORM
    expr: PLATFORM
    type: string
    description: Platform identifier
    searchable: true
  - name: CLOSED_WON_DATE
    expr: CLOSED_WON_DATE
    type: date
    description: Date when the deal was closed
    searchable: false
  - name: ORDER_DATE
    expr: ORDER_DATE
    type: timestamp
    description: Timestamp of the order
    searchable: false
  measures:
  - name: UPSELL_REVENUE
    expr: UPSELL_REVENUE
    agg: sum
    description: Revenue from upsells
    type: number
  - name: UPSELL_COUNT
    expr: UPSELL_COUNT
    agg: sum
    description: Count of upsells
    type: number
  - name: TOTAL_EMAILS_OPENED
    expr: TOTAL_EMAILS_OPENED
    agg: sum
    description: Total number of emails opened
    type: number
  - name: TOTAL_EMAILS_SENT
    expr: TOTAL_EMAILS_SENT
    agg: sum
    description: Total number of emails sent
    type: number
  - name: TOTAL_EMAILS_CLICKED
    expr: TOTAL_EMAILS_CLICKED
    agg: sum
    description: Total number of emails clicked
    type: number
  - name: EMAIL_OPENED_PERCENT
    expr: EMAIL_OPENED_PERCENT
    agg: avg
    description: Percentage of emails opened
    type: number
  - name: EMAIL_CLICKED_PERCENT
    expr: EMAIL_CLICKED_PERCENT
    agg: avg
    description: Percentage of emails clicked
    type: number
  - name: AVG_FULFILLMENT_DAYS
    expr: AVG_FULFILLMENT_DAYS
    agg: avg
    description: Average days to fulfill orders
    type: number
  - name: AVG_DELIVERY_DAYS
    expr: AVG_DELIVERY_DAYS
    agg: avg
    description: Average days to deliver orders
    type: number
  - name: TOTAL_FULFILLMENT_DAYS
    expr: TOTAL_FULFILLMENT_DAYS
    agg: sum
    description: Total days spent on fulfillment
    type: number
  - name: TOTAL_DELIVERY_DAYS
    expr: TOTAL_DELIVERY_DAYS
    agg: sum
    description: Total days spent on delivery
    type: number
  - name: TOTAL_FULFILLMENT_COUNT
    expr: TOTAL_FULFILLMENT_COUNT
    agg: sum
    description: Total count of fulfillments
    type: number
  - name: TOTAL_DELIVERY_COUNT
    expr: TOTAL_DELIVERY_COUNT
    agg: sum
    description: Total count of deliveries
    type: number

---
version: 2

models:
  - name: coverage_attachment
    description: "Coverage attachment model"
    entities:
      - name: coverage_attachment
        expr: "TEAM"
        type: "primary"
        description: "Team identifier"
      # TODO: TEAM and TEAM NAME through all systems.
    dimensions:
      - name: TEAM
        expr: "TEAM"
        type: "string"
        stored_values: true
        description: "Team identifier"
      - name: TEAM_NAME
        expr: "TEAM_NAME"
        type: "string"
        stored_values: true
        description: "Full name of the team"
      - name: ORDER_DATE
        expr: "ORDER_DATE"
        type: "date"
        description: "Date of the order"
      - name: PROVIDER
        expr: "PROVIDER"
        type: "string"
        stored_values: true
        description: "Provider identifier"
    measures:
      - name: PROTECTED_ORDERS
        expr: "PROTECTED_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders with protection"
      - name: ELIGIBLE_ORDERS
        expr: "ELIGIBLE_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders eligible for protection"
      - name: TOTAL_ORDERS
        expr: "TOTAL_ORDERS"
        type: "number"
        agg: "sum"
        description: "Total number of orders"
      - name: ATTACHMENT_RATE
        expr: "ATTACHMENT_RATE"
        type: "number"
        agg: "avg"
        description: "Rate of protection attachment" 
---
version: 2

models:
  - name: ric_attachment
    description: "Return insurance coverage attachment model"
    entities:
      - name: ric_attachment
        expr: "TEAM"
        type: "primary"
        description: "Team identifier"
    dimensions:
      - name: TEAM
        expr: "TEAM"
        type: "string"
        description: "Team identifier"
      - name: TEAM_NAME
        expr: "TEAM_NAME"
        type: "string"
        stored_values: true
        description: "Name of the team"
      - name: ORDER_DATE
        expr: "ORDER_DATE"
        type: "date"
        description: "Date of the order"
    measures:
      - name: PROTECTED_ORDERS
        expr: "PROTECTED_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders with protection"
      - name: OPTED_IN_ORDERS
        expr: "OPTED_IN_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders that opted in"
      - name: SAW_BUTTON_ORDERS
        expr: "SAW_BUTTON_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders where button was visible"
      - name: ELIGIBLE_ORDERS
        expr: "ELIGIBLE_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders eligible for protection"
      - name: TOTAL_ORDERS
        expr: "TOTAL_ORDERS"
        type: "number"
        agg: "sum"
        description: "Total number of orders" 
---
version: 2

models:
  - name: oms_orders
    description: "Order management system orders model"
    entities:
      - name: oms_orders
        expr: "MERCHANT_ID"
        type: "primary"
        description: "Unique merchant identifier"
    dimensions:
      - name: MERCHANT_ID
        expr: "MERCHANT_ID"
        type: "string"
        description: "Unique merchant identifier"
      - name: MERCHANT_NAME
        expr: "MERCHANT_NAME"
        type: "string"
        stored_values: true
        description: "Name of the merchant"
      - name: DATE_PERIOD
        expr: "DATE_PERIOD"
        type: "date"
        description: "Date of the order period"
    measures:
      - name: OUR_LABEL
        expr: "OUR_LABEL"
        type: "number"
        agg: "sum"
        description: "Count of our labels used"
      - name: TOTAL_LABELS
        expr: "TOTAL_LABELS"
        type: "number"
        agg: "sum"
        description: "Total count of all labels"
      - name: FULFILLMENT_RATE
        expr: "FULFILLMENT_RATE"
        type: "number"
        agg: "avg"
        description: "Rate of order fulfillment" 
---
version: 0
models:
- name: total_revenue
  data_source_name: null
  schema: null
  database: null
  description: Generated model for total_revenue
  model: null
  entities: []
  dimensions:
  - name: ID
    expr: ID
    type: string
    description: Unique identifier for each revenue record
    searchable: false
  - name: DATE
    expr: DATE
    type: timestamp
    description: Date when the revenue record was captured
    searchable: false
  - name: NAME
    expr: NAME
    type: string
    description: Name associated with the revenue record
    searchable: false
  - name: PLATFORM
    expr: PLATFORM
    type: string
    description: Platform or channel through which the revenue was generated
    searchable: false
  - name: COMPLIANT
    expr: COMPLIANT
    type: boolean
    description: Indicates whether the revenue record meets compliance standards
    searchable: false
  - name: REDO_TYPE
    expr: REDO_TYPE
    type: string
    description: Categorization type for redo revenue entries
    searchable: false
  - name: MERCHANT_TYPE
    expr: MERCHANT_TYPE
    type: string
    description: Type or category of the merchant associated with the revenue
    searchable: false
  - name: MAX_DATE
    expr: MAX_DATE
    type: timestamp
    description: Latest date captured in the revenue records
    searchable: false
  - name: CLOSED_WON_DATE
    expr: CLOSED_WON_DATE
    type: timestamp
    description: Date when the revenue opportunity was confirmed as successful
    searchable: false
  measures:
  - name: REDO_REV
    expr: REDO_REV
    agg: sum
    description: Total redo revenue summed across records
    type: number
  - name: MERCHANT_REV
    expr: MERCHANT_REV
    agg: sum
    description: Aggregate revenue from merchant-related transactions
    type: number

---
version: 2

models:
  - name: ris_attachment
    description: "Return insurance service attachment model"
    entities:
      - name: ris_attachment
        expr: "TEAM_ID"
        type: "primary"
        description: "Team identifier"
    dimensions:
      - name: TEAM_ID
        expr: "TEAM_ID"
        type: "string"
        description: "Team identifier"
      - name: NAME
        expr: "NAME"
        type: "string"
        stored_values: true
        description: "Name of the team"
      - name: DATE
        expr: "DATE"
        type: "date"
        description: "Date of the attachment record"
    measures:
      - name: RIS_ORDERS
        expr: "RIS_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders with return insurance service"
      - name: REDO_ELIGIBLE_ORDERS
        expr: "REDO_ELIGIBLE_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders eligible for Redo"
      - name: RIS_ATTACH_RATE
        expr: "RIS_ATTACH_RATE"
        type: "number"
        agg: "avg"
        description: "Rate of return insurance service attachment" 
---
version: 2

models:
  - name: label_revenue
    description: "Label revenue model"
    entities:
      - name: label_revenue
        expr: "ID"
        type: "primary"
        description: "Unique identifier for the revenue record"
    dimensions:
      - name: ID
        expr: "ID"
        type: "string"
        description: "Unique identifier for the revenue record"
      - name: NAME
        expr: "NAME"
        type: "string"
        stored_values: true
        description: "Name of the merchant"
      - name: DATE
        expr: "DATE"
        type: "date"
        description: "Date of the revenue record"
      - name: PLATFORM
        expr: "PLATFORM"
        type: "string"
        stored_values: true
        description: "Platform identifier"
      - name: CLOSED_WON_DATE
        expr: "CLOSED_WON_DATE"
        type: "date"
        description: "Date when the deal was closed"
    measures:
      - name: RETURNS
        expr: "RETURNS"
        type: "number"
        agg: "sum"
        description: "Total number of returns"
      - name: RETURNS_COVERED
        expr: "RETURNS_COVERED"
        type: "number"
        agg: "sum"
        description: "Number of covered returns"
      - name: RETURNS_ELIGIBLE
        expr: "RETURNS_ELIGIBLE"
        type: "number"
        agg: "sum"
        description: "Number of returns eligible for coverage"
      - name: ORDERS_RETURNED
        expr: "ORDERS_RETURNED"
        type: "number"
        agg: "sum"
        description: "Total number of orders returned"
      - name: ORDERS_RETURNED_COVERED
        expr: "ORDERS_RETURNED_COVERED"
        type: "number"
        agg: "sum"
        description: "Number of covered orders returned"
      - name: ORDERS_RETURNED_ELIGIBLE
        expr: "ORDERS_RETURNED_ELIGIBLE"
        type: "number"
        agg: "sum"
        description: "Number of eligible orders returned"
      - name: RETURNS_COVERED_USING
        expr: "RETURNS_COVERED_USING"
        type: "number"
        agg: "sum"
        description: "Number of returns using coverage"
      - name: SAFETY_NET_REVENUE
        expr: "SAFETY_NET_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from safety net cases"
      - name: SHIPPING_SHARE_REVENUE
        expr: "SHIPPING_SHARE_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from shipping share"
      - name: CUSTOMER_REFUND_REVENUE
        expr: "CUSTOMER_REFUND_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from customer refunds"
      - name: SUPPORT_REVENUE
        expr: "SUPPORT_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from support services"
      - name: PACKAGE_PICKUP_REVENUE
        expr: "PACKAGE_PICKUP_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from package pickups"
      - name: PACKAGE_PICKUP_REFUND
        expr: "PACKAGE_PICKUP_REFUND"
        type: "number"
        agg: "sum"
        description: "Refunds for package pickups"
      - name: FINAL_SALE_CREDITS
        expr: "FINAL_SALE_CREDITS"
        type: "number"
        agg: "sum"
        description: "Credits for final sales"
      - name: LABEL_REFUNDS
        expr: "LABEL_REFUNDS"
        type: "number"
        agg: "sum"
        description: "Refunds for labels"
      - name: CUSTOMER_REVENUE
        expr: "CUSTOMER_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from customers"
      - name: SHIPMENTS
        expr: "SHIPMENTS"
        type: "number"
        agg: "sum"
        description: "Total number of shipments"
      - name: SHIPMENTS_NOT_OPEN
        expr: "SHIPMENTS_NOT_OPEN"
        type: "number"
        agg: "sum"
        description: "Number of shipments not open"
      - name: RETURN_LAG_DAYS
        expr: "RETURN_LAG_DAYS"
        type: "number"
        agg: "avg"
        description: "Average days between order and return"
      - name: RETURNS_NOT_REJECTED
        expr: "RETURNS_NOT_REJECTED"
        type: "number"
        agg: "sum"
        description: "Number of returns not rejected" 
---
version: 2

models:
  - name: order_tracking_revenue
    description: "Order tracking revenue model"
    entities:
      - name: order_tracking_revenue
        expr: "MERCHANT_ID"
        type: "primary"
        description: "Unique merchant identifier"
    dimensions:
      - name: MERCHANT_ID
        expr: "MERCHANT_ID"
        type: "string"
        description: "Unique merchant identifier"
      - name: MERCHANT_NAME
        expr: "MERCHANT_NAME"
        type: "string"
        stored_values: true
        description: "Name of the merchant"
      - name: DATE
        expr: "DATE"
        type: "date"
        description: "Date of the revenue record"
      - name: PLATFORM
        expr: "PLATFORM"
        type: "string"
        stored_values: true
        description: "Platform identifier"
      - name: CLOSED_WON_DATE
        expr: "CLOSED_WON_DATE"
        type: "date"
        description: "Date when the deal was closed"
      - name: ACCEPTED_BILLING
        expr: "ACCEPTED_BILLING"
        type: "boolean"
        description: "Whether billing has been accepted"
      - name: FREE_UNTIL_END_DATE
        expr: "FREE_UNTIL_END_DATE"
        type: "date"
        description: "End date of free period"
    measures:
      - name: DEAL_SIZE_RATE
        expr: "DEAL_SIZE_RATE"
        type: "number"
        agg: "avg"
        description: "Rate for deal size"
      - name: BILLED_REVENUE
        expr: "BILLED_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from billed orders"
      - name: BILLED_ORDER_COUNT
        expr: "BILLED_ORDER_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of billed orders"
      - name: TOTAL_ORDER_COUNT
        expr: "TOTAL_ORDER_COUNT"
        type: "number"
        agg: "sum"
        description: "Total count of all orders"
      - name: CALCULATED_PRICE_PER_ORDER
        expr: "CALCULATED_PRICE_PER_ORDER"
        type: "number"
        agg: "avg"
        description: "Calculated average price per order" 
---
version: 2
models:
- name: ric_attachment
  data_source_name: null
  schema: null
  database: null
  description: Return insurance coverage attachment model
  model: null
  entities:
  - name: ric_attachment
    ref_: null
    expr: TEAM
    type: primary
    description: Team identifier
    project_path: null
  - name: stg_teams
    ref_: null
    expr: TEAM
    type: foreign
    description: Team identifier
    project_path: ../../staging/mongodb/buster_ymls
  dimensions:
  - name: TEAM
    expr: TEAM
    type: string
    description: Team identifier
    searchable: false
  - name: TEAM_NAME
    expr: TEAM_NAME
    type: string
    description: Name of the team
    searchable: true
  - name: ORDER_DATE
    expr: ORDER_DATE
    type: date
    description: Date of the order
    searchable: false
  measures:
  - name: PROTECTED_ORDERS
    expr: PROTECTED_ORDERS
    agg: sum
    description: Number of orders with protection
    type: number
  - name: OPTED_IN_ORDERS
    expr: OPTED_IN_ORDERS
    agg: sum
    description: Number of orders that opted in
    type: number
  - name: SAW_BUTTON_ORDERS
    expr: SAW_BUTTON_ORDERS
    agg: sum
    description: Number of orders where button was visible
    type: number
  - name: ELIGIBLE_ORDERS
    expr: ELIGIBLE_ORDERS
    agg: sum
    description: Number of orders eligible for protection
    type: number
  - name: TOTAL_ORDERS
    expr: TOTAL_ORDERS
    agg: sum
    description: Total number of orders
    type: number

---
version: 2

models:
  - name: extended_warranties_revenue
    description: "Extended warranties revenue model"
    entities:
      - name: extended_warranties_revenue
        expr: "TEAM_ID"
        type: "primary"
        description: "Team identifier"
    dimensions:
      - name: DATE
        expr: "DATE"
        type: "date"
        description: "Date of the revenue record"
      - name: CHARGETYPE
        expr: "CHARGETYPE"
        type: "string"
        stored_values: true
        description: "Type of charge"
      - name: TEAM_ID
        expr: "TEAM_ID"
        type: "string"
        description: "Team identifier"
    measures:
      - name: REVENUE
        expr: "REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue amount from extended warranties" 
---
version: 2

models:
  - name: label_costs
    description: "Label costs model"
    entities:
      - name: label_costs
        expr: "TEAM"
        type: "primary"
        description: "Team identifier"
    dimensions:
      - name: TEAM
        expr: "TEAM"
        type: "string"
        description: "Team identifier"
      - name: TEAM_NAME
        expr: "TEAM_NAME"
        type: "string"
        stored_values: true
        description: "Name of the team"
      - name: PLATFORM
        expr: "PLATFORM"
        type: "string"
        stored_values: true
        description: "Platform identifier"
      - name: RETURN_DATE
        expr: "RETURN_DATE"
        type: "date"
        description: "Date of the return"
      - name: CLOSED_WON_DATE
        expr: "CLOSED_WON_DATE"
        type: "date"
        description: "Date when the deal was closed"
    measures:
      - name: COVERED_COST
        expr: "COVERED_COST"
        type: "number"
        agg: "sum"
        description: "Cost for covered returns"
      - name: CUSTOMER_PAID_COST
        expr: "CUSTOMER_PAID_COST"
        type: "number"
        agg: "sum"
        description: "Cost paid by customers"
      - name: SUPPORT_COST
        expr: "SUPPORT_COST"
        type: "number"
        agg: "sum"
        description: "Cost for support"
      - name: CUSTOMER_REFUND_COST
        expr: "CUSTOMER_REFUND_COST"
        type: "number"
        agg: "sum"
        description: "Cost of customer refunds"
      - name: SAFETY_NET_COST
        expr: "SAFETY_NET_COST"
        type: "number"
        agg: "sum"
        description: "Cost for safety net cases"
      - name: TOTAL_COST
        expr: "TOTAL_COST"
        type: "number"
        agg: "sum"
        description: "Total cost across all categories"
      - name: COVERED_COUNT
        expr: "COVERED_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of covered returns"
      - name: CUSTOMER_PAID_COUNT
        expr: "CUSTOMER_PAID_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of customer paid returns"
      - name: SUPPORT_COUNT
        expr: "SUPPORT_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of support cases"
      - name: CUSTOMER_REFUND_COUNT
        expr: "CUSTOMER_REFUND_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of customer refunds"
      - name: SAFETY_NET_COUNT
        expr: "SAFETY_NET_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of safety net cases"
      - name: TOTAL_COUNT
        expr: "TOTAL_COUNT"
        type: "number"
        agg: "sum"
        description: "Total count across all categories" 
---
version: 2

models:
  - name: coverage_revenue
    description: "Coverage revenue model"
    entities:
      - name: coverage_revenue
        expr: "ID"
        type: "primary"
        description: "Unique identifier for the revenue record"
    dimensions:
      - name: ID
        expr: "ID"
        type: "string"
        description: "Unique identifier for the revenue record"
      - name: NAME
        expr: "NAME"
        type: "string"
        stored_values: true
        description: "Name of the merchant"
      - name: STORE_URL
        expr: "STORE_URL"
        type: "string"
        description: "URL of the merchant's store"
      - name: PLATFORM
        expr: "PLATFORM"
        type: "string"
        stored_values: true
        description: "Platform identifier"
      - name: COMPLIANT
        expr: "COMPLIANT"
        type: "boolean"
        description: "Whether the merchant is compliant"
      - name: CLOSED_WON_DATE
        expr: "CLOSED_WON_DATE"
        type: "date"
        description: "Date when the deal was closed"
      - name: PAID_MODEL
        expr: "PAID_MODEL"
        type: "string"
        stored_values: true
        description: "Type of payment model"
      - name: DATE
        expr: "DATE"
        type: "date"
        description: "Date of the revenue record"
    measures:
      - name: CUSTOMER_PRICE_PER_ORDER
        expr: "CUSTOMER_PRICE_PER_ORDER"
        type: "number"
        agg: "avg"
        description: "Average price charged to customer per order"
      - name: MERCHANT_PRICE_PER_ORDER
        expr: "MERCHANT_PRICE_PER_ORDER"
        type: "number"
        agg: "avg"
        description: "Average price charged to merchant per order"
      - name: ORDERS
        expr: "ORDERS"
        type: "number"
        agg: "sum"
        description: "Total number of orders"
      - name: ELIGIBLE_ORDERS
        expr: "ELIGIBLE_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders eligible for coverage"
      - name: COVERED_ORDERS
        expr: "COVERED_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of orders with coverage"
      - name: EXCHANGE_ORDERS
        expr: "EXCHANGE_ORDERS"
        type: "number"
        agg: "sum"
        description: "Total number of exchange orders"
      - name: ELIGIBLE_EXCHANGE_ORDERS
        expr: "ELIGIBLE_EXCHANGE_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of exchange orders eligible for coverage"
      - name: COVERED_EXCHANGE_ORDERS
        expr: "COVERED_EXCHANGE_ORDERS"
        type: "number"
        agg: "sum"
        description: "Number of exchange orders with coverage"
      - name: PACKAGE_PROTECTION_COUNT
        expr: "PACKAGE_PROTECTION_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of package protections"
      - name: LINE_ITEM_COUNT
        expr: "LINE_ITEM_COUNT"
        type: "number"
        agg: "sum"
        description: "Total count of line items"
      - name: ELIGIBLE_LINE_ITEM_COUNT
        expr: "ELIGIBLE_LINE_ITEM_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of eligible line items"
      - name: COVERAGE_REVENUE
        expr: "COVERAGE_REVENUE"
        type: "number"
        agg: "sum"
        description: "Total revenue from coverage"
      - name: COVERAGE_INCOME
        expr: "COVERAGE_INCOME"
        type: "number"
        agg: "sum"
        description: "Total income from coverage"
      - name: FINAL_SALE_RETURNS_COVERAGE_INCOME
        expr: "FINAL_SALE_RETURNS_COVERAGE_INCOME"
        type: "number"
        agg: "sum"
        description: "Income from final sale returns coverage"
      - name: COVERAGE_REFUND
        expr: "COVERAGE_REFUND"
        type: "number"
        agg: "sum"
        description: "Total refunds from coverage"
      - name: AVG_COVERAGE_PRICE
        expr: "AVG_COVERAGE_PRICE"
        type: "number"
        agg: "avg"
        description: "Average price of coverage"
      - name: MERCHANT_REVENUE
        expr: "MERCHANT_REVENUE"
        type: "number"
        agg: "sum"
        description: "Total revenue from merchants"
      - name: PACKAGE_PROTECTION_REVENUE
        expr: "PACKAGE_PROTECTION_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from package protection"
      - name: TOV
        expr: "TOV"
        type: "number"
        agg: "sum"
        description: "Total order value" 
---
name: stg_conversations
description: Staging model for conversations from MongoDB. Contains core conversation data and metadata.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: CONVERSATION_ID
  description: Unique identifier for each conversation
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: Reference to the team the conversation belongs to
  type: string
  searchable: false
  options: null
- name: PLATFORM
  description: Platform where the conversation originated
  type: string
  searchable: true
  options: null
- name: ASSIGNEE
  description: Reference to the user assigned to the conversation
  type: string
  searchable: true
  options: null
- name: STATUS
  description: Current status of the conversation
  type: string
  searchable: true
  options: null
- name: CLOSEDAT
  description: Timestamp when the conversation was closed
  type: timestamp
  searchable: false
  options: null
- name: SUBJECT
  description: Subject or title of the conversation
  type: string
  searchable: false
  options: null
- name: CREATEDAT
  description: Timestamp when the conversation was created
  type: timestamp
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the conversation was last updated
  type: timestamp
  searchable: false
  options: null
- name: LASTRESPONSEAT
  description: Timestamp when the last response was sent
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: AI_USED_ON_TICKET_AT
  description: Timestamp when AI features were applied to the ticket.
  type: timestamp
  searchable: false
  options: null
- name: CLOSING_MESSAGE_CREATED_AT
  description: Timestamp of the last message when conversation was closed
  type: timestamp
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
version: 2

models:
  - name: order_tracking_upsells
    description: "Order tracking upsells model"
    entities:
      - name: order_tracking_upsells
        expr: "TEAM"
        type: "primary"
        description: "Team identifier"
    dimensions:
      - name: TEAM
        expr: "TEAM"
        type: "string"
        description: "Team identifier"
      - name: TEAM_NAME
        expr: "TEAM_NAME"
        type: "string"
        stored_values: true
        description: "Name of the team"
      - name: PLATFORM
        expr: "PLATFORM"
        type: "string"
        stored_values: true
        description: "Platform identifier"
      - name: CLOSED_WON_DATE
        expr: "CLOSED_WON_DATE"
        type: "date"
        description: "Date when the deal was closed"
      - name: ORDER_DATE
        expr: "ORDER_DATE"
        type: "timestamp"
        description: "Timestamp of the order"
    measures:
      - name: UPSELL_REVENUE
        expr: "UPSELL_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from upsells"
      - name: UPSELL_COUNT
        expr: "UPSELL_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of upsells"
      - name: TOTAL_EMAILS_OPENED
        expr: "TOTAL_EMAILS_OPENED"
        type: "number"
        agg: "sum"
        description: "Total number of emails opened"
      - name: TOTAL_EMAILS_SENT
        expr: "TOTAL_EMAILS_SENT"
        type: "number"
        agg: "sum"
        description: "Total number of emails sent"
      - name: TOTAL_EMAILS_CLICKED
        expr: "TOTAL_EMAILS_CLICKED"
        type: "number"
        agg: "sum"
        description: "Total number of emails clicked"
      - name: EMAIL_OPENED_PERCENT
        expr: "EMAIL_OPENED_PERCENT"
        type: "number"
        agg: "avg"
        description: "Percentage of emails opened"
      - name: EMAIL_CLICKED_PERCENT
        expr: "EMAIL_CLICKED_PERCENT"
        type: "number"
        agg: "avg"
        description: "Percentage of emails clicked"
      - name: AVG_FULFILLMENT_DAYS
        expr: "AVG_FULFILLMENT_DAYS"
        type: "number"
        agg: "avg"
        description: "Average days to fulfill orders"
      - name: AVG_DELIVERY_DAYS
        expr: "AVG_DELIVERY_DAYS"
        type: "number"
        agg: "avg"
        description: "Average days to deliver orders"
      - name: TOTAL_FULFILLMENT_DAYS
        expr: "TOTAL_FULFILLMENT_DAYS"
        type: "number"
        agg: "sum"
        description: "Total days spent on fulfillment"
      - name: TOTAL_DELIVERY_DAYS
        expr: "TOTAL_DELIVERY_DAYS"
        type: "number"
        agg: "sum"
        description: "Total days spent on delivery"
      - name: TOTAL_FULFILLMENT_COUNT
        expr: "TOTAL_FULFILLMENT_COUNT"
        type: "number"
        agg: "sum"
        description: "Total count of fulfillments"
      - name: TOTAL_DELIVERY_COUNT
        expr: "TOTAL_DELIVERY_COUNT"
        type: "number"
        agg: "sum"
        description: "Total count of deliveries" 
---
version: 2

models:
  - name: one_click_upsell_revenue
    description: "One click upsell revenue model"
    entities:
      - name: one_click_upsell_revenue
        expr: "UPSELL_PAGE_ANALYTICS_RECORD_ID"
        type: "primary"
        description: "Unique identifier for the upsell record"
      - name: stg_teams
        expr: "TEAM_ID"
        type: "foreign"
        description: "Reference to the team"
    dimensions:
      - name: UPSELL_PAGE_ANALYTICS_RECORD_ID
        expr: "UPSELL_PAGE_ANALYTICS_RECORD_ID"
        type: "string"
        description: "Unique identifier for the upsell record"
      - name: DATE
        expr: "DATE"
        type: "date"
        description: "Date of the revenue record"
      - name: TEAM_ID
        expr: "TEAM_ID"
        type: "string"
        description: "Team identifier"
    measures:
      - name: ONE_CLICK_UPSELL_REVENUE
        expr: "ONE_CLICK_UPSELL_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from one click upsells" 
---
version: 2

models:
  - name: cxp_revenue
    description: "CXP revenue model"
    entities:
      - name: cxp_revenue
        expr: "TEAM_ID"
        type: "primary"
        description: "Unique team identifier"
    dimensions:
      - name: TEAM_ID
        expr: "TEAM_ID"
        type: "string"
        description: "Unique team identifier"
      - name: TEAM_NAME
        expr: "TEAM_NAME"
        type: "string"
        stored_values: true
        description: "Name of the team"
      - name: MONTH
        expr: "MONTH"
        type: "date"
        description: "Month of the revenue record"
      - name: NOTIFICATION_EMAIL
        expr: "NOTIFICATION_EMAIL"
        type: "string"
        description: "Email for notifications"
      - name: IS_AUTOPILOT_ENABLED
        expr: "IS_AUTOPILOT_ENABLED"
        type: "boolean"
        description: "Whether autopilot is enabled"
      - name: IS_COPILOT_ENABLED
        expr: "IS_COPILOT_ENABLED"
        type: "boolean"
        description: "Whether copilot is enabled"
      - name: IS_AI_ENABLED
        expr: "IS_AI_ENABLED"
        type: "boolean"
        description: "Whether AI features are enabled"
      - name: FREE_TRIAL_USED
        expr: "FREE_TRIAL_USED"
        type: "boolean"
        description: "Whether free trial has been used"
      - name: FREE_TRIAL_EXPIRATION
        expr: "FREE_TRIAL_EXPIRATION"
        type: "timestamp"
        description: "When the free trial expires"
      - name: SHOPIFY_SUBSCRIPTION_CREATED_AT
        expr: "SHOPIFY_SUBSCRIPTION_CREATED_AT"
        type: "timestamp"
        description: "When the Shopify subscription was created"
      - name: CURRENT_PERIOD_END_AT
        expr: "CURRENT_PERIOD_END_AT"
        type: "timestamp"
        description: "When the current subscription period ends"
    measures:
      - name: MONTHLY_PRICE
        expr: "MONTHLY_PRICE"
        type: "number"
        agg: "avg"
        description: "Monthly subscription price"
      - name: OVERAGE_PRICE
        expr: "OVERAGE_PRICE"
        type: "number"
        agg: "avg"
        description: "Price for overage usage"
      - name: ALLOTED_TICKETS
        expr: "ALLOTED_TICKETS"
        type: "number"
        agg: "sum"
        description: "Number of tickets allotted"
      - name: CONCIERGE_CONVERSATION_COUNT
        expr: "CONCIERGE_CONVERSATION_COUNT"
        type: "number"
        agg: "sum"
        description: "Count of concierge conversations"
      - name: RESPONDED_TICKETS
        expr: "RESPONDED_TICKETS"
        type: "number"
        agg: "sum"
        description: "Number of tickets responded to"
      - name: AI_USED_ON_TICKET
        expr: "AI_USED_ON_TICKET"
        type: "number"
        agg: "sum"
        description: "Number of tickets where AI was used"
      - name: TICKETS_OVER_LIMIT
        expr: "TICKETS_OVER_LIMIT"
        type: "number"
        agg: "sum"
        description: "Number of tickets exceeding the limit"
      - name: AI_USAGE_REVENUE
        expr: "AI_USAGE_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from AI usage"
      - name: MONTHLY_SUBSCRIPTION_REVENUE
        expr: "MONTHLY_SUBSCRIPTION_REVENUE"
        type: "number"
        agg: "sum"
        description: "Revenue from monthly subscriptions"
      - name: TOTAL_SUPPORT_REVENUE
        expr: "TOTAL_SUPPORT_REVENUE"
        type: "number"
        agg: "sum"
        description: "Total revenue from support services" 
---
version: 2

models:
  - name: total_revenue_by_hour
    description: "Hourly revenue totals model"
    entities:
      - name: total_revenue_by_hour
        expr: "MERCHANT_ID"
        type: "primary"
        description: "Unique merchant identifier"
    dimensions:
      - name: MERCHANT_ID
        expr: "MERCHANT_ID"
        type: "string"
        description: "Unique merchant identifier"
      - name: MERCHANT_NAME
        expr: "MERCHANT_NAME"
        type: "string"
        stored_values: true
        description: "Name of the merchant"
      - name: REVENUE_TYPE
        expr: "REVENUE_TYPE"
        type: "string"
        stored_values: true
        description: "Primary type of revenue"
      - name: SUB_REVENUE_TYPE
        expr: "SUB_REVENUE_TYPE"
        type: "string"
        stored_values: true
        description: "Secondary type of revenue"
      - name: PLATFORM
        expr: "PLATFORM"
        type: "string"
        stored_values: true
        description: "Platform identifier"
      - name: COMPLIANT
        expr: "COMPLIANT"
        type: "boolean"
        description: "Whether the merchant is compliant"
      - name: DATE_PERIOD
        expr: "DATE_PERIOD"
        type: "timestamp"
        description: "Timestamp of the revenue period"
    measures:
      - name: REVENUE
        expr: "REVENUE"
        type: "number"
        agg: "sum"
        description: "Total revenue amount"
      - name: MARGIN
        expr: "MARGIN"
        type: "number"
        agg: "avg"
        description: "Average margin percentage"
      - name: COUNT
        expr: "COUNT"
        type: "number"
        agg: "sum"
        description: "Count of revenue records" 
---
name: stg_customer_events
description: Staging model for customer events from MongoDB. Tracks various customer interactions and behaviors.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Unique identifier for the customer event record
  type: string
  searchable: false
  options: null
- name: CUSTOMER
  description: Customer associated with the event
  type: string
  searchable: false
  options: null
- name: TEAM
  description: Team handling or associated with the customer event
  type: string
  searchable: false
  options: null
- name: TIMESTAMP
  description: Timestamp when the event occurred
  type: timestamp
  searchable: false
  options: null
- name: EVENTTYPE
  description: Type or category of the event
  type: string
  searchable: true
  options: null
- name: UPDATEDAT
  description: Timestamp indicating when the record was last updated
  type: timestamp
  searchable: false
  options: null
- name: CREATEDAT
  description: Timestamp indicating when the record was created
  type: timestamp
  searchable: false
  options: null
- name: PRODUCT_VARIANT_PRODUCT_ID
  description: Identifier for the product associated with the variant
  type: string
  searchable: false
  options: null
- name: PRODUCT_VARIANT_PRODUCT_TITLE
  description: Title of the product associated with the variant
  type: string
  searchable: false
  options: null
- name: PRODUCT_VARIANT_PRODUCT_UNTRANSLATED_TITLE
  description: Original title of the product before translation
  type: string
  searchable: false
  options: null
- name: PRODUCT_VARIANT_ID
  description: Unique identifier for the product variant
  type: string
  searchable: false
  options: null
- name: PRODUCT_VARIANT_SKU
  description: Stock keeping unit for the product variant
  type: string
  searchable: false
  options: null
- name: PRODUCT_VARIANT_TITLE
  description: Title or name of the product variant
  type: string
  searchable: false
  options: null
- name: PRODUCT_VARIANT_UNTRANSLATED_TITLE
  description: Original title of the product variant before translation
  type: string
  searchable: false
  options: null
- name: RETURN_ID
  description: Identifier for the return transaction
  type: string
  searchable: false
  options: null
- name: RETURN_STATUS
  description: Current status of the return process
  type: string
  searchable: true
  options: null
- name: CART_LINE_MERCHANDISE_ID
  description: Identifier for the merchandise in a cart line
  type: string
  searchable: false
  options: null
- name: CART_LINE_MERCHANDISE_SKU
  description: SKU for the merchandise in a cart line
  type: string
  searchable: false
  options: null
- name: CART_LINE_MERCHANDISE_PRODUCT_TITLE
  description: Product title for the merchandise in a cart line
  type: string
  searchable: false
  options: null
- name: CART_LINE_MERCHANDISE_PRODUCT_UNTRANSLATED_TITLE
  description: Original product title before translation for cart line merchandise
  type: string
  searchable: false
  options: null
- name: CART_LINE_MERCHANDISE_TITLE
  description: Title or name of the merchandise in the cart line
  type: string
  searchable: false
  options: null
- name: CART_LINE_MERCHANDISE_UNTRANSLATED_TITLE
  description: Original title of the merchandise before translation
  type: string
  searchable: false
  options: null
- name: CART_LINE_COST_TOTAL_AMOUNT_CURRENCY
  description: Currency used for the total cost in the cart line
  type: string
  searchable: true
  options: null
- name: ORDER_ID
  description: Unique identifier for the order associated with the event
  type: string
  searchable: false
  options: null
- name: SOURCE_NAME
  description: Source of the event
  type: TEXT
  searchable: true
  options: null
- name: CHECKOUT_TOTAL_PRICE_CURRENCY
  description: Currency in which the checkout total price is denominated
  type: string
  searchable: true
  options: null
- name: URL_WITHOUT_PARAMS
  description: Event URL stripped of parameters
  type: TEXT
  searchable: false
  options: null
- name: URL_WITH_PARAMS
  description: Event URL including parameters
  type: TEXT
  searchable: false
  options: null
- name: CHANNEL
  description: Sales or communication channel for the order or event
  type: string
  searchable: true
  options: null
- name: CAMPAIGN
  description: Marketing campaign associated with the event
  type: string
  searchable: false
  options: null
- name: COLLECTION_ID
  description: Unique identifier for the product collection
  type: string
  searchable: false
  options: null
- name: COLLECTION_TITLE
  description: Title of the product collection
  type: string
  searchable: false
  options: null
measures:
- name: CART_LINE_COST_TOTAL_AMOUNT
  description: Total cost amount aggregated from cart line merchandise
  type: number
- name: CART_LINE_QUANTITY
  description: Aggregated quantity from the cart lines
  type: number
- name: TOTAL_PRICE
  description: Total price amount aggregated from order values
  type: number
- name: ITEM_COUNT
  description: Total number of items aggregated from orders
  type: number
- name: CHECKOUT_TOTAL_PRICE_AMOUNT
  description: Aggregated total price amount at checkout
  type: number
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: Reference to the team the event belongs to
- name: stg_product_collections
  source_col: COLLECTION_ID
  ref_col: COLLECTION_ID
  type: null
  cardinality: null
  description: Foreign key from stg_customer_events COLLECTION_ID to stg_product_collections COLLECTION_ID
- name: stg_customers
  source_col: CUSTOMER
  ref_col: _ID
  type: null
  cardinality: null
  description: CUSTOMER references STG_CUSTOMERS._ID
- name: stg_orders
  source_col: ORDER_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: ORDER_ID references STG_ORDERS._ID

---
version: 2
models:
- name: label_costs
  data_source_name: null
  schema: revenue
  database: dbt
  description: Label costs model
  model: null
  entities:
  - name: teams
    ref_: null
    expr: TEAM
    type: foreign
    description: Reference to the general teams table
    project_path: ../../general/buster_ymls
  dimensions:
  - name: TEAM
    expr: TEAM
    type: string
    description: Team identifier
    searchable: false
  - name: RETURN_DATE
    expr: RETURN_DATE
    type: date
    description: Date of the return
    searchable: false
  - name: TEAM_NAME
    expr: TEAM_NAME
    type: string
    description: Name of the team
    searchable: true
  - name: PLATFORM
    expr: PLATFORM
    type: string
    description: Platform identifier
    searchable: true
  - name: CLOSED_WON_DATE
    expr: CLOSED_WON_DATE
    type: date
    description: Date when the deal was closed
    searchable: false
  measures:
  - name: COVERED_COST
    expr: COVERED_COST
    agg: sum
    description: Cost for covered returns
    type: number
  - name: CUSTOMER_PAID_COST
    expr: CUSTOMER_PAID_COST
    agg: sum
    description: Cost paid by customers
    type: number
  - name: SUPPORT_COST
    expr: SUPPORT_COST
    agg: sum
    description: Cost for support
    type: number
  - name: CUSTOMER_REFUND_COST
    expr: CUSTOMER_REFUND_COST
    agg: sum
    description: Cost of customer refunds
    type: number
  - name: SAFETY_NET_COST
    expr: SAFETY_NET_COST
    agg: sum
    description: Cost for safety net cases
    type: number
  - name: TOTAL_COST
    expr: TOTAL_COST
    agg: sum
    description: Total cost across all categories
    type: number
  - name: COVERED_COUNT
    expr: COVERED_COUNT
    agg: sum
    description: Count of covered returns
    type: number
  - name: CUSTOMER_PAID_COUNT
    expr: CUSTOMER_PAID_COUNT
    agg: sum
    description: Count of customer paid returns
    type: number
  - name: SUPPORT_COUNT
    expr: SUPPORT_COUNT
    agg: sum
    description: Count of support cases
    type: number
  - name: CUSTOMER_REFUND_COUNT
    expr: CUSTOMER_REFUND_COUNT
    agg: sum
    description: Count of customer refunds
    type: number
  - name: SAFETY_NET_COUNT
    expr: SAFETY_NET_COUNT
    agg: sum
    description: Count of safety net cases
    type: number
  - name: TOTAL_COUNT
    expr: TOTAL_COUNT
    agg: sum
    description: Total count across all categories
    type: number
  metrics: []
  segments: []

---
version: 0
models:
- name: am_coverage_revenue
  data_source_name: null
  schema: null
  database: null
  description: Generated model for am_coverage_revenue
  model: null
  entities: []
  dimensions:
  - name: ID
    expr: ID
    type: string
    description: Dimension representing the unique identifier for each record.
    searchable: false
  - name: NAME
    expr: NAME
    type: string
    description: Dimension representing the name associated with the record.
    searchable: false
  - name: DATE
    expr: DATE
    type: timestamp
    description: Dimension representing the timestamp when the record was created or modified.
    searchable: false
  - name: PLATFORM
    expr: PLATFORM
    type: string
    description: Dimension representing the platform from which the data is sourced.
    searchable: false
  - name: OWNER
    expr: OWNER
    type: string
    description: Dimension representing the owner responsible for the record.
    searchable: false
  - name: OWNER_EMAIL
    expr: OWNER_EMAIL
    type: string
    description: Dimension representing the email address of the record owner.
    searchable: false
  measures:
  - name: NON_EXCHANGE_COVERED_ORDERS
    expr: NON_EXCHANGE_COVERED_ORDERS
    agg: sum
    description: Measure representing the total sum of non-exchange covered orders.
    type: number
  - name: ORDERS
    expr: ORDERS
    agg: sum
    description: Measure representing the total sum of all orders.
    type: number
  - name: COVERAGE_RATE
    expr: COVERAGE_RATE
    agg: sum
    description: Measure representing the sum of coverage rate percentages across records.
    type: number
  - name: LAST_Q_ORDERS
    expr: LAST_Q_ORDERS
    agg: sum
    description: Measure representing the total sum of orders from the last quarter.
    type: number

---
name: stg_service_invoice_line_items
description: Generated model for stg_service_invoice_line_items
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: SERVICE_INVOICE_ID
  description: Unique identifier for the service invoice
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the team associated with the invoice
  type: TEXT
  searchable: false
  options: null
- name: BILLED_SUCCESSFULLY
  description: Indicator if the invoice was billed successfully
  type: BOOLEAN
  searchable: false
  options: null
- name: BILLING_DUE_DATE
  description: Date and time when the billing is due
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: CREATED_AT
  description: Timestamp when the record was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: KIND
  description: Type or category of the invoice line item
  type: TEXT
  searchable: true
  options: null
- name: UPDATED_AT
  description: Timestamp indicating the last update to the record
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: NAME
  description: Descriptive name of the invoice line item
  type: TEXT
  searchable: false
  options: null
- name: CURRENCY
  description: Currency code used in the invoice
  type: TEXT
  searchable: true
  options: null
measures:
- name: BILLING_ATTEMPTS
  description: Total number of billing attempts made
  type: FLOAT
- name: CREDITS_FOR_UPCOMING_MONTH
  description: Sum of credits applicable for the upcoming month
  type: FLOAT
- name: EMAILS_SENT
  description: Total number of emails sent as part of the invoicing process
  type: FLOAT
- name: FREE_EMAILS_FOR_PERIOD
  description: Total free emails allowed for the billing period
  type: FLOAT
- name: TOTAL_CARRIER_FEES_IN_THOUSANDTH_CENTS
  description: Aggregate carrier fees expressed in thousandths of cents
  type: FLOAT
- name: TOTAL_MMS_PARTS
  description: Total number of MMS parts billed
  type: FLOAT
- name: TOTAL_SMS_PARTS
  description: Total number of SMS parts billed
  type: FLOAT
- name: OVERAGE_MMS_PRICE_IN_THOUSANDTH_CENTS
  description: Overage charges for MMS expressed in thousandths of cents
  type: FLOAT
- name: OVERAGE_SMS_PRICE_IN_THOUSANDTH_CENTS
  description: Overage charges for SMS expressed in thousandths of cents
  type: FLOAT
- name: PRICE_PER_THOUSAND_EMAILS_IN_CENTS
  description: Cost per thousand emails sent, in cents
  type: FLOAT
- name: PRICE
  description: Total price for the invoice line item
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_users
description: Generated model for stg_users
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: USER_ID
  description: Unique identifier for the user in the system
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the team the user belongs to
  type: TEXT
  searchable: false
  options: null
- name: USER_NAME
  description: Username used by the user for system login
  type: TEXT
  searchable: false
  options: null
- name: FIRST_NAME
  description: The users first name
  type: TEXT
  searchable: false
  options: null
- name: LAST_NAME
  description: The users last name
  type: TEXT
  searchable: false
  options: null
- name: EMAIL
  description: Email address associated with the user
  type: TEXT
  searchable: false
  options: null
- name: CREATED_AT
  description: Timestamp marking when the record was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: UPDATED_AT
  description: Timestamp marking when the record was last updated
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_campaign_recipients
description: Generated model for stg_campaign_recipients
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Unique identifier for the record
  type: TEXT
  searchable: false
  options: null
- name: TEAMID
  description: Identifier for the team associated with the recipient
  type: TEXT
  searchable: false
  options: null
- name: CAMPAIGNID
  description: Identifier for the campaign being referenced
  type: TEXT
  searchable: false
  options: null
- name: AUTOMATIONID
  description: Identifier for the automation process linked to the campaign
  type: TEXT
  searchable: false
  options: null
- name: AUTOMATIONSTEPID
  description: Identifier for the specific step in the automation sequence
  type: TEXT
  searchable: false
  options: null
- name: AUTOMATIONEXECUTIONID
  description: Identifier for a particular execution of the automation process
  type: TEXT
  searchable: false
  options: null
- name: CUSTOMERID
  description: Identifier for the customer associated with the recipient
  type: TEXT
  searchable: false
  options: null
- name: CHANNEL
  description: Communication channel used for delivering the campaign
  type: TEXT
  searchable: false
  options: null
- name: CHANNELID
  description: Unique identifier for the specific communication channel instance
  type: TEXT
  searchable: false
  options: null
- name: MESSAGEID
  description: Identifier for the message sent as part of the campaign
  type: TEXT
  searchable: false
  options: null
- name: FIRSTNAME
  description: First name of the campaign recipient
  type: TEXT
  searchable: false
  options: null
- name: LASTNAME
  description: Last name of the campaign recipient
  type: TEXT
  searchable: false
  options: null
- name: STATUS
  description: Current status of the campaign recipient, such as active or unsubscribed
  type: TEXT
  searchable: false
  options: null
- name: CREATEDAT
  description: Timestamp indicating when the record was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp indicating when the record was last updated
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
measures:
- name: ATTEMPTSLEFT
  description: Number of attempts remaining for delivering the campaign
  type: FLOAT
- name: METRICOPENS
  description: Total count of opens recorded for the campaign
  type: NUMBER
- name: METRICCLICKS
  description: Total count of clicks registered from the campaign
  type: NUMBER
- name: METRICUPSELLREVENUE
  description: Revenue generated from upsell activities within the campaign
  type: NUMBER
- name: METRICUPSELLCOUNT
  description: Count of upsell occurrences triggered by the campaign
  type: NUMBER
- name: METRICALREADYUNSUBSCRIBES
  description: Number of customers already unsubscribed prior to the campaign
  type: NUMBER
- name: METRICINVALIDCHANNELIDS
  description: Count of records with invalid channel identifiers
  type: NUMBER
- name: METRICSUPPRESSIONS
  description: Count of suppression events that prevented message delivery
  type: NUMBER
- name: METRICSMARTSENDINGSKIPS
  description: Count of messages skipped due to smart sending rules
  type: NUMBER
- name: METRICUNSUPPORTEDINTERNATIONALS
  description: Count of attempts that failed due to unsupported international channels
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAMID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAMID references STG_TEAMS.TEAM_ID
- name: stg_campaigns
  source_col: CAMPAIGNID
  ref_col: CAMPAIGN_ID
  type: null
  cardinality: null
  description: CAMPAIGNID references STG_CAMPAIGNS.CAMPAIGN_ID
- name: stg_customers
  source_col: CUSTOMERID
  ref_col: _ID
  type: null
  cardinality: null
  description: CUSTOMERID references STG_CUSTOMERS._ID

---
name: support_revenue
description: Support revenue model for tracking customer service subscription revenue
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: DATE
  description: Date corresponding to the record
  type: DATE
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the associated team
  type: TEXT
  searchable: false
  options: null
- name: BILLING_DUE_DATE
  description: Timestamp indicating when billing is due
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: SUPPORT_PERIOD_START_DATE
  description: Start date of the support period
  type: DATE
  searchable: false
  options: null
- name: SUPPORT_PERIOD_END_DATE
  description: End date of the support period
  type: DATE
  searchable: false
  options: null
- name: NAME
  description: Name of the support service or record
  type: TEXT
  searchable: false
  options: null
- name: REVENUE_TYPE
  description: Category or type of revenue recorded
  type: TEXT
  searchable: true
  options: null
measures:
- name: REVENUE
  description: Sum of revenue generated over the support period
  type: NUMBER
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
version: 2
models:
- name: oms_orders
  data_source_name: null
  schema: null
  database: null
  description: Order management system orders model
  model: null
  entities:
  - name: oms_orders
    ref_: null
    expr: MERCHANT_ID
    type: primary
    description: Unique merchant identifier
    project_path: null
  - name: stg_teams
    ref_: null
    expr: MERCHANT_ID
    type: foreign
    description: Team identifier
    project_path: ../../staging/mongodb/buster_ymls
  dimensions:
  - name: MERCHANT_NAME
    expr: MERCHANT_NAME
    type: string
    description: Name of the merchant
    searchable: true
  - name: MERCHANT_ID
    expr: MERCHANT_ID
    type: string
    description: Unique merchant identifier
    searchable: false
  - name: DATE_PERIOD
    expr: DATE_PERIOD
    type: date
    description: Date of the order period
    searchable: false
  measures:
  - name: OUR_LABEL
    expr: OUR_LABEL
    agg: sum
    description: Count of our labels used
    type: number
  - name: TOTAL_LABELS
    expr: TOTAL_LABELS
    agg: sum
    description: Total count of all labels
    type: number
  - name: FULFILLMENT_RATE
    expr: FULFILLMENT_RATE
    agg: avg
    description: Rate of order fulfillment
    type: number

---
name: extended_warranties_revenue
description: Extended warranties revenue model for tracking warranty service income
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: DATE
  description: Date of the revenue record
  type: date
  searchable: false
  options: null
- name: CHARGE_TYPE
  description: The type of charge applied for the warranty service
  type: TEXT
  searchable: true
  options: null
- name: TEAM_ID
  description: Team identifier
  type: string
  searchable: false
  options: null
measures:
- name: REVENUE
  description: Revenue amount from extended warranties
  type: number
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: stg_upsell_page_analytics_records
description: Staging model for upsell page analytics records from MongoDB. Contains upsell revenue and billing data.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: UPSELL_PAGE_ANALYTICS_RECORD_ID
  description: Unique identifier for the analytics record
  type: string
  searchable: false
  options: null
- name: CREATED_AT
  description: Timestamp when the record was created
  type: timestamp
  searchable: false
  options: null
- name: PRODUCT_ID
  description: ID of the product being upsold
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: ID of the team
  type: string
  searchable: false
  options: null
- name: UPDATED_AT
  description: Timestamp when the record was last updated
  type: timestamp
  searchable: false
  options: null
- name: BILLING_STATUS
  description: Status of billing for the upsell
  type: string
  searchable: true
  options: null
measures:
- name: TOTAL_UPSELL_REVENUE
  description: Total revenue generated from upsells
  type: number
- name: BILLED_AMOUNT_DOLLARS
  description: Amount billed in dollars
  type: number
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: Reference to the team

---
name: teams
description: Teams model containing merchant account information and related metadata
data_source_name: redo
database: dbt
schema: general
dimensions:
- name: TEAM_ID
  description: Unique identifier for the team
  type: TEXT
  searchable: false
  options: null
- name: TEAM_NAME
  description: Name of the team
  type: TEXT
  searchable: true
  options: null
- name: NOTIFICATION_EMAIL
  description: Email address for notifications
  type: TEXT
  searchable: false
  options: null
- name: STORE_URL
  description: URL for the store
  type: TEXT
  searchable: true
  options: null
- name: PAID_MODEL
  description: Indicator of paid model subscription
  type: TEXT
  searchable: true
  options: null
- name: ACCEPTED_BILLING
  description: Flag for accepted billing terms
  type: BOOLEAN
  searchable: false
  options: null
- name: FREE_UNTIL_END_DATE
  description: Date until which free access is available
  type: DATE
  searchable: false
  options: null
- name: PLAN_NAME
  description: Name of the subscription plan
  type: TEXT
  searchable: true
  options: null
- name: TIMEZONE
  description: Time zone setting for the team
  type: TEXT
  searchable: true
  options: null
- name: INCLUDE_IN_REVENUE_REPORTING
  description: Flag to include in revenue reporting
  type: BOOLEAN
  searchable: false
  options: null
- name: RETURNS_ENABLED
  description: Flag indicating if returns are enabled
  type: BOOLEAN
  searchable: false
  options: null
- name: PROTECTION_ENABLED
  description: Flag indicating if protection is enabled
  type: BOOLEAN
  searchable: false
  options: null
- name: TRACKING_ENABLED
  description: Flag indicating if tracking is enabled
  type: BOOLEAN
  searchable: false
  options: null
- name: ACCOUNTS_ENABLED
  description: Flag indicating if multiple accounts are enabled
  type: BOOLEAN
  searchable: false
  options: null
- name: SUPPORT_ENABLED
  description: Flag indicating if support is enabled
  type: BOOLEAN
  searchable: false
  options: null
- name: PPP_ENABLED
  description: Flag indicating if Package Protection Plus is enabled
  type: BOOLEAN
  searchable: false
  options: null
- name: FS_ENABLED
  description: Flag indicating if Final Sale Returns is enabled
  type: BOOLEAN
  searchable: false
  options: null
- name: WARRANTIES_ENABLED
  description: Flag indicating if warranties are enabled
  type: BOOLEAN
  searchable: false
  options: null
- name: COMPANY_OWNER
  description: Owner of the company
  type: TEXT
  searchable: true
  options: null
- name: POST_SALES_OWNER
  description: Owner after sales
  type: TEXT
  searchable: true
  options: null
- name: RETURN_APP
  description: Return application identifier
  type: TEXT
  searchable: false
  options: null
- name: BIG_COMMERCE_EXTENDED_WARRANTIES_CLOSED_WON
  description: Closing timestamp for BigCommerce extended warranties deals
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: BIG_COMMERCE_EXTENDED_WARRANTIES_DEAL_OWNER_NAME
  description: Owner name for BigCommerce extended warranties deal
  type: TEXT
  searchable: false
  options: null
- name: BIG_COMMERCE_EXTENDED_WARRANTIES_DEAL_SOURCE
  description: Source of BigCommerce extended warranties deal
  type: TEXT
  searchable: false
  options: null
- name: BIG_COMMERCE_PACKAGE_PROTECTION_PLUS_CLOSED_WON
  description: Closing timestamp for BigCommerce package protection plus deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: BIG_COMMERCE_PACKAGE_PROTECTION_PLUS_DEAL_OWNER_NAME
  description: Owner name for BigCommerce package protection plus deal
  type: TEXT
  searchable: false
  options: null
- name: BIG_COMMERCE_PACKAGE_PROTECTION_PLUS_DEAL_SOURCE
  description: Source of BigCommerce package protection plus deal
  type: TEXT
  searchable: false
  options: null
- name: BIG_COMMERCE_RETURNS_CLOSED_WON
  description: Closing timestamp for BigCommerce returns deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: BIG_COMMERCE_RETURNS_DEAL_OWNER_NAME
  description: Owner name for BigCommerce returns deal
  type: TEXT
  searchable: false
  options: null
- name: BIG_COMMERCE_RETURNS_DEAL_SOURCE
  description: Source of BigCommerce returns deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_CONCIERGE_CLOSED_WON
  description: Closing timestamp for Commentsold concierge deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: COMMENTSOLD_CONCIERGE_DEAL_OWNER_NAME
  description: Owner name for Commentsold concierge deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_CONCIERGE_DEAL_SOURCE
  description: Source of Commentsold concierge deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_OMS_CLOSED_WON
  description: Closing timestamp for Commentsold OMS deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: COMMENTSOLD_OMS_DEAL_OWNER_NAME
  description: Owner name for Commentsold OMS deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_OMS_DEAL_SOURCE
  description: Source of Commentsold OMS deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_ORDER_TRACKING_CLOSED_WON
  description: Closing timestamp for Commentsold order tracking deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: COMMENTSOLD_ORDER_TRACKING_DEAL_OWNER_NAME
  description: Owner name for Commentsold order tracking deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_ORDER_TRACKING_DEAL_SOURCE
  description: Source of Commentsold order tracking deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_PACKAGE_PROTECTION_CLOSED_WON
  description: Closing timestamp for Commentsold package protection deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: COMMENTSOLD_PACKAGE_PROTECTION_DEAL_OWNER_NAME
  description: Owner name for Commentsold package protection deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_PACKAGE_PROTECTION_DEAL_SOURCE
  description: Source of Commentsold package protection deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_RETURNS_CLOSED_WON
  description: Closing timestamp for Commentsold returns deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: COMMENTSOLD_RETURNS_DEAL_OWNER_NAME
  description: Owner name for Commentsold returns deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_RETURNS_DEAL_SOURCE
  description: Source of Commentsold returns deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_SUPPORT_CLOSED_WON
  description: Closing timestamp for Commentsold support deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: COMMENTSOLD_SUPPORT_DEAL_OWNER_NAME
  description: Owner name for Commentsold support deal
  type: TEXT
  searchable: false
  options: null
- name: COMMENTSOLD_SUPPORT_DEAL_SOURCE
  description: Source of Commentsold support deal
  type: TEXT
  searchable: false
  options: null
- name: COMMERCE_CLOUD_OMS_CLOSED_WON
  description: Closing timestamp for Commerce Cloud OMS deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: COMMERCE_CLOUD_OMS_DEAL_OWNER_NAME
  description: Owner name for Commerce Cloud OMS deal
  type: TEXT
  searchable: false
  options: null
- name: COMMERCE_CLOUD_OMS_DEAL_SOURCE
  description: Source of Commerce Cloud OMS deal
  type: TEXT
  searchable: false
  options: null
- name: COMMERCE_CLOUD_RETURNS_CLOSED_WON
  description: Closing timestamp for Commerce Cloud returns deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: COMMERCE_CLOUD_RETURNS_DEAL_OWNER_NAME
  description: Owner name for Commerce Cloud returns deal
  type: TEXT
  searchable: false
  options: null
- name: COMMERCE_CLOUD_RETURNS_DEAL_SOURCE
  description: Source of Commerce Cloud returns deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_CHECKOUT_OPTIMIZATION_CLOSED_WON
  description: Closing timestamp for Shopify checkout optimization deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_CHECKOUT_OPTIMIZATION_DEAL_OWNER_NAME
  description: Owner name for Shopify checkout optimization deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_CHECKOUT_OPTIMIZATION_DEAL_SOURCE
  description: Source of Shopify checkout optimization deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_CONCIERGE_CLOSED_WON
  description: Closing timestamp for Shopify concierge deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_CONCIERGE_DEAL_OWNER_NAME
  description: Owner name for Shopify concierge deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_CONCIERGE_DEAL_SOURCE
  description: Source of Shopify concierge deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_CUSTOMER_ACCOUNTS_CLOSED_WON
  description: Closing timestamp for Shopify customer accounts deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_CUSTOMER_ACCOUNTS_DEAL_OWNER_NAME
  description: Owner name for Shopify customer accounts deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_CUSTOMER_ACCOUNTS_DEAL_SOURCE
  description: Source of Shopify customer accounts deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_EMAIL_CLOSED_WON
  description: Closing timestamp for Shopify email deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_EMAIL_DEAL_OWNER_NAME
  description: Owner name for Shopify email deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_EMAIL_DEAL_SOURCE
  description: Source of Shopify email deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_EXTENDED_WARRANTIES_CLOSED_WON
  description: Closing timestamp for Shopify extended warranties deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_EXTENDED_WARRANTIES_DEAL_OWNER_NAME
  description: Owner name for Shopify extended warranties deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_EXTENDED_WARRANTIES_DEAL_SOURCE
  description: Source of Shopify extended warranties deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_FINAL_SALE_RETURNS_CLOSED_WON
  description: Closing timestamp for Shopify final sale returns deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_FINAL_SALE_RETURNS_DEAL_OWNER_NAME
  description: Owner name for Shopify final sale returns deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_FINAL_SALE_RETURNS_DEAL_SOURCE
  description: Source of Shopify final sale returns deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_OMS_CLOSED_WON
  description: Closing timestamp for Shopify OMS deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_OMS_DEAL_OWNER_NAME
  description: Owner name for Shopify OMS deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_OMS_DEAL_SOURCE
  description: Source of Shopify OMS deal
  type: TEXT
  searchable: true
  options: null
- name: SHOPIFY_ONE_CLICK_UPSELL_CLOSED_WON
  description: Closing timestamp for Shopify one-click upsell deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_ONE_CLICK_UPSELL_DEAL_OWNER_NAME
  description: Owner name for Shopify one-click upsell deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_ONE_CLICK_UPSELL_DEAL_SOURCE
  description: Source of Shopify one-click upsell deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_ORDER_TRACKING_CLOSED_WON
  description: Closing timestamp for Shopify order tracking deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_ORDER_TRACKING_DEAL_OWNER_NAME
  description: Owner name for Shopify order tracking deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_ORDER_TRACKING_DEAL_SOURCE
  description: Source of Shopify order tracking deal
  type: TEXT
  searchable: true
  options: null
- name: SHOPIFY_PACKAGE_PROTECTION_CLOSED_WON
  description: Closing timestamp for Shopify package protection deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_PACKAGE_PROTECTION_DEAL_OWNER_NAME
  description: Owner name for Shopify package protection deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_PACKAGE_PROTECTION_DEAL_SOURCE
  description: Source of Shopify package protection deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_PACKAGE_PROTECTION_PLUS_CLOSED_WON
  description: Closing timestamp for Shopify package protection plus deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_PACKAGE_PROTECTION_PLUS_DEAL_OWNER_NAME
  description: Owner name for Shopify package protection plus deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_PACKAGE_PROTECTION_PLUS_DEAL_SOURCE
  description: Source of Shopify package protection plus deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_RETURNS_CLOSED_WON
  description: Closing timestamp for Shopify returns deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_RETURNS_DEAL_OWNER_NAME
  description: Owner name for Shopify returns deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_RETURNS_DEAL_SOURCE
  description: Source of Shopify returns deal
  type: TEXT
  searchable: true
  options: null
- name: SHOPIFY_REVIEWS_CLOSED_WON
  description: Closing timestamp for Shopify reviews deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_REVIEWS_DEAL_OWNER_NAME
  description: Owner name for Shopify reviews deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_REVIEWS_DEAL_SOURCE
  description: Source of Shopify reviews deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_SMS_CLOSED_WON
  description: Closing timestamp for Shopify SMS deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_SMS_DEAL_OWNER_NAME
  description: Owner name for Shopify SMS deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_SMS_DEAL_SOURCE
  description: Source of Shopify SMS deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_SUPPORT_CLOSED_WON
  description: Closing timestamp for Shopify support deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_SUPPORT_DEAL_OWNER_NAME
  description: Owner name for Shopify support deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_SUPPORT_DEAL_SOURCE
  description: Source of Shopify support deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_WARRANTIES_CLOSED_WON
  description: Closing timestamp for Shopify warranties deal
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: SHOPIFY_WARRANTIES_DEAL_OWNER_NAME
  description: Owner name for Shopify warranties deal
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_WARRANTIES_DEAL_SOURCE
  description: Source of Shopify warranties deal
  type: TEXT
  searchable: false
  options: null
- name: FIRST_CLOSED_WON_AT
  description: Timestamp for first closed won deal. This is the field that designates the cohort to which this team belongs. The cohort is every team signed in the same month.
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: FIRST_CLOSED_WON_PRODUCT
  description: Product involved in first closed won deal
  type: TEXT
  searchable: true
  options: null
- name: FIRST_CLOSED_WON_PLATFORM
  description: Platform used in first closed won deal
  type: TEXT
  searchable: true
  options: null
- name: RETURNS_CLOSED_WON_DATE
  description: Date for returns closed won deal
  type: DATE
  searchable: false
  options: null
- name: OMS_CLOSED_WON_DATE
  description: Date for OMS closed won deal
  type: DATE
  searchable: false
  options: null
- name: BIG_COMMERCE_EXTENDED_WARRANTIES_DEAL_ID
  description: BigCommerce extended warranties deal ID
  type: NUMBER
  searchable: false
  options: null
- name: BIG_COMMERCE_PACKAGE_PROTECTION_PLUS_DEAL_ID
  description: BigCommerce package protection plus deal ID
  type: NUMBER
  searchable: false
  options: null
- name: BIG_COMMERCE_RETURNS_DEAL_ID
  description: BigCommerce returns deal ID
  type: NUMBER
  searchable: false
  options: null
- name: COMMENTSOLD_CONCIERGE_DEAL_ID
  description: Commentsold concierge deal ID
  type: NUMBER
  searchable: false
  options: null
- name: COMMENTSOLD_OMS_DEAL_ID
  description: Commentsold OMS deal ID
  type: NUMBER
  searchable: false
  options: null
- name: COMMENTSOLD_ORDER_TRACKING_DEAL_ID
  description: Commentsold order tracking deal ID
  type: NUMBER
  searchable: false
  options: null
- name: COMMENTSOLD_PACKAGE_PROTECTION_DEAL_ID
  description: Commentsold package protection deal ID
  type: NUMBER
  searchable: false
  options: null
- name: COMMENTSOLD_RETURNS_DEAL_ID
  description: Commentsold returns deal ID
  type: NUMBER
  searchable: false
  options: null
- name: COMMENTSOLD_SUPPORT_DEAL_ID
  description: Commentsold support deal ID
  type: NUMBER
  searchable: false
  options: null
- name: COMMERCE_CLOUD_OMS_DEAL_ID
  description: Commerce Cloud OMS deal ID
  type: NUMBER
  searchable: false
  options: null
- name: COMMERCE_CLOUD_RETURNS_DEAL_ID
  description: Commerce Cloud returns deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_CHECKOUT_OPTIMIZATION_DEAL_ID
  description: Shopify checkout optimization deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_CONCIERGE_DEAL_ID
  description: Shopify concierge deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_CUSTOMER_ACCOUNTS_DEAL_ID
  description: Shopify customer accounts deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_EMAIL_DEAL_ID
  description: Shopify email deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_EXTENDED_WARRANTIES_DEAL_ID
  description: Shopify extended warranties deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_FINAL_SALE_RETURNS_DEAL_ID
  description: Shopify final sale returns deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_OMS_DEAL_ID
  description: Shopify OMS deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_ONE_CLICK_UPSELL_DEAL_ID
  description: Shopify one-click upsell deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_ORDER_TRACKING_DEAL_ID
  description: Shopify order tracking deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_PACKAGE_PROTECTION_DEAL_ID
  description: Shopify package protection deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_PACKAGE_PROTECTION_PLUS_DEAL_ID
  description: Shopify package protection plus deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_RETURNS_DEAL_ID
  description: Shopify returns deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_REVIEWS_DEAL_ID
  description: Shopify reviews deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_SMS_DEAL_ID
  description: Shopify SMS deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_SUPPORT_DEAL_ID
  description: Shopify support deal ID
  type: NUMBER
  searchable: false
  options: null
- name: SHOPIFY_WARRANTIES_DEAL_ID
  description: Shopify warranties deal ID
  type: NUMBER
  searchable: false
  options: null
measures:
- name: PRICE_PER_ORDER
  description: Total price per order
  type: FLOAT
- name: MERCHANT_PRICE_PER_ORDER
  description: Total merchant price per order
  type: FLOAT
- name: BIG_COMMERCE_EXTENDED_WARRANTIES_DEAL_AMOUNT
  description: Size of BigCommerce extended warranties deal
  type: FLOAT
- name: BIG_COMMERCE_PACKAGE_PROTECTION_PLUS_DEAL_AMOUNT
  description: Size of BigCommerce package protection plus deal
  type: FLOAT
- name: BIG_COMMERCE_RETURNS_DEAL_AMOUNT
  description: Size of BigCommerce returns deal
  type: FLOAT
- name: COMMENTSOLD_CONCIERGE_DEAL_AMOUNT
  description: Size of Commentsold concierge deal
  type: FLOAT
- name: COMMENTSOLD_OMS_DEAL_AMOUNT
  description: Size of Commentsold OMS deal
  type: FLOAT
- name: COMMENTSOLD_ORDER_TRACKING_DEAL_AMOUNT
  description: Size of Commentsold order tracking deal
  type: FLOAT
- name: COMMENTSOLD_PACKAGE_PROTECTION_DEAL_AMOUNT
  description: Size of Commentsold package protection deal
  type: FLOAT
- name: COMMENTSOLD_RETURNS_DEAL_AMOUNT
  description: Size of Commentsold returns deal
  type: FLOAT
- name: COMMENTSOLD_SUPPORT_DEAL_AMOUNT
  description: Size of Commentsold support deal
  type: FLOAT
- name: COMMERCE_CLOUD_OMS_DEAL_AMOUNT
  description: Size of Commerce Cloud OMS deal
  type: FLOAT
- name: COMMERCE_CLOUD_RETURNS_DEAL_AMOUNT
  description: Size of Commerce Cloud returns deal
  type: FLOAT
- name: SHOPIFY_CHECKOUT_OPTIMIZATION_DEAL_AMOUNT
  description: Size of Shopify checkout optimization deal
  type: FLOAT
- name: SHOPIFY_CONCIERGE_DEAL_AMOUNT
  description: Size of Shopify concierge deal
  type: FLOAT
- name: SHOPIFY_CUSTOMER_ACCOUNTS_DEAL_AMOUNT
  description: Size of Shopify customer accounts deal
  type: FLOAT
- name: SHOPIFY_EMAIL_DEAL_AMOUNT
  description: Size of Shopify email deal
  type: FLOAT
- name: SHOPIFY_EXTENDED_WARRANTIES_DEAL_AMOUNT
  description: Size of Shopify extended warranties deal
  type: FLOAT
- name: SHOPIFY_FINAL_SALE_RETURNS_DEAL_AMOUNT
  description: Size of Shopify final sale returns deal
  type: FLOAT
- name: SHOPIFY_OMS_DEAL_AMOUNT
  description: Size of Shopify OMS deal
  type: FLOAT
- name: SHOPIFY_ONE_CLICK_UPSELL_DEAL_AMOUNT
  description: Size of Shopify one-click upsell deal
  type: FLOAT
- name: SHOPIFY_ORDER_TRACKING_DEAL_AMOUNT
  description: Size of Shopify order tracking deal
  type: FLOAT
- name: SHOPIFY_PACKAGE_PROTECTION_DEAL_AMOUNT
  description: Size of Shopify package protection deal
  type: FLOAT
- name: SHOPIFY_PACKAGE_PROTECTION_PLUS_DEAL_AMOUNT
  description: Size of Shopify package protection plus deal
  type: FLOAT
- name: SHOPIFY_RETURNS_DEAL_AMOUNT
  description: Size of Shopify returns deal
  type: FLOAT
- name: SHOPIFY_REVIEWS_DEAL_AMOUNT
  description: Size of Shopify reviews deal
  type: FLOAT
- name: SHOPIFY_SMS_DEAL_AMOUNT
  description: Size of Shopify SMS deal
  type: FLOAT
- name: SHOPIFY_SUPPORT_DEAL_AMOUNT
  description: Size of Shopify support deal
  type: FLOAT
- name: SHOPIFY_WARRANTIES_DEAL_AMOUNT
  description: Size of Shopify warranties deal
  type: FLOAT
- name: FIRST_CLOSED_WON_DEAL_AMOUNT
  description: Size of first closed won deal
  type: FLOAT
- name: RETURNS_DEAL_AMOUNT
  description: Size of returns deal
  type: FLOAT
- name: OMS_DEAL_AMOUNT
  description: Size of OMS deal
  type: FLOAT
metrics: []
filters: []
relationships: []

---
version: 2
models:
- name: cxp_revenue
  data_source_name: null
  schema: revenue
  database: dbt
  description: CXP revenue model
  model: null
  entities:
  - name: teams
    ref_: null
    expr: TEAM_ID
    type: foreign
    description: Reference to the general teams table
    project_path: ../../general/buster_ymls
  dimensions:
  - name: DATE
    expr: DATE
    type: DATE
    description: Date when the revenue event was recorded
    searchable: false
  - name: TEAM_ID
    expr: TEAM_ID
    type: string
    description: Unique team identifier
    searchable: false
  - name: TEAM_NAME
    expr: TEAM_NAME
    type: string
    description: Name of the team
    searchable: true
  - name: PERIOD_START_DATE
    expr: PERIOD_START_DATE
    type: DATE
    description: Beginning date of the revenue period
    searchable: false
  - name: PERIOD_END_DATE
    expr: PERIOD_END_DATE
    type: DATE
    description: Ending date of the revenue period
    searchable: false
  - name: REVENUE_TYPE
    expr: REVENUE_TYPE
    type: TEXT
    description: Category or classification of the revenue generated
    searchable: false
  measures:
  - name: REVENUE
    expr: REVENUE
    agg: sum
    description: Sum of revenue values aggregated over the period
    type: NUMBER
  metrics: []
  segments: []

---
name: stg_order_shipping_lines
description: Generated model for stg_order_shipping_lines
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: ORDER_ID
  description: Unique identifier for the order
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the team associated with the order
  type: TEXT
  searchable: false
  options: null
- name: SHIPPING_LINE_ID
  description: Unique identifier for the shipping line
  type: TEXT
  searchable: false
  options: null
- name: ORDER_UPDATED_AT
  description: Timestamp when the order was last updated
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: ORDER_CREATED_AT
  description: Timestamp when the order was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: TITLE
  description: Title of the shipping line
  type: TEXT
  searchable: false
  options: null
- name: CODE
  description: Shipping code identifier
  type: TEXT
  searchable: false
  options: null
- name: PRICE_SET_SHOP_MONEY_CURRENCY_CODE
  description: Currency code for shop money pricing
  type: TEXT
  searchable: false
  options: null
- name: PRICE_SET_PRESENTMENT_MONEY_CURRENCY_CODE
  description: Currency code for presentment money pricing
  type: TEXT
  searchable: false
  options: null
- name: DISCOUNTED_PRICE_SET_SHOP_MONEY_CURRENCY_CODE
  description: Currency code for discounted shop money pricing
  type: TEXT
  searchable: false
  options: null
- name: DISCOUNTED_PRICE_SET_PRESENTMENT_MONEY_CURRENCY_CODE
  description: Currency code for discounted presentment money pricing
  type: TEXT
  searchable: false
  options: null
- name: CARRIER_IDENTIFIER
  description: Identifier for the shipping carrier
  type: TEXT
  searchable: false
  options: null
- name: SOURCE
  description: Source of the shipping information
  type: TEXT
  searchable: false
  options: null
measures:
- name: PRICE
  description: Total price for the shipping line
  type: NUMBER
- name: PRICE_SET_SHOP_MONEY_AMOUNT
  description: Sum of shop money amounts for pricing
  type: NUMBER
- name: PRICE_SET_PRESENTMENT_MONEY_AMOUNT
  description: Sum of presentment money amounts for pricing
  type: NUMBER
- name: DISCOUNTED_PRICE
  description: Total discounted price for the shipping line
  type: NUMBER
- name: DISCOUNTED_PRICE_SET_SHOP_MONEY_AMOUNT
  description: Sum of discounted shop money amounts for pricing
  type: NUMBER
- name: DISCOUNTED_PRICE_SET_PRESENTMENT_MONEY_AMOUNT
  description: Sum of discounted presentment money amounts for pricing
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID
- name: stg_orders
  source_col: ORDER_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: ORDER_ID references STG_ORDERS._ID

---
name: stg_balance_transactions
description: Generated model for stg_balance_transactions
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: BALANCE_TRANSACTION_ID
  description: Unique identifier for the balance transaction
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the team associated with the transaction
  type: TEXT
  searchable: false
  options: null
- name: CREATED_AT
  description: Timestamp when the transaction was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: FULFILLMENT_GROUP_ID
  description: Identifier for the associated fulfillment group
  type: TEXT
  searchable: false
  options: null
- name: CURRENCY
  description: Currency code in which the transaction occurs
  type: TEXT
  searchable: true
  options: null
- name: DESCRIPTION
  description: Details or notes related to the transaction
  type: TEXT
  searchable: false
  options: null
- name: STATUS
  description: Current state of the transaction
  type: TEXT
  searchable: true
  options: null
measures:
- name: AMOUNT
  description: Total amount of the transaction
  type: NUMBER
- name: FEE
  description: Associated fee amount for the transaction
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_satisfaction_responses
description: Staging model for satisfaction responses from MongoDB. Contains customer satisfaction survey responses.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Primary identifier for the satisfaction response
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: Reference to the team
  type: string
  searchable: false
  options: null
- name: CREATEDAT
  description: Timestamp when the response was created
  type: timestamp
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the response was last updated
  type: timestamp
  searchable: false
  options: null
- name: CHANNEL
  description: Channel through which the response was collected
  type: string
  searchable: true
  options: null
- name: COMMENT
  description: Customer's comment with their response
  type: string
  searchable: false
  options: null
- name: CONVERSATION_ID
  description: Reference to the conversation
  type: string
  searchable: false
  options: null
- name: EMAILSENT
  description: Flag indicating if email was sent
  type: boolean
  searchable: false
  options: null
- name: SENDAT
  description: Timestamp when the survey was sent
  type: timestamp
  searchable: false
  options: null
- name: SENDTOEMAIL
  description: Email address to send the survey to
  type: string
  searchable: false
  options: null
- name: STATUS
  description: Status of the satisfaction response
  type: string
  searchable: true
  options: null
measures:
- name: RATING
  description: Satisfaction rating score
  type: number
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_public_api_coverage_infos
description: Generated model for stg_public_api_coverage_infos
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Unique identifier for the record
  type: TEXT
  searchable: false
  options: null
- name: CREATED_AT
  description: Timestamp when the record was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: UPDATED_AT
  description: Timestamp when the record was last updated
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the associated team
  type: TEXT
  searchable: false
  options: null
- name: REQUEST_CUSTOMER_ID
  description: Identifier for the customer making the request
  type: TEXT
  searchable: false
  options: null
- name: REQUEST_CART_PRICE_TOTAL_CURRENCY
  description: Currency code for the total cart price in the request
  type: TEXT
  searchable: false
  options: null
- name: RESPONSE_COVERAGE_ID
  description: Identifier for the coverage included in the response
  type: TEXT
  searchable: false
  options: null
- name: RESPONSE_COVERAGE_PRICE_CURRENCY
  description: Currency code for the coverage price in the response
  type: TEXT
  searchable: false
  options: null
- name: RESPONSE_COVERAGE_MERCHANT_PRICE_CURRENCY
  description: Currency code for the merchant coverage price in the response
  type: TEXT
  searchable: false
  options: null
measures:
- name: REQUEST_CART_PRICE_TOTAL_AMOUNT
  description: Total amount summed for the request cart prices
  type: NUMBER
- name: RESPONSE_COVERAGE_PRICE_AMOUNT
  description: Total amount summed for the response coverage prices
  type: NUMBER
- name: RESPONSE_COVERAGE_MERCHANT_PRICE_AMOUNT
  description: Total amount summed for the merchant coverage prices in responses
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_conversation_messages
description: Staging model for conversation messages from MongoDB. Contains individual message data and related conversation attributes.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: MESSAGE_ID
  description: Unique identifier for the message.
  type: string
  searchable: false
  options: null
- name: USER_ID
  description: The user who wrote the message
  type: string
  searchable: true
  options: null
- name: MESSAGE_CREATED_AT
  description: Timestamp when the message was created
  type: timestamp
  searchable: false
  options: null
- name: MESSAGE_UPDATED_AT
  description: Timestamp when the message was last updated
  type: timestamp
  searchable: false
  options: null
- name: TYPE
  description: Type of the message
  type: string
  searchable: true
  options: null
- name: VISIBILITY
  description: Visibility setting of the message
  type: string
  searchable: true
  options: null
- name: IS_EXTERNAL_ORIGIN
  description: Boolean flag indicating if the message originated externally
  type: boolean
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the team associated with the conversation.
  type: string
  searchable: false
  options: null
- name: CONVERSATION_ID
  description: Unique identifier for the conversation thread.
  type: string
  searchable: false
  options: null
- name: CONVERSATION_STATUS
  description: Status of the parent conversation
  type: string
  searchable: true
  options: null
- name: CONVERSATION_CREATED_AT
  description: Timestamp when the parent conversation was created
  type: timestamp
  searchable: false
  options: null
- name: CONVERSATION_CLOSED_AT
  description: Timestamp when the parent conversation was closed
  type: timestamp
  searchable: false
  options: null
- name: CONVERSATION_ASSIGNEE
  description: Assignee of the parent conversation
  type: string
  searchable: true
  options: null
- name: CONVERSATION_PLATFORM
  description: Messaging platform or source for the conversation.
  type: TEXT
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_users
  source_col: USER_ID
  ref_col: USER_ID
  type: null
  cardinality: null
  description: stg_conversation_messages USER_ID references stg_users USER_ID
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID
- name: stg_concierge_conversations
  source_col: CONVERSATION_ID
  ref_col: CONVERSATION_ID
  type: null
  cardinality: null
  description: Foreign key from stg_conversation_messages to STG_CONCIERGE_CONVERSATIONS

---
name: stg_balances
description: Generated model for stg_balances
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: BALANCE_ID
  description: Unique identifier for the balance record
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the associated team
  type: TEXT
  searchable: false
  options: null
- name: KIND
  description: Type indicator for the balance record
  type: TEXT
  searchable: false
  options: null
- name: ALERT_STATUS
  description: Current alert status for the balance
  type: TEXT
  searchable: false
  options: null
- name: CREATED_AT
  description: Timestamp when the balance record was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: UPDATED_AT
  description: Timestamp when the balance record was last updated
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
measures:
- name: AMOUNT
  description: Monetary amount of the balance
  type: NUMBER
- name: ALERT_THRESHOLD
  description: Threshold value that triggers an alert
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_product_tags
description: Staging model for product tags from MongoDB. Contains product tag associations.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: PRODUCT_ID
  description: Reference to the product
  type: string
  searchable: false
  options: null
- name: LEGACY_ID
  description: Legacy product identifier
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: Reference to the team
  type: string
  searchable: false
  options: null
- name: TAG
  description: Tag value associated with the product
  type: string
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the tag association was last updated
  type: timestamp
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_products
  source_col: PRODUCT_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: Foreign key from stg_product_tags to STG_PRODUCTS
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: warranties_revenue_custom_merchants
description: Custom merchant revenue model for special partnership arrangements
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: TEAM_ID
  description: Identifier for the team
  type: string
  searchable: false
  options: null
- name: TEAM_NAME
  description: Name of the team
  type: string
  searchable: false
  options: null
- name: DATE
  description: Date of the revenue record
  type: date
  searchable: false
  options: null
- name: PLATFORM
  description: Platform identifier (shopify, etc.)
  type: string
  searchable: true
  options: null
measures:
- name: PP_PLUS_REVENUE
  description: Revenue from package protection plus operations
  type: number
- name: FSR_REVENUE
  description: Revenue from final sale returns
  type: number
- name: SHIPSURANCE_PREMIUM
  description: Amount paid to Shipsurance for insurance
  type: number
- name: INSURED_ORDER_VALUE
  description: Value of orders with insurance
  type: number
- name: FSR_ORDER_COUNT
  description: Count of orders with final sale returns
  type: number
- name: PP_PLUS_ORDER_COUNT
  description: Count of orders with package protection plus
  type: number
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: email_sms_revenue
description: Email and SMS marketing revenue tracking model
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: DATE
  description: Date associated with the revenue event
  type: DATE
  searchable: false
  options: null
- name: TEAM_ID
  description: Unique identifier for the team
  type: TEXT
  searchable: false
  options: null
- name: TEAM_NAME
  description: Name of the team
  type: TEXT
  searchable: false
  options: null
- name: REVENUE_TYPE
  description: Type of revenue source, such as email or SMS. Can be sms_usage, email_usage, email_subscription, or sms_subscription
  type: TEXT
  searchable: true
  options: null
- name: REVENUE_TIMING
  description: Classification of revenue timing for recognition purposes (billed or accruing)
  type: TEXT
  searchable: true
  options: null
- name: KIND
  description: Category or classification of revenue (marketing-email, marketing-sms)
  type: TEXT
  searchable: true
  options: null
- name: PERIOD_START_DATE
  description: Start date of the revenue period
  type: DATE
  searchable: false
  options: null
- name: PERIOD_END_DATE
  description: End date of the revenue period
  type: DATE
  searchable: false
  options: null
measures:
- name: REVENUE_CASH_BASED
  description: Total cash-based revenue aggregated over the period
  type: FLOAT
- name: REVENUE_ACCRUAL_BASED
  description: Total accrual-based revenue aggregated over the period
  type: FLOAT
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: one_click_upsell_revenue
description: One click upsell revenue model for tracking post-purchase offer revenue
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: UPSELL_PAGE_ANALYTICS_RECORD_ID
  description: Unique identifier for the upsell record
  type: string
  searchable: false
  options: null
- name: DATE
  description: Date of the revenue record
  type: date
  searchable: false
  options: null
- name: TEAM_ID
  description: Team identifier
  type: string
  searchable: false
  options: null
measures:
- name: ONE_CLICK_UPSELL_REVENUE
  description: Revenue from one click upsells
  type: number
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: ai_revenue
description: AI-generated revenue data including subscription and resolution-based pricing
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: team_id
  description: Unique identifier for the team. Used as primary key and for joining to teams table.
  type: TEXT
  searchable: false
  options: null
- name: team_name
  description: Name of the team. Used for identifying and grouping revenue by merchants.
  type: TEXT
  searchable: true
  options: null
- name: date
  description: Date associated with the revenue record. Used for time-based analysis and reporting.
  type: DATE
  searchable: false
  options: null
- name: revenue_type
  description: Category of revenue (Subscription or Resolution-based). Indicates pricing model used.
  type: TEXT
  searchable: true
  options: null
measures:
- name: revenue
  description: Total revenue amount in USD. Used for revenue calculations and analysis.
  type: NUMBER
- name: resolved_conversation_count
  description: Number of resolved conversations for resolution-based pricing calculations.
  type: NUMBER
metrics: []
filters: []
relationships:
- name: teams
  source_col: team_id
  ref_col: team_id
  type: null
  cardinality: null
  description: The team associated with this revenue. Enables team-centric revenue analysis.

---
name: label_revenue
description: Label revenue model for analyzing returns and shipping operations
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: NAME
  description: Name of the merchant
  type: string
  searchable: true
  options: null
- name: ID
  description: Unique identifier for merchant
  type: string
  searchable: false
  options: null
- name: DATE
  description: Date of the revenue record
  type: date
  searchable: false
  options: null
- name: PLATFORM
  description: Platform identifier (shopify, commentsold, commerce-cloud)
  type: string
  searchable: true
  options: null
- name: CLOSED_WON_DATE
  description: Date when the deal was closed
  type: date
  searchable: false
  options: null
measures:
- name: RETURNS
  description: Total number of returns
  type: number
- name: RETURNS_COVERED
  description: Number of covered returns
  type: number
- name: RETURNS_ELIGIBLE
  description: Number of returns eligible for coverage
  type: number
- name: ORDERS_RETURNED
  description: Total number of orders returned
  type: number
- name: ORDERS_RETURNED_COVERED
  description: Number of covered orders returned
  type: number
- name: ORDERS_RETURNED_ELIGIBLE
  description: Number of eligible orders returned
  type: number
- name: RETURNS_COVERED_USING
  description: Number of returns using coverage
  type: number
- name: SAFETY_NET_REVENUE
  description: Revenue from safety net cases
  type: number
- name: SHIPPING_SHARE_REVENUE
  description: Revenue from shipping share
  type: number
- name: CUSTOMER_REFUND_REVENUE
  description: Revenue from customer refunds
  type: number
- name: SUPPORT_REVENUE
  description: Revenue from support services
  type: number
- name: PACKAGE_PICKUP_REVENUE
  description: Revenue from package pickups
  type: number
- name: PACKAGE_PICKUP_REFUND
  description: Refunds for package pickups
  type: number
- name: FINAL_SALE_CREDITS
  description: Credits for final sales
  type: number
- name: LABEL_REFUNDS
  description: Refunds for labels
  type: number
- name: CUSTOMER_REVENUE
  description: Revenue from customers
  type: number
- name: SHIPMENTS
  description: Total number of shipments
  type: number
- name: SHIPMENTS_NOT_OPEN
  description: Number of shipments not open
  type: number
- name: RETURN_LAG_DAYS
  description: Average days between order and return
  type: number
- name: RETURNS_NOT_REJECTED
  description: Number of returns not rejected
  type: number
metrics: []
filters: []
relationships:
- name: teams
  source_col: ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: total_revenue_by_hour
description: Hourly revenue totals model aggregating all revenue streams
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: MERCHANT_NAME
  description: Name of the merchant
  type: string
  searchable: true
  options: null
- name: MERCHANT_ID
  description: Also known as team name - Unique merchant identifier
  type: string
  searchable: false
  options: null
- name: REVENUE_TYPE
  description: Primary type of revenue (labels, coverage, order_tracking, etc.)
  type: string
  searchable: true
  options: null
- name: SUB_REVENUE_TYPE
  description: Secondary type of revenue (product-specific categories)
  type: string
  searchable: true
  options: null
- name: PLATFORM
  description: Platform identifier (shopify, commentsold, etc.)
  type: string
  searchable: true
  options: null
- name: OWNER
  description: Deal owner of this merchants revenue type. Would refer to the sales rep that owns the deal.
  type: TEXT
  searchable: false
  options: null
- name: COMPLIANT
  description: Whether the merchant is compliant with platform requirements
  type: boolean
  searchable: false
  options: null
- name: DATE_PERIOD
  description: Timestamp of the revenue period
  type: timestamp
  searchable: false
  options: null
measures:
- name: REVENUE
  description: Total revenue amount
  type: number
- name: REVENUE_CASH_BASED
  description: Cash-based revenue calculation
  type: FLOAT
- name: MARGIN
  description: Average margin percentage
  type: number
- name: COUNT
  description: Count of revenue records
  type: number
metrics: []
filters: []
relationships:
- name: teams
  source_col: MERCHANT_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: coverage_revenue
description: Coverage revenue model for analyzing insurance and protection products
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: NAME
  description: Name of the merchant
  type: string
  searchable: true
  options: null
- name: STORE_URL
  description: URL of the merchant's store
  type: string
  searchable: false
  options: null
- name: ID
  description: Unique identifier for merchant
  type: string
  searchable: false
  options: null
- name: PLATFORM
  description: Platform identifier (shopify, commentsold, commerce-cloud)
  type: string
  searchable: true
  options: null
- name: COMPLIANT
  description: Whether the revenue for that day is compliant with program requirements
  type: boolean
  searchable: false
  options: null
- name: CLOSED_WON_DATE
  description: Date when the deal was closed with that merchant
  type: date
  searchable: false
  options: null
- name: PAID_MODEL
  description: Type of payment model used for coverage
  type: string
  searchable: true
  options: null
- name: DATE
  description: Date of the revenue record
  type: date
  searchable: false
  options: null
measures:
- name: CUSTOMER_PRICE_PER_ORDER
  description: Average price charged to customer per order
  type: number
- name: MERCHANT_PRICE_PER_ORDER
  description: Average price charged to merchant per order
  type: number
- name: ORDERS
  description: Total number of orders
  type: number
- name: ELIGIBLE_ORDERS
  description: Number of orders eligible for coverage
  type: number
- name: COVERED_ORDERS
  description: Number of orders with coverage
  type: number
- name: EXCHANGE_ORDERS
  description: Total number of exchange orders
  type: number
- name: ELIGIBLE_EXCHANGE_ORDERS
  description: Number of exchange orders eligible for coverage
  type: number
- name: COVERED_EXCHANGE_ORDERS
  description: Number of exchange orders with coverage
  type: number
- name: PACKAGE_PROTECTION_COUNT
  description: Count of package protections
  type: number
- name: LINE_ITEM_COUNT
  description: Total count of line items
  type: number
- name: ELIGIBLE_LINE_ITEM_COUNT
  description: Count of eligible line items
  type: number
- name: COVERAGE_REVENUE
  description: Total revenue from coverage
  type: number
- name: COVERAGE_INCOME
  description: Total income from coverage
  type: number
- name: FINAL_SALE_RETURNS_COVERAGE_INCOME
  description: Income from final sale returns coverage
  type: number
- name: COVERAGE_REFUND
  description: Total refunds from coverage
  type: number
- name: AVG_COVERAGE_PRICE
  description: Average price of coverage
  type: number
- name: MERCHANT_REVENUE
  description: Total revenue from merchants
  type: number
- name: PACKAGE_PROTECTION_REVENUE
  description: Revenue from package protection
  type: number
- name: TOV
  description: Total order value
  type: number
metrics: []
filters: []
relationships:
- name: teams
  source_col: ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: coverage_attachment
description: Generated model for coverage_attachment
data_source_name: redo
database: dbt
schema: attachment
dimensions:
- name: TEAM
  description: Team identifier
  type: TEXT
  searchable: false
  options: null
- name: TEAM_NAME
  description: Name of the merchant receiving the order
  type: TEXT
  searchable: false
  options: null
- name: ORDER_DATE
  description: Date when the order was placed
  type: DATE
  searchable: false
  options: null
- name: PROVIDER
  description: Platform provider associated with the order
  type: TEXT
  searchable: false
  options: null
measures:
- name: PROTECTED_ORDERS
  description: Total number of orders with coverage applied
  type: NUMBER
- name: ELIGIBLE_ORDERS
  description: Total number of orders eligible for coverage evaluation
  type: NUMBER
- name: TOTAL_ORDERS
  description: Overall count of orders processed
  type: NUMBER
- name: ATTACHMENT_RATE
  description: Rate of coverage attachment across orders
  type: NUMBER
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: ris_attachment
description: Generated model for ris_attachment
data_source_name: redo
database: dbt
schema: attachment
dimensions:
- name: DATE
  description: Date when the attachment record was created or recorded
  type: DATE
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier of the team associated with the record
  type: TEXT
  searchable: false
  options: null
- name: NAME
  description: Name of the merchant
  type: TEXT
  searchable: false
  options: null
measures:
- name: RIS_ORDERS
  description: Total number of RIS orders processed in the model
  type: NUMBER
- name: REDO_ELIGIBLE_ORDERS
  description: Count of orders eligible for a redo process
  type: NUMBER
- name: RIS_ATTACH_RATE
  description: Rate of attachments in RIS orders
  type: NUMBER
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: pp_plus_revenue
description: Package protection plus revenue tracking model
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: TEAM_ID
  description: Unique identifier for the team.
  type: string
  searchable: false
  options: null
- name: DATE
  description: The timestamp indicating the date associated with this record.
  type: timestamp
  searchable: false
  options: null
measures:
- name: PACKAGE_PROTECTION_PLUS_REVENUE
  description: Total revenue generated from package protection plus services.
  type: number
- name: OWED_TO_SHIPSURANCE
  description: Total amount owed to Shipsurance.
  type: number
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: order_tracking_revenue
description: Order tracking revenue model for monitoring order tracking service revenue
data_source_name: redo
database: dbt
schema: revenue
dimensions:
- name: DATE
  description: Date of the revenue record
  type: date
  searchable: false
  options: null
- name: MERCHANT_NAME
  description: Name of the merchant
  type: string
  searchable: false
  options: null
- name: MERCHANT_ID
  description: Unique merchant identifier
  type: string
  searchable: false
  options: null
- name: PLATFORM
  description: Platform identifier
  type: string
  searchable: true
  options: null
- name: CLOSED_WON_DATE
  description: Date when the deal was closed
  type: date
  searchable: false
  options: null
- name: ACCEPTED_BILLING
  description: Whether billing has been accepted
  type: boolean
  searchable: false
  options: null
- name: FREE_UNTIL_END_DATE
  description: End date of free period
  type: date
  searchable: false
  options: null
measures:
- name: DEAL_SIZE_RATE
  description: Rate for deal size
  type: number
- name: BILLED_REVENUE
  description: Revenue from billed orders
  type: number
- name: BILLED_ORDER_COUNT
  description: Count of billed orders
  type: number
- name: TOTAL_ORDER_COUNT
  description: Total count of all orders
  type: number
- name: CALCULATED_PRICE_PER_ORDER
  description: Calculated price per order
  type: number
metrics: []
filters: []
relationships:
- name: teams
  source_col: MERCHANT_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: commentsold_attachment
description: Generated model for commentsold_attachment
data_source_name: redo
database: dbt
schema: attachment
dimensions:
- name: TEAM_NAME
  description: Team name associated with the order
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: Unique identifier for the team
  type: TEXT
  searchable: false
  options: null
- name: ORDER_DATE
  description: Date when the order was placed
  type: DATE
  searchable: false
  options: null
measures:
- name: ORDERS
  description: Total number of orders received
  type: NUMBER
- name: ELIGIBLE_ORDERS
  description: Number of orders eligible for coverage
  type: NUMBER
- name: PROTECTED_ORDERS
  description: Number of orders with coverage
  type: NUMBER
- name: ATTACHMENT_RATE
  description: Percentage rate of eligible orders with coverage
  type: NUMBER
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: oms_usage
description: Generated model for oms_usage
data_source_name: redo
database: dbt
schema: attachment
dimensions:
- name: MERCHANT_NAME
  description: Merchant name for the transaction record
  type: TEXT
  searchable: false
  options: null
- name: MERCHANT_ID
  description: Unique identifier for the merchant
  type: TEXT
  searchable: false
  options: null
- name: DATE_PERIOD
  description: The date or period during which the data was recorded
  type: DATE
  searchable: false
  options: null
measures:
- name: OUR_LABEL
  description: Sum of count of labels purchased through our platform
  type: NUMBER
- name: TOTAL_LABELS
  description: Sum of total labels recorded in transactions
  type: NUMBER
- name: FULFILLMENT_RATE
  description: Aggregated rate of labels purchased through our platform
  type: NUMBER
- name: REVENUE
  description: Total revenue computed from the transactions
  type: FLOAT
metrics: []
filters: []
relationships:
- name: teams
  source_col: MERCHANT_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: package_pickup_usage
description: Generated model for package_pickup_usage
data_source_name: redo
database: dbt
schema: attachment
dimensions:
- name: TEAM_NAME
  description: Merchant name receiving the package
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: Unique identifier for the merchant
  type: TEXT
  searchable: false
  options: null
- name: DAY
  description: The date when the pickup events was requested
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
measures:
- name: TOTAL_RETURNS
  description: Total number of returns recorded
  type: NUMBER
- name: SHIPPING_RETURNS
  description: Number of returns requiring shipping
  type: NUMBER
- name: ALL_PICKUPS
  description: Total count of package pickups requested
  type: NUMBER
- name: SUCCESSFUL_PICKUPS
  description: Count of pickups completed successfully
  type: NUMBER
- name: PENDING_PICKUPS
  description: Count of pickups awaiting completion
  type: NUMBER
- name: FAILED_PICKUPS
  description: Count of pickups that failed
  type: NUMBER
metrics: []
filters: []
relationships:
- name: teams
  source_col: TEAM_ID
  ref_col: team_id
  type: null
  cardinality: null
  description: Reference to the general teams table

---
name: stg_returns
description: Staging model for returns from MongoDB. Contains details about return requests. Does not join directly to the orders table. In order to join to the orders table you must use the stg_return_line_items table as the relationship between returns and orders lives on the line item level.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Primary identifier for the return
  type: string
  searchable: false
  options: null
- name: STATUS
  description: Current status of the return
  type: string
  searchable: true
  options: null
- name: TEAM
  description: Reference to the team
  type: string
  searchable: false
  options: null
- name: WRONGPRODUCT
  description: Flag indicating if wrong product was received
  type: boolean
  searchable: true
  options: null
- name: DAMAGED
  description: Flag indicating if product was damaged
  type: boolean
  searchable: true
  options: null
- name: TYPE
  description: Type of return
  type: string
  searchable: true
  options: null
- name: REJECTTYPE
  description: Reason for rejection if applicable
  type: TEXT
  searchable: true
  options: null
- name: COMPENSATION_METHODS
  description: Compensation methods for the return
  type: string
  searchable: true
  options: null
- name: COMPLETEDAT
  description: Timestamp when the return was completed
  type: timestamp
  searchable: false
  options: null
- name: CURRENCY
  description: Currency used for the return
  type: string
  searchable: true
  options: null
- name: CREATEDAT
  description: Timestamp when the return was created
  type: timestamp
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the return was last updated
  type: timestamp
  searchable: false
  options: null
- name: APPROVEDAT
  description: Timestamp when the return was approved
  type: timestamp
  searchable: false
  options: null
- name: APPROVEDBY
  description: User who approved the return
  type: string
  searchable: false
  options: null
- name: PROCESSEDAT
  description: Timestamp when the return was processed
  type: timestamp
  searchable: false
  options: null
- name: PROCESSEDBY
  description: User who processed the return
  type: string
  searchable: false
  options: null
- name: EXPIRATIONDATE
  description: Expiration date of the return offer
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: TESTID
  description: Reference to the test if this is an AB test return
  type: string
  searchable: false
  options: null
- name: TREATMENTID
  description: Reference to the treatment if this is a AB test return
  type: string
  searchable: false
  options: null
- name: REFERRALID
  description: Identifier for the referral process
  type: TEXT
  searchable: false
  options: null
- name: PICKUP_PHONE
  description: Phone number associated with the pickup.
  type: TEXT
  searchable: false
  options: null
- name: PICKUP_EMAIL
  description: Email address associated with the pickup.
  type: TEXT
  searchable: false
  options: null
- name: PICKUP_DATE
  description: Scheduled date for pickup.
  type: DATE
  searchable: false
  options: null
- name: PICKUP_PACKAGE_LOCATION
  description: Location of the pickup package.
  type: TEXT
  searchable: false
  options: null
- name: PICKUP_SPECIAL_INSTRUCTIONS
  description: Any special instructions for pickup.
  type: TEXT
  searchable: false
  options: null
- name: PICKUP_TEXT_REMINDER
  description: Indicates if a text reminder was sent for pickup.
  type: BOOLEAN
  searchable: false
  options: null
- name: PICKUP_EXISTS
  description: Flag indicating if a pickup record exists.
  type: BOOLEAN
  searchable: false
  options: null
- name: PICKUP_SURVEY_SENT
  description: Flag indicating if a survey was sent after pickup.
  type: BOOLEAN
  searchable: false
  options: null
- name: PICKUP_CANCELATION_EXISTS
  description: Flag indicating if pickup cancellation exists.
  type: BOOLEAN
  searchable: false
  options: null
- name: PICKUP_CANCELATION_STATUS
  description: Status of the pickup cancellation process.
  type: TEXT
  searchable: true
  options: null
- name: PICKUP_CANCELATION_CONFIRMATION_NUMBER
  description: Confirmation number for the pickup cancellation.
  type: TEXT
  searchable: false
  options: null
- name: PICKUP_CANCELATION_PICKUP_DATE
  description: Original pickup date before cancellation.
  type: DATE
  searchable: false
  options: null
- name: PICKUP_CANCELATION_WAS_REFUNDED
  description: Flag indicating if the cancellation was refunded.
  type: BOOLEAN
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: Reference to the team
- name: stg_treatments
  source_col: TREATMENTID
  ref_col: TREATMENT_ID
  type: null
  cardinality: null
  description: TREATMENTID references stg_treatments.TREATMENT_ID

---
name: stg_customer_group_memberships
description: Staging model for customer group memberships from MongoDB. Contains customer group associations.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: CUSTOMER_ID
  description: Unique identifier for the customer
  type: string
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp indicating the last update time of the record
  type: timestamp
  searchable: false
  options: null
- name: TEAM
  description: Team associated with the customer group membership
  type: string
  searchable: false
  options: null
- name: GROUP_ID
  description: Identifier for the customer group
  type: string
  searchable: false
  options: null
- name: ADDED_AT
  description: Timestamp when the customer was added to the group
  type: timestamp
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM references STG_TEAMS.TEAM_ID
- name: stg_customers
  source_col: CUSTOMER_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: CUSTOMER_ID references STG_CUSTOMERS._ID
- name: stg_customergroups
  source_col: GROUP_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: GROUP_ID references STG_CUSTOMERGROUPS._ID

---
name: stg_products
description: Staging model for products from MongoDB. Contains product details and metadata.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Primary identifier for the product
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: Reference to the team
  type: string
  searchable: false
  options: null
- name: IDENTIFIER
  description: Product identifier
  type: string
  searchable: false
  options: null
- name: LEGACY_ID
  description: Legacy product identifier
  type: string
  searchable: false
  options: null
- name: NAME
  description: Product name
  type: string
  searchable: true
  options: null
- name: PRODUCT_TYPE
  description: Type of product
  type: string
  searchable: true
  options: null
- name: VENDOR
  description: Product vendor
  type: string
  searchable: true
  options: null
- name: SKU
  description: Stock keeping unit
  type: string
  searchable: true
  options: null
- name: PARENT
  description: Reference to parent product if exists
  type: string
  searchable: false
  options: null
- name: IS_PRODUCT
  description: Flag indicating if this is a product
  type: boolean
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the product was last updated
  type: timestamp
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID
- name: stg_products
  source_col: PARENT
  ref_col: _ID
  type: null
  cardinality: null
  description: Self-referential relationship referencing parent product via PARENT

---
name: stg_treatments
description: Staging model for treatments from MongoDB. Contains treatment configuration and settings. A treatment is a variation of an AB test. Join this table to the Splits table to get the team associated with the test.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: TREATMENT_ID
  description: Unique identifier for treatment
  type: string
  searchable: false
  options: null
- name: NAME
  description: Name of the treatment
  type: string
  searchable: true
  options: null
- name: ATTACHMENT_STRATEGY
  description: Strategy for handling attachments
  type: string
  searchable: true
  options: null
- name: REDO_AUTO_ENABLED
  description: Whether automatic redo is enabled
  type: boolean
  searchable: false
  options: null
- name: REDO_ENABLED
  description: Whether redo functionality is enabled
  type: boolean
  searchable: false
  options: null
- name: RETURNS_ENABLED
  description: Whether returns are enabled
  type: boolean
  searchable: false
  options: null
- name: ACTIVE
  description: Whether the treatment is active
  type: boolean
  searchable: false
  options: null
- name: SPLIT_ID
  description: Reference to associated split
  type: string
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_splits
  source_col: SPLIT_ID
  ref_col: SPLIT_ID
  type: null
  cardinality: null
  description: SPLIT_ID references STG_SPLITS.SPLIT_ID

---
name: stg_integrations
description: Staging model for integrations from MongoDB. Contains integration configurations and settings.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: INTEGRATION_ID
  description: Unique identifier for each integration
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: Reference to the team the integration belongs to
  type: string
  searchable: false
  options: null
- name: KIND
  description: Type of integration
  type: string
  searchable: true
  options: null
- name: EMAIL
  description: Email associated with the integration
  type: string
  searchable: false
  options: null
- name: ENABLED
  description: Whether the integration is enabled
  type: boolean
  searchable: false
  options: null
- name: NAME
  description: Name of the integration
  type: string
  searchable: true
  options: null
- name: UPDATEDAT
  description: Timestamp when the integration was last updated
  type: timestamp
  searchable: false
  options: null
- name: CREATEDAT
  description: Timestamp when the integration was created
  type: timestamp
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_product_collections
description: Staging model for product collections from MongoDB. Contains product collection associations.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: PRODUCT_ID
  description: Reference to the product
  type: string
  searchable: false
  options: null
- name: LEGACY_ID
  description: Legacy product identifier
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: Reference to the team
  type: string
  searchable: false
  options: null
- name: COLLECTION_NAME
  description: Name of the collection
  type: string
  searchable: true
  options: null
- name: COLLECTION_ID
  description: Identifier for the collection
  type: string
  searchable: false
  options: null
- name: LEGACY_COLLECTION_ID
  description: Legacy collection identifier
  type: string
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the collection association was last updated
  type: timestamp
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_campaigns
description: Generated model for stg_campaigns
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Unique campaign identifier
  type: TEXT
  searchable: false
  options: null
- name: TEAMID
  description: Identifier for the team associated with the campaign
  type: TEXT
  searchable: false
  options: null
- name: NAME
  description: Campaign name
  type: TEXT
  searchable: false
  options: null
- name: CHANNEL
  description: Communication channel used in the campaign
  type: TEXT
  searchable: true
  options: null
- name: SCHEDULEDAT
  description: Scheduled date and time for the campaign
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: FINISHEDAT
  description: Date and time when the campaign finished
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: CREATEDAT
  description: Record creation timestamp
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: UPDATEDAT
  description: Record update timestamp
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAMID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: Foreign key from stg_campaigns TEAMID to stg_teams TEAM_ID

---
name: stg_orders
description: Staging model for orders from MongoDB. Contains core order data and metadata.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Unique identifier for each order
  type: string
  searchable: false
  options: null
- name: TEAM
  description: Team identifier
  type: string
  searchable: false
  options: null
- name: PROVIDER
  description: Provider information
  type: string
  searchable: true
  options: null
- name: SHOPIFYCREATEDAT
  description: Timestamp when the order was created in Shopify
  type: timestamp
  searchable: false
  options: null
- name: SHOPIFYCREATEDAT__TI
  description: Additional timestamp information for order creation
  type: timestamp
  searchable: false
  options: null
- name: SOURCE_NAME
  description: Source of the order
  type: string
  searchable: true
  options: null
- name: CANCELLED_AT
  description: Timestamp when the order was cancelled
  type: string
  searchable: false
  options: null
- name: CUSTOMER_ID
  description: Customer's shopify identifier
  type: string
  searchable: false
  options: null
- name: CUSTOMER_NAME
  description: Full name of the customer
  type: TEXT
  searchable: true
  options: null
- name: EMAIL
  description: Customer email for the order
  type: string
  searchable: true
  options: null
- name: CUSTOMER_PHONE_NUMBER
  description: Customer contact phone number
  type: TEXT
  searchable: false
  options: null
- name: ORDER_NUMBER
  description: Shopify order number
  type: string
  searchable: true
  options: null
- name: USER_AGENT
  description: User agent of the client that placed the order. If the word "mobile" is in the user agent, then the order is a mobile order, else it is a desktop order.
  type: string
  searchable: true
  options: null
- name: ISEXCHANGEORDER
  description: Flag indicating if order is an exchange
  type: boolean
  searchable: false
  options: null
- name: PROTECTED
  description: Flag indicating if order is protected. Also referred to as Covered
  type: boolean
  searchable: false
  options: null
- name: PACKAGEPROTECTED
  description: Flag indicating if order is package protected
  type: boolean
  searchable: false
  options: null
- name: IS_FINAL_SALE_RETURNS_PROTECTED
  description: Indicates if final sale returns are protected
  type: BOOLEAN
  searchable: false
  options: null
- name: REDOELIGIBLE
  description: Flag indicating if order is eligible for redo coverage
  type: boolean
  searchable: false
  options: null
- name: TRACKINGBILLINGSTATUS
  description: Status of order tracking billing
  type: string
  searchable: true
  options: null
- name: IS_EXCHANGE_COVERAGE
  description: Flag indicating if order has exchange coverage
  type: boolean
  searchable: false
  options: null
- name: SHOPIFY_ID
  description: Shopify order identifier
  type: string
  searchable: false
  options: null
- name: EXTENDED_WARRANTY_PURCHASED
  description: Boolean flag for extended warranty purchase.
  type: boolean
  searchable: false
  options: null
- name: CONCIERGEASSISTEDDATE
  description: Timestamp when concierge assistance was provided for the order
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: CREATEDAT
  description: Source system creation timestamp
  type: timestamp
  searchable: false
  options: null
- name: UPDATEDAT
  description: Last update timestamp
  type: timestamp
  searchable: false
  options: null
- name: __SOURCE_EXISTS
  description: Boolean flag indicating source record existence.
  type: boolean
  searchable: false
  options: null
measures:
- name: TOTAL_PRICE
  description: Total price of the order
  type: number
- name: TRACKINGBILLINGAMOUNT
  description: Amount billed for tracking
  type: number
- name: EXTENDED_WARRANTIES_TOTAL_PRICE
  description: Total price for extended warranties sold.
  type: number
- name: __SOURCE_VERSION
  description: Source version number for change tracking.
  type: number
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM references STG_TEAMS.TEAM_ID
- name: stg_customers
  source_col: CUSTOMER_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: CUSTOMER_ID references STG_CUSTOMERS._ID

---
name: stg_test_metrics
description: Generated model for stg_test_metrics. This table contains the metrics for the AB tests. Join this table to the Treatments table to get the metrics for the different variations of the AB test.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: TEST_METRIC_ID
  description: Unique identifier for the test metric.
  type: string
  searchable: false
  options: null
- name: COUNTRY
  description: Country code or name associated with the metric.
  type: string
  searchable: false
  options: null
- name: DATASOURCE
  description: Title for the data source or origin.
  type: string
  searchable: false
  options: null
- name: DATE
  description: Date when the metric was recorded.
  type: string
  searchable: false
  options: null
- name: METRIC
  description: The specific metric or measurement value.
  type: string
  searchable: false
  options: null
- name: ORDER_ID
  description: Unique identifier for the order associated with the metric.
  type: string
  searchable: false
  options: null
- name: TREATMENT_ID
  description: Identifier for the treatment or experimental variant.
  type: string
  searchable: false
  options: null
measures:
- name: NUM_MERCHANT_ITEMS_PURCHASED
  description: Total number of merchant items purchased.
  type: number
- name: PRICE_BRACKET
  description: Aggregate sum of price brackets from transactions.
  type: number
- name: VALUE
  description: Aggregated value of transactions.
  type: number
- name: __SOURCE_VERSION
  description: Version number of the data source for lineage tracking.
  type: number
- name: __V
  description: Internal version control metric for tracking changes.
  type: number
metrics: []
filters: []
relationships:
- name: stg_treatments
  source_col: TREATMENT_ID
  ref_col: TREATMENT_ID
  type: null
  cardinality: null
  description: TREATMENT_ID references STG_TREATMENTS.TREATMENT_ID

---
name: stg_return_tracking_details
description: Generated model for stg_return_tracking_details
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: RETURN_ID
  description: Unique identifier for the return transaction
  type: TEXT
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the return was last updated
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: CARRIER_CODE
  description: Code representing the shipping carrier
  type: TEXT
  searchable: true
  options: null
- name: CARRIER
  description: Carrier name of the return shipping
  type: TEXT
  searchable: true
  options: null
- name: TRACKING_NUMBER
  description: Tracking number of the return shipping
  type: TEXT
  searchable: false
  options: null
- name: DATETIME
  description: Date of the tracking detail record
  type: DATE
  searchable: false
  options: null
- name: DESCRIPTION
  description: Brief description of the tracking event
  type: TEXT
  searchable: false
  options: null
- name: MESSAGE
  description: Detailed message regarding the tracking status
  type: TEXT
  searchable: false
  options: null
- name: OBJECT
  description: Object associated with the tracking event
  type: TEXT
  searchable: false
  options: null
- name: SOURCE
  description: Source system of the tracking update
  type: TEXT
  searchable: true
  options: null
- name: STATUS
  description: Current status of the return tracking
  type: TEXT
  searchable: true
  options: null
- name: STATUS_DETAIL
  description: Additional details about the current status
  type: TEXT
  searchable: false
  options: null
- name: TRACKING_LOCATION_OBJECT
  description: Location object for tracking such as branch or facility
  type: TEXT
  searchable: false
  options: null
- name: TRACKING_LOCATION_CITY
  description: City of the tracking location
  type: TEXT
  searchable: false
  options: null
- name: TRACKING_LOCATION_COUNTRY
  description: Country of the tracking location
  type: TEXT
  searchable: false
  options: null
- name: TRACKING_LOCATION_ZIP_CODE
  description: Zip code of the tracking location
  type: TEXT
  searchable: false
  options: null
- name: TRACKING_LOCATION_STATE
  description: State or province of the tracking location
  type: TEXT
  searchable: false
  options: null
measures:
- name: TRACKING_DETAIL_INDEX
  description: Aggregated index value for tracking detail metrics
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_returns
  source_col: RETURN_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: Foreign key RETURN_ID references stg_returns._ID

---
name: stg_teams
description: Staging model for teams from MongoDB. Contains merchant team details and settings.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: TEAM_ID
  description: Primary identifier for the team
  type: string
  searchable: false
  options: null
- name: NAME
  description: Name of the team
  type: string
  searchable: true
  options: null
- name: EMAIL
  description: Primary email for the team
  type: string
  searchable: false
  options: null
- name: NOTIFICATION_EMAIL
  description: Email address for notifications
  type: string
  searchable: false
  options: null
- name: STOREURL
  description: URL of the team's store
  type: string
  searchable: true
  options: null
- name: ACCESSTOKEN
  description: Access token used for authenticating API requests
  type: TEXT
  searchable: false
  options: null
- name: PRICEPERORDER
  description: Coverage price per order setting
  type: string
  searchable: false
  options: null
- name: MERCHANTPRICEPERORDER
  description: Merchant price per order setting
  type: string
  searchable: false
  options: null
- name: BILLINGMETHOD
  description: Method used for billing
  type: string
  searchable: true
  options: null
- name: UPDATEDAT
  description: Timestamp when the team was last updated
  type: timestamp
  searchable: false
  options: null
- name: CREATEDAT
  description: Timestamp when the team was created
  type: timestamp
  searchable: false
  options: null
- name: TIMEZONE
  description: Timezone associated with the team
  type: TEXT
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships: []

---
name: stg_customergroups
description: Generated model for stg_customergroups
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: _ID
  description: Unique identifier for the customer group
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: Identifier for the associated team
  type: TEXT
  searchable: false
  options: null
- name: CREATEDAT
  description: Timestamp when the record was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp when the record was last updated
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: NAME
  description: Name of the customer group
  type: TEXT
  searchable: false
  options: null
- name: TYPE
  description: Type or category of the customer group
  type: TEXT
  searchable: false
  options: null
- name: ISFULLSUBSCRIBERLIST
  description: Indicates if the group represents a full subscriber list
  type: BOOLEAN
  searchable: false
  options: null
measures:
- name: COUNT
  description: Total count of records in the customer groups
  type: FLOAT
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID

---
name: stg_payoutorders
description: Staging model for payout orders from MongoDB. Contains order payout information.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: PAYOUT_ORDER_ID
  description: unique identifier for the payout order
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: identifier representing the team associated with the payout
  type: TEXT
  searchable: false
  options: null
- name: RETURN_ID
  description: identifier for return transactions related to the payout
  type: TEXT
  searchable: false
  options: null
- name: ORDER_ID
  description: identifier for the associated order in the system
  type: TEXT
  searchable: false
  options: null
- name: SHOPIFY_ORDER_ID
  description: Identifier for the related Shopify order
  type: string
  searchable: false
  options: null
- name: CHARGE_CURRENCY
  description: currency denomination used for the charge
  type: TEXT
  searchable: true
  options: null
- name: CHARGE_TYPE
  description: type or category of the charge applied
  type: TEXT
  searchable: true
  options: null
- name: CREATED_AT
  description: timestamp marking when the record was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: UPDATED_AT
  description: timestamp marking when the record was last updated
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: Reference to the team
- name: stg_orders
  source_col: ORDER_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: Foreign key relationship to stg_orders

---
name: stg_order_fulfillment_line_items
description: Generated model for stg_order_fulfillment_line_items
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: ORDER_ID
  description: Unique identifier for the order
  type: TEXT
  searchable: false
  options: null
- name: TEAM_ID
  description: Unique identifier for the team handling the order
  type: TEXT
  searchable: false
  options: null
- name: ORDER_UPDATED_AT
  description: Timestamp when the order was last updated
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: ORDER_CREATED_AT
  description: Timestamp when the order was created
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: FULFILLMENT_ID
  description: Unique identifier for the fulfillment process
  type: TEXT
  searchable: false
  options: null
- name: CREATED_AT
  description: Timestamp when the fulfillment record was created
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: LOCATION_ID
  description: Identifier for the physical location
  type: TEXT
  searchable: false
  options: null
- name: FULFILLMENT_NAME
  description: Name associated with the fulfillment process
  type: TEXT
  searchable: false
  options: null
- name: FULFILLMENT_ORDER_ID
  description: Order identifier linked to the fulfillment
  type: TEXT
  searchable: false
  options: null
- name: FULFILLMENT_SERVICE
  description: Service used for processing the fulfillment
  type: TEXT
  searchable: false
  options: null
- name: FULFILLMENT_SHIPMENT_STATUS
  description: Shipment status of the fulfillment
  type: TEXT
  searchable: false
  options: null
- name: FULFILLMENT_STATUS
  description: Current status of the fulfillment process
  type: TEXT
  searchable: false
  options: null
- name: FULFILLMENT_TRACKING_COMPANY
  description: Courier or company providing shipment tracking for the order fulfillment
  type: TEXT
  searchable: false
  options: null
- name: FULFILLMENT_TRACKING_NUMBER
  description: Tracking number assigned by the carrier for the order fulfillment
  type: TEXT
  searchable: false
  options: null
- name: FULFILLMENT_TRACKING_URL
  description: URL for tracking the shipment for the order fulfillment
  type: TEXT
  searchable: false
  options: null
- name: FULFILLMENT_UPDATED_AT
  description: Timestamp when the fulfillment details were updated
  type: TIMESTAMP_TZ
  searchable: false
  options: null
- name: WAS_SHIPMENT_REPORTED_TO_SHIPSURANCE
  description: Boolean indicating if the shipment was reported to Shipsurance
  type: BOOLEAN
  searchable: false
  options: null
- name: FULFILLMENT_LINE_ITEM_ID
  description: Unique identifier for the fulfillment line item
  type: TEXT
  searchable: false
  options: null
- name: LINE_ITEM_FULFILLMENT_SERVICE
  description: Fulfillment service applied to the line item
  type: TEXT
  searchable: false
  options: null
- name: LINE_ITEM_FULFILLMENT_STATUS
  description: Fulfillment status specific to the line item
  type: TEXT
  searchable: false
  options: null
- name: IS_GIFT_CARD
  description: Flag indicating if the order item is a gift card
  type: BOOLEAN
  searchable: false
  options: null
- name: NAME
  description: Name of the order item
  type: TEXT
  searchable: false
  options: null
- name: PRESENTMENT_MONEY_CURRENCY_CODE
  description: Currency code for the presented amount
  type: TEXT
  searchable: false
  options: null
- name: SHOP_MONEY_CURRENCY_CODE
  description: Currency code for the shop money amount
  type: TEXT
  searchable: false
  options: null
- name: PRODUCT_EXISTS
  description: Flag indicating whether the product exists in inventory
  type: BOOLEAN
  searchable: false
  options: null
- name: PRODUCT_ID
  description: Unique identifier for the product
  type: TEXT
  searchable: false
  options: null
- name: REQUIRES_SHIPPING
  description: Flag indicating if the product requires shipping
  type: BOOLEAN
  searchable: false
  options: null
- name: SKU
  description: Stock keeping unit identifier for the product
  type: TEXT
  searchable: false
  options: null
- name: IS_TAXABLE
  description: Flag indicating if the item is subject to tax
  type: BOOLEAN
  searchable: false
  options: null
- name: TITLE
  description: Title or description of the product item
  type: TEXT
  searchable: false
  options: null
- name: TOTAL_DISCOUNT_PRESENTMENT_CURRENCY
  description: Discount expressed in the presentment currency
  type: TEXT
  searchable: false
  options: null
- name: TOTAL_DISCOUNT_SHOP_CURRENCY
  description: Discount expressed in the shop currency
  type: TEXT
  searchable: false
  options: null
- name: VARIANT_ID
  description: Unique identifier for the product variant
  type: TEXT
  searchable: false
  options: null
- name: VARIANT_INVENTORY_MANAGEMENT
  description: Method for managing inventory of the variant
  type: TEXT
  searchable: false
  options: null
- name: VARIANT_TITLE
  description: Title or name of the product variant
  type: TEXT
  searchable: false
  options: null
- name: VENDOR
  description: Vendor or supplier associated with the product
  type: TEXT
  searchable: false
  options: null
measures:
- name: FULFILLABLE_QUANTITY
  description: Sum of quantities available for fulfillment
  type: NUMBER
- name: GRAMS
  description: Total weight of items measured in grams
  type: NUMBER
- name: PRICE
  description: Sum of prices for the order items
  type: NUMBER
- name: PRESENTMENT_MONEY_AMOUNT
  description: Total monetary amount in presentment currency
  type: NUMBER
- name: SHOP_MONEY_AMOUNT
  description: Total monetary amount in shop currency
  type: NUMBER
- name: QUANTITY
  description: Total quantity of order items
  type: NUMBER
- name: TOTAL_DISCOUNT
  description: Total discount amount applied to the order
  type: NUMBER
- name: TOTAL_DISCOUNT_PRESENTMENT_AMOUNT
  description: Total discount amount in presentment currency
  type: NUMBER
- name: TOTAL_DISCOUNT_SHOP_AMOUNT
  description: Total discount amount in shop currency
  type: NUMBER
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID
- name: stg_orders
  source_col: ORDER_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: ORDER_ID references STG_ORDERS._ID
- name: stg_products
  source_col: PRODUCT_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: PRODUCT_ID references STG_PRODUCTS._ID

---
name: stg_fulfillmentbatches
description: Staging model for fulfillment batches from MongoDB. Contains batch information and related details.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: BATCH_ID
  description: Identifier for the fulfillment batch
  type: TEXT
  searchable: false
  options: null
- name: TEAM
  description: Team responsible for creating the batch
  type: string
  searchable: false
  options: null
- name: BATCHDATE
  description: Date of the batch creation
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
- name: UPDATEDAT
  description: Timestamp indicating the last update to the batch record
  type: TIMESTAMP_NTZ
  searchable: false
  options: null
measures: []
metrics: []
filters: []
relationships:
- name: stg_teams
  source_col: TEAM
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM references STG_TEAMS.TEAM_ID

---
name: stg_order_line_items
description: Staging model for order line items from MongoDB. Contains detailed information about items in orders.
data_source_name: redo
database: staging
schema: mongodb
dimensions:
- name: ORDER_ID
  description: Reference to the parent order
  type: string
  searchable: false
  options: null
- name: TEAM_ID
  description: Reference to the team
  type: string
  searchable: false
  options: null
- name: LINE_ITEM_ID
  description: Identifier for each line item, is only unique when used in combination with the ORDER_ID
  type: string
  searchable: false
  options: null
- name: ORDER_NUMBER
  description: The number associated with the order.
  type: string
  searchable: false
  options: null
- name: SOURCE_NAME
  description: Name of the data source for the order information
  type: TEXT
  searchable: false
  options: null
- name: ORDER_UPDATED_AT
  description: Timestamp when the parent order was last updated
  type: timestamp
  searchable: false
  options: null
- name: ORDER_CANCELLED_AT
  description: Timestamp when the parent order was cancelled
  type: string
  searchable: false
  options: null
- name: ORDER_CREATED_AT
  description: Timestamp when the parent order was created
  type: timestamp
  searchable: false
  options: null
- name: ISEXCHANGEORDER
  description: Flag indicating if this is an exchange order
  type: boolean
  searchable: false
  options: null
- name: IS_FINAL_SALE_PROTECTED
  description: Flag indicating if the item is final sale protected. Also referred to as final sale covered
  type: boolean
  searchable: false
  options: null
- name: IS_PROTECTED
  description: Flag indicating if the item is protected. Also refered to as covered.
  type: boolean
  searchable: false
  options: null
- name: IS_PACKAGE_PROTECTED
  description: Flag indicating if the package is under protection.
  type: boolean
  searchable: false
  options: null
- name: VENDOR
  description: Vendor of the product
  type: string
  searchable: true
  options: null
- name: PRESENTMENT_MONEY_CURRENCY
  description: Currency code for the presented amount.
  type: string
  searchable: false
  options: null
- name: SHOP_MONEY_CURRENCY
  description: Currency code for the shop money amount.
  type: string
  searchable: false
  options: null
- name: PRODUCT_TITLE
  description: Title of the product in the order
  type: TEXT
  searchable: false
  options: null
- name: VARIANT_TITLE
  description: Title of the product variant
  type: string
  searchable: true
  options: null
- name: PRODUCT_ID
  description: Reference to the product's legacy_id
  type: string
  searchable: false
  options: null
- name: VARIANT_ID
  description: ID of the product variant
  type: string
  searchable: false
  options: null
- name: SKU
  description: Stock Keeping Unit identifier
  type: TEXT
  searchable: false
  options: null
- name: REQUIRES_SHIPPING
  description: Flag indicating if the order requires shipping
  type: BOOLEAN
  searchable: false
  options: null
- name: __SOURCE_EXISTS
  description: Indicator whether the source record exists.
  type: boolean
  searchable: false
  options: null
- name: FULFILLMENT_LOCATION_ID
  description: ID of the fulfillment location
  type: string
  searchable: false
  options: null
measures:
- name: QUANTITY
  description: Quantity ordered
  type: number
- name: CURRENT_QUANTITY
  description: Current quantity of the line item
  type: number
- name: UNIT_PRICE
  description: Price per individual unit.
  type: number
- name: PRICE
  description: Price per unit
  type: number
- name: PRESENTMENT_MONEY_UNIT_PRICE
  description: Unit price in presented currency.
  type: number
- name: SHOP_MONEY_UNIT_PRICE
  description: Unit price in shop currency.
  type: number
- name: PRE_TAX_PRICE
  description: Price before tax of all units
  type: number
- name: __SOURCE_VERSION
  description: Version number of the source record.
  type: number
- name: DISCOUNT_ALLOCATIONS
  description: Total discounts applied
  type: number
metrics: []
filters: []
relationships:
- name: stg_orders
  source_col: ORDER_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: ORDER_ID references STG_ORDERS._ID
- name: stg_teams
  source_col: TEAM_ID
  ref_col: TEAM_ID
  type: null
  cardinality: null
  description: TEAM_ID references STG_TEAMS.TEAM_ID
- name: stg_products
  source_col: PRODUCT_ID
  ref_col: _ID
  type: null
  cardinality: null
  description: PRODUCT_ID references stg_products._ID
- name: stg_payoutorders
  source_col: ORDER_ID
  ref_col: ORDER_ID
  type: null
  cardinality: null
  description: Foreign key from stg_order_line_items to stg_payoutorders

\`\`\`
`.replace('{DATASET_CONTEXT}', datasetContext);
};

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  instructions: getAnalystInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
  tools: {
    createMetricsFileTool,
    modifyMetricsFileTool,
    createDashboardsFileTool,
    modifyDashboardsFileTool,
    doneTool,
    sequentialThinkingTool,
  },
  memory: new Memory({
    storage: new PostgresStore({
      connectionString:
        process.env.DATABASE_URL ||
        (() => {
          throw new Error('DATABASE_URL environment variable is required');
        })(),
      schemaName: 'mastra',
    }),
  }),
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
