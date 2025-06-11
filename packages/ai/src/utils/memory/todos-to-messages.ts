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
    role: 'assistant',
    content: [{
      type: 'tool-call',
      toolCallId: 'create-todos-call',
      toolName: 'create_todo_list',
      args: { todos }
    }]
  };
}

/**
 * Creates a tool result message containing the todos
 * This represents the response to the tool call
 * 
 * @param todos - The markdown-formatted todo list
 * @returns CoreMessage with tool role containing the todo result
 */
export function createTodoToolResultMessage(todos: string): CoreMessage {
  return {
    role: 'tool',
    content: todos,
    toolCallId: 'create-todos-call',
    toolName: 'create_todo_list'
  };
}