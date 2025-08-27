import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createGrepSearchToolExecute } from './grep-search-tool-execute';

export const GREP_SEARCH_TOOL_NAME = 'grepSearch';

const GrepResultSchema = z.object({
  success: z.boolean().describe('Whether the command executed successfully'),
  command: z.string().describe('The command that was executed'),
  stdout: z.string().optional().describe('Standard output from the command'),
  stderr: z.string().optional().describe('Standard error from the command'),
  error: z.string().optional().describe('Error message if command failed'),
});

export const GrepSearchToolInputSchema = z.object({
  commands: z.array(z.string()).min(1).describe('Array of ripgrep (rg) commands to execute'),
});

const GrepSearchToolOutputSchema = z.object({
  message: z.string().describe('Summary message'),
  duration: z.number().describe('Duration of operation in milliseconds'),
  results: z.array(GrepResultSchema).describe('Results from each command'),
});

const GrepSearchToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'process' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .describe('Sandbox instance for command execution'),
});

export type GrepSearchToolInput = z.infer<typeof GrepSearchToolInputSchema>;
export type GrepSearchToolOutput = z.infer<typeof GrepSearchToolOutputSchema>;
export type GrepSearchToolContext = z.infer<typeof GrepSearchToolContextSchema>;

export function createGrepSearchTool<
  TAgentContext extends GrepSearchToolContext = GrepSearchToolContext,
>(context: TAgentContext) {
  const execute = createGrepSearchToolExecute(context);

  return tool({
    description:
      'Executes ripgrep (rg) commands to search files and directories. Accepts raw rg commands with any flags and options. Returns the stdout/stderr output from each command.',
    inputSchema: GrepSearchToolInputSchema,
    outputSchema: GrepSearchToolOutputSchema,
    execute,
  });
}
