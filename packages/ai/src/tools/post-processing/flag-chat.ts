import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for Flag Chat
interface FlagChatOutput {
  success: boolean;
}

// Zod schema for flag chat input validation
export const flagChatSchema = z.object({
  summary_message: z.string().min(1).describe('A brief summary of the issue detected in the chat'),
  summary_title: z.string().min(1).describe('A short 3-6 word title for the summary message'),
});

// Flag Chat Tool
export const flagChat = createTool({
  id: 'flagChat',
  description: 'Flag a chat for review by the data team',
  inputSchema: flagChatSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the chat was flagged successfully'),
  }),
  execute: async ({ context }) => {
    return await processFlagChat(context as z.infer<typeof flagChatSchema>);
  },
});

const processFlagChat = wrapTraced(
  async (params: z.infer<typeof flagChatSchema>): Promise<FlagChatOutput> => {
    try {
      // Validate the flag chat parameters
      if (!params.summary_message?.trim()) {
        throw new Error('Summary message is required and cannot be empty');
      }

      if (!params.summary_title?.trim()) {
        throw new Error('Summary title is required and cannot be empty');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in flag chat:', error);

      // Provide helpful error messages
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid flag chat parameters: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }

      throw new Error(
        `Flag chat processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'flagChat' }
);
