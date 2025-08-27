import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createBashToolExecute } from './bash-tool-execute';

export const BASH_TOOL_NAME = 'bashTool';

const BashCommandSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  description: z.string().optional().describe('Description of what this command does'),
  timeout: z
    .number()
    .optional()
    .describe('Timeout in milliseconds (currently not supported in sandbox)'),
});

export const BashToolInputSchema = z.object({
  commands: z.array(BashCommandSchema).describe('Array of bash command objects to execute'),
});

export const BashToolOutputSchema = z.object({
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

const BashToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'process' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .describe('Sandbox instance for bash command execution'),
});

export type BashToolInput = z.infer<typeof BashToolInputSchema>;
export type BashToolOutput = z.infer<typeof BashToolOutputSchema>;
export type BashToolContext = z.infer<typeof BashToolContextSchema>;

// Factory function to create the bash tool
export function createBashTool(context: BashToolContext) {
  const execute = createBashToolExecute(context);

  return tool({
    description: `Executes bash commands and captures stdout, stderr, and exit codes.

IMPORTANT: The 'commands' field must be an array of command objects: [{command: "pwd", description: "Print working directory"}, {command: "ls", description: "List files"}]

Note: Timeout functionality is currently not supported in the sandbox environment.`,
    inputSchema: BashToolInputSchema,
    outputSchema: BashToolOutputSchema,
    execute,
  });
}
