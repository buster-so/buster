import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type EditFileParams, editMultipleFiles } from './edit_files-functions';

const editFileParamsSchema = z.object({
  filePath: z.string().describe('Relative or absolute path to the file'),
  findString: z.string().describe('Text to find (must appear exactly once)'),
  replaceString: z.string().describe('Text to replace the found text with'),
});

const editFilesSchema = z.object({
  edits: z.array(editFileParamsSchema).min(1, 'At least one edit must be provided').max(100, 'Maximum 100 edits allowed per request'),
});

const outputSchema = z.object({
  results: z.array(
    z.object({
      success: z.boolean(),
      filePath: z.string(),
      error: z.string().optional(),
      message: z.string().optional(),
    })
  ),
  summary: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
  }),
});

type EditFilesInput = z.infer<typeof editFilesSchema>;
type EditFilesOutput = z.infer<typeof outputSchema>;

const editFilesFunction = wrapTraced(
  async (input: EditFilesInput, _runtimeContext: RuntimeContext): Promise<EditFilesOutput> => {
    const { edits } = input;

    try {
      const results = editMultipleFiles(edits as EditFileParams[]);

      const successful = results.filter((r) => r.success).length;
      const failed = results.length - successful;

      return {
        results,
        summary: {
          total: results.length,
          successful,
          failed,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const results = edits.map((edit) => ({
        success: false,
        filePath: edit.filePath,
        error: `Execution error: ${errorMessage}`,
      }));

      return {
        results,
        summary: {
          total: edits.length,
          successful: 0,
          failed: edits.length,
        },
      };
    }
  },
  { name: 'edit-files' }
);

// Export the tool
export const editFiles = createTool({
  id: 'edit-files',
  description: `Performs find-and-replace operations on files with validation and bulk editing support.

This tool replaces specified text content with new content, but only if the find string appears exactly once in the file. It supports both relative and absolute file paths and can handle bulk operations through an array of edit objects.

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
  inputSchema: editFilesSchema,
  outputSchema,
  execute: async ({ context, runtimeContext }) => {
    return await editFilesFunction(context as EditFilesInput, runtimeContext as RuntimeContext);
  },
});

export default editFiles;
