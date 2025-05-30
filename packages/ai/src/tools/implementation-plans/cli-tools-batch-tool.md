# Batch Tool Implementation Plan

## Overview

Migrate the Rust `batch_tool.rs` to TypeScript using Mastra framework. This tool executes multiple commands in sequence with dependency management.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/cli_tools/batch_tool.rs`
- **Purpose**: Execute multiple commands with ordering and error handling
- **Input**: Array of commands with dependencies
- **Output**: Results of all command executions
- **Key Features**:
  - Command dependency graph
  - Parallel execution where possible
  - Error propagation control
  - Output aggregation

## Dependencies
- Node.js child_process for command execution
- Node.js fs/promises for file operations
- Security validation utilities
- @mastra/core/workflows for orchestration
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Workflow-based
**Wave**: 3
**AI Agent Time**: 4 minutes
**Depends on**: bash-tool, basic CLI tools

## TypeScript Implementation

### Tool Definition

```typescript
export const batchTool = createTool({
  id: 'batch-execute',
  description: 'Execute multiple commands with dependency management and parallel execution',
  inputSchema: z.object({
    commands: z.array(z.object({
      id: z.string().describe('Unique command identifier'),
      command: z.string().describe('Command to execute'),
      depends_on: z.array(z.string()).default([]).describe('IDs of commands this depends on'),
      continue_on_error: z.boolean().default(false).describe('Continue if this command fails'),
      timeout: z.number().optional().describe('Command timeout in ms'),
      cwd: z.string().optional().describe('Working directory'),
      env: z.record(z.string()).optional().describe('Environment variables')
    })),
    max_parallel: z.number().default(4).describe('Maximum parallel executions'),
    stop_on_error: z.boolean().default(true).describe('Stop all execution on any error')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    total_commands: z.number(),
    successful_commands: z.number(),
    failed_commands: z.number(),
    results: z.array(z.object({
      id: z.string(),
      command: z.string(),
      status: z.enum(['success', 'failed', 'skipped']),
      exit_code: z.number().optional(),
      stdout: z.string(),
      stderr: z.string(),
      duration_ms: z.number(),
      error: z.string().optional()
    })),
    total_duration_ms: z.number()
  }),
  execute: async ({ context }) => {
    return await executeBatch(context);
  },
});
```

### Core Implementation

```typescript
interface Command {
  id: string;
  command: string;
  depends_on: string[];
  continue_on_error: boolean;
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
}

interface CommandResult {
  id: string;
  command: string;
  status: 'success' | 'failed' | 'skipped';
  exit_code?: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  error?: string;
}

const executeBatch = wrapTraced(
  async (params: BatchParams) => {
    const startTime = Date.now();
    const { commands, max_parallel = 4, stop_on_error = true } = params;
    
    // Validate command graph
    validateDependencyGraph(commands);
    
    // Build execution plan
    const executionPlan = buildExecutionPlan(commands);
    
    // Execute commands
    const results = await executeCommandPlan(
      executionPlan,
      max_parallel,
      stop_on_error
    );
    
    // Calculate summary
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    return {
      success: failed === 0,
      total_commands: commands.length,
      successful_commands: successful,
      failed_commands: failed,
      results,
      total_duration_ms: Date.now() - startTime
    };
  },
  { name: 'batch-execute' }
);

function validateDependencyGraph(commands: Command[]): void {
  const ids = new Set(commands.map(c => c.id));
  
  // Check for duplicate IDs
  if (ids.size !== commands.length) {
    throw new Error('Duplicate command IDs found');
  }
  
  // Check for missing dependencies
  for (const cmd of commands) {
    for (const dep of cmd.depends_on) {
      if (!ids.has(dep)) {
        throw new Error(`Command ${cmd.id} depends on unknown command ${dep}`);
      }
    }
  }
  
  // Check for circular dependencies
  if (hasCircularDependency(commands)) {
    throw new Error('Circular dependency detected in command graph');
  }
}

function hasCircularDependency(commands: Command[]): boolean {
  const graph = new Map<string, string[]>();
  commands.forEach(cmd => graph.set(cmd.id, cmd.depends_on));
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);
    
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) return true;
    }
  }
  
  return false;
}

