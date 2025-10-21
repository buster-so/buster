import { tool } from 'ai';
import { z } from 'zod';
import { createMultiEditFileToolExecute } from './multi-edit-file-tool-execute';
import DESCRIPTION from './multiedit.txt';

export const MULTI_EDIT_FILE_TOOL_NAME = 'multiEdit';

const EditOperationSchema = z.object({
  oldString: z.string().describe('The text to replace'),
  newString: z.string().describe('The text to replace it with (must be different from oldString)'),
  replaceAll: z
    .boolean()
    .optional()
    .describe('Replace all occurrences of oldString (default false)'),
});

export const MultiEditFileToolInputSchema = z.object({
  filePath: z.string().describe('The absolute path to the file to modify'),
  edits: z
    .array(EditOperationSchema)
    .min(1, 'At least one edit must be provided')
    .describe('Array of edit operations to perform sequentially on the file'),
});

export const MultiEditFileToolOutputSchema = z.object({
  success: z.boolean().describe('Whether all edits were successful'),
  filePath: z.string().describe('The path of the edited file'),
  editResults: z
    .array(
      z.object({
        editNumber: z.number().describe('The sequential number of this edit'),
        success: z.boolean().describe('Whether this edit was successful'),
        message: z.string().optional().describe('Success message if applicable'),
        errorMessage: z.string().optional().describe('Error message if this edit failed'),
      })
    )
    .describe('Results of each individual edit operation'),
  finalDiff: z.string().optional().describe('Final diff showing all changes combined'),
  message: z.string().optional().describe('Overall success message'),
  errorMessage: z.string().optional().describe('Overall error message if failed'),
});

export const MultiEditFileToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  onToolEvent: z.any().optional().describe('Callback for tool events'),
});

export type MultiEditFileToolInput = z.infer<typeof MultiEditFileToolInputSchema>;
export type MultiEditFileToolOutput = z.infer<typeof MultiEditFileToolOutputSchema>;
export type MultiEditFileToolContext = z.infer<typeof MultiEditFileToolContextSchema>;

/**
 * Factory function to create the multi-edit-file tool
 */
export function createMultiEditFileTool<
  TAgentContext extends MultiEditFileToolContext = MultiEditFileToolContext,
>(context: TAgentContext) {
  const execute = createMultiEditFileToolExecute(context);

  return tool({
    description: DESCRIPTION,
    inputSchema: MultiEditFileToolInputSchema,
    outputSchema: MultiEditFileToolOutputSchema,
    execute,
  });
}
