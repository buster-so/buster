# TICKET-009: Testing Coverage Gaps

**Priority**: 🟡 High  
**Estimated Effort**: 4-5 days  
**Dependencies**: TICKET-004 (Error Handling)  
**Blocks**: TICKET-011

## Problem Statement

While good integration tests exist, critical testing gaps remain around error boundaries, concurrent execution, resource cleanup, and edge case handling. These gaps prevent confidence in production stability.

## Current Testing State

### Existing Strengths:
- ✅ Integration tests for workflow execution
- ✅ Unit tests for tool schemas
- ✅ Database conversation history testing
- ✅ Agent integration testing

### Critical Gaps:
- ❌ Error boundary testing
- ❌ Concurrent execution testing  
- ❌ Resource cleanup verification
- ❌ Edge case handling validation
- ❌ Performance regression testing
- ❌ Memory leak detection

## Scope

### Test Files to Create:
- `tests/error-boundaries/workflow-error-handling.test.ts`
- `tests/concurrency/concurrent-execution.test.ts`
- `tests/performance/resource-cleanup.test.ts`
- `tests/edge-cases/malformed-input.test.ts`
- `tests/stress/memory-pressure.test.ts`
- `tests/security/rate-limiting.test.ts`
- `tests/utils/test-utilities.ts`

### Test Infrastructure to Add:
- Memory usage monitoring in tests
- Concurrent test orchestration
- Resource leak detection
- Performance baseline tracking

### Changes Required:

#### 1. Create Error Boundary Tests
```typescript
// tests/error-boundaries/workflow-error-handling.test.ts
import { RuntimeContext } from '@mastra/core/runtime-context';
import { initLogger } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import analystWorkflow, { type AnalystRuntimeContext } from '../../src/workflows/analyst-workflow';
import { AnalystWorkflowError } from '../../src/utils/error-handling';

describe('Error Boundary Tests', () => {
  beforeAll(() => {
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: 'ERROR-BOUNDARY-TESTS',
    });
  });

  test('should handle missing runtime context gracefully', async () => {
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    // Intentionally missing required context fields
    
    const run = analystWorkflow.createRun();
    
    await expect(
      run.start({
        inputData: { prompt: 'test prompt' },
        runtimeContext,
      })
    ).rejects.toThrow('Missing required runtime context');
  });

  test('should handle database connection failures', async () => {
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'test-user');
    runtimeContext.set('threadId', 'test-thread');
    runtimeContext.set('organizationId', 'test-org');
    runtimeContext.set('dataSourceId', 'invalid-datasource-id');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const run = analystWorkflow.createRun();
    
    await expect(
      run.start({
        inputData: { prompt: 'SELECT * FROM users' },
        runtimeContext,
      })
    ).rejects.toThrow(/database|connection/i);
  });

  test('should handle model API failures gracefully', async () => {
    const originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'invalid-key';
    
    try {
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('userId', 'test-user');
      runtimeContext.set('threadId', 'test-thread');
      runtimeContext.set('organizationId', 'test-org');
      runtimeContext.set('dataSourceId', 'test-datasource');
      runtimeContext.set('dataSourceSyntax', 'postgres');

      const run = analystWorkflow.createRun();
      
      await expect(
        run.start({
          inputData: { prompt: 'test prompt' },
          runtimeContext,
        })
      ).rejects.toThrow(/API|model|service/i);
    } finally {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }
  });

  test('should handle partial step failures', async () => {
    // Test scenario where some parallel steps succeed and others fail
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'test-user');
    runtimeContext.set('threadId', 'test-thread');
    runtimeContext.set('organizationId', 'test-org');
    runtimeContext.set('dataSourceId', 'test-datasource');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const run = analystWorkflow.createRun();
    
    // This should handle cases where title generation succeeds but value extraction fails
    const result = await run.start({
      inputData: { 
        prompt: 'This is a prompt with very unusual characters that might break parsing: \\u0000\\xFF\\uFFFE' 
      },
      runtimeContext,
    });

    // Workflow should complete even if some steps have issues
    expect(result).toBeDefined();
  });

  test('should handle workflow abortion gracefully', async () => {
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'test-user');
    runtimeContext.set('threadId', 'test-thread');
    runtimeContext.set('organizationId', 'test-org');
    runtimeContext.set('dataSourceId', 'test-datasource');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const run = analystWorkflow.createRun();
    
    // Start workflow
    const workflowPromise = run.start({
      inputData: { prompt: 'Complex analysis that will take time' },
      runtimeContext,
    });

    // Abort after short delay
    setTimeout(() => {
      run.abort();
    }, 1000);

    // Should handle abortion gracefully
    await expect(workflowPromise).rejects.toThrow(/abort/i);
  });
});
```

