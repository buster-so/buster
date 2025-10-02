import { tool } from 'ai';
import { z } from 'zod';
import { createEditFileToolExecute } from './edit-file-tool-execute';
import DESCRIPTION from './edit.txt';

export const EditFileToolInputSchema = z.object({
  filePath: z.string().describe('The absolute path to the file to modify'),
  oldString: z.string().describe('The text to replace'),
  newString: z
    .string()
    .describe('The text to replace it with (must be different from oldString)'),
  replaceAll: z
    .boolean()
    .optional()
    .default(false)
    .describe('Replace all occurrences of oldString (default false)'),
});

export const EditFileToolOutputSchema = z.object({
  success: z.boolean().describe('Whether the edit was successful'),
  filePath: z.string().describe('The path of the edited file'),
  message: z.string().optional().describe('Success message'),
  errorMessage: z.string().optional().describe('Error message if failed'),
  diff: z.string().optional().describe('Diff of the changes made'),
});

export const EditFileToolContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
  projectDirectory: z.string().describe('The root directory of the project'),
});

export type EditFileToolInput = z.infer<typeof EditFileToolInputSchema>;
export type EditFileToolOutput = z.infer<typeof EditFileToolOutputSchema>;
export type EditFileToolContext = z.infer<typeof EditFileToolContextSchema>;

/**
 * Factory function to create the edit-file tool
 */
export function createEditFileTool<
  TAgentContext extends EditFileToolContext = EditFileToolContext,
>(context: TAgentContext) {
  const execute = createEditFileToolExecute(context);

  return tool({
    description: DESCRIPTION,
    inputSchema: EditFileToolInputSchema,
    outputSchema: EditFileToolOutputSchema,
    execute,
  });
}
