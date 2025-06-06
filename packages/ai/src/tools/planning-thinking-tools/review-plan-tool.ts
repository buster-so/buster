import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces matching Rust structs
interface ReviewPlanInput {
  todo_items: number[]; // 1-based index
}

interface ReviewPlanOutput {
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

// Format todos list for output showing completion status
function formatTodosOutput(todos: TodoItem[]): string {
  return todos
    .map((todo) => {
      const marker = todo.completed ? 'x' : ' ';
      return `[${marker}] ${todo.todo}`;
    })
    .join('\n');
}

// Process review plan execution with todo completion by index
async function processReviewPlan(
  params: ReviewPlanInput,
  runtimeContext?: RuntimeContext
): Promise<ReviewPlanOutput> {
  if (!runtimeContext) {
    throw new Error('Runtime context not found');
  }

  // Get the current todos from state
  const todosValue = runtimeContext.get('todos');
  const todos = parseTodos(todosValue);

  if (todos.length === 0) {
    throw new Error("Could not find 'todos' in agent state or it's not an array.");
  }

  const totalTodos = todos.length;

  // Process each todo index
  for (const idxOneBased of params.todo_items) {
    // Convert 1-based index to 0-based index
    if (idxOneBased === 0) {
      throw new Error('todo_item index cannot be 0, indexing starts from 1.');
    }

    const idxZeroBased = idxOneBased - 1;

    if (idxZeroBased >= totalTodos) {
      throw new Error(`todo_item index ${idxOneBased} out of range (${totalTodos} todos, 1-based)`);
    }

    // Mark the todo at the given index as complete
    const todo = todos[idxZeroBased];
    if (!todo || typeof todo !== 'object') {
      throw new Error(`Todo item at index ${idxOneBased} (1-based) is not a valid object.`);
    }

    todo.completed = true;
  }

  // Save the updated todos back to state
  runtimeContext.set('todos', todos);

  // Format the output string
  const todosString = formatTodosOutput(todos);

  // Set review_needed to false after review
  runtimeContext.set('review_needed', false);

  return {
    success: true,
    todos: todosString,
  };
}

// Main review plan function with tracing
const executeReviewPlan = wrapTraced(
  async (
    params: ReviewPlanInput & { runtimeContext?: RuntimeContext }
  ): Promise<ReviewPlanOutput> => {
    const { runtimeContext, ...reviewParams } = params;
    return await processReviewPlan(reviewParams, runtimeContext);
  },
  { name: 'review-plan' }
);

// Input/Output schemas
const inputSchema = z.object({
  todo_items: z
    .array(z.number().int().min(1, 'Todo item index must be at least 1 (1-based indexing)'))
    .min(1, 'At least one todo item index must be provided')
    .describe('A list of 1-based indices of the tasks to mark as complete (1 is the first item).'),
});

const outputSchema = z.object({
  success: z.boolean(),
  todos: z.string(),
});

// Export the tool
export const reviewPlanTool = createTool({
  id: 'review-plan',
  description: 'Marks one or more tasks as complete by their 1-based indices in the to-do list.',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    return await executeReviewPlan(
      context as ReviewPlanInput & { runtimeContext?: RuntimeContext }
    );
  },
});

export default reviewPlanTool;
