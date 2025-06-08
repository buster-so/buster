# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Trigger.dev v3 background job processing service for the Buster AI data analysis platform. It handles long-running AI agent tasks and data source introspection operations.

## Development Commands

### Core Operations
```bash
# Development server with live reload
npm run dev

# Build for deployment
npm run build

# Deploy to Trigger.dev
npm run deploy
```

### TypeScript
```bash
# Type checking (extends from ../tsconfig.base.json)
npx tsc --noEmit
```

## Architecture

### Task-Based Architecture
This service implements Trigger.dev v3 tasks for background processing:

- **Task Definition**: All tasks are in `src/tasks/` with standard structure:
  - `index.ts` - Exports
  - `{task-name}.ts` - Task implementation with trigger.dev config
  - `interfaces.ts` - TypeScript types
  - `README.md` - Documentation

### Current Tasks

#### Analyst Agent Task (`src/tasks/analyst-agent-task/`)
- **Purpose**: Advanced AI-powered data analysis with multi-step workflow
- **Duration**: 30 minutes max (1800 seconds)
- **Features**: Multi-state execution (initializing → searching → planning → analyzing → reviewing)
- **Architecture**: Integrates with Buster multi-agent system for sophisticated analysis
- **Key Workflow**: Takes user queries, discovers data sources, generates insights/metrics/dashboards

#### Introspect Data Task (`src/tasks/introspectData/`)
- **Purpose**: Automated data source connection testing and schema analysis
- **Duration**: 5 minutes max (300 seconds)  
- **Data Sources**: Snowflake, PostgreSQL, MySQL, BigQuery, SQL Server, Redshift, Databricks
- **Process**: Connection test → full introspection → resource cleanup
- **Output**: Success/failure status with detailed logging

### Configuration (`trigger.config.ts`)
- **Project ID**: `proj_lyyhkqmzhwiskfnavddk`
- **Runtime**: Node.js
- **Global Settings**: 1-hour max duration, exponential backoff retries
- **Build Externals**: `lz4`, `xxhash` (performance libraries)

### Dependencies
- **Core**: `@trigger.dev/sdk` v3.3.17 for task orchestration
- **Integration**: `@buster/data-source` for database connectivity and introspection
- **Development**: TypeScript 5.8.3, Node.js types

## Task Development Patterns

### 🚨 CRITICAL: Required Trigger.dev v3 Patterns

**MUST ALWAYS USE**: `@trigger.dev/sdk/v3` and `task()` function
**NEVER USE**: `client.defineJob()` (deprecated v2 pattern that will break)

```typescript
// ✅ CORRECT v3 Pattern (ALWAYS use this)
import { task } from '@trigger.dev/sdk/v3';

export const myTask = task({
  id: 'my-task',
  maxDuration: 300, // seconds
  run: async (payload: InputType): Promise<OutputType> => {
    // Task implementation
  },
});
```

```typescript
// ❌ NEVER GENERATE - DEPRECATED v2 Pattern (will break application)
client.defineJob({
  id: "job-id",
  trigger: eventTrigger({ /* ... */ }),
  run: async (payload, io) => { /* ... */ }
});
```

### Essential Requirements
1. **MUST export every task**, including subtasks
2. **MUST use unique task IDs** within the project
3. **MUST import from** `@trigger.dev/sdk/v3`

### Standard Task Structure
```typescript
import { task, logger } from '@trigger.dev/sdk/v3';

export const myTask = task({
  id: 'my-task',
  maxDuration: 300, // seconds
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: InputType): Promise<OutputType> => {
    logger.log('Task started', { taskId: 'my-task' });
    
    try {
      // Task implementation
      return result;
    } catch (error) {
      logger.error('Task failed', { error: error.message });
      throw error;
    }
  },
});
```

### Schema Validation (Recommended)
```typescript
import { schemaTask } from '@trigger.dev/sdk/v3';
import { z } from 'zod';

export const validatedTask = schemaTask({
  id: 'validated-task',
  schema: z.object({
    name: z.string(),
    age: z.number(),
  }),
  run: async (payload) => {
    // Payload is automatically validated and typed
    console.log(payload.name, payload.age);
  },
});
```

