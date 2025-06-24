import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for No Issues Found
interface NoIssuesFoundOutput {
  success: boolean;
}

// Zod schema for no issues found input validation
export const noIssuesFoundSchema = z.object({
  message: z.string().min(1).describe('Confirmation message indicating no issues were found.'),
});

// No Issues Found Tool
export const noIssuesFound = createTool({
  id: 'noIssuesFound',
  description: 'Indicates that no issues were detected in the chat history.',
  inputSchema: noIssuesFoundSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the no-issues response was processed successfully'),
  }),
  execute: async ({ context }) => {
    return await processNoIssuesFound(context as z.infer<typeof noIssuesFoundSchema>);
  },
});

const processNoIssuesFound = wrapTraced(
  async (params: z.infer<typeof noIssuesFoundSchema>): Promise<NoIssuesFoundOutput> => {
    try {
      // Validate the no issues found parameters
      if (!params.message?.trim()) {
        throw new Error('Confirmation message is required and cannot be empty');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in no issues found:', error);

      // Provide helpful error messages
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid no issues found parameters: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }

      throw new Error(
        `No issues found processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'noIssuesFound' }
);
