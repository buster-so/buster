import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Input/Output schemas
const finishAndRespondInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const finishAndRespondOutputSchema = z.object({});

// Process done tool execution with todo management
async function processDone(): Promise<z.infer<typeof finishAndRespondOutputSchema>> {
  // This tool signals the end of the workflow and provides the final response.
  // The actual agent termination logic resides elsewhere.
  return {};
}

// Main done function with tracing
const executeDone = wrapTraced(
  async (): Promise<z.infer<typeof finishAndRespondOutputSchema>> => {
    return await processDone();
  },
  { name: 'finish-and-respond' }
);

// Export the tool
export const finishAndRespond = createTool({
  id: 'finish-and-respond',
  description:
    "Marks all remaining unfinished tasks as complete, sends a final response to the user, and ends the workflow. Use this when the workflow is finished. This must be in markdown format and not use the '•' bullet character.",
  inputSchema: finishAndRespondInputSchema,
  outputSchema: finishAndRespondOutputSchema,
  execute: executeDone,
});

export default finishAndRespond;
