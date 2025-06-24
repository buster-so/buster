import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface BatchParams {
  commands: Command[];
  max_parallel: number;
  stop_on_error: boolean;
}

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

// Note: ReviewResult interface currently unused but kept for future implementation
// interface ReviewResult {
//   score: number;
//   issues: Issue[];
// }

// Note: Issue interface currently unused but kept for future implementation
// interface Issue {
//   severity: 'critical' | 'warning' | 'suggestion';
//   category: string;
//   description: string;
//   recommendation: string;
// }

export const batchTool = createTool({
  id: 'batch-execute',
  description: 'Execute multiple commands with dependency management and parallel execution',
  inputSchema: z.object({
    commands: z.array(
      z.object({
        id: z.string().describe('Unique command identifier'),
        command: z.string().describe('Command to execute'),
        depends_on: z.array(z.string()).default([]).describe('IDs of commands this depends on'),
        continue_on_error: z.boolean().default(false).describe('Continue if this command fails'),
        timeout: z.number().optional().describe('Command timeout in ms'),
        cwd: z.string().optional().describe('Working directory'),
        env: z.record(z.string()).optional().describe('Environment variables'),
      })
    ),
    max_parallel: z.number().default(4).describe('Maximum parallel executions'),
    stop_on_error: z.boolean().default(true).describe('Stop all execution on any error'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    total_commands: z.number(),
    successful_commands: z.number(),
    failed_commands: z.number(),
    results: z.array(
      z.object({
        id: z.string(),
        command: z.string(),
        status: z.enum(['success', 'failed', 'skipped']),
        exit_code: z.number().optional(),
        stdout: z.string(),
        stderr: z.string(),
        duration_ms: z.number(),
        error: z.string().optional(),
      })
    ),
    total_duration_ms: z.number(),
  }),
  execute: async ({ context }) => {
    return await executeBatch(context as BatchParams);
  },
});

const executeBatch = wrapTraced(
  async (params: BatchParams) => {
    const startTime = Date.now();
    const { commands, max_parallel = 4, stop_on_error = true } = params;

    // Validate command graph
    validateDependencyGraph(commands);

    // Build execution plan
    const executionPlan = buildExecutionPlan(commands);

    // Execute commands
    const results = await executeCommandPlan(executionPlan, max_parallel, stop_on_error);

    // Calculate summary
    const successful = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return {
      success: failed === 0,
      total_commands: commands.length,
      successful_commands: successful,
      failed_commands: failed,
      results,
      total_duration_ms: Date.now() - startTime,
    };
  },
  { name: 'batch-execute' }
);

function validateDependencyGraph(commands: Command[]): void {
  const ids = new Set(commands.map((c) => c.id));

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
  for (const cmd of commands) {
    graph.set(cmd.id, cmd.depends_on);
  }

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

  for (const node of Array.from(graph.keys())) {
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
  for (const cmd of commands) {
    graph.set(cmd.id, cmd);
    inDegree.set(cmd.id, cmd.depends_on.length);
  }

  const plan: Command[][] = [];
  const executed = new Set<string>();

  while (executed.size < commands.length) {
    const batch: Command[] = [];

    // Find commands with no pending dependencies
    for (const [id, cmd] of Array.from(graph.entries())) {
      if (!executed.has(id) && inDegree.get(id) === 0) {
        batch.push(cmd);
      }
    }

    if (batch.length === 0) {
      throw new Error('Unable to resolve execution order');
    }

    // Mark as executed and update dependencies
    for (const cmd of batch) {
      executed.add(cmd.id);

      // Decrease in-degree for dependent commands
      for (const c of commands) {
        if (c.depends_on.includes(cmd.id)) {
          const currentDegree = inDegree.get(c.id);
          if (currentDegree !== undefined) {
            inDegree.set(c.id, currentDegree - 1);
          }
        }
      }
    }

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
    const batchResults = await executeCommandBatch(batch, maxParallel, failedCommands);

    results.push(...batchResults);

    // Check for failures
    const failures = batchResults.filter((r) => r.status === 'failed');
    for (const f of failures) {
      failedCommands.add(f.id);
    }

    if (stopOnError && failures.length > 0) {
      // Skip remaining commands
      const remainingCommands = plan.slice(plan.indexOf(batch) + 1).flat();

      for (const cmd of remainingCommands) {
        results.push({
          id: cmd.id,
          command: cmd.command,
          status: 'skipped',
          stdout: '',
          stderr: '',
          duration_ms: 0,
          error: 'Skipped due to previous error',
        });
      }

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
      if (cmd.depends_on.some((dep) => failedDependencies.has(dep))) {
        return {
          id: cmd.id,
          command: cmd.command,
          status: 'skipped' as const,
          stdout: '',
          stderr: '',
          duration_ms: 0,
          error: 'Skipped due to failed dependency',
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
    // Validate security constraints
    validateCommandSecurity(cmd.command);

    const result = await executeCommand(cmd.command, {
      cwd: cmd.cwd || '',
      env: { ...process.env, ...cmd.env } as Record<string, string>,
      timeout: cmd.timeout || 30000,
    });

    return {
      id: cmd.id,
      command: cmd.command,
      status: result.exitCode === 0 ? 'success' : 'failed',
      exit_code: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      id: cmd.id,
      command: cmd.command,
      status: 'failed',
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
      duration_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function validateCommandSecurity(command: string): void {
  // Basic security validation
  const dangerousPatterns = [
    /rm\s+-rf/,
    />\s*\/dev\/sd[a-z]/,
    /dd\s+if=/,
    /mkfs/,
    /fdisk/,
    /eval\s*\(/,
    /exec\s*\(/,
    /system\s*\(/,
    /curl.*\|\s*sh/,
    /wget.*\|\s*sh/,
    /sudo\s+/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      throw new Error(`Command contains potentially dangerous pattern: ${command}`);
    }
  }

  // Check for suspicious file access
  const sensitiveFiles = [
    '/etc/passwd',
    '/etc/shadow',
    '/etc/sudoers',
    '/root/',
    '~/.ssh/',
    '~/.aws/',
  ];

  for (const file of sensitiveFiles) {
    if (command.includes(file)) {
      throw new Error(`Command attempts to access sensitive file: ${file}`);
    }
  }
}

async function executeCommand(
  command: string,
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const [cmd, ...args] = command.split(' ');

    if (!cmd) {
      reject(new Error('Empty command'));
      return;
    }

    const child = spawn(cmd, args, {
      cwd: options.cwd ? resolve(options.cwd) : process.cwd(),
      env: options.env as NodeJS.ProcessEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    }

    const timeout = options.timeout || 30000;
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    child.on('close', (code: number | null) => {
      clearTimeout(timer);
      resolvePromise({
        exitCode: code || 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });

    child.on('error', (error: Error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
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

    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;

    if (this.waiting.length > 0 && this.permits > 0) {
      this.permits--;
      const resolve = this.waiting.shift();
      if (resolve) {
        resolve();
      }
    }
  }
}
