# TICKET-005: Resource Management & Limits

**Priority**: 🔴 Critical  
**Estimated Effort**: 4-5 days  
**Dependencies**: TICKET-001 (Type Safety Foundation)  
**Blocks**: TICKET-008, TICKET-010

## Problem Statement

The system lacks resource limits and protection mechanisms, making it vulnerable to resource exhaustion, memory leaks, and DoS scenarios. No limits exist for:

- Database query result sizes
- Streaming accumulator sizes  
- Conversation history length
- Tool execution timeouts
- Connection pool management

## Current Vulnerabilities

### 1. Database Query Limits
```typescript
// ❌ No result size limits in execute-sql.ts
const result = await conn.execute(sql.statement); // Could return millions of rows
```

### 2. Streaming Memory Growth  
```typescript
// ❌ No size limits in streaming.ts
accumulator.rawText += chunk; // Could grow indefinitely
```

### 3. Conversation History Growth
```typescript
// ❌ No history length limits
const conversationHistory = [...existingHistory, ...newMessages]; // Could grow indefinitely
```

### 4. Connection Management
```typescript
// ❌ No connection pool monitoring or limits
const conn = await getDataSourceConnection(credentials); // No pool size limits
```

## Scope

### Files to Modify:
- `src/utils/resource-limits.ts` (new file)
- `src/utils/streaming.ts`
- `src/tools/database-tools/execute-sql.ts`
- `src/utils/database/saveConversationHistory.ts`
- `src/utils/memory/message-history.ts`
- `src/steps/analyst-step.ts`
- `src/steps/think-and-prep-step.ts`

### Changes Required:

#### 1. Create Resource Limit Configuration
```typescript
// src/utils/resource-limits.ts
export const RESOURCE_LIMITS = {
  // Database limits
  MAX_QUERY_RESULT_ROWS: 10_000,
  MAX_QUERY_RESULT_SIZE_MB: 50,
  MAX_QUERY_TIMEOUT_MS: 30_000,
  MAX_CONCURRENT_QUERIES: 5,
  
  // Streaming limits
  MAX_STREAMING_ACCUMULATOR_SIZE: 1_000_000, // 1MB
  MAX_STREAMING_DURATION_MS: 300_000, // 5 minutes
  
  // Conversation limits
  MAX_CONVERSATION_HISTORY_MESSAGES: 1_000,
  MAX_CONVERSATION_HISTORY_SIZE_MB: 10,
  
  // Tool execution limits  
  MAX_TOOL_EXECUTION_TIME_MS: 60_000, // 1 minute
  MAX_CONCURRENT_TOOLS: 3,
  
  // Memory limits
  MAX_STEP_OUTPUT_SIZE_MB: 20,
  MAX_WORKFLOW_MEMORY_MB: 100,
} as const;

export class ResourceLimitExceededError extends Error {
  constructor(
    public readonly limitType: string,
    public readonly limit: number,
    public readonly actual: number,
    public readonly unit: string = ''
  ) {
    super(`Resource limit exceeded: ${limitType} limit is ${limit}${unit}, got ${actual}${unit}`);
    this.name = 'ResourceLimitExceededError';
  }
}

export function validateQueryResultSize(
  result: any[], 
  context: string
): void {
  if (result.length > RESOURCE_LIMITS.MAX_QUERY_RESULT_ROWS) {
    throw new ResourceLimitExceededError(
      'query_result_rows',
      RESOURCE_LIMITS.MAX_QUERY_RESULT_ROWS,
      result.length,
      ' rows'
    );
  }

  const sizeEstimate = estimateObjectSize(result);
  const sizeMB = sizeEstimate / (1024 * 1024);
  
  if (sizeMB > RESOURCE_LIMITS.MAX_QUERY_RESULT_SIZE_MB) {
    throw new ResourceLimitExceededError(
      'query_result_size',
      RESOURCE_LIMITS.MAX_QUERY_RESULT_SIZE_MB,
      Math.round(sizeMB),
      'MB'
    );
  }
}

export function validateStreamingAccumulator(
  accumulator: { rawText: string },
  startTime: number
): void {
  // Check size limit
  if (accumulator.rawText.length > RESOURCE_LIMITS.MAX_STREAMING_ACCUMULATOR_SIZE) {
    throw new ResourceLimitExceededError(
      'streaming_accumulator_size',
      RESOURCE_LIMITS.MAX_STREAMING_ACCUMULATOR_SIZE,
      accumulator.rawText.length,
      ' characters'
    );
  }

  // Check duration limit
  const duration = Date.now() - startTime;
  if (duration > RESOURCE_LIMITS.MAX_STREAMING_DURATION_MS) {
    throw new ResourceLimitExceededError(
      'streaming_duration',
      RESOURCE_LIMITS.MAX_STREAMING_DURATION_MS,
      duration,
      'ms'
    );
  }
}

export function validateConversationHistory(
  history: any[]
): void {
  if (history.length > RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_MESSAGES) {
    throw new ResourceLimitExceededError(
      'conversation_history_messages',
      RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_MESSAGES,
      history.length,
      ' messages'
    );
  }

  const sizeEstimate = estimateObjectSize(history);
  const sizeMB = sizeEstimate / (1024 * 1024);
  
  if (sizeMB > RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_SIZE_MB) {
    throw new ResourceLimitExceededError(
      'conversation_history_size',
      RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_SIZE_MB,
      Math.round(sizeMB),
      'MB'
    );
  }
}

export function estimateObjectSize(obj: any): number {
  return JSON.stringify(obj).length * 2; // Rough estimate: 2 bytes per character
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new ResourceLimitExceededError(
          `${operation}_timeout`,
          timeoutMs,
          timeoutMs,
          'ms'
        ));
      }, timeoutMs);
    })
  ]);
}
```

