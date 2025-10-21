import { tool } from 'ai';
import { z } from 'zod';
import BASH_TOOL_DESCRIPTION from './bash-tool-description.txt';
import { createBashToolExecute } from './bash-tool-execute';

export const BASH_TOOL_NAME = 'bash';

export const BashToolInputSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  description: z
    .string()
    .describe(
      "Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: Lists files in current directory\n\nInput: git status\nOutput: Shows working tree status\n\nInput: npm install\nOutput: Installs package dependencies\n\nInput: mkdir foo\nOutput: Creates directory 'foo'"
    ),
  timeout: z
    .number()
    .optional()
    .describe('Optional timeout in milliseconds (max 600000ms / 10 minutes)'),
});

export const BashToolOutputSchema = z.object({
  command: z.string(),
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
  success: z.boolean(),
  error: z.string().optional(),
});

const BashToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  isInResearchMode: z
    .boolean()
    .optional()
    .default(false)
    .describe('Flag indicating the agent should only allow read-only bash commands'),
  onToolEvent: z.any().optional(),
});

export type BashToolInput = z.infer<typeof BashToolInputSchema>;
export type BashToolOutput = z.infer<typeof BashToolOutputSchema>;
export type BashToolContext = z.infer<typeof BashToolContextSchema>;

export function createBashTool<TAgentContext extends BashToolContext = BashToolContext>(
  context: TAgentContext
) {
  const execute = createBashToolExecute(context);

  return tool({
    description: BASH_TOOL_DESCRIPTION,
    inputSchema: BashToolInputSchema,
    outputSchema: BashToolOutputSchema,
    execute,
  });
}
