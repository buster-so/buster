# TICKET-006: Database Connection Safety

**Priority**: 🟡 High  
**Estimated Effort**: 2-3 days  
**Dependencies**: TICKET-003 (Runtime Context Validation), TICKET-005 (Resource Limits)  
**Blocks**: TICKET-010

## Problem Statement

Database connections lack proper safety mechanisms, health checks, and cleanup procedures, risking connection leaks and unreliable query execution.

## Current Issues

### Missing Safety Mechanisms:
- No connection health checks before query execution
- No connection pool monitoring  
- Inconsistent connection cleanup
- No retry logic for connection failures
- Missing SQL injection pattern detection
- No query plan analysis or optimization

## Scope

### Files to Modify:
- `src/tools/database-tools/execute-sql.ts`
- `src/utils/database/connection-safety.ts` (new file)
- `src/utils/database/query-validator.ts` (new file)
- `src/utils/database/connection-pool-monitor.ts` (new file)

### Changes Required:

#### 1. Create Connection Safety Utilities
```typescript
// src/utils/database/connection-safety.ts
import type { Connection } from '@buster/database';
import { RESOURCE_LIMITS } from '../resource-limits';

export interface SafeConnection extends Connection {
  isHealthy: boolean;
  lastHealthCheck: Date;
  queryCount: number;
}

export class ConnectionHealthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionHealthError';
  }
}

export async function validateConnectionHealth(
  conn: Connection
): Promise<SafeConnection> {
  try {
    // Simple health check query
    const healthResult = await conn.execute('SELECT 1 as health_check');
    
    if (!healthResult || healthResult.rows.length === 0) {
      throw new ConnectionHealthError('Connection health check failed');
    }

    return {
      ...conn,
      isHealthy: true,
      lastHealthCheck: new Date(),
      queryCount: 0
    };
  } catch (error) {
    throw new ConnectionHealthError(
      `Database connection is unhealthy: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function withSafeConnection<T>(
  connectionPromise: Promise<Connection>,
  operation: (conn: SafeConnection) => Promise<T>
): Promise<T> {
  let connection: Connection | null = null;
  
  try {
    // Get and validate connection
    connection = await connectionPromise;
    const safeConnection = await validateConnectionHealth(connection);
    
    // Execute operation with validated connection
    const result = await operation(safeConnection);
    return result;
    
  } catch (error) {
    if (error instanceof ConnectionHealthError) {
      throw new Error(
        'Unable to connect to the database. Please try again later.'
      );
    }
    throw error;
  } finally {
    // Ensure connection cleanup
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Failed to close database connection:', closeError);
      }
    }
  }
}

