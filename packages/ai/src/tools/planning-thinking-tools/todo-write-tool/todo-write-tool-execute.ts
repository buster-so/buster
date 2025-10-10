import { wrapTraced } from 'braintrust';
import type { TodoItem } from '../../../agents/analytics-engineer-agent/types';
import type {
  TodoWriteToolContext,
  TodoWriteToolInput,
  TodoWriteToolOutput,
} from './todo-write-tool';

/**
 * Processes todos by setting timestamps and handling status changes
 */
function processTodos(inputTodos: TodoItem[], existingTodos: TodoItem[] = []): TodoItem[] {
  const existingById = new Map(existingTodos.map((todo) => [todo.id, todo]));
  const now = new Date().toISOString();

  return inputTodos.map((todo) => {
    const existing = existingById.get(todo.id);
    const processed = { ...todo };

    // Set createdAt for new todos
    if (!existing) {
      processed.createdAt = processed.createdAt || now;
    } else {
      // Keep existing createdAt
      processed.createdAt = existing.createdAt;
    }

    // Set completedAt when status changes to completed
    if (processed.status === 'completed' && (!existing || existing.status !== 'completed')) {
      processed.completedAt = now;
    }

    // Clear completedAt if status changes from completed to something else
    if (processed.status !== 'completed' && existing?.status === 'completed') {
      processed.completedAt = undefined;
    }

    return processed;
  });
}

/**
 * Creates the execute function for the todo write tool
 */
export function createTodoWriteToolExecute(context: TodoWriteToolContext) {
  return wrapTraced(
    async function execute(input: TodoWriteToolInput): Promise<TodoWriteToolOutput> {
      const { chatId, todosList = [] } = context;
      const { todos: inputTodos } = input;

      console.info(`Writing ${inputTodos.length} todo(s) for chat ${chatId}`);

      try {
        // Process the todos (set timestamps, handle status changes)
        const processedTodos = processTodos(inputTodos, todosList);

        // Update the in-memory todosList by clearing and repopulating
        todosList.splice(0, todosList.length, ...processedTodos);

        console.info(`Successfully updated ${processedTodos.length} todo(s) in memory`);

        return {
          success: true,
          todos: processedTodos,
          message: `Successfully updated ${processedTodos.length} todo(s)`,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error in todo write tool:', errorMessage);

        return {
          success: false,
          todos: todosList,
          message: `Error: ${errorMessage}`,
        };
      }
    },
    { name: 'todo-write-execute' }
  );
}
