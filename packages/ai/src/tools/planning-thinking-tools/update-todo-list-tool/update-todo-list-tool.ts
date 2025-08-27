import { tool } from 'ai';
import { z } from 'zod';
import { createUpdateTodoListToolExecute } from './update-todo-list-tool-execute';

export const UPDATE_TODO_LIST_TOOL_NAME = 'updateTodoList';

export const UpdateTodoListToolInputSchema = z.object({
  todoList: z.string().describe('The updated todo list in markdown format'),
});

const UpdateTodoListToolOutputSchema = z.object({
  success: z.boolean(),
  updatedTodoList: z.string().describe('The updated todo list'),
  message: z.string().optional(),
});

const UpdateTodoListToolContextSchema = z.object({
  todoList: z.string().describe('The current todo list'),
});

export type UpdateTodoListToolInput = z.infer<typeof UpdateTodoListToolInputSchema>;
export type UpdateTodoListToolOutput = z.infer<typeof UpdateTodoListToolOutputSchema>;
export type UpdateTodoListToolContext = z.infer<typeof UpdateTodoListToolContextSchema>;

export function createUpdateTodoListTool(context: UpdateTodoListToolContext) {
  const execute = createUpdateTodoListToolExecute(context);

  return tool({
    description:
      'Update the todo list with a new markdown formatted list. This replaces the entire todo list with the provided content.',
    inputSchema: UpdateTodoListToolInputSchema,
    outputSchema: UpdateTodoListToolOutputSchema,
    execute,
  });
}

// Legacy export for backward compatibility
export const updateTodoList = createUpdateTodoListTool({
  todoList: '',
});
