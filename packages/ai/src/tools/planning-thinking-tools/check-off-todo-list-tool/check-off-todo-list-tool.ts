import { tool } from 'ai';
import { z } from 'zod';
import { createCheckOffTodoListToolExecute } from './check-off-todo-list-tool-execute';

export const CHECK_OFF_TODO_LIST_TOOL_NAME = 'checkOffTodoList';

export const CheckOffTodoListToolInputSchema = z.object({
  todoItems: z.array(z.string()).describe('An array of todo item texts to check off in the list'),
});

const CheckOffTodoListToolOutputSchema = z.object({
  success: z.boolean(),
  updatedTodoList: z.string().describe('The updated todo list with the items checked off'),
  message: z.string().optional(),
  checkedOffItems: z.array(z.string()).describe('List of items that were successfully checked off'),
  failedItems: z.array(z.string()).describe('List of items that could not be checked off'),
});

const CheckOffTodoListToolContextSchema = z.object({
  todoList: z.string().optional().describe('The current todo list'),
  updateTodoList: z
    .function()
    .args(z.string())
    .returns(z.void())
    .optional()
    .describe('Function to update the todo list'),
});

export type CheckOffTodoListToolInput = z.infer<typeof CheckOffTodoListToolInputSchema>;
export type CheckOffTodoListToolOutput = z.infer<typeof CheckOffTodoListToolOutputSchema>;
export type CheckOffTodoListToolContext = z.infer<typeof CheckOffTodoListToolContextSchema>;

export function createCheckOffTodoListTool(context: CheckOffTodoListToolContext) {
  const execute = createCheckOffTodoListToolExecute(context);

  return tool({
    description:
      'Check off multiple todo items in the todo list by replacing "- [ ]" with "- [x]" for each item. The todo list is maintained as a string in the runtime context.',
    inputSchema: CheckOffTodoListToolInputSchema,
    outputSchema: CheckOffTodoListToolOutputSchema,
    execute,
  });
}

// Legacy export for backward compatibility
export const checkOffTodoList = createCheckOffTodoListTool({
  todoList: '',
  updateTodoList: () => {},
});
