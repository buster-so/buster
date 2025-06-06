import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Input/Output schemas - both empty since this is just a signal
const submitThoughtsInputSchema = z.object({});

const submitThoughtsOutputSchema = z.object({});

// Process submit thoughts tool execution
async function processSubmitThoughts(): Promise<z.infer<typeof submitThoughtsOutputSchema>> {
  // This tool signals that the agent has finished thinking through all steps
  // and is ready to move on to the next phase of the workflow.
  return {};
}

// Main submit thoughts function with tracing
const executeSubmitThoughts = wrapTraced(
  async (): Promise<z.infer<typeof submitThoughtsOutputSchema>> => {
    return await processSubmitThoughts();
  },
  { name: 'submitThoughtsTool' }
);

// Export the tool
export const submitThoughtsTool = createTool({
  id: 'submitThoughtsTool',
  description:
    'Confirms that the agent has finished thinking through all of its steps and is ready to move on to the next phase of the workflow. This is a signal tool with no input or output parameters.',
  inputSchema: submitThoughtsInputSchema,
  outputSchema: submitThoughtsOutputSchema,
  execute: async () => {
    return await executeSubmitThoughts();
  },
});

export default submitThoughtsTool;
