import { tool } from 'ai';
import { z } from 'zod';
import {
  ClarifyingQuestionSchema,
  createUpdateClarificationsFileToolExecute,
} from './update-clarifications-file-tool-execute';

export const UPDATE_CLARIFICATIONS_FILE_TOOL_NAME = 'updateClarificationsFile';

export const UpdateClarificationsFileToolInputSchema = z.object({
  clarifications: z
    .array(ClarifyingQuestionSchema)
    .describe('Array of clarification questions to set as the complete clarification file'),
});

const UpdateClarificationsFileToolOutputSchema = z.object({
  success: z.boolean(),
  clarifications: z.array(ClarifyingQuestionSchema).optional(),
  message: z.string().optional(),
  totalClarifications: z.number().optional().describe('Total number of clarification questions'),
});

const UpdateClarificationsFileToolContextSchema = z.object({
  clarifications: z.array(ClarifyingQuestionSchema).optional().describe('Current clarifications'),
  updateClarifications: z
    .function()
    .args(z.array(ClarifyingQuestionSchema))
    .returns(z.void())
    .optional()
    .describe('Function to update clarifications'),
});

export type UpdateClarificationsFileToolInput = z.infer<
  typeof UpdateClarificationsFileToolInputSchema
>;
export type UpdateClarificationsFileToolOutput = z.infer<
  typeof UpdateClarificationsFileToolOutputSchema
>;
export type UpdateClarificationsFileToolContext = z.infer<
  typeof UpdateClarificationsFileToolContextSchema
>;

export function createUpdateClarificationsFileTool<
  TAgentContext extends UpdateClarificationsFileToolContext = UpdateClarificationsFileToolContext,
>(context: TAgentContext) {
  const execute = createUpdateClarificationsFileToolExecute(context);

  return tool({
    description:
      'Update the clarification questions file with a new array of clarification questions. This replaces any existing clarification questions with the provided array.',
    inputSchema: UpdateClarificationsFileToolInputSchema,
    outputSchema: UpdateClarificationsFileToolOutputSchema,
    execute,
  });
}

// Legacy export for backward compatibility
export const updateClarificationsFile = createUpdateClarificationsFileTool({
  clarifications: [],
  updateClarifications: () => {},
});
