# Analyst Agent Task

This task provides advanced AI-powered data analysis and insights generation capabilities through a sophisticated multi-step workflow that combines agent intelligence with automated data processing.

## Features

- **Multi-State Workflow**: Executes through distinct phases (initializing, searching, planning, analyzing, reviewing)
- **Intelligent Agent Execution**: Leverages the Buster multi-agent system for sophisticated analysis
- **Artifact Generation**: Creates metrics, dashboards, queries, and charts as analysis outputs
- **Error Recovery**: Graceful degradation and recovery mechanisms for robust execution
- **Real-time Progress Tracking**: Detailed step-by-step execution monitoring
- **Data Source Integration**: Seamless integration with multiple data source types
- **Context Preservation**: Maintains conversation history and session state

## Workflow States

### 1. Initializing
- Validates input parameters and sets up agent state
- Configures available tools based on context
- Prepares data source connections

### 2. Searching
- Executes data catalog search and discovery
- Identifies relevant data sources for the analysis
- Establishes data context for subsequent phases

### 3. Planning
- Develops analysis strategy and execution plan
- Determines required tools and processing steps
- Estimates execution duration and resource requirements

### 4. Analyzing
- Performs core analysis execution with tool usage
- Generates insights, metrics, and visualizations
- Creates structured artifacts for consumption

### 5. Reviewing
- Conducts quality assurance and result validation
- Ensures accuracy and relevance of generated insights
- Finalizes analysis results and recommendations

## Usage

### Basic Analysis Request

```typescript
import { analystAgentTask } from './tasks/analyst-agent-task';

const result = await analystAgentTask.trigger({
  sessionId: 'session_abc123',
  userId: 'user_xyz789',
  query: 'Analyze customer satisfaction trends over the last quarter',
  options: {
    maxSteps: 15,
    enableStreaming: true
  }
});
```

### Analysis with Data Sources

```typescript
const result = await analystAgentTask.trigger({
  sessionId: 'session_def456',
  userId: 'user_uvw012',
  query: 'Compare revenue performance across regions',
  dataSources: [
    {
      name: 'sales-db',
      type: 'postgresql',
      credentials: {
        host: 'sales-prod.company.com',
        port: 5432,
        database: 'sales_analytics',
        username: 'analyst',
        password: 'secure_password'
      }
    },
    {
      name: 'customer-warehouse',
      type: 'snowflake',
      credentials: {
        account_id: 'ABC12345.us-west-2.aws',
        warehouse_id: 'ANALYTICS_WH',
        username: 'data_analyst',
        password: 'warehouse_password',
        default_database: 'CUSTOMER_DATA'
      }
    }
  ],
  options: {
    maxSteps: 20,
    timeoutMs: 1200000, // 20 minutes
    model: 'claude-3-sonnet',
    enableStreaming: true
  }
});
```

### Follow-up Analysis with Context

```typescript
const followUpResult = await analystAgentTask.trigger({
  sessionId: 'session_ghi789',
  userId: 'user_rst345',
  query: 'Can you drill down into the Q4 sales data for the western region?',
  context: {
    threadId: 'thread_previous_analysis',
    previousMessages: [
      {
        role: 'user',
        content: 'Show me Q4 sales performance by region',
        timestamp: '2024-01-15T10:00:00Z'
      },
      {
        role: 'assistant',
        content: 'I\'ve analyzed your Q4 sales data. The western region shows particularly strong performance...',
        timestamp: '2024-01-15T10:02:30Z'
      }
    ]
  },
  options: {
    maxSteps: 10,
    model: 'claude-3-sonnet'
  }
});
```

## Input Schema

### AnalystAgentTaskInput

| Field         | Type         | Required | Description                                 |
| ------------- | ------------ | -------- | ------------------------------------------- |
| `sessionId`   | string       | Yes      | Unique identifier for the analysis session  |
| `userId`      | string       | Yes      | User ID for the analysis request            |
| `query`       | string       | Yes      | The user's query or request for analysis    |
| `dataSources` | DataSource[] | No       | Optional data source configurations         |
| `context`     | Context      | No       | Optional context from previous interactions |
| `options`     | Options      | No       | Configuration options for agent execution   |

### DataSource

| Field         | Type   | Required | Description                                       |
| ------------- | ------ | -------- | ------------------------------------------------- |
| `name`        | string | Yes      | Unique name for the data source                   |
| `type`        | string | Yes      | Type of data source (postgresql, snowflake, etc.) |
| `credentials` | object | No       | Authentication and connection details             |

### Context

| Field              | Type      | Required | Description                                   |
| ------------------ | --------- | -------- | --------------------------------------------- |
| `threadId`         | string    | No       | Thread identifier for conversation continuity |
| `previousMessages` | Message[] | No       | Previous conversation messages                |

### Options

| Field             | Type    | Required | Description                                     |
| ----------------- | ------- | -------- | ----------------------------------------------- |
| `maxSteps`        | number  | No       | Maximum number of execution steps (default: 15) |
| `timeoutMs`       | number  | No       | Execution timeout in milliseconds               |
| `model`           | string  | No       | AI model to use (default: claude-3-sonnet)      |
| `enableStreaming` | boolean | No       | Enable real-time streaming (default: false)     |

