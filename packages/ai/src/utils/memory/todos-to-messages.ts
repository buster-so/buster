import type { CoreMessage } from 'ai';

/**
 * Creates an assistant message with a tool call for creating todos
 * This is used to inject todos into the message history as if they were created by a tool
 *
 * @param todos - The markdown-formatted todo list
 * @returns CoreMessage with assistant role containing the tool call
 */
export function createTodoToolCallMessage(todos: string): CoreMessage {
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text: `<todo_list>
        - Below are the items on your TODO list:
        ${todos}
        </todo_list>`,
      },
    ],
  };
}