#### 2. Update Database Tool with Limits
```typescript
// src/tools/database-tools/execute-sql.ts
import { 
  RESOURCE_LIMITS, 
  validateQueryResultSize, 
  withTimeout 
} from '../../utils/resource-limits';

const executeFunction = wrapTraced(
  async (input: z.infer<typeof inputSchema>, context: any) => {
    try {
      // Add query timeout
      const result = await withTimeout(
        conn.execute(sql.statement),
        RESOURCE_LIMITS.MAX_QUERY_TIMEOUT_MS,
        'database_query'
      );

      // Validate result size before processing
      validateQueryResultSize(result.rows, 'SQL query execution');

      return {
        success: true,
        data: result.rows,
        rowCount: result.rows.length,
        limited: false
      };
    } catch (error) {
      if (error instanceof ResourceLimitExceededError) {
        // Handle resource limit errors gracefully
        return {
          success: false,
          error: `Query result too large. Please limit your query to fewer than ${RESOURCE_LIMITS.MAX_QUERY_RESULT_ROWS} rows.`,
          code: 'QUERY_TOO_LARGE',
          retryable: false
        };
      }
      throw error;
    } finally {
      await conn.close(); // Ensure connection cleanup
    }
  },
  { name: 'execute-sql' }
);
```

#### 3. Update Streaming Utilities with Limits
```typescript
// src/utils/streaming.ts
import { validateStreamingAccumulator, RESOURCE_LIMITS } from './resource-limits';

export class ToolArgsParser {
  private startTime = Date.now();
  
  processChunk(chunk: any): StreamingResult | null {
    try {
      // Validate accumulator size before processing
      validateStreamingAccumulator(this.accumulator, this.startTime);
      
      // Existing processing logic...
      this.accumulator.rawText += chunk.text || '';
      
      return this.parseAccumulator();
    } catch (error) {
      if (error instanceof ResourceLimitExceededError) {
        // Reset accumulator to prevent further growth
        this.accumulator.rawText = '';
        console.warn('Streaming accumulator limit exceeded, resetting:', error.message);
        return null;
      }
      throw error;
    }
  }
}
```