export function retryConnection<T>(
  connectionOperation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    
    const executeAttempt = async () => {
      try {
        const result = await connectionOperation();
        resolve(result);
      } catch (error) {
        attempt++;
        
        if (attempt >= maxRetries) {
          reject(new Error(
            `Database operation failed after ${maxRetries} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          ));
          return;
        }
        
        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempt - 1);
        setTimeout(executeAttempt, delay);
      }
    };
    
    executeAttempt();
  });
}
```

#### 2. Create Query Validation Utilities
```typescript
// src/utils/database/query-validator.ts
export interface QueryValidationResult {
  isValid: boolean;
  issues: string[];
  riskLevel: 'low' | 'medium' | 'high';
  estimatedComplexity: number;
}

export function validateSqlQuery(query: string): QueryValidationResult {
  const issues: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let estimatedComplexity = 1;

  // Remove comments and normalize whitespace
  const normalizedQuery = query
    .replace(/--.*$/gm, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /\b(drop|delete|truncate|alter|create|insert|update)\s+(?!.*where)/i,
    /\bunion\s+all\s+select/i,
    /\bexec\s*\(/i,
    /\bxp_cmdshell/i,
    /\bsp_executesql/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(normalizedQuery)) {
      issues.push('Query contains potentially dangerous operations');
      riskLevel = 'high';
    }
  }

  // Check for performance concerns
  const performanceWarnings = [
    { pattern: /select\s+\*\s+from/i, message: 'SELECT * may impact performance' },
    { pattern: /\blike\s+['"]%.*%['"]/i, message: 'Leading wildcard LIKE may be slow' },
    { pattern: /\bor\b.*\bor\b.*\bor\b/i, message: 'Multiple OR conditions may be slow' },
    { pattern: /\bin\s*\([^)]{100,}\)/i, message: 'Large IN clause may impact performance' },
  ];

  for (const warning of performanceWarnings) {
    if (warning.pattern.test(normalizedQuery)) {
      issues.push(warning.message);
      estimatedComplexity += 2;
      if (riskLevel === 'low') riskLevel = 'medium';
    }
  }

  // Check for complex joins
  const joinCount = (normalizedQuery.match(/\bjoin\b/g) || []).length;
  if (joinCount > 3) {
    issues.push(`Query has ${joinCount} joins, may be complex`);
    estimatedComplexity += joinCount;
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  // Check for subqueries
  const subqueryCount = (normalizedQuery.match(/\bselect\b/g) || []).length - 1;
  if (subqueryCount > 2) {
    issues.push(`Query has ${subqueryCount} subqueries, may be complex`);
    estimatedComplexity += subqueryCount;
  }

  return {
    isValid: riskLevel !== 'high',
    issues,
    riskLevel,
    estimatedComplexity
  };
}

export function estimateQueryTimeout(
  query: string,
  baseTimeoutMs: number = RESOURCE_LIMITS.MAX_QUERY_TIMEOUT_MS
): number {
  const validation = validateSqlQuery(query);
  
  // Adjust timeout based on complexity
  const complexityMultiplier = Math.min(validation.estimatedComplexity * 0.5, 3);
  return Math.min(baseTimeoutMs * complexityMultiplier, baseTimeoutMs * 2);
}
```

#### 3. Update Execute SQL Tool
```typescript
// src/tools/database-tools/execute-sql.ts
import { 
  withSafeConnection, 
  retryConnection 
} from '../../utils/database/connection-safety';
import { 
  validateSqlQuery, 
  estimateQueryTimeout 
} from '../../utils/database/query-validator';
import { withTimeout } from '../../utils/resource-limits';

const executeFunction = wrapTraced(
  async (input: z.infer<typeof inputSchema>, context: any) => {
    const { dataSourceId, organizationId } = getValidatedContext(context.runtimeContext);
    
    try {
      // Validate query before execution
      const queryValidation = validateSqlQuery(input.query);
      
      if (!queryValidation.isValid) {
        return {
          success: false,
          error: `Query validation failed: ${queryValidation.issues.join(', ')}`,
          code: 'INVALID_QUERY',
          retryable: false
        };
      }

      // Log performance warnings
      if (queryValidation.issues.length > 0) {
        console.warn('Query performance warnings:', {
          query: input.query,
          issues: queryValidation.issues,
          riskLevel: queryValidation.riskLevel
        });
      }

      // Execute with safety wrapper and retry logic
      const result = await retryConnection(async () => {
        return await withSafeConnection(
          getDataSourceConnection({ dataSourceId, organizationId }),
          async (safeConn) => {
            // Calculate dynamic timeout based on query complexity
            const timeoutMs = estimateQueryTimeout(input.query);
            
            // Execute with timeout
            const queryResult = await withTimeout(
              safeConn.execute(input.query),
              timeoutMs,
              'database_query'
            );

            // Validate result size
            validateQueryResultSize(queryResult.rows, 'SQL query execution');

            // Track connection usage
            safeConn.queryCount++;

            return {
              success: true,
              data: queryResult.rows,
              rowCount: queryResult.rows.length,
              executionTimeMs: queryResult.duration,
              queryComplexity: queryValidation.estimatedComplexity,
              limited: false
            };
          }
        );
      });

      return result;

    } catch (error) {
      if (error instanceof ResourceLimitExceededError) {
        return {
          success: false,
          error: `Query exceeded limits: ${error.message}`,
          code: 'QUERY_LIMIT_EXCEEDED',
          retryable: false
        };
      }

      if (error instanceof ConnectionHealthError) {
        return {
          success: false,
          error: 'Database connection failed. Please try again later.',
          code: 'CONNECTION_FAILED',
          retryable: true
        };
      }

      throw error; // Re-throw for standardized error handling
    }
  },
  { 
    name: 'execute-sql',
    tags: { tool: 'database', operation: 'query' }
  }
);
```

#### 4. Create Connection Pool Monitor
```typescript
// src/utils/database/connection-pool-monitor.ts
interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  connectionErrors: string[];
}

class ConnectionPoolMonitor {
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    averageConnectionTime: 0,
    connectionErrors: []
  };

  private connectionTimes: number[] = [];

  trackConnection<T>(connectionOperation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    return connectionOperation()
      .then(result => {
        const duration = Date.now() - startTime;
        this.connectionTimes.push(duration);
        
        // Keep only last 100 connection times
        if (this.connectionTimes.length > 100) {
          this.connectionTimes.shift();
        }
        
        this.metrics.averageConnectionTime = 
          this.connectionTimes.reduce((a, b) => a + b, 0) / this.connectionTimes.length;
        
        return result;
      })
      .catch(error => {
        this.metrics.failedConnections++;
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.metrics.connectionErrors.push(errorMessage);
        
        // Keep only last 50 errors
        if (this.metrics.connectionErrors.length > 50) {
          this.metrics.connectionErrors.shift();
        }
        
        throw error;
      })
      .finally(() => {
        this.metrics.activeConnections--;
      });
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const failureRate = this.metrics.failedConnections / this.metrics.totalConnections;
    
    if (failureRate > 0.5) return 'unhealthy';
    if (failureRate > 0.2 || this.metrics.averageConnectionTime > 5000) return 'degraded';
    return 'healthy';
  }
}

export const connectionMonitor = new ConnectionPoolMonitor();
```

## Acceptance Criteria

- [ ] All database connections are health-checked before use
- [ ] Connection cleanup is guaranteed with try-finally blocks
- [ ] Query validation prevents dangerous operations
- [ ] Connection retry logic handles transient failures
- [ ] Connection pool monitoring tracks usage and health
- [ ] Query timeout is dynamically calculated based on complexity
- [ ] Resource limits are enforced for all database operations

## Test Plan

- [ ] Test connection health check failures
- [ ] Test connection cleanup on errors
- [ ] Test query validation with dangerous patterns
- [ ] Test retry logic with connection failures
- [ ] Test connection pool monitoring metrics
- [ ] Test query timeout with complex queries
- [ ] Test resource limit enforcement

## Monitoring Integration

Add health check endpoint:
```typescript
// Health check for database connections
app.get('/health/database', async (req, res) => {
  const status = connectionMonitor.getHealthStatus();
  const metrics = connectionMonitor.getMetrics();
  
  res.status(status === 'healthy' ? 200 : 503).json({
    status,
    metrics,
    timestamp: new Date().toISOString()
  });
});
```

## Configuration

Add environment variables:
```bash
# Connection safety settings
DB_HEALTH_CHECK_ENABLED=true
DB_RETRY_ATTEMPTS=3
DB_RETRY_BACKOFF_MS=1000
DB_QUERY_VALIDATION_ENABLED=true
DB_PERFORMANCE_WARNINGS_ENABLED=true
```

## Notes

This ticket depends on runtime context validation (TICKET-003) for proper context handling and resource limits (TICKET-005) for query size validation. It's essential for production database reliability.