import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createCreateFilesToolExecute } from './create-files-tool-execute';

export const CREATE_FILES_TOOL_NAME = 'createFiles';

const FileCreateParamsSchema = z.object({
  path: z.string().describe('The relative or absolute path to create the file at'),
  content: z.string().describe('The content to write to the file'),
});

export const CreateFilesToolInputSchema = z.object({
  files: z.array(FileCreateParamsSchema).describe('Array of file creation operations to perform'),
});

const CreateFilesToolOutputSchema = z.object({
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

const CreateFilesToolContextSchema = z.object({
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

export type CreateFilesToolInput = z.infer<typeof CreateFilesToolInputSchema>;
export type CreateFilesToolOutput = z.infer<typeof CreateFilesToolOutputSchema>;
export type CreateFilesToolContext = z.infer<typeof CreateFilesToolContextSchema>;

export function createCreateFilesTool<
  TAgentContext extends CreateFilesToolContext = CreateFilesToolContext,
>(context: TAgentContext) {
  const execute = createCreateFilesToolExecute(context);

  return tool({
    description: `Create one or more files at specified paths with provided content. Supports both absolute and relative file paths. Creates directories if they don't exist and overwrites existing files. Handles errors gracefully by continuing to process other files even if some fail. Returns both successful operations and failed operations with detailed error messages.`,
    inputSchema: CreateFilesToolInputSchema,
    outputSchema: CreateFilesToolOutputSchema,
    execute,
  });
}
