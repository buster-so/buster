import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces matching Rust structs
interface DoneInput {
  final_response: string;
}

interface DoneOutput {
  success: boolean;
  todos: string;
}

interface RuntimeContext {
  get(key: string): any | undefined;
  set(key: string, value: any): void;
}

interface TodoItem {
  todo: string;
  completed: boolean;
  [key: string]: any; // Allow other fields
}

// Parse and validate todo items from agent state
function parseTodos(todosValue: any): TodoItem[] {
  if (!Array.isArray(todosValue)) {
    return [];
  }

  return todosValue.filter((item): item is TodoItem => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.todo === 'string' &&
      typeof item.completed === 'boolean'
    );
  });
}

// Format todos list for output with completion annotations
function formatTodosOutput(todos: TodoItem[], markedByDone: number[]): string {
  return todos
    .map((todo, idx) => {
      const annotation = markedByDone.includes(idx) 
        ? ' *Marked complete by calling the done tool'
        : '';
      return `[x] ${todo.todo}${annotation}`;
    })
    .join('\n');
}

// Process done tool execution with todo management
async function processDone(
  params: DoneInput,
  runtimeContext?: RuntimeContext
): Promise<DoneOutput> {
  if (!runtimeContext) {
    throw new Error('Runtime context not found');
  }

  // Get the current todos from state
  const todosValue = runtimeContext.get('todos');
  const todos = parseTodos(todosValue);

  // If no todos exist, just return success without a list
  if (todos.length === 0) {
    return {
      success: true,
      todos: 'No to-do list found.'
    };
  }

  const markedByDone: number[] = []; // Track items marked by this tool

  // Mark all remaining unfinished todos as complete
  for (let idx = 0; idx < todos.length; idx++) {
    const todo = todos[idx];
    if (!todo.completed) {
      todo.completed = true;
      markedByDone.push(idx); // Track 0-based index
    }
  }

  // Save the updated todos back to state
  runtimeContext.set('todos', todos);

  // Format the output string, potentially noting items marked by 'done'
  const todosString = formatTodosOutput(todos, markedByDone);

  // This tool signals the end of the workflow and provides the final response.
  // The actual agent termination logic resides elsewhere.
  return {
    success: true,
    todos: todosString
  };
}

// Main done function with tracing
const executeDone = wrapTraced(
  async (params: DoneInput & { runtimeContext?: RuntimeContext }): Promise<DoneOutput> => {
    const { runtimeContext, ...doneParams } = params;
    return await processDone(doneParams, runtimeContext);
  },
  { name: 'done-tool' }
);

// Input/Output schemas
const inputSchema = z.object({
  final_response: z.string().min(1, 'Final response is required').describe(
    'The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the \'•\' bullet character. Do not include markdown tables.'
  )
});

const outputSchema = z.object({
  success: z.boolean(),
  todos: z.string()
});

// Export the tool
export const doneTool = createTool({
  id: 'done',
  description: 'Marks all remaining unfinished tasks as complete, sends a final response to the user, and ends the workflow. Use this when the workflow is finished. This must be in markdown format and not use the \'•\' bullet character.',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    return await executeDone(context as DoneInput & { runtimeContext?: RuntimeContext });
  }
});

export default doneTool;