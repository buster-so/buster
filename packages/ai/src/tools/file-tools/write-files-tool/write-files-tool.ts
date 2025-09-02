import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createWriteFilesToolExecute } from './write-files-tool-execute';

export const WRITE_FILES_TOOL_NAME = 'writeFiles';

const FileWriteParamsSchema = z.object({
  path: z.string().describe('The relative or absolute path to write the file at'),
  content: z.string().describe('The content to write to the file'),
  overwrite: z
    .boolean()
    .optional()
    .describe(
      'If true, overwrites existing files. If false (default), returns an error if file exists'
    ),
});

export const WriteFilesToolInputSchema = z.object({
  files: z.array(FileWriteParamsSchema).describe('Array of file write operations to perform'),
});

const WriteFilesToolOutputSchema = z.object({
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

const WriteFilesToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'fs' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .describe('Sandbox instance for file operations'),
  repositoryName: z.string().optional().describe('The repository name for git operations'),
});

export type WriteFilesToolInput = z.infer<typeof WriteFilesToolInputSchema>;
export type WriteFilesToolOutput = z.infer<typeof WriteFilesToolOutputSchema>;
export type WriteFilesToolContext = z.infer<typeof WriteFilesToolContextSchema>;

export function createWriteFilesTool<
  TAgentContext extends WriteFilesToolContext = WriteFilesToolContext,
>(context: TAgentContext) {
  const execute = createWriteFilesToolExecute(context);

  return tool({
    description: `Write one or more files at specified paths with provided content. Supports both absolute and relative file paths. Creates directories if they don't exist. By default, returns an error if the file already exists unless overwrite is set to true. Handles errors gracefully by continuing to process other files even if some fail. Returns both successful operations and failed operations with detailed error messages.`,
    inputSchema: WriteFilesToolInputSchema,
    outputSchema: WriteFilesToolOutputSchema,
    execute,
  });
}
