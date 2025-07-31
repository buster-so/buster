import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';

const rgSearchInputSchema = z.object({
  commands: z.array(z.string()).min(1).describe('Array of ripgrep (rg) commands to execute'),
});

const rgResultSchema = z.object({
  success: z.boolean().describe('Whether the command executed successfully'),
  command: z.string().describe('The command that was executed'),
  stdout: z.string().optional().describe('Standard output from the command'),
  stderr: z.string().optional().describe('Standard error from the command'),
  error: z.string().optional().describe('Error message if command failed'),
});

const rgSearchOutputSchema = z.object({
  message: z.string().describe('Summary message'),
  duration: z.number().describe('Duration of operation in milliseconds'),
  results: z.array(rgResultSchema).describe('Results from each command'),
});

export type RgSearchInput = z.infer<typeof rgSearchInputSchema>;
export type RgSearchOutput = z.infer<typeof rgSearchOutputSchema>;

const rgSearchExecution = wrapTraced(
  async (
    params: z.infer<typeof rgSearchInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof rgSearchOutputSchema>> => {
    const { commands } = params;
    const startTime = Date.now();

    if (!commands || commands.length === 0) {
      return {
        message: 'No commands provided',
        duration: Date.now() - startTime,
        results: [],
      };
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (sandbox) {
        // Execute all commands concurrently
        const resultPromises = commands.map(async (command) => {
          try {
            console.info(`[grep-search-tool] Executing command: ${command}`);

            // Use executeCommand like bash-tool does
            const result = await sandbox.process.executeCommand(command);

            console.info(`[grep-search-tool] Command result:`, {
              command,
              exitCode: result.exitCode,
              hasResult: !!result.result,
              resultLength: result.result?.length || 0,
              resultPreview: result.result ? `${result.result.substring(0, 100)}...` : 'empty',
            });

            // The sandbox returns the full output in result.result
            const output = result.result || '';

            // For ripgrep, exit code 1 means no matches found, which is not an error
            const isRgNoMatchesFound = result.exitCode === 1 && command.includes('rg ');

            if (result.exitCode === 0 || isRgNoMatchesFound) {
              return {
                success: true,
                command: command,
                stdout: output,
                stderr: '',
              };
            }
            return {
              success: false,
              command: command,
              stdout: output || '',
              stderr: '',
              error: `Command failed with exit code ${result.exitCode}`,
            };
          } catch (error) {
            console.error(`[grep-search-tool] Execution error for command: ${command}`, error);
            return {
              success: false,
              command: command,
              stdout: '',
              stderr: '',
              error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
          }
        });

        const rgResults = await Promise.all(resultPromises);

        return {
          message: `Executed ${rgResults.length} ripgrep commands`,
          duration: Date.now() - startTime,
          results: rgResults,
        };
      }

      // When not in sandbox, we can't use the rg command
      // Return an error for each command
      return {
        message: 'Ripgrep commands require sandbox environment',
        duration: Date.now() - startTime,
        results: commands.map((cmd) => ({
          success: false,
          command: cmd,
          error: 'ripgrep command requires sandbox environment',
        })),
      };
    } catch (error) {
      return {
        message: 'Execution error occurred',
        duration: Date.now() - startTime,
        results: commands.map((cmd) => ({
          success: false,
          command: cmd,
          error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'rg-search' }
);

export const grepSearch = createTool({
  id: 'grep_search',
  description:
    'Executes ripgrep (rg) commands to search files and directories. Accepts raw rg commands with any flags and options. Returns the stdout/stderr output from each command.',
  inputSchema: rgSearchInputSchema,
  outputSchema: rgSearchOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof rgSearchInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await rgSearchExecution(context, runtimeContext);
  },
});

export default grepSearch;
