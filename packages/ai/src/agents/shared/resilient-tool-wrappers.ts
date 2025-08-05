/**
 * Resilient Tool Wrappers
 *
 * This module provides wrapper functions that make tools extremely resilient
 * by ensuring they never throw exceptions that could terminate the agent.
 * Instead, tools return graceful error responses and continue operation.
 */

import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import type { DocsAgentContext } from '../../context/docs-agent-context';
import {
  type ResilientResult,
  createResilientWrapper,
  safeJsonParse,
  sandboxCircuitBreaker,
  validateWithRecovery,
  withErrorRecovery,
} from './error-recovery';

// Re-export withErrorRecovery for use in other files
export { withErrorRecovery };

/**
 * Safe tool execution result that matches expected tool output schemas
 */
export interface SafeToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  fallbackUsed?: boolean;
}

/**
 * Bash tool resilient wrapper
 */
export function createResilientBashTool() {
  const bashOutputSchema = z.object({
    results: z.array(
      z.object({
        command: z.string(),
        stdout: z.string(),
        stderr: z.string().optional(),
        exitCode: z.number(),
        success: z.boolean(),
        error: z.string().optional(),
      })
    ),
  });

  type BashOutput = z.infer<typeof bashOutputSchema>;
  type BashInput = {
    commands: Array<{
      command: string;
      description?: string;
      timeout?: number;
    }>;
  };

  return createResilientWrapper<BashInput, BashOutput>(
    async (input: BashInput) => {
      // This would call the actual bash tool implementation
      throw new Error('Implementation would go here');
    },
    {
      toolName: 'execute-bash',
      gracefulError: (input: BashInput, error: string): BashOutput => ({
        results: input.commands.map((cmd) => ({
          command: cmd.command,
          stdout: '',
          stderr: `Tool error: ${error}`,
          exitCode: 1,
          success: false,
          error: `Bash execution failed: ${error}`,
        })),
      }),
      retryOptions: {
        maxRetries: 3,
        baseDelayMs: 2000,
        maxDelayMs: 10000,
      },
    }
  );
}

/**
 * File creation tool resilient wrapper
 */
export function createResilientFileCreationTool() {
  const fileCreationOutputSchema = z.object({
    results: z.array(
      z.discriminatedUnion('status', [
        z.object({
          status: z.literal('success'),
          filePath: z.string(),
        }),
        z.object({
          status: z.literal('error'),
          filePath: z.string(),
          errorMessage: z.string(),
        }),
      ])
    ),
    gitCommit: z
      .object({
        attempted: z.boolean(),
        success: z.boolean(),
        commitHash: z.string().optional(),
        errorMessage: z.string().optional(),
      })
      .optional(),
  });

  type FileCreationOutput = z.infer<typeof fileCreationOutputSchema>;
  type FileCreationInput = {
    files: Array<{
      path: string;
      content: string;
    }>;
    what_i_did?: string;
  };

  return createResilientWrapper<FileCreationInput, FileCreationOutput>(
    async (input: FileCreationInput) => {
      // This would call the actual file creation tool implementation
      throw new Error('Implementation would go here');
    },
    {
      toolName: 'create-files',
      gracefulError: (input: FileCreationInput, error: string): FileCreationOutput => ({
        results: input.files.map((file) => ({
          status: 'error' as const,
          filePath: file.path,
          errorMessage: `File creation failed: ${error}`,
        })),
        gitCommit: input.what_i_did
          ? {
              attempted: false,
              success: false,
              errorMessage: `Git commit skipped due to file creation failure: ${error}`,
            }
          : undefined,
      }),
      retryOptions: {
        maxRetries: 2,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
      },
    }
  );
}

/**
 * File reading tool resilient wrapper
 */