#### 2. Create Concurrent Execution Tests
```typescript
// tests/concurrency/concurrent-execution.test.ts
import { RuntimeContext } from '@mastra/core/runtime-context';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import { describe, expect, test } from 'vitest';
import analystWorkflow, { type AnalystRuntimeContext } from '../../src/workflows/analyst-workflow';

describe('Concurrent Execution Tests', () => {
  test('should handle multiple concurrent workflow executions', async () => {
    const concurrentCount = 5;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < concurrentCount; i++) {
      const { chatId, organizationId, userId } = await createTestChat();
      const messageId = await createTestMessage(chatId, userId);

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('userId', userId);
      runtimeContext.set('threadId', chatId);
      runtimeContext.set('organizationId', organizationId);
      runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
      runtimeContext.set('dataSourceSyntax', 'postgres');
      runtimeContext.set('messageId', messageId);

      const run = analystWorkflow.createRun();
      const promise = run.start({
        inputData: { prompt: `Concurrent test ${i}: What are our top products?` },
        runtimeContext,
      });

      promises.push(promise);
    }

    // All workflows should complete successfully
    const results = await Promise.allSettled(promises);
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Concurrent execution: ${succeeded} succeeded, ${failed} failed`);
    
    // At least 80% should succeed (allow for some flakiness)
    expect(succeeded / concurrentCount).toBeGreaterThan(0.8);
  }, 60000);

  test('should handle concurrent database connections', async () => {
    // Test that concurrent database operations don't deadlock or exhaust connections
    const concurrentQueries = 10;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < concurrentQueries; i++) {
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('userId', 'test-user');
      runtimeContext.set('threadId', `thread-${i}`);
      runtimeContext.set('organizationId', 'test-org');
      runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
      runtimeContext.set('dataSourceSyntax', 'postgres');

      const run = analystWorkflow.createRun();
      const promise = run.start({
        inputData: { prompt: `SELECT ${i} as test_value` },
        runtimeContext,
      });

      promises.push(promise);
    }

    const results = await Promise.allSettled(promises);
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason);

    // Should not have connection pool exhaustion errors
    const connectionErrors = errors.filter(error => 
      error.message?.includes('connection') || 
      error.message?.includes('pool')
    );

    expect(connectionErrors).toHaveLength(0);
  }, 30000);

  test('should handle concurrent streaming operations', async () => {
    const concurrentStreams = 3;
    const promises: Promise<any>[] = [];

    for (let i = 0; i < concurrentStreams; i++) {
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('userId', `user-${i}`);
      runtimeContext.set('threadId', `thread-${i}`);
      runtimeContext.set('organizationId', 'test-org');
      runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
      runtimeContext.set('dataSourceSyntax', 'postgres');

      const run = analystWorkflow.createRun();
      const promise = run.start({
        inputData: { 
          prompt: `Create a comprehensive dashboard for stream ${i} with multiple charts` 
        },
        runtimeContext,
      });

      promises.push(promise);
    }

    const results = await Promise.allSettled(promises);
    
    // Verify no streaming accumulator conflicts
    const streamingErrors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason)
      .filter(error => error.message?.includes('streaming') || error.message?.includes('accumulator'));

    expect(streamingErrors).toHaveLength(0);
  }, 90000);
});
```

#### 3. Create Resource Cleanup Tests
```typescript
// tests/performance/resource-cleanup.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { RuntimeContext } from '@mastra/core/runtime-context';
import analystWorkflow, { type AnalystRuntimeContext } from '../../src/workflows/analyst-workflow';

