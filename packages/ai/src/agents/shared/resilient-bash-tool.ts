/**
 * Resilient Bash Tool Implementation
 * 
 * This provides an extremely resilient version of the bash execution tool
 * that never throws exceptions and always returns a valid response.
 */

import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { DocsAgentContext } from '../../context/docs-agent-context';
import { DocsAgentContextKeys } from '../../context/docs-agent-context';
import { 
  makeCompletelysafe,
  executeSandboxCommandSafely,
  validateToolInput,
  withErrorRecovery,
} from './resilient-tool-wrappers';

const bashCommandSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  description: z.string().optional().describe('Description of what this command does'),
  timeout: z.number().optional().describe('Timeout in milliseconds (currently not supported in sandbox)'),
});

const inputSchema = z.object({
  commands: z.array(bashCommandSchema),
});

const outputSchema = z.object({
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

type BashInput = z.infer<typeof inputSchema>;
type BashOutput = z.infer<typeof outputSchema>;

/**
 * Core bash execution logic with extreme error handling
 */
async function executeBashCommandsCore(
  input: BashInput,
  runtimeContext: RuntimeContext<DocsAgentContext>
): Promise<BashOutput> {
  const commands = Array.isArray(input.commands) ? input.commands : [input.commands];

  if (!commands || commands.length === 0) {
    return { results: [] };
  }

  try {
    const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

    if (!sandbox) {
      // No sandbox available - return graceful error for each command
      return {
        results: commands.map((cmd) => ({
          command: cmd.command,
          stdout: '',
          stderr: 'Bash execution requires sandbox environment',
          exitCode: 127,
          success: false,
          error: 'Sandbox not available',
        })),
      };
    }

    // Execute all commands with individual error handling
    const resultPromises = commands.map(async (cmd) => {
      const commandResult = await executeSandboxCommandSafely(
        sandbox,
        cmd.command,
        `bash-command: ${cmd.description || cmd.command}`
      );

      return {
        command: cmd.command,
        stdout: commandResult.output,
        stderr: commandResult.error || '',
        exitCode: commandResult.exitCode,
        success: commandResult.success,
        error: commandResult.error,
      };
    });

    const results = await Promise.all(resultPromises);
    return { results };

  } catch (error) {
    // Fallback error handling - should never reach here due to safe wrappers
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ResilientBash] Unexpected error in core execution:', errorMessage);
    
    return {
      results: commands.map((cmd) => ({
        command: cmd.command,
        stdout: '',
        stderr: `Unexpected execution error: ${errorMessage}`,
        exitCode: 1,
        success: false,
        error: errorMessage,
      })),
    };
  }
}

/**
 * Fallback function for when everything fails
 */
function createBashFallback(input: BashInput, error: string): BashOutput {
  console.warn('[ResilientBash] Using fallback due to error:', error);
  
  return {
    results: input.commands.map((cmd) => ({
      command: cmd.command,
      stdout: '',
      stderr: `Tool error: ${error}`,
      exitCode: 127,
      success: false,
      error: `Bash execution completely failed: ${error}`,
    })),
  };
}

/**
 * Wrapper to make executeBashCommandsCore compatible with makeCompletelysafe
 */
const wrappedBashExecution = (params: { input: BashInput; runtimeContext: RuntimeContext<DocsAgentContext> }): Promise<BashOutput> => {
  return executeBashCommandsCore(params.input, params.runtimeContext);
};

/**
 * Completely safe bash execution that never throws
 */
const safeBashExecution = makeCompletelysafe(
  wrappedBashExecution,
  (params: { input: BashInput; runtimeContext: RuntimeContext<DocsAgentContext> }, error: string) => createBashFallback(params.input, error),
  'resilient-bash'
);

/**
 * Traced version of the safe bash execution
 */
const executeResilientBashCommands = wrapTraced(
  async (
    input: BashInput,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<BashOutput> => {
    // Validate input safely
    try {
      validateToolInput(inputSchema, input, 'resilient-bash');
    } catch (validationError) {
      // Even validation errors are handled gracefully
      const errorMessage = validationError instanceof Error 
        ? validationError.message 
        : String(validationError);
      
      return createBashFallback(
        { commands: [] }, // Safe default
        `Input validation failed: ${errorMessage}`
      );
    }

    return safeBashExecution({ input, runtimeContext });
  },
  { name: 'resilient-bash-execute-tool' }
);

/**
 * Export the resilient bash tool
 */
export const resilientExecuteBash = createTool({
  id: 'resilient-execute-bash',
  description: `RESILIENT bash command execution tool that NEVER crashes the agent.

Executes bash commands safely with comprehensive error handling, retries, and graceful degradation.
This tool is designed for extreme resilience in sandbox environments with limited resources.

Key Features:
- Never throws exceptions that could terminate the agent
- Comprehensive retry logic with exponential backoff
- Circuit breaker for resource protection
- Graceful degradation when sandbox is unavailable
- Individual command error isolation
- Detailed error reporting and logging

IMPORTANT: The 'commands' field must be an array of command objects:
[{command: "pwd", description: "Print working directory"}, {command: "ls", description: "List files"}]

The tool will attempt to execute all commands even if some fail, providing best-effort results.`,
  inputSchema,
  outputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: BashInput;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await executeResilientBashCommands(context, runtimeContext);
  },
});

export default resilientExecuteBash;