export function createResilientFileReadingTool() {
  const fileReadingOutputSchema = z.object({
    results: z.array(
      z.discriminatedUnion('status', [
        z.object({
          status: z.literal('success'),
          filePath: z.string(),
          content: z.string(),
        }),
        z.object({
          status: z.literal('error'),
          filePath: z.string(),
          errorMessage: z.string(),
        }),
      ])
    ),
  });

  type FileReadingOutput = z.infer<typeof fileReadingOutputSchema>;
  type FileReadingInput = {
    filePaths: string[];
  };

  return createResilientWrapper<FileReadingInput, FileReadingOutput>(
    async (input: FileReadingInput) => {
      // This would call the actual file reading tool implementation
      throw new Error('Implementation would go here');
    },
    {
      toolName: 'read-files',
      gracefulError: (input: FileReadingInput, error: string): FileReadingOutput => ({
        results: input.filePaths.map((filePath) => ({
          status: 'error' as const,
          filePath,
          errorMessage: `File reading failed: ${error}`,
        })),
      }),
      fallback: async (input: FileReadingInput): Promise<FileReadingOutput> => {
        // Try to read files with simpler method
        const results = await Promise.all(
          input.filePaths.map(async (filePath) => {
            try {
              const fs = await import('node:fs/promises');
              const content = await fs.readFile(filePath, 'utf-8');
              return {
                status: 'success' as const,
                filePath,
                content,
              };
            } catch (err) {
              return {
                status: 'error' as const,
                filePath,
                errorMessage: `Fallback read failed: ${err instanceof Error ? err.message : String(err)}`,
              };
            }
          })
        );
        return { results };
      },
      retryOptions: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
      },
    }
  );
}

/**
 * File editing tool resilient wrapper
 */
export function createResilientFileEditingTool() {
  const fileEditingOutputSchema = z.object({
    results: z.array(
      z.discriminatedUnion('status', [
        z.object({
          status: z.literal('success'),
          filePath: z.string(),
          changesApplied: z.number(),
        }),
        z.object({
          status: z.literal('error'),
          filePath: z.string(),
          errorMessage: z.string(),
        }),
      ])
    ),
    gitCommit: z
      .object({
        attempted: z.boolean(),
        success: z.boolean(),
        commitHash: z.string().optional(),
        errorMessage: z.string().optional(),
      })
      .optional(),
  });

  type FileEditingOutput = z.infer<typeof fileEditingOutputSchema>;
  type FileEditingInput = {
    fileEdits: Array<{
      filePath: string;
      edits: Array<{
        oldText: string;
        newText: string;
        replaceAll?: boolean;
      }>;
    }>;
    what_i_did?: string;
  };

  return createResilientWrapper<FileEditingInput, FileEditingOutput>(
    async (input: FileEditingInput) => {
      // This would call the actual file editing tool implementation
      throw new Error('Implementation would go here');
    },
    {
      toolName: 'edit-files',
      gracefulError: (input: FileEditingInput, error: string): FileEditingOutput => ({
        results: input.fileEdits.map((fileEdit) => ({
          status: 'error' as const,
          filePath: fileEdit.filePath,
          errorMessage: `File editing failed: ${error}`,
        })),
        gitCommit: input.what_i_did
          ? {
              attempted: false,
              success: false,
              errorMessage: `Git commit skipped due to file editing failure: ${error}`,
            }
          : undefined,
      }),
      retryOptions: {
        maxRetries: 2,
        baseDelayMs: 1500,
        maxDelayMs: 8000,
      },
    }
  );
}

/**
 * File listing tool resilient wrapper
 */
export function createResilientFileListingTool() {
  const fileListingOutputSchema = z.object({
    results: z.array(
      z.discriminatedUnion('status', [
        z.object({
          status: z.literal('success'),
          directory: z.string(),
          files: z.array(z.string()),
          totalFiles: z.number(),
        }),
        z.object({
          status: z.literal('error'),
          directory: z.string(),
          errorMessage: z.string(),
        }),
      ])
    ),
  });

  type FileListingOutput = z.infer<typeof fileListingOutputSchema>;
  type FileListingInput = {
    directories: string[];
    pattern?: string;
    recursive?: boolean;
  };

  return createResilientWrapper<FileListingInput, FileListingOutput>(
    async (input: FileListingInput) => {
      // This would call the actual file listing tool implementation
      throw new Error('Implementation would go here');
    },
    {
      toolName: 'list-files',
      gracefulError: (input: FileListingInput, error: string): FileListingOutput => ({
        results: input.directories.map((directory) => ({
          status: 'error' as const,
          directory,
          errorMessage: `File listing failed: ${error}`,
        })),
      }),
      fallback: async (input: FileListingInput): Promise<FileListingOutput> => {
        // Try basic file listing without advanced features
        const results = await Promise.all(
          input.directories.map(async (directory) => {
            try {
              const fs = await import('node:fs/promises');
              const files = await fs.readdir(directory);
              return {
                status: 'success' as const,
                directory,
                files: files.filter((f) => !f.startsWith('.')), // Basic filtering
                totalFiles: files.length,
              };
            } catch (err) {
              return {
                status: 'error' as const,
                directory,
                errorMessage: `Fallback listing failed: ${err instanceof Error ? err.message : String(err)}`,
              };
            }
          })
        );
        return { results };
      },
      retryOptions: {
        maxRetries: 2,
        baseDelayMs: 1000,
        maxDelayMs: 4000,
      },
    }
  );
}

