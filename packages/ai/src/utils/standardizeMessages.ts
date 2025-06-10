import type { CoreMessage } from 'ai';

/**
 * Standardizes input to CoreMessage[] format
 * This ensures all agents use the same message format
 *
 * @param input - Can be a string prompt or an array of CoreMessages
 * @returns CoreMessage[] array
 */
export function standardizeMessages(input: string | CoreMessage[]): CoreMessage[] {
  // If input is already CoreMessage[], return as-is
  if (Array.isArray(input)) {
    return input;
  }

  // If input is a string, convert to user message
  if (typeof input === 'string') {
    return [
      {
        role: 'user',
        content: input,
      },
    ];
  }

  // Fallback for unexpected input types
  throw new Error(`Invalid input type for standardizeMessages: ${typeof input}`);
}

/**
 * Prepends conversation history to a new prompt
 * Useful for continuing conversations
 *
 * @param history - Previous conversation history
 * @param newPrompt - New user prompt to add
 * @returns Combined CoreMessage[] array
 */
export function appendToConversation(history: CoreMessage[], newPrompt: string): CoreMessage[] {
  return [
    ...history,
    {
      role: 'user',
      content: newPrompt,
    },
  ];
}

/**
 * Validates that messages are in correct CoreMessage format
 *
 * @param messages - Messages to validate
 * @returns true if valid, throws if invalid
 */
export function validateCoreMessages(messages: CoreMessage[]): boolean {
  for (const message of messages) {
    if (!message.role || !['system', 'user', 'assistant', 'tool'].includes(message.role)) {
      throw new Error(`Invalid message role: ${message.role}`);
    }

    if (message.content === undefined || message.content === null) {
      throw new Error(`Message content is required for role: ${message.role}`);
    }
  }

  return true;
}
