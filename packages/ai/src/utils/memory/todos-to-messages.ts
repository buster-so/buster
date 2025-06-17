import type { ChatMessageReasoningMessage } from '@server/types/chat-types/chat-message.type';
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

/**
 * Creates a reasoning message for todos to display in the reasoning UI
 * This treats the entire todo list as a single file
 *
 * @param todos - The markdown-formatted todo list
 * @returns ChatMessageReasoningMessage with todos as a single file
 */
export function createTodoReasoningMessage(
  todos: string
): Extract<ChatMessageReasoningMessage, { type: 'files' }> {
  const fileId = `todo-${Date.now()}-${Math.random().toString(36).substring(2)}`;

  return {
    id: fileId,
    type: 'files',
    title: 'TODO List',
    status: 'completed',
    secondary_title: undefined,
    file_ids: [fileId],
    files: {
      [fileId]: {
        id: fileId,
        file_type: 'todo',
        file_name: 'todos',
        version_number: 1,
        status: 'completed',
        file: {
          text: todos,
          modified: undefined,
        },
      },
    },
  };
}