/**
 * Generic tool wrapper that handles sandbox operations safely
 */
export async function executeSafelyInSandbox<T>(
  operation: () => Promise<T>,
  fallback: () => T,
  context: string
): Promise<T> {
  // Use circuit breaker for sandbox operations
  const result = await sandboxCircuitBreaker.execute(operation);

  if (result.success && result.data !== undefined) {
    return result.data;
  }

  console.warn(`[SafeSandbox] ${context} failed: ${result.error}, using fallback`);
  return fallback();
}

/**
 * Wraps sandbox command execution with extreme resilience
 */
export async function executeSandboxCommandSafely(
  sandbox: any,
  command: string,
  context: string
): Promise<{ success: boolean; output: string; exitCode: number; error?: string }> {
  return executeSafelyInSandbox(
    async () => {
      const result = await sandbox.process.executeCommand(command);
      return {
        success: result.exitCode === 0,
        output: result.result || '',
        exitCode: result.exitCode,
      };
    },
    () => ({
      success: false,
      output: '',
      exitCode: 1,
      error: `Sandbox command execution failed for: ${command}`,
    }),
    `${context} - command: ${command}`
  );
}

/**
 * Safe JSON parsing for sandbox results
 */
export function parseSandboxResultSafely<T>(result: string, context: string, fallback: T): T {
  const parseResult = safeJsonParse<T>(result.trim());

  if (parseResult.success && parseResult.data !== undefined) {
    return parseResult.data;
  }

  console.warn(`[SafeParse] Failed to parse ${context}: ${parseResult.error}, using fallback`);
  return fallback;
}

/**
 * Validates tool input with recovery
 */
export function validateToolInput<T>(schema: z.ZodSchema<T>, input: unknown, toolName: string): T {
  const validation = validateWithRecovery(schema, input, `${toolName} input`);

  if (validation.success && validation.data !== undefined) {
    return validation.data;
  }

  // Instead of throwing, return a safe default or throw a recoverable error
  const error = new Error(`[${toolName}] Invalid input: ${validation.error}`);
  error.name = 'ValidationError';
  throw error;
}

/**
 * Creates a completely safe version of any async function
 * This is the ultimate safety wrapper - it NEVER throws
 */
export function makeCompletelysafe<TInput, TOutput>(
  fn: (input: TInput) => Promise<TOutput>,
  safeDefault: (input: TInput, error: string) => TOutput,
  name: string
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput): Promise<TOutput> => {
    try {
      const result = await withErrorRecovery(() => fn(input), undefined, name);

      if (result.success && result.data !== undefined) {
        return result.data;
      }

      console.error(`[${name}] All recovery attempts failed: ${result.error}`);
      return safeDefault(input, result.error || 'Unknown error');
    } catch (error) {
      // This should never happen, but just in case...
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${name}] Unexpected error escaped recovery: ${errorMessage}`);
      return safeDefault(input, errorMessage);
    }
  };
}

/**
 * Tool registry for managing resilient versions of tools
 */
export class ResilientToolRegistry {
  private tools = new Map<string, any>();

  register<TInput, TOutput>(
    name: string,
    originalTool: (input: TInput) => Promise<TOutput>,
    safeDefault: (input: TInput, error: string) => TOutput
  ): void {
    const safeTool = makeCompletelysafe(originalTool, safeDefault, name);
    this.tools.set(name, safeTool);
  }

  get<TInput, TOutput>(name: string): ((input: TInput) => Promise<TOutput>) | undefined {
    return this.tools.get(name);
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }
}

/**
 * Global registry instance
 */
export const resilientTools = new ResilientToolRegistry();
