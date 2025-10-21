import { tool } from 'ai';
import { z } from 'zod';
import GREP_TOOL_DESCRIPTION from './grep-tool-description.txt';
import { createGrepSearchToolExecute as createGrepToolExecute } from './grep-tool-execute';

export const GREP_TOOL_NAME = 'grep';

const GrepMatchSchema = z.object({
  path: z.string().describe('File path where the match was found'),
  lineNum: z.number().describe('Line number of the match'),
  lineText: z.string().describe('Text content of the matching line'),
  lineTruncated: z
    .boolean()
    .describe('Whether the line text was truncated due to exceeding character limit'),
  modTime: z.number().describe('File modification time in milliseconds'),
});

export const GrepToolInputSchema = z.object({
  pattern: z.string().describe('The regex pattern to search for in file contents'),
  path: z
    .string()
    .optional()
    .describe('The directory to search in. Defaults to the current working directory.'),
  glob: z
    .string()
    .optional()
    .describe('File pattern to filter search (e.g., "*.js", "*.{ts,tsx}")'),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Match index to start from (0-indexed). Defaults to 0 (first match).'),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Maximum number of matches to return. Defaults to 100.'),
});

const GrepToolOutputSchema = z.object({
  pattern: z.string().describe('The search pattern used'),
  matches: z
    .array(GrepMatchSchema)
    .describe('Array of matches found, sorted by file modification time'),
  totalMatches: z.number().describe('Total number of matches found'),
  truncated: z.boolean().describe('Whether results were truncated'),
});

const GrepSearchContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  onToolEvent: z.any().optional(),
});

export type GrepToolInput = z.infer<typeof GrepToolInputSchema>;
export type GrepToolOutput = z.infer<typeof GrepToolOutputSchema>;
export type GrepToolContext = z.infer<typeof GrepSearchContextSchema>;

export function createGrepTool<TAgentContext extends GrepToolContext = GrepToolContext>(
  context: TAgentContext
) {
  const execute = createGrepToolExecute(context);

  return tool({
    description: GREP_TOOL_DESCRIPTION,
    inputSchema: GrepToolInputSchema,
    outputSchema: GrepToolOutputSchema,
    execute,
  });
}
