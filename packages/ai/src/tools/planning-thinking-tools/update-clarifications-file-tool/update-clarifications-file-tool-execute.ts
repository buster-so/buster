import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type {
  UpdateClarificationsFileToolContext,
  UpdateClarificationsFileToolInput,
  UpdateClarificationsFileToolOutput,
} from './update-clarifications-file-tool';

export const ClarifyingQuestionSchema = z.object({
  issue: z.string(),
  context: z.string(),
  clarificationQuestion: z.string(),
});

export function createUpdateClarificationsFileToolExecute(
  context: UpdateClarificationsFileToolContext
) {
  return wrapTraced(
    async (
      input: UpdateClarificationsFileToolInput
    ): Promise<UpdateClarificationsFileToolOutput> => {
      const { clarifications } = input;

      try {
        // Validate all clarifications against the schema
        const validatedClarifications = z.array(ClarifyingQuestionSchema).parse(clarifications);

        // Update the context directly by replacing the clarifications array
        context.clarifications = validatedClarifications;

        return {
          success: true,
          clarifications: validatedClarifications,
          message: 'Successfully updated clarification questions',
          totalClarifications: validatedClarifications.length,
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            message: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
          };
        }

        return {
          success: false,
          message: `Error updating clarifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
    { name: 'update-clarifications-file-execute' }
  );
}
