import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for Generate Update Message
interface GenerateUpdateMessageOutput {
  success: boolean;
}

// Zod schema for generate update message input validation
export const generateUpdateMessageSchema = z.object({
  update_message: z
    .string()
    .min(1)
    .describe(
      'A concise summary of the new issues and assumptions within the context of the Slack thread.'
    ),
});

// Generate Update Message Tool
export const generateUpdateMessage = createTool({
  id: 'generateUpdateMessage',
  description:
    'Generates an update message for new issues and assumptions identified after the initial alert.',
  inputSchema: generateUpdateMessageSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the update message was generated successfully'),
  }),
  execute: async ({ context }) => {
    return await processGenerateUpdateMessage(
      context as z.infer<typeof generateUpdateMessageSchema>
    );
  },
});

const processGenerateUpdateMessage = wrapTraced(
  async (
    params: z.infer<typeof generateUpdateMessageSchema>
  ): Promise<GenerateUpdateMessageOutput> => {
    try {
      // Validate the generate update message parameters
      if (!params.update_message?.trim()) {
        throw new Error('Update message is required and cannot be empty');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in generate update message:', error);

      // Provide helpful error messages
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid generate update message parameters: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }

      throw new Error(
        `Generate update message processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'generateUpdateMessage' }
);