describe('Resource Cleanup Tests', () => {
  let initialMemory: NodeJS.MemoryUsage;

  beforeEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    initialMemory = process.memoryUsage();
  });

  afterEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  test('should not leak memory with repeated workflow executions', async () => {
    const iterations = 10;
    const memorySnapshots: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('userId', 'memory-test-user');
      runtimeContext.set('threadId', `memory-test-thread-${i}`);
      runtimeContext.set('organizationId', 'memory-test-org');
      runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
      runtimeContext.set('dataSourceSyntax', 'postgres');

      const run = analystWorkflow.createRun();
      await run.start({
        inputData: { prompt: `Memory test iteration ${i}` },
        runtimeContext,
      });

      // Force garbage collection and measure memory
      if (global.gc) {
        global.gc();
      }
      
      const currentMemory = process.memoryUsage();
      memorySnapshots.push(currentMemory.heapUsed);
    }

    // Memory should not consistently grow
    const firstHalf = memorySnapshots.slice(0, Math.floor(iterations / 2));
    const secondHalf = memorySnapshots.slice(Math.floor(iterations / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
    
    const memoryGrowthRatio = secondAvg / firstAvg;
    
    console.log('Memory growth analysis:', {
      firstAvgMB: Math.round(firstAvg / 1024 / 1024),
      secondAvgMB: Math.round(secondAvg / 1024 / 1024),
      growthRatio: memoryGrowthRatio.toFixed(3),
    });

    // Memory should not grow by more than 50%
    expect(memoryGrowthRatio).toBeLessThan(1.5);
  }, 120000);

  test('should clean up database connections properly', async () => {
    const { connectionMonitor } = await import('../../src/utils/database/connection-pool-monitor');
    
    const initialStats = connectionMonitor.getMetrics();
    
    // Execute multiple workflows that use database connections
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('userId', 'db-cleanup-user');
      runtimeContext.set('threadId', `db-cleanup-thread-${i}`);
      runtimeContext.set('organizationId', 'db-cleanup-org');
      runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
      runtimeContext.set('dataSourceSyntax', 'postgres');

      const run = analystWorkflow.createRun();
      promises.push(run.start({
        inputData: { prompt: `SELECT 'cleanup test ${i}' as test` },
        runtimeContext,
      }));
    }

    await Promise.allSettled(promises);
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalStats = connectionMonitor.getMetrics();
    
    // Active connections should return to baseline or close to it
    expect(finalStats.activeConnections).toBeLessThanOrEqual(initialStats.activeConnections + 1);
  }, 30000);

  test('should handle streaming resource cleanup', async () => {
    const initialMemory = process.memoryUsage();
    
    // Execute workflow with large streaming output
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'streaming-cleanup-user');
    runtimeContext.set('threadId', 'streaming-cleanup-thread');
    runtimeContext.set('organizationId', 'streaming-cleanup-org');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const run = analystWorkflow.createRun();
    await run.start({
      inputData: { 
        prompt: 'Create a complex dashboard with 10 different charts and detailed analysis' 
      },
      runtimeContext,
    });

    // Force cleanup and measure memory
    if (global.gc) {
      global.gc();
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
    
    console.log(`Memory increase after streaming: ${memoryIncreaseMB.toFixed(2)}MB`);
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncreaseMB).toBeLessThan(50);
  }, 60000);
});
```

#### 4. Create Edge Case Tests
```typescript
// tests/edge-cases/malformed-input.test.ts
import { RuntimeContext } from '@mastra/core/runtime-context';
import { describe, expect, test } from 'vitest';
import analystWorkflow, { type AnalystRuntimeContext } from '../../src/workflows/analyst-workflow';

