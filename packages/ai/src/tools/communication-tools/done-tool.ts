import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { DoneToolExecuteInput } from '../../utils/validation-helpers';

// Input/Output schemas
const doneInputSchema = z.object({
  final_response: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

/**
 * Optimistic parsing function for streaming done tool arguments
 * Extracts the final_response field as it's being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof doneInputSchema>> | null {
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
    } else {
      // Unexpected error - re-throw with context
      throw new Error(
        `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

const doneOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  todos: z.string().describe('String representation of the final todo status'),
});

// Type for todo items
interface TodoItem {
  todo: string;
  completed: boolean;
  [key: string]: any; // Allow additional properties
}

// Process done tool execution with todo management
async function processDone(input: DoneToolExecuteInput): Promise<z.infer<typeof doneOutputSchema>> {
  try {
    // Check multiple possible locations for runtime context
    const runtimeContext = input.context?.runtimeContext || input.runtimeContext || input.context;

    if (!runtimeContext || typeof runtimeContext.get !== 'function') {
      // If we can't find a proper runtime context, return success without todos management
      return {
        success: true,
        todos: 'No to-do list found.',
      };
    }

    // Get todos from runtime context
    const todos = runtimeContext.get('todos');

    // Handle case where todos is not an array or doesn't exist
    if (!Array.isArray(todos)) {
      return {
        success: true,
        todos: 'No to-do list found.',
      };
    }

    // If empty array
    if (todos.length === 0) {
      return {
        success: true,
        todos: 'No to-do list found.',
      };
    }

    // Filter out invalid todo items and mark incomplete ones as complete
    const validTodos: TodoItem[] = [];
    const originalCompletionStates = new Map<number, boolean>();

    for (let i = 0; i < todos.length; i++) {
      const item = todos[i];
      // Check if item is a valid todo object
      if (typeof item === 'object' && item !== null && typeof item.todo === 'string') {
        const todo = { ...item };

        // Store original completion state
        originalCompletionStates.set(validTodos.length, !!todo.completed);

        // Mark incomplete todos as complete
        if (!todo.completed) {
          todo.completed = true;
        }

        validTodos.push(todo);
      }
    }

    // If no valid todos found
    if (validTodos.length === 0) {
      return {
        success: true,
        todos: 'No to-do list found.',
      };
    }

    // Update the runtime context with completed todos
    if (typeof runtimeContext.set === 'function') {
      runtimeContext.set('todos', validTodos);
    }

    // Format todos for output
    const todoStrings = validTodos.map((todo, index) => {
      const wasOriginallyCompleted = originalCompletionStates.get(index) || false;
      const wasMarkedByDone = !wasOriginallyCompleted && todo.completed;
      const checkmark = '[x]';
      const suffix = wasMarkedByDone ? ' *Marked complete by calling the done tool' : '';
      return `${checkmark} ${todo.todo}${suffix}`;
    });

    return {
      success: true,
      todos: todoStrings.join('\n'),
    };
  } catch (error) {
    // Re-throw the error to be handled by the test
    throw error;
  }
}

// Main done function with tracing
const executeDone = wrapTraced(
  async (input: DoneToolExecuteInput): Promise<z.infer<typeof doneOutputSchema>> => {
    return await processDone(input);
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
  execute: async ({
    context,
    runtimeContext,
  }: { context: z.infer<typeof doneInputSchema>; runtimeContext?: any }) => {
    // Handle both legacy test format (runtimeContext in context) and new format (separate runtimeContext)
    const actualRuntimeContext = runtimeContext || (context as any)?.runtimeContext;

    // Validate and structure the input for type safety
    const executeInput: DoneToolExecuteInput = {
      context: actualRuntimeContext ? { runtimeContext: actualRuntimeContext } : undefined,
      runtimeContext: actualRuntimeContext,
    };

    return await executeDone(executeInput);
  },
});

export default doneTool;
