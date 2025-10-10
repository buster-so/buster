import { tool } from 'ai';
import { z } from 'zod';
import DESCRIPTION from './glob-tool-description.txt';
import { createGlobToolExecute } from './glob-tool-execute';

export const GLOB_TOOL_NAME = 'glob';

const GlobMatchSchema = z.object({
  path: z.string().describe('File path that matches the pattern'),
  modTime: z.number().describe('File modification time in milliseconds'),
});

export const GlobToolInputSchema = z.object({
  pattern: z
    .string()
    .describe('The glob pattern to match files against (e.g., "*.ts", "src/**/*.js", "docs/*.md")'),
  path: z.string().optional().describe('The directory to search in. Defaults to the project root.'),
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

const GlobToolOutputSchema = z.object({
  pattern: z.string().describe('The glob pattern used'),
  matches: z
    .array(GlobMatchSchema)
    .describe('Array of matching files, sorted by modification time (newest first)'),
  totalMatches: z.number().describe('Total number of matches returned'),
  truncated: z.boolean().describe('Whether results were truncated'),
});

const GlobToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  projectDirectory: z.string().describe('The root directory of the project'),
  onToolEvent: z.any().optional(),
});

export type GlobToolInput = z.infer<typeof GlobToolInputSchema>;
export type GlobToolOutput = z.infer<typeof GlobToolOutputSchema>;
export type GlobToolContext = z.infer<typeof GlobToolContextSchema>;

export function createGlobTool<TAgentContext extends GlobToolContext = GlobToolContext>(
  context: TAgentContext
) {
  const execute = createGlobToolExecute(context);

  return tool({
    description: DESCRIPTION,
    inputSchema: GlobToolInputSchema,
    outputSchema: GlobToolOutputSchema,
    execute,
  });
}
