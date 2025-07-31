import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../context/docs-agent-context';

// Input/Output schemas
const idleInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

export type IdleToolExecuteInput = z.infer<typeof idleInputSchema>;

/**
 * Optimistic parsing function for streaming idle tool arguments
 * Extracts the final_response field as it's being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof idleInputSchema>> | null {
  // Validate input type
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    // First try to parse as complete JSON
    const parsed = JSON.parse(accumulatedText);
    return {
      final_response: parsed.final_response || undefined,
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
      const partialMatch = accumulatedText.match(/"final_response"\s*:\s*"((?:[^"\\]|\\.*)*)/);
      if (partialMatch && partialMatch[1] !== undefined) {
        // Unescape the partial string
        const unescaped = partialMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return {
          final_response: unescaped,
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

const idleOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
});

type IdleOutput = z.infer<typeof idleOutputSchema>;

async function processIdle(
  _input: IdleToolExecuteInput,
  runtimeContext: RuntimeContext<DocsAgentContext>
): Promise<IdleOutput> {
  // Check if sandbox is available
  const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

  if (sandbox) {
    try {
      // Check for {{TODO}} strings in files
      const grepCommand = 'grep -rlF "{{TODO}}" . 2>/dev/null || true';
      const result = await sandbox.process.executeCommand(grepCommand);

      // Check if grep found any files
      const output = (result.result || '').trim();
      const filesWithTodos = output ? output.split('\n').filter(Boolean) : [];

      if (filesWithTodos.length > 0) {
        throw new Error(
          `Cannot enter idle state: Found {{TODO}} markers in ${filesWithTodos.length} file(s): ${filesWithTodos.slice(0, 5).join(', ')}${filesWithTodos.length > 5 ? '...' : ''}`
        );
      }
    } catch (error) {
      // If it's our TODO error, re-throw it
      if (error instanceof Error && error.message.includes('Cannot enter idle state')) {
        throw error;
      }
      // Otherwise, log warning but don't block idle
      console.warn('Warning: Could not check for TODOs:', error);
    }
  }

  return {
    success: true,
  };
}

const executeIdle = wrapTraced(
  async (
    input: IdleToolExecuteInput,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof idleOutputSchema>> => {
    return await processIdle(input, runtimeContext);
  },
  { name: 'idle-tool' }
);

// Export the tool
export const idleTool = createTool({
  id: 'idle',
  description:
    "Marks all remaining unfinished tasks as complete, sends a final response to the user, and enters an idle state. Use this when current work is finished but the agent should remain available for future tasks. This must be in markdown format and not use the '•' bullet character.",
  inputSchema: idleInputSchema,
  outputSchema: idleOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof idleInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await executeIdle(context as IdleToolExecuteInput, runtimeContext);
  },
});

export default idleTool;