#### 4. Add Conversation History Limits
```typescript
// src/utils/database/saveConversationHistory.ts
import { validateConversationHistory } from '../resource-limits';

export async function saveConversationHistoryFromStep(
  runtimeContext: { get: (key: string) => any },
  stepMessages: any[]
): Promise<void> {
  // Validate conversation history size before saving
  validateConversationHistory(stepMessages);
  
  // Existing save logic...
}

// Add conversation trimming utility
export function trimConversationHistory(
  messages: CoreMessage[], 
  maxMessages: number = RESOURCE_LIMITS.MAX_CONVERSATION_HISTORY_MESSAGES
): CoreMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }

  // Keep the first user message and most recent messages
  const firstUserMessage = messages.find(m => m.role === 'user');
  const recentMessages = messages.slice(-maxMessages + 1);
  
  return firstUserMessage ? [firstUserMessage, ...recentMessages] : recentMessages;
}
```

#### 5. Add Tool Execution Timeouts
```typescript
// src/steps/analyst-step.ts
import { withTimeout, RESOURCE_LIMITS } from '../utils/resource-limits';

const analystExecution = async ({ inputData, runtimeContext }) => {
  try {
    // Wrap agent stream with timeout
    const stream = await withTimeout(
      analystAgent.stream(messages, {
        runtimeContext,
        toolChoice: 'required',
        abortSignal: abortController.signal,
        onStepFinish: handleAnalystStepFinish,
      }),
      RESOURCE_LIMITS.MAX_TOOL_EXECUTION_TIME_MS,
      'analyst_execution'
    );

    // Existing processing logic...
  } catch (error) {
    // Handle timeout errors gracefully
    if (error instanceof ResourceLimitExceededError && error.limitType.includes('timeout')) {
      throw new Error('Analysis is taking too long. Please try with a simpler request.');
    }
    throw error;
  }
};
```

#### 6. Add Connection Pool Monitoring
```typescript
// src/utils/connection-pool-monitor.ts
let activeConnections = 0;

export function trackConnection<T>(connectionPromise: Promise<T>): Promise<T> {
  if (activeConnections >= RESOURCE_LIMITS.MAX_CONCURRENT_QUERIES) {
    throw new ResourceLimitExceededError(
      'concurrent_connections',
      RESOURCE_LIMITS.MAX_CONCURRENT_QUERIES,
      activeConnections + 1,
      ' connections'
    );
  }

  activeConnections++;
  
  return connectionPromise.finally(() => {
    activeConnections--;
  });
}

export function getConnectionStats() {
  return {
    active: activeConnections,
    limit: RESOURCE_LIMITS.MAX_CONCURRENT_QUERIES,
    available: RESOURCE_LIMITS.MAX_CONCURRENT_QUERIES - activeConnections
  };
}
```

## Acceptance Criteria

- [ ] Database queries have row count and size limits
- [ ] Streaming has accumulator size and duration limits
- [ ] Conversation history has message count and size limits
- [ ] Tool execution has timeout limits
- [ ] Connection pool has concurrency limits
- [ ] Resource limit errors are user-friendly
- [ ] Limits are configurable via environment variables
- [ ] Resource usage is monitored and logged

## Test Plan

- [ ] Test database queries exceeding row limits
- [ ] Test streaming with large accumulator
- [ ] Test conversation history growth
- [ ] Test tool execution timeouts
- [ ] Test concurrent connection limits
- [ ] Test resource limit error messages
- [ ] Test resource cleanup on failures

## Configuration

Add environment variables for production tuning:
```bash
# Database limits
MAX_QUERY_RESULT_ROWS=10000
MAX_QUERY_RESULT_SIZE_MB=50
MAX_QUERY_TIMEOUT_MS=30000

# Streaming limits  
MAX_STREAMING_ACCUMULATOR_SIZE=1000000
MAX_STREAMING_DURATION_MS=300000

# Conversation limits
MAX_CONVERSATION_HISTORY_MESSAGES=1000
MAX_CONVERSATION_HISTORY_SIZE_MB=10
```

## Monitoring

Add metrics for resource usage:
```typescript
// Track resource usage for monitoring
export const resourceMetrics = {
  queryResultSizes: new Histogram('query_result_sizes'),
  streamingDurations: new Histogram('streaming_durations'), 
  conversationHistorySizes: new Histogram('conversation_history_sizes'),
  connectionPoolUsage: new Gauge('connection_pool_usage'),
};
```

## Notes

This ticket is critical for production stability and should be prioritized alongside error handling. It prevents resource exhaustion scenarios that could bring down the service.