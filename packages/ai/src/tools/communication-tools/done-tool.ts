import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const MESSAGE_PARAM_DESCRIPTION = `
The final response message to the user. 

**MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. 

Do not include markdown tables.
`;

export const doneTool = createTool({
  id: 'done',
  description: 'Signal completion of all requested tasks and end the workflow',
  inputSchema: z.object({
    message: z.string().describe(MESSAGE_PARAM_DESCRIPTION),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
  execute: async () => {
    return {
      success: true,
    };
  },
});