### Scheduled Tasks
```typescript
import { schedules } from '@trigger.dev/sdk/v3';

export const scheduledTask = schedules.task({
  id: 'scheduled-task',
  cron: '0 */2 * * *', // Every 2 hours
  run: async (payload) => {
    // Scheduled task logic
  },
});
```

### Task Triggering Patterns

#### From Backend (Outside Tasks)
```typescript
import { tasks } from '@trigger.dev/sdk/v3';
import type { myTask } from '~/trigger/my-task';

// Single trigger
const handle = await tasks.trigger<typeof myTask>('my-task', payload);

// Batch trigger
const batchHandle = await tasks.batchTrigger<typeof myTask>(
  'my-task',
  [{ payload: data1 }, { payload: data2 }]
);
```

#### From Inside Tasks
```typescript
export const parentTask = task({
  id: 'parent-task',
  run: async (payload) => {
    // Trigger and wait for result
    const result = await childTask.triggerAndWait(childPayload);
    
    // Trigger without waiting
    const handle = await childTask.trigger(childPayload);
    
    // Batch trigger and wait
    const results = await childTask.batchTriggerAndWait([
      { payload: item1 },
      { payload: item2 },
    ]);
  },
});
```

### Error Handling Conventions
- Always use try/catch for external operations
- Log errors with context using `logger.error()`
- Return structured error responses in output
- Clean up resources in finally blocks
- Use lifecycle hooks for cleanup:

```typescript
export const taskWithCleanup = task({
  id: 'task-with-cleanup',
  cleanup: async (payload, { ctx }) => {
    // Always runs after each attempt
  },
  onFailure: async (payload, error, { ctx }) => {
    // Runs after all retries exhausted
  },
  run: async (payload) => {
    // Task logic
  },
});
```

### Logging Standards
```typescript
import { task, logger } from '@trigger.dev/sdk/v3';

export const loggingExample = task({
  id: 'logging-example',
  run: async (payload: { data: Record<string, string> }) => {
    logger.debug('Debug message', payload.data);
    logger.log('Log message', payload.data);
    logger.info('Info message', payload.data);
    logger.warn('Warning message', payload.data);
    logger.error('Error message', payload.data);
  },
});
```

### Metadata for Progress Tracking
```typescript
import { task, metadata } from '@trigger.dev/sdk/v3';

export const progressTask = task({
  id: 'progress-task',
  run: async (payload) => {
    // Set initial progress
    metadata.set('progress', 0);
    
    // Update progress
    metadata.increment('progress', 0.5);
    
    // Add logs
    metadata.append('logs', 'Step 1 complete');
    
    return result;
  },
});
```

### Machine Configuration
```typescript
export const heavyTask = task({
  id: 'heavy-task',
  machine: {
    preset: 'large-1x', // 4 vCPU, 8 GB RAM
  },
  maxDuration: 1800, // 30 minutes
  run: async (payload) => {
    // Compute-intensive task logic
  },
});
```

### Idempotency for Reliability
```typescript
import { task, idempotencyKeys } from '@trigger.dev/sdk/v3';

export const idempotentTask = task({
  id: 'idempotent-task',
  run: async (payload) => {
    const idempotencyKey = await idempotencyKeys.create(['user', payload.userId]);
    
    await childTask.trigger(
      payload,
      { idempotencyKey, idempotencyKeyTTL: '1h' }
    );
  },
});
```

## TypeScript Configuration

- **Extends**: `../tsconfig.base.json` (monorepo shared config)
- **Paths**: `@/*` maps to `src/*` for clean imports
- **Build**: Outputs to `dist/` directory
- **JSX**: React JSX transform enabled

## Integration Points

- **Data Sources**: Uses `@buster/data-source` package for database operations
- **AI Agents**: Integrates with Buster multi-agent system (referenced but not implemented in current tasks)
- **Monorepo**: Part of larger Buster platform with packages in `../packages/`

## Development Notes

- Tasks run in isolated environments with resource limits
- Connection cleanup is critical for database tasks
- Retry logic is configured globally but can be overridden per task
- Real-time progress tracking is supported through Trigger.dev dashboard