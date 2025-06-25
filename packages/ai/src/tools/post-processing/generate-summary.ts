import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for Generate Summary
interface GenerateSummaryOutput {
  success: boolean;
}

// Zod schema for generate summary input validation
export const generateSummarySchema = z.object({
  title: z.string().min(1).describe('A concise title for the summary message, 3-6 words long.'),
  summary_message: z
    .string()
    .min(1)
    .describe('A simple and concise summary of the issues and assumptions.'),
});

// Generate Summary Tool
export const generateSummary = createTool({
  id: 'generateSummary',
  description:
    'Generates a cohesive summary and title for issues and assumptions identified by the AI data analyst.',
  inputSchema: generateSummarySchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the summary was generated successfully'),
  }),
  execute: async ({ context }) => {
    return await processGenerateSummary(context as z.infer<typeof generateSummarySchema>);
  },
});

const processGenerateSummary = wrapTraced(
  async (params: z.infer<typeof generateSummarySchema>): Promise<GenerateSummaryOutput> => {
    try {
      // Validate the generate summary parameters
      if (!params.title?.trim()) {
        throw new Error('Title is required and cannot be empty');
      }

      if (!params.summary_message?.trim()) {
        throw new Error('Summary message is required and cannot be empty');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in generate summary:', error);

      // Provide helpful error messages
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid generate summary parameters: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }

      throw new Error(
        `Generate summary processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'generateSummary' }
);