function buildExecutionPlan(commands: Command[]): Command[][] {
  const graph = new Map<string, Command>();
  const inDegree = new Map<string, number>();
  
  // Initialize
  commands.forEach(cmd => {
    graph.set(cmd.id, cmd);
    inDegree.set(cmd.id, cmd.depends_on.length);
  });
  
  const plan: Command[][] = [];
  const executed = new Set<string>();
  
  while (executed.size < commands.length) {
    const batch: Command[] = [];
    
    // Find commands with no pending dependencies
    for (const [id, cmd] of graph) {
      if (!executed.has(id) && inDegree.get(id) === 0) {
        batch.push(cmd);
      }
    }
    
    if (batch.length === 0) {
      throw new Error('Unable to resolve execution order');
    }
    
    // Mark as executed and update dependencies
    batch.forEach(cmd => {
      executed.add(cmd.id);
      
      // Decrease in-degree for dependent commands
      commands.forEach(c => {
        if (c.depends_on.includes(cmd.id)) {
          inDegree.set(c.id, inDegree.get(c.id)! - 1);
        }
      });
    });
    
    plan.push(batch);
  }
  
  return plan;
}

async function executeCommandPlan(
  plan: Command[][],
  maxParallel: number,
  stopOnError: boolean
): Promise<CommandResult[]> {
  const results: CommandResult[] = [];
  const failedCommands = new Set<string>();
  
  for (const batch of plan) {
    // Execute batch with parallelism limit
    const batchResults = await executeCommandBatch(
      batch,
      maxParallel,
      failedCommands
    );
    
    results.push(...batchResults);
    
    // Check for failures
    const failures = batchResults.filter(r => r.status === 'failed');
    failures.forEach(f => failedCommands.add(f.id));
    
    if (stopOnError && failures.length > 0) {
      // Skip remaining commands
      const remainingCommands = plan
        .slice(plan.indexOf(batch) + 1)
        .flat();
        
      remainingCommands.forEach(cmd => {
        results.push({
          id: cmd.id,
          command: cmd.command,
          status: 'skipped',
          stdout: '',
          stderr: '',
          duration_ms: 0,
          error: 'Skipped due to previous error'
        });
      });
      
      break;
    }
  }
  
  return results;
}

async function executeCommandBatch(
  batch: Command[],
  maxParallel: number,
  failedDependencies: Set<string>
): Promise<CommandResult[]> {
  const semaphore = new Semaphore(maxParallel);
  
  return Promise.all(
    batch.map(async (cmd) => {
      // Skip if dependencies failed
      if (cmd.depends_on.some(dep => failedDependencies.has(dep))) {
        return {
          id: cmd.id,
          command: cmd.command,
          status: 'skipped' as const,
          stdout: '',
          stderr: '',
          duration_ms: 0,
          error: 'Skipped due to failed dependency'
        };
      }
      
      await semaphore.acquire();
      
      try {
        return await executeSingleCommand(cmd);
      } finally {
        semaphore.release();
      }
    })
  );
}

async function executeSingleCommand(cmd: Command): Promise<CommandResult> {
  const startTime = Date.now();
  
  try {
    const result = await executeCommand(cmd.command, {
      cwd: cmd.cwd,
      env: { ...process.env, ...cmd.env },
      timeout: cmd.timeout
    });
    
    return {
      id: cmd.id,
      command: cmd.command,
      status: result.exitCode === 0 ? 'success' : 'failed',
      exit_code: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration_ms: Date.now() - startTime
    };
  } catch (error) {
    return {
      id: cmd.id,
      command: cmd.command,
      status: 'failed',
      stdout: '',
      stderr: error.message,
      duration_ms: Date.now() - startTime,
      error: error.message
    };
  }
}

// Simple semaphore implementation
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }
  
  release(): void {
    this.permits++;
    
    if (this.waiting.length > 0 && this.permits > 0) {
      this.permits--;
      const resolve = this.waiting.shift()!;
      resolve();
    }
  }
}
```

## Test Strategy

### Unit Tests (`batch-tool.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Dependency graph validation
- Circular dependency detection
- Execution order verification
- Parallel execution limits

### Integration Tests (`batch-tool.integration.test.ts`)
- Real command execution
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Complex dependency chains
- Error propagation handling

## AI Agent Implementation Time

**Estimated Time**: 4 minutes
**Complexity**: Medium-High

## Implementation Priority

**Medium** - Useful for complex workflows but not critical.