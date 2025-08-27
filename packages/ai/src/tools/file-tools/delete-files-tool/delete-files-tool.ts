import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createDeleteFilesToolExecute } from './delete-files-tool-execute';

export const DELETE_FILES_TOOL_NAME = 'deleteFiles';

export const DeleteFilesToolInputSchema = z.object({
  paths: z
    .array(z.string())
    .describe(
      'Array of file paths to delete. Can be absolute paths (e.g., /path/to/file.txt) or relative paths (e.g., ./relative/file.txt). Only files can be deleted, not directories.'
    ),
});

const DeleteFilesToolOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        path: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

const DeleteFilesToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'process' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .describe('Sandbox instance for file operations'),
});

export type DeleteFilesToolInput = z.infer<typeof DeleteFilesToolInputSchema>;
export type DeleteFilesToolOutput = z.infer<typeof DeleteFilesToolOutputSchema>;
export type DeleteFilesToolContext = z.infer<typeof DeleteFilesToolContextSchema>;

export function createDeleteFilesTool<
  TAgentContext extends DeleteFilesToolContext = DeleteFilesToolContext,
>(context: TAgentContext) {
  const execute = createDeleteFilesToolExecute(context);

  return tool({
    description: `Deletes files at the specified paths. Accepts both absolute and relative file paths and can handle bulk operations through an array of paths. Only files can be deleted, not directories. Returns structured JSON with deletion results including success status and any error messages. Handles errors gracefully by continuing to process other files even if some fail.`,
    inputSchema: DeleteFilesToolInputSchema,
    outputSchema: DeleteFilesToolOutputSchema,
    execute,
  });
}
