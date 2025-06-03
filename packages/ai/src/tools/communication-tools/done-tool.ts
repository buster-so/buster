import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Input/Output schemas
const doneInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const doneOutputSchema = z.object({
  success: z.boolean(),
  todos: z.string(),
});
// Process done tool execution with todo management
async function processDone(): Promise<z.infer<typeof doneOutputSchema>> {
  // This tool signals the end of the workflow and provides the final response.
  // The actual agent termination logic resides elsewhere.
  return {
    success: true,
    todos: 'DONE WITH ALL TODOS',
  };
}

// Main done function with tracing
const executeDone = wrapTraced(
  async (): Promise<z.infer<typeof doneOutputSchema>> => {
    return await processDone();
  },
  { name: 'done-tool' }
);

// Export the tool
export const doneTool = createTool({
  id: 'done',
  description:
    "Marks all remaining unfinished tasks as complete, sends a final response to the user, and ends the workflow. Use this when the workflow is finished. This must be in markdown format and not use the '•' bullet character.",
  inputSchema: doneInputSchema,
  outputSchema: doneOutputSchema,
  execute: executeDone,
});

export default doneTool;
