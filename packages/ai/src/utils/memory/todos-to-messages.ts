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
      toolName: 'createToDos',
      args: { todos }
    }]
  };
}

/**
 * Creates a tool result message for the todo creation
 * This represents the response to the tool call
 * 
 * @param todos - The markdown-formatted todo list (not used in result, just for consistency)
 * @returns CoreMessage with tool role containing a simple acknowledgment
 */
export function createTodoToolResultMessage(todos: string): CoreMessage {
  return {
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId: 'create-todos-call',
        toolName: 'createToDos',
        result: {
          success: true
        }
      }
    ]
  } as CoreMessage;
}