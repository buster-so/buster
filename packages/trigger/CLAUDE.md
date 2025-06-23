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

### Schema Validation with Zod (Required Pattern)

**ALL tasks MUST use Zod schemas** for type-safe validation and automatic type inference:

```typescript
import { schemaTask } from '@trigger.dev/sdk/v3';
import { z } from 'zod';

// Define Zod schema
export const TaskInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().min(0).max(120),
  email: z.string().email().optional(),
  options: z.object({
    enableNotifications: z.boolean().default(true),
    maxRetries: z.number().int().min(0).max(5).default(3),
  }).optional(),
});

// TypeScript type automatically inferred from schema
export type TaskInput = z.infer<typeof TaskInputSchema>;

export const validatedTask = schemaTask({
  id: 'validated-task',
  schema: TaskInputSchema,
  run: async (payload) => {
    // Payload is automatically validated and typed
    console.log(payload.name, payload.age);
    // Full TypeScript IntelliSense available
  },
});
```

### Zod Schema Patterns for Trigger Tasks

#### 1. Use Schemas Instead of Interfaces
```typescript
// ❌ DON'T: Define separate interfaces
export interface TaskInput {
  name: string;
  age: number;
}

// ✅ DO: Define Zod schema and infer types
export const TaskInputSchema = z.object({
  name: z.string(),
  age: z.number(),
});
export type TaskInput = z.infer<typeof TaskInputSchema>;
```

#### 2. Complex Nested Schemas
```typescript
export const DataSourceSchema = z.object({
  name: z.string().min(1, 'Data source name is required'),
  type: z.enum(['snowflake', 'postgresql', 'mysql', 'bigquery']),
  credentials: z.record(z.unknown()), // Flexible for different credential types
});

export const AnalysisOptionsSchema = z.object({
  maxSteps: z.number().int().min(1).max(50).default(15),
  model: z.enum(['claude-3-sonnet', 'claude-3-opus']).default('claude-3-sonnet'),
  enableStreaming: z.boolean().default(false),
});

export const TaskInputSchema = z.object({
  sessionId: z.string().uuid('Must be a valid UUID'),
  query: z.string().min(1, 'Query cannot be empty'),
  dataSources: z.array(DataSourceSchema).optional(),
  options: AnalysisOptionsSchema.optional(),
});
```

#### 3. Output Schema Validation
```typescript
export const TaskOutputSchema = z.object({
  success: z.boolean(),
  sessionId: z.string(),
  result: z.object({
    response: z.string(),
    artifacts: z.array(z.object({
      id: z.string(),
      type: z.enum(['metric', 'dashboard', 'query', 'chart']),
      title: z.string(),
      content: z.record(z.unknown()),
    })).default([]),
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }).optional(),
});

export type TaskOutput = z.infer<typeof TaskOutputSchema>;
```

#### 4. Enum Validation
```typescript
export const DatabaseTypeSchema = z.enum([
  'snowflake', 'postgresql', 'mysql', 'bigquery', 
  'sqlserver', 'redshift', 'databricks'
]);

export const AgentPhaseSchema = z.enum([
  'initializing', 'searching', 'planning', 
  'analyzing', 'reviewing', 'completed', 'failed'
]);
```

#### 5. Advanced Validation Rules
```typescript
export const CredentialsSchema = z.object({
  type: DatabaseTypeSchema,
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
}).passthrough() // Allow additional fields for different credential types
  .refine(data => {
    // Custom validation: BigQuery doesn't need host/port
    if (data.type === 'bigquery') return true;
    return data.host && data.port;
  }, 'Host and port required for non-BigQuery databases');
```

### Benefits of Zod Schema Approach

1. **Single Source of Truth** - Schema defines both validation and TypeScript types
2. **Runtime Safety** - Validates payloads before task execution, preventing runtime errors
3. **Better Error Messages** - Descriptive validation errors with field-specific context
4. **Zero Duplication** - No need to maintain separate interfaces and validation logic
5. **IDE Support** - Full IntelliSense, autocomplete, and error checking
6. **Automatic Type Inference** - TypeScript types automatically generated from schemas

### File Organization Pattern

Each task should have an `interfaces.ts` file structured as:

```typescript
// interfaces.ts
import { z } from 'zod';

// 1. Define all Zod schemas
export const InputSchema = z.object({ /* ... */ });
export const OutputSchema = z.object({ /* ... */ });

// 2. Export TypeScript types
export type Input = z.infer<typeof InputSchema>;
export type Output = z.infer<typeof OutputSchema>;

// 3. Export any helper schemas for reuse
export const CommonSchema = z.object({ /* ... */ });
```

### Migration from Interfaces

When updating existing tasks:

1. **Replace interfaces with Zod schemas**
2. **Use `z.infer<typeof Schema>` for types**
3. **Update task to use `schemaTask`**
4. **Add meaningful validation rules**
5. **Test payload validation**

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