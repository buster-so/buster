import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Input/Output schemas
const messageUserClarifyingQuestionInputSchema = z.object({
  clarifying_question: z
    .string()
    .min(1, 'Clarifying question is required')
    .describe(
      "The clarifying question to ask the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

/**
 * Optimistic parsing function for streaming message-user-clarifying-question tool arguments
 * Extracts the clarifying_question field as it's being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof messageUserClarifyingQuestionInputSchema>> | null {
  // Validate input type
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    // First try to parse as complete JSON
    const parsed = JSON.parse(accumulatedText);
    return {
      clarifying_question: parsed.clarifying_question !== undefined ? parsed.clarifying_question : undefined,
    };
  } catch (error) {
    // Only catch JSON parse errors - let other errors bubble up
    if (error instanceof SyntaxError) {
      // JSON parsing failed - try regex extraction for partial content
      // Handle both complete and incomplete strings, accounting for escaped quotes
      const match = accumulatedText.match(/"clarifying_question"\s*:\s*"((?:[^"\\]|\\.)*)"?/);
      if (match && match[1] !== undefined) {
        // Unescape the string
        const unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return {
          clarifying_question: unescaped,
        };
      }

      // Try to extract partial string that's still being built (incomplete quote)
      const partialMatch = accumulatedText.match(/"clarifying_question"\s*:\s*"((?:[^"\\]|\\.)*)/);
      if (partialMatch && partialMatch[1] !== undefined) {
        // Unescape the partial string
        const unescaped = partialMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return {
          clarifying_question: unescaped,
        };
      }

      return null;
    }
    // Unexpected error - re-throw with context
    throw new Error(
      `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

const messageUserClarifyingQuestionOutputSchema = z.object({});

// Process message user clarifying question tool execution
async function processMessageUserClarifyingQuestion(): Promise<
  z.infer<typeof messageUserClarifyingQuestionOutputSchema>
> {
  // This tool signals a clarifying question and pauses the workflow.
  // The actual agent termination logic resides elsewhere.
  return {};
}

// Main message user clarifying question function with tracing
const executeMessageUserClarifyingQuestion = wrapTraced(
  async (): Promise<z.infer<typeof messageUserClarifyingQuestionOutputSchema>> => {
    return await processMessageUserClarifyingQuestion();
  },
  { name: 'message-user-clarifying-question' }
);

// Export the tool
export const messageUserClarifyingQuestion = createTool({
  id: 'message-user-clarifying-question',
  description:
    "Ask the user a clarifying question when additional information is needed to proceed with the analysis. Use this when partial analysis is possible but user confirmation is needed, or when the request is ambiguous. This must be in markdown format and not use the '•' bullet character.",
  inputSchema: messageUserClarifyingQuestionInputSchema,
  outputSchema: messageUserClarifyingQuestionOutputSchema,
  execute: executeMessageUserClarifyingQuestion,
});

export default messageUserClarifyingQuestion;