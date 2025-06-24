import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface NoAssumptionsOutput {
  success: boolean;
}

// Zod schema for no assumptions input validation
const noAssumptionsSchema = z.object({}).describe('No parameters required for this tool');

// No Assumptions Identified Tool
export const noAssumptionsIdentified = createTool({
  id: 'noAssumptionsIdentified',
  description: 'Use to indicate that no assumptions were identified.',
  inputSchema: noAssumptionsSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the no-assumptions response was processed successfully'),
  }),
  execute: async ({ context }) => {
    return await processNoAssumptions(context as z.infer<typeof noAssumptionsSchema>);
  },
});

const processNoAssumptions = wrapTraced(
  async (_params: z.infer<typeof noAssumptionsSchema>): Promise<NoAssumptionsOutput> => {
    try {
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in no assumptions identified:', error);

      throw new Error(
        `No assumptions processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'noAssumptionsIdentified' }
);
