import { tool } from 'ai';
import { z } from 'zod';
import { createReadFileToolExecute } from './read-file-tool-execute';

export const READ_FILE_TOOL_NAME = 'read';

export const ReadFileToolInputSchema = z.object({
  filePath: z
    .string()
    .describe(
      'Path to the file to read. Can be absolute path (e.g., /path/to/file.txt) or relative path (e.g., ./relative/path/file.ts). File will be read with UTF-8 encoding.'
    ),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Line number to start reading from (0-indexed). Defaults to 0 (start of file).'),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Maximum number of lines to read. Defaults to 1000.'),
});

const ReadFileToolOutputSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    file_path: z.string(),
    content: z.string(),
    truncated: z
      .boolean()
      .describe('Whether the file content was truncated (line limit, character limit, or both)'),
    lineTruncated: z
      .boolean()
      .describe('Whether the file was truncated due to exceeding the line limit'),
    charTruncated: z
      .boolean()
      .describe(
        'Whether content was truncated due to character limits (per-line or total content)'
      ),
  }),
  z.object({
    status: z.literal('error'),
    file_path: z.string(),
    error_message: z.string(),
  }),
]);

const ReadFileToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  projectDirectory: z.string().describe('The root directory of the project'),
  onToolEvent: z.any().optional().describe('Callback for tool events'),
});

export type ReadFileToolInput = z.infer<typeof ReadFileToolInputSchema>;
export type ReadFileToolOutput = z.infer<typeof ReadFileToolOutputSchema>;
export type ReadFileToolContext = z.infer<typeof ReadFileToolContextSchema>;

export function createReadFileTool<TAgentContext extends ReadFileToolContext = ReadFileToolContext>(
  context: TAgentContext
) {
  const execute = createReadFileToolExecute(context);

  return tool({
    description: `Read the contents of a file from the filesystem. Accepts both absolute and relative file paths. Files are read with UTF-8 encoding. Supports optional offset and limit parameters for pagination. Returns file content or detailed error message.`,
    inputSchema: ReadFileToolInputSchema,
    outputSchema: ReadFileToolOutputSchema,
    execute,
  });
}
