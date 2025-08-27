import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createReadFilesToolExecute } from './read-files-tool-execute';

export const READ_FILES_TOOL_NAME = 'readFiles';

export const ReadFilesToolInputSchema = z.object({
  files: z
    .array(z.string())
    .describe(
      'Array of file paths to read. Can be absolute paths (e.g., /path/to/file.txt) or relative paths (e.g., ./relative/path/file.ts). Files will be read with UTF-8 encoding.'
    ),
});

const ReadFilesToolOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        file_path: z.string(),
        content: z.string(),
        truncated: z
          .boolean()
          .describe('Whether the file content was truncated due to exceeding 1000 lines'),
      }),
      z.object({
        status: z.literal('error'),
        file_path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

const ReadFilesToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'fs' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .describe('Sandbox instance for file operations'),
});

export type ReadFilesToolInput = z.infer<typeof ReadFilesToolInputSchema>;
export type ReadFilesToolOutput = z.infer<typeof ReadFilesToolOutputSchema>;
export type ReadFilesToolContext = z.infer<typeof ReadFilesToolContextSchema>;

export function createReadFilesTool<
  TAgentContext extends ReadFilesToolContext = ReadFilesToolContext,
>(context: TAgentContext) {
  const execute = createReadFilesToolExecute(context);

  return tool({
    description: `Read the contents of one or more files from the filesystem. Accepts both absolute and relative file paths. Files are read with UTF-8 encoding and content is limited to 1000 lines maximum. Returns both successful reads and failures with detailed error messages.`,
    inputSchema: ReadFilesToolInputSchema,
    outputSchema: ReadFilesToolOutputSchema,
    execute,
  });
}
