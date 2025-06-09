import type { CoreMessage } from 'ai';

/**
 * Format a single CoreMessage as a reasoning entry
 */
function formatMessageAsReasoningEntry(message: CoreMessage): any {
  // Extract the content based on message type
  let messageContent = '';

  if (typeof message.content === 'string') {
    messageContent = message.content;
  } else if (Array.isArray(message.content)) {
    // Handle multi-part content (e.g., text + images)
    messageContent = message.content
      .map((part) => {
        if (part.type === 'text') {
          return part.text;
        }
        return `[${part.type}]`;
      })
      .join(' ');
  }

  // For tool messages, include the tool name and result
  if (message.role === 'tool') {
    const toolMessage = message as any;
    messageContent = `Tool: ${toolMessage.toolName}\nResult: ${typeof toolMessage.content === 'string' ? toolMessage.content : JSON.stringify(toolMessage.content)}`;
  }

  return {
    id: crypto.randomUUID(),
    type: 'text',
    title: 'llm chunk',
    status: 'completed',
    message: messageContent,
    message_chunk: null,
    secondary_title: 'dummy', // Placeholder as requested
    finished_reasoning: false,
  };
}

/**
 * Convert an array of CoreMessages to reasoning format
 * Each message becomes its own reasoning entry
 *
 * @param messages - Array of CoreMessage objects from the LLM conversation
 * @returns Array of reasoning entries, one for each message
 */
export function formatLlmMessagesAsReasoning(messages: CoreMessage[]): any[] {
  return messages.map(formatMessageAsReasoningEntry);
}

/**
 * Get the current reasoning array and append new reasoning entries
 * This ensures reasoning builds on itself like conversation history
 *
 * @param currentReasoning - Existing reasoning array (if any)
 * @param newMessages - New CoreMessages to append as reasoning
 * @returns Combined reasoning array
 */
export function appendToReasoning(
  currentReasoning: any[] | null | undefined,
  newMessages: CoreMessage[]
): any[] {
  const existing = currentReasoning || [];
  const newReasoningEntries = formatLlmMessagesAsReasoning(newMessages);
  return [...existing, ...newReasoningEntries];
}