describe('Edge Case Input Handling', () => {
  function createValidRuntimeContext(): RuntimeContext<AnalystRuntimeContext> {
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'edge-case-user');
    runtimeContext.set('threadId', 'edge-case-thread');
    runtimeContext.set('organizationId', 'edge-case-org');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');
    return runtimeContext;
  }

  test('should handle extremely long prompts', async () => {
    const longPrompt = 'A'.repeat(10000); // 10KB prompt
    
    const run = analystWorkflow.createRun();
    const result = await run.start({
      inputData: { prompt: longPrompt },
      runtimeContext: createValidRuntimeContext(),
    });

    expect(result).toBeDefined();
  }, 30000);

  test('should handle prompts with special characters', async () => {
    const specialCharPrompt = `
      Test with special chars: "quotes", 'single quotes', \`backticks\`
      Unicode: 测试 🚀 emoji ñ accents
      Control chars: \t\n\r\b\f
      SQL injection attempt: '; DROP TABLE users; --
      XSS attempt: <script>alert('xss')</script>
      Null bytes: \0\x00
    `;
    
    const run = analystWorkflow.createRun();
    const result = await run.start({
      inputData: { prompt: specialCharPrompt },
      runtimeContext: createValidRuntimeContext(),
    });

    expect(result).toBeDefined();
  }, 30000);

  test('should handle empty and whitespace-only prompts', async () => {
    const emptyPrompts = [
      '',
      '   ',
      '\t\n\r',
      '                    ',
    ];

    for (const prompt of emptyPrompts) {
      const run = analystWorkflow.createRun();
      
      // Should either handle gracefully or provide meaningful error
      try {
        const result = await run.start({
          inputData: { prompt },
          runtimeContext: createValidRuntimeContext(),
        });
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/prompt|input|empty/i);
      }
    }
  }, 30000);

  test('should handle malformed conversation history', async () => {
    const malformedHistories = [
      // Missing required fields
      [{ content: 'test' }],
      // Invalid role
      [{ role: 'invalid', content: 'test' }],
      // Null content
      [{ role: 'user', content: null }],
      // Deeply nested objects
      [{ role: 'user', content: { nested: { very: { deep: { object: 'test' } } } } }],
    ];

    for (const history of malformedHistories) {
      const run = analystWorkflow.createRun();
      
      try {
        const result = await run.start({
          inputData: { 
            prompt: 'Test with malformed history',
            conversationHistory: history as any
          },
          runtimeContext: createValidRuntimeContext(),
        });
        
        // Should handle gracefully if no error thrown
        expect(result).toBeDefined();
      } catch (error) {
        // Should provide meaningful error for malformed input
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/history|format|invalid/i);
      }
    }
  }, 30000);

  test('should handle network timeout scenarios', async () => {
    // Simulate slow network by using a complex query
    const complexPrompt = `
      Create a comprehensive analysis that requires:
      - Multiple complex SQL queries with joins
      - Large data aggregations
      - Multiple visualization components
      - Detailed statistical analysis
      Please make this as thorough as possible with extensive calculations.
    `;
    
    const run = analystWorkflow.createRun();
    const startTime = Date.now();
    
    try {
      const result = await run.start({
        inputData: { prompt: complexPrompt },
        runtimeContext: createValidRuntimeContext(),
      });
      
      const duration = Date.now() - startTime;
      console.log(`Complex analysis completed in ${duration}ms`);
      
      expect(result).toBeDefined();
    } catch (error) {
      // Should provide user-friendly timeout errors
      expect((error as Error).message).toMatch(/timeout|slow|unavailable/i);
    }
  }, 120000);
});
```

#### 5. Create Test Utilities
```typescript
// tests/utils/test-utilities.ts
import { RuntimeContext } from '@mastra/core/runtime-context';
import type { AnalystRuntimeContext } from '../../src/workflows/analyst-workflow';

export interface TestResourceMonitor {
  initialMemory: NodeJS.MemoryUsage;
  startTime: number;
  checkpoints: Array<{
    timestamp: number;
    memory: NodeJS.MemoryUsage;
    description: string;
  }>;
}

export function createResourceMonitor(): TestResourceMonitor {
  if (global.gc) {
    global.gc();
  }
  
  return {
    initialMemory: process.memoryUsage(),
    startTime: Date.now(),
    checkpoints: [],
  };
}

