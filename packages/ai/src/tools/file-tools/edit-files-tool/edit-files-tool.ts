import type { Sandbox } from '@buster/sandbox';
import { tool } from 'ai';
import { z } from 'zod';
import { createEditFilesToolExecute } from './edit-files-tool-execute';

export const EDIT_FILES_TOOL_NAME = 'editFiles';

const EditFileParamsSchema = z.object({
  filePath: z.string().describe('Relative or absolute path to the file'),
  findString: z.string().describe('Text to find (must appear exactly once)'),
  replaceString: z.string().describe('Text to replace the found text with'),
});

export const EditFilesToolInputSchema = z.object({
  edits: z
    .array(EditFileParamsSchema)
    .min(1, 'At least one edit must be provided')
    .max(100, 'Maximum 100 edits allowed per request')
    .describe(
      'Array of edit operations to perform. Each edit specifies a file path, text to find, and replacement text. The find string must appear exactly once in the file.'
    ),
});

export const EditFilesToolOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        file_path: z.string(),
        message: z.string(),
      }),
      z.object({
        status: z.literal('error'),
        file_path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
  summary: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
  }),
});

export const EditFilesToolContextSchema = z.object({
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

export type EditFilesToolInput = z.infer<typeof EditFilesToolInputSchema>;
export type EditFilesToolOutput = z.infer<typeof EditFilesToolOutputSchema>;
export type EditFilesToolContext = z.infer<typeof EditFilesToolContextSchema>;

// Factory function to create the edit-files tool
export function createEditFilesTool<
  TAgentContext extends EditFilesToolContext = EditFilesToolContext,
>(context: TAgentContext) {
  const execute = createEditFilesToolExecute(context);

  return tool({
    description: `Performs find-and-replace operations on files with validation and bulk editing support. Replaces specified text content with new content, but only if the find string appears exactly once in the file. Supports both relative and absolute file paths and can handle bulk operations through an array of edit objects.

Key features:
- Validates that the find string appears exactly once (returns error if 0 or multiple occurrences)
- Supports both relative and absolute file paths
- Handles bulk operations with individual success/failure tracking
- Continues processing remaining edits when errors occur
- Returns detailed error messages for various failure scenarios

Error conditions:
- File doesn't exist: Returns error indicating file not found
- Find string not found: Returns error indicating no match
- Find string found multiple times: Returns error suggesting a more specific string
- Permission/IO errors: Returns appropriate error messages

For bulk operations, each edit is processed independently and the tool returns both successful and failed operations with detailed results.`,
    inputSchema: EditFilesToolInputSchema,
    outputSchema: EditFilesToolOutputSchema,
    execute,
  });
}
