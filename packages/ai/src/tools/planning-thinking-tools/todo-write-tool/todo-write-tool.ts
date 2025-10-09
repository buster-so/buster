import { tool } from 'ai';
import { z } from 'zod';
import { TodoItemSchema } from '../../../agents/analytics-engineer-agent/types';
import { createTodoWriteToolExecute } from './todo-write-tool-execute';

export const TODO_WRITE_TOOL_NAME = 'todoWrite';

const TodoWriteToolOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  todos: z.array(TodoItemSchema).describe('The full current state of all todos'),
  message: z.string().optional().describe('Optional message about the operation'),
});

const TodoWriteToolInputSchema = z.object({
  todos: z
    .array(TodoItemSchema)
    .describe('Array of todo items to write/update. Include all todos with their current state.'),
});

const TodoWriteToolContextSchema = z.object({
  chatId: z.string().describe('The chat/conversation ID to associate todos with'),
  workingDirectory: z.string().describe('The working directory for the chat'),
  todosList: z
    .array(TodoItemSchema)
    .default([])
    .describe('In-memory array of todo items to manipulate'),
});

export type TodoWriteToolInput = z.infer<typeof TodoWriteToolInputSchema>;
export type TodoWriteToolOutput = z.infer<typeof TodoWriteToolOutputSchema>;
export type TodoWriteToolContext = z.infer<typeof TodoWriteToolContextSchema>;

export function createTodoWriteTool<
  TAgentContext extends TodoWriteToolContext = TodoWriteToolContext,
>(context: TAgentContext) {
  const execute = createTodoWriteToolExecute(context);

  return tool({
    description: `Write and manage todo items for the current chat session. Accepts an array of todo items with their current state (pending, in_progress, or completed). All todos are persisted to disk and associated with the current chat. Returns the full current state of all todos.`,
    inputSchema: TodoWriteToolInputSchema,
    outputSchema: TodoWriteToolOutputSchema,
    execute,
  });
}
