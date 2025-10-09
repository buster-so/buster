import { tool } from 'ai';
import { z } from 'zod';
import { createLsToolExecute } from './ls-tool-execute';
import DESCRIPTION from './ls.txt';

export const LS_TOOL_NAME = 'ls';

export const LsToolInputSchema = z.object({
  path: z
    .string()
    .optional()
    .describe(
      'The absolute path to the directory to list (must be absolute, not relative). Defaults to project root.'
    ),
  ignore: z.array(z.string()).optional().describe('List of glob patterns to ignore'),
  depth: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      'Maximum depth to traverse. Controls how many levels deep to show in the tree. Defaults to 3.'
    ),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('File index to start from (0-indexed). Defaults to 0 (first file).'),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Maximum number of files to return. Defaults to 100.'),
});

export const LsToolOutputSchema = z.object({
  success: z.boolean().describe('Whether the listing was successful'),
  path: z.string().describe('The path that was listed'),
  output: z.string().describe('Tree-formatted directory listing'),
  count: z.number().describe('Number of files listed'),
  truncated: z.boolean().describe('Whether the listing was truncated at limit'),
  errorMessage: z.string().optional().describe('Error message if failed'),
});

export const LsToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  projectDirectory: z.string().describe('The root directory of the project'),
  onToolEvent: z.any().optional(),
});

export type LsToolInput = z.infer<typeof LsToolInputSchema>;
export type LsToolOutput = z.infer<typeof LsToolOutputSchema>;
export type LsToolContext = z.infer<typeof LsToolContextSchema>;

/**
 * Factory function to create the ls tool
 */
export function createLsTool<TAgentContext extends LsToolContext = LsToolContext>(
  context: TAgentContext
) {
  const execute = createLsToolExecute(context);

  return tool({
    description: DESCRIPTION,
    inputSchema: LsToolInputSchema,
    outputSchema: LsToolOutputSchema,
    execute,
  });
}
