import { tool } from 'ai';
import { z } from 'zod';
import { createWriteFileToolExecute } from './write-file-tool-execute';

export const WRITE_FILE_TOOL_NAME = 'write';

const FileCreateParamsSchema = z.object({
  path: z
    .string()
    .describe(
      'The file path (relative like "folder/file.txt" or absolute like "/path/to/file.txt"). Must be a simple path without newlines or special characters.'
    ),
  content: z.string().describe('The content to write to the file'),
});

export const WriteFileToolInputSchema = z.object({
  files: z.array(FileCreateParamsSchema).describe('Array of file creation operations to perform'),
});

const WriteFileToolOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        filePath: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        filePath: z.string(),
        errorMessage: z.string(),
      }),
    ])
  ),
});

const WriteFileToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  onToolEvent: z.any().optional().describe('Callback for tool events'),
});

export type WriteFileToolInput = z.infer<typeof WriteFileToolInputSchema>;
export type WriteFileToolOutput = z.infer<typeof WriteFileToolOutputSchema>;
export type WriteFileToolContext = z.infer<typeof WriteFileToolContextSchema>;

export function createWriteFileTool<
  TAgentContext extends WriteFileToolContext = WriteFileToolContext,
>(context: TAgentContext) {
  const execute = createWriteFileToolExecute(context);

  return tool({
    description: `Create one or more files at specified paths with provided content. Supports both absolute and relative file paths. Creates directories if they don't exist and overwrites existing files. Handles errors gracefully by continuing to process other files even if some fail. Returns both successful operations and failed operations with detailed error messages.`,
    inputSchema: WriteFileToolInputSchema,
    outputSchema: WriteFileToolOutputSchema,
    execute,
  });
}
