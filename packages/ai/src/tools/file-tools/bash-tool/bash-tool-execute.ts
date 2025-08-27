import { wrapTraced } from 'braintrust';
import type { BashToolContext, BashToolInput, BashToolOutput } from './bash-tool';

const executeBashCommands = wrapTraced(
  async (input: BashToolInput, context: BashToolContext): Promise<BashToolOutput> => {
    const commands = Array.isArray(input.commands) ? input.commands : [input.commands];

    if (!commands || commands.length === 0) {
      return { results: [] };
    }

    try {
      const sandbox = context.sandbox;

      if (sandbox) {
        // Execute all commands concurrently using executeCommand
        const resultPromises = commands.map(async (cmd) => {
          try {
            const result = await sandbox.process.executeCommand(cmd.command, '/home/daytona');

            // The sandbox returns the full output in result.result
            // For bash commands, we want to capture everything and trim whitespace
            const output = (result.result || '').trim();

            // For timeout handling, we'll need to implement a different approach
            // The sandbox doesn't support the timeout command directly
            // TODO: Implement timeout handling if needed

            return {
              command: cmd.command,
              stdout: output,
              stderr: '', // Sandbox combines stdout/stderr in result
              exitCode: result.exitCode,
              success: result.exitCode === 0,
              error:
                result.exitCode !== 0
                  ? output || `Command failed with exit code ${result.exitCode}`
                  : undefined,
            };
          } catch (error) {
            return {
              command: cmd.command,
              stdout: '',
              stderr: '',
              exitCode: 1,
              success: false,
              error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
          }
        });

        const results = await Promise.all(resultPromises);
        return { results };
      }

      // When not in sandbox, we can't execute bash commands
      // Return an error for each command
      return {
        results: commands.map((cmd) => ({
          command: cmd.command,
          stdout: '',
          stderr: '',
          exitCode: 1,
          success: false,
          error: 'Bash execution requires sandbox environment',
        })),
      };
    } catch (error) {
      return {
        results: commands.map((cmd) => ({
          command: cmd.command,
          stdout: '',
          stderr: '',
          exitCode: 1,
          success: false,
          error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'bash-tool-execute' }
);

export function createBashToolExecute(context: BashToolContext) {
  return async function bashToolExecute(input: BashToolInput): Promise<BashToolOutput> {
    return await executeBashCommands(input, context);
  };
}
