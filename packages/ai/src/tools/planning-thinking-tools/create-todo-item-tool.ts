import { createTool } from '@mastra/core';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

const inputSchema = z.object({
  todos: z
    .string()
    .describe(
      'The todos that the agent will work on. Must be in markdown format. Example: "[ ] Todo 1\n[ ] Todo 2\n[ ] Todo 3"'
    ),
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
  id: 'create-todo-list',
  description:
    'Call this tool to create a TODO list. The agent will work on the TODO list in the order it is provided.',
  inputSchema,
  outputSchema,
  execute: executeFunction,
});
