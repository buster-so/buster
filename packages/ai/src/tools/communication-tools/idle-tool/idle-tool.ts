import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

export const IDLE_TOOL_NAME = 'idleTool';

const IdleInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const IdleOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
});

const IdleContextSchema = z.object({
  messageId: z.string().optional().describe('The message ID for tracking tool execution.'),
});

export type IdleInput = z.infer<typeof IdleInputSchema>;
export type IdleOutput = z.infer<typeof IdleOutputSchema>;
export type IdleContext = z.infer<typeof IdleContextSchema>;

async function processIdle(): Promise<IdleOutput> {
  return { success: true };
}

function createIdleExecute() {
  return wrapTraced(
    async (): Promise<IdleOutput> => {
      return await processIdle();
    },
    { name: 'idle-tool' }
  );
}

// Factory: simple tool without streaming lifecycle
export function createIdleTool() {
  const execute = createIdleExecute();

  return tool({
    description:
      "Marks all remaining unfinished tasks as complete, sends a final response to the user, and enters an idle state. Use this when current work is finished but the agent should remain available for future tasks. This must be in markdown format and not use the '•' bullet character.",
    inputSchema: IdleInputSchema,
    outputSchema: IdleOutputSchema,
    execute,
  });
}
