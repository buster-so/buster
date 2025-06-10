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

/**
 * Optimistic parsing function for streaming finish-and-respond tool arguments
 * Extracts the final_response field as it's being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof finishAndRespondInputSchema>> | null {
  // Validate input type
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    // First try to parse as complete JSON
    const parsed = JSON.parse(accumulatedText);
    return {
      final_response: parsed.final_response !== undefined ? parsed.final_response : undefined,
    };
  } catch (error) {
    // Only catch JSON parse errors - let other errors bubble up
    if (error instanceof SyntaxError) {
      // JSON parsing failed - try regex extraction for partial content
      // Handle both complete and incomplete strings, accounting for escaped quotes
      const match = accumulatedText.match(/"final_response"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (match && match[1] !== undefined) {
        // Unescape the string
        const unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return {
          final_response: unescaped,
        };
      }

      // Try to extract partial string that's still being built (incomplete quote)
      const partialMatch = accumulatedText.match(/"final_response"\s*:\s*"((?:[^"\\]|\\.)*)/);
      if (partialMatch && partialMatch[1] !== undefined) {
        // Unescape the partial string
        const unescaped = partialMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return {
          final_response: unescaped,
        };
      }

      return null;
    } else {
      // Unexpected error - re-throw with context
      throw new Error(
        `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

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
