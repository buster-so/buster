import { wrapTraced } from 'braintrust';
import type {
  UpdateTodoListToolContext,
  UpdateTodoListToolInput,
  UpdateTodoListToolOutput,
} from './update-todo-list-tool';

export function createUpdateTodoListToolExecute(context: UpdateTodoListToolContext) {
  return wrapTraced(
    async (input: UpdateTodoListToolInput): Promise<UpdateTodoListToolOutput> => {
      const { todoList } = input;

      try {
        // Update the context directly by mutating the todoList property
        Object.assign(context, { todoList });

        return {
          success: true,
          updatedTodoList: todoList,
          message: 'Successfully updated todo list',
        };
      } catch (error) {
        return {
          success: false,
          updatedTodoList: context.todoList,
          message: `Error updating todo list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
    { name: 'update-todo-list-execute' }
  );
}