export function addCheckpoint(monitor: TestResourceMonitor, description: string): void {
  if (global.gc) {
    global.gc();
  }
  
  monitor.checkpoints.push({
    timestamp: Date.now(),
    memory: process.memoryUsage(),
    description,
  });
}

export function analyzeResourceUsage(monitor: TestResourceMonitor): {
  totalDurationMs: number;
  memoryGrowthMB: number;
  peakMemoryMB: number;
  checkpoints: Array<{
    description: string;
    memoryGrowthMB: number;
    durationMs: number;
  }>;
} {
  const finalMemory = process.memoryUsage();
  const memoryGrowth = finalMemory.heapUsed - monitor.initialMemory.heapUsed;
  
  const peakMemory = Math.max(
    finalMemory.heapUsed,
    ...monitor.checkpoints.map(c => c.memory.heapUsed)
  );
  
  const checkpointAnalysis = monitor.checkpoints.map(checkpoint => ({
    description: checkpoint.description,
    memoryGrowthMB: (checkpoint.memory.heapUsed - monitor.initialMemory.heapUsed) / 1024 / 1024,
    durationMs: checkpoint.timestamp - monitor.startTime,
  }));
  
  return {
    totalDurationMs: Date.now() - monitor.startTime,
    memoryGrowthMB: memoryGrowth / 1024 / 1024,
    peakMemoryMB: peakMemory / 1024 / 1024,
    checkpoints: checkpointAnalysis,
  };
}

export function createStandardRuntimeContext(overrides?: Partial<AnalystRuntimeContext>): RuntimeContext<AnalystRuntimeContext> {
  const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
  
  const defaults = {
    userId: 'test-user',
    threadId: 'test-thread',
    organizationId: 'test-org',
    dataSourceId: 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
    dataSourceSyntax: 'postgres',
    ...overrides,
  };
  
  Object.entries(defaults).forEach(([key, value]) => {
    runtimeContext.set(key, value);
  });
  
  return runtimeContext;
}

export async function measureExecutionTime<T>(
  operation: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const startTime = Date.now();
  const result = await operation();
  const durationMs = Date.now() - startTime;
  
  return { result, durationMs };
}

export function expectWithinRange(
  actual: number, 
  expected: number, 
  tolerancePercent: number = 10
): void {
  const tolerance = expected * (tolerancePercent / 100);
  const min = expected - tolerance;
  const max = expected + tolerance;
  
  expect(actual).toBeGreaterThanOrEqual(min);
  expect(actual).toBeLessThanOrEqual(max);
}
```

## Acceptance Criteria

- [ ] Error boundary tests cover all failure scenarios
- [ ] Concurrent execution tests verify thread safety
- [ ] Resource cleanup tests prevent memory leaks
- [ ] Edge case tests handle malformed inputs gracefully
- [ ] Performance regression tests establish baselines
- [ ] Test utilities support comprehensive monitoring
- [ ] All tests run reliably in CI/CD pipeline

## Test Execution

Add to package.json:
```json
{
  "scripts": {
    "test:error-boundaries": "vitest run tests/error-boundaries/",
    "test:concurrency": "vitest run tests/concurrency/",
    "test:performance": "vitest run tests/performance/",
    "test:edge-cases": "vitest run tests/edge-cases/",
    "test:stress": "vitest run tests/stress/",
    "test:comprehensive": "vitest run tests/error-boundaries/ tests/concurrency/ tests/performance/ tests/edge-cases/"
  }
}
```

## CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Run comprehensive tests
  run: |
    npm run test:comprehensive
    npm run test:stress
  env:
    NODE_OPTIONS: "--expose-gc --max-old-space-size=4096"
```

## Performance Baselines

Establish baselines for:
- Memory usage per workflow execution
- Database connection pool utilization
- Streaming accumulator sizes
- Query execution times
- Workflow completion times

## Notes

This ticket builds on the error handling standardization (TICKET-004) and helps ensure the fixes from other tickets work correctly under stress. It's critical for production confidence.