## Output Schema

### AnalystAgentTaskOutput

| Field       | Type              | Description                                    |
| ----------- | ----------------- | ---------------------------------------------- |
| `success`   | boolean           | Whether the task completed successfully        |
| `sessionId` | string            | Session identifier for tracking                |
| `result`    | AnalysisResult    | Analysis results and artifacts (if successful) |
| `error`     | ErrorDetails      | Error information (if failed)                  |
| `metadata`  | ExecutionMetadata | Execution statistics and information           |

### AnalysisResult

| Field             | Type            | Description                                     |
| ----------------- | --------------- | ----------------------------------------------- |
| `response`        | string          | Final analysis response from the agent          |
| `artifacts`       | Artifact[]      | Generated artifacts (metrics, dashboards, etc.) |
| `usedDataSources` | string[]        | Data sources accessed during analysis           |
| `executionSteps`  | ExecutionStep[] | Detailed step-by-step execution log             |

### Artifact Types

- **Metric**: Quantitative measurements and KPIs
- **Dashboard**: Interactive visualization configurations
- **Query**: SQL queries and data retrieval scripts
- **Chart**: Chart configurations and data visualizations

## Error Handling

The task implements comprehensive error handling with:

- **Input Validation**: Ensures required fields are present
- **Graceful Degradation**: Continues execution when non-critical steps fail
- **State Recovery**: Attempts to recover from transient failures
- **Detailed Error Reporting**: Provides specific error codes and messages

### Common Error Codes

- `AGENT_EXECUTION_ERROR`: General agent execution failure
- `INVALID_INPUT`: Missing or invalid input parameters
- `DATA_SOURCE_ERROR`: Data source connection or query failure
- `TIMEOUT_ERROR`: Task execution exceeded time limit

## Integration with Trigger.dev

This task is built on Trigger.dev v3 and includes:

- **Extended Duration**: 30-minute maximum execution time for complex analyses
- **Retry Logic**: Automatic retry on transient failures
- **Progress Tracking**: Real-time execution status updates
- **Resource Management**: Efficient memory and connection handling

## Performance Considerations

- **Data Source Optimization**: Minimize unnecessary data transfers
- **Tool Selection**: Intelligent tool usage based on analysis requirements
- **Caching**: Leverages agent memory for conversation continuity
- **Parallel Processing**: Concurrent execution of independent analysis steps

## Security & Privacy

- **Credential Handling**: Secure storage and transmission of data source credentials
- **Data Privacy**: No persistent storage of sensitive analysis data
- **Access Control**: User-based session isolation and access management
- **Audit Logging**: Comprehensive execution logging for compliance

## Examples

### Sales Performance Analysis

```typescript
const salesAnalysis = await analystAgentTask.trigger({
  sessionId: 'sales_q4_2024',
  userId: 'analyst_jane_doe',
  query: 'Analyze Q4 2024 sales performance and identify key growth drivers',
  dataSources: [{
    name: 'sales-warehouse',
    type: 'snowflake',
    credentials: { /* snowflake credentials */ }
  }]
});

// Expected artifacts:
// - Sales performance metrics
// - Revenue trend dashboard
// - Regional breakdown charts
// - Growth driver analysis queries
```

### Customer Behavior Analysis

```typescript
const customerAnalysis = await analystAgentTask.trigger({
  sessionId: 'customer_behavior_2024',
  userId: 'analyst_john_smith',
  query: 'Identify customer churn patterns and recommend retention strategies',
  dataSources: [
    { name: 'customer-db', type: 'postgresql' },
    { name: 'engagement-data', type: 'bigquery' }
  ],
  options: {
    maxSteps: 25,
    model: 'claude-3-opus'
  }
});

// Expected artifacts:
// - Churn rate metrics
// - Customer segmentation dashboard
// - Retention strategy recommendations
// - Predictive analysis queries
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Increase `timeoutMs` in options
   - Reduce complexity of the analysis query
   - Check data source performance

2. **Data Source Connection Failures**
   - Verify credentials and connection details
   - Check network connectivity
   - Ensure data source is accessible

3. **Insufficient Results**
   - Provide more specific query context
   - Include relevant data sources
   - Increase `maxSteps` for complex analyses

### Debug Mode

Enable detailed logging by setting the log level in the trigger configuration:

```typescript
// In trigger.config.ts
export default defineConfig({
  logLevel: 'debug',
  // ... other config
});
```

## Contributing

When extending the analyst agent task:

1. Follow the existing workflow state pattern
2. Implement proper error handling and recovery
3. Add comprehensive logging for debugging
4. Update this README with new features
5. Include example usage for new capabilities

## Related Documentation

- [Trigger.dev Documentation](https://trigger.dev/docs)
- [Buster Agent System](../../../packages/ai/README.md)
- [Data Source Integration](../introspectData/README.md)
- [Error Handling Patterns](../../documentation/error-handling.md) 