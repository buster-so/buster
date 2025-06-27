import { createTool } from '@mastra/core';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

const inputSchema = z.object({
  todos: z.string().describe('The todos that the agent will work on.")'),
});

const outputSchema = z.object({});

const executeFunction = wrapTraced(
  async (): Promise<z.infer<typeof outputSchema>> => {
    // Simply return the item - ChunkProcessor will handle persistence
    return {};
  },
  { name: 'create-todo-item' }
);

export const createTodoList = createTool({
  id: 'create_todo_item',
  description:
    'Create a single TODO list item. Call this tool multiple times to create your complete TODO list.',
  inputSchema,
  outputSchema,
  execute: executeFunction,
});
