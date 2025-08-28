import { tool } from 'ai';
import { z } from 'zod';
import { createUpdateTodoListToolExecute } from './update-todo-list-tool-execute';

/**
 * Tool for managing markdown-formatted todo lists with checkbox items.
 *
 * IMPORTANT: All todo items must use the checkbox format:
 * - [ ] for unchecked/pending tasks
 * - [x] for checked/completed tasks
 *
 * Example todo list structure:
 *
 * # Project Implementation Todo
 *
 * ## Phase 1: Setup and Planning
 * - [x] Initialize repository structure
 * - [x] Set up development environment
 * - [ ] Define API specifications
 * - [ ] Create database schema
 *
 * ## Phase 2: Core Features
 * - [ ] Implement user authentication
 * - [ ] Build user profile endpoints
 * - [ ] Add authorization middleware
 * - [ ] Create user settings page
 *
 * ## Phase 3: Testing
 * - [ ] Write unit tests for auth module
 * - [ ] Add integration tests for API
 * - [ ] Perform security audit
 * - [ ] Run performance benchmarks
 *
 * ## Phase 4: Documentation and Deployment
 * - [ ] Update API documentation
 * - [ ] Write deployment guide
 * - [ ] Create pull request
 * - [ ] Deploy to staging
 */

export const UPDATE_TODO_LIST_TOOL_NAME = 'updateTodoList';

const UpdateTodoListEditSchema = z.object({
  operation: z.enum(['replace', 'append']).describe(
    `You should perform an append when you just want to add new items to the end of the todo list. 
      You should perform a replace when you want to replace existing content with new content.
      Appending is preferred over replacing because it preserves existing todos and is less likely to cause issues.
      If you are replacing content, you should provide the content you want to replace and the new content you want to insert.`
  ),
  content_to_replace: z
    .string()
    .describe(
      'The string content that should be replaced in the current todo list. This is required for the replace operation. Will just be an empty string for the append operation.'
    ),
  content: z
    .string()
    .describe(
      'The new markdown content to insert. Either replaces content_to_replace or appends to the end. This is required for both the replace and append operations.'
    ),
});

export const UpdateTodoListToolInputSchema = z.object({
  edits: z
    .array(UpdateTodoListEditSchema)
    .min(1)
    .describe('Array of edit operations to apply sequentially to the todo list'),
});

const UpdateTodoListToolOutputSchema = z.object({
  success: z.boolean(),
  updatedTodoList: z.string().describe('The updated todo list after all edits'),
  errors: z.array(z.string()).optional().describe('List of errors if any edit operations failed'),
});

const UpdateTodoListToolContextSchema = z.object({
  todoList: z.string().describe('The current todo list'),
});

export type UpdateTodoListEdit = z.infer<typeof UpdateTodoListEditSchema>;
export type UpdateTodoListToolInput = z.infer<typeof UpdateTodoListToolInputSchema>;
export type UpdateTodoListToolOutput = z.infer<typeof UpdateTodoListToolOutputSchema>;
export type UpdateTodoListToolContext = z.infer<typeof UpdateTodoListToolContextSchema>;

export function createUpdateTodoListTool(context: UpdateTodoListToolContext) {
  const execute = createUpdateTodoListToolExecute(context);

  return tool({
    description:
      'Update the todo list with markdown edits. Can either append new items to the end or replace specific content within the list.',
    inputSchema: UpdateTodoListToolInputSchema,
    outputSchema: UpdateTodoListToolOutputSchema,
    execute,
  });
}

// Legacy export for backward compatibility
export const updateTodoList = createUpdateTodoListTool({
  todoList: '',
});
