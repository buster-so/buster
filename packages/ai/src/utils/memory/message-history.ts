import type { CoreMessage } from 'ai';
import type { MessageHistory } from './types';
import { isAssistantMessage } from './types';

/**
 * Extract and validate message history from step response
 */
export function extractMessageHistory(stepMessages: any[]): MessageHistory {
  // Since we're using CoreMessage[] directly, just validate it's an array and return
  if (!Array.isArray(stepMessages)) {
    console.error('Invalid message history format: not an array');
    return [];
  }

  // Cast to CoreMessage[] - Mastra provides compatible format
  return stepMessages as CoreMessage[];
}

/**
 * Get the last tool used in the message history
 */
export function getLastToolUsed(messages: MessageHistory): string | null {
  // Iterate backwards through messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg) continue;

    if (isAssistantMessage(msg) && Array.isArray(msg.content)) {
      // Find tool calls in the content
      const toolCall = msg.content.find(
        (item): any => typeof item === 'object' && 'type' in item && item.type === 'tool-call'
      );

      if (toolCall && 'toolName' in toolCall) {
        return toolCall.toolName as string;
      }
    }
  }

  return null;
}

/**
 * Get all tools used in the message history
 */
export function getAllToolsUsed(messages: MessageHistory): string[] {
  const tools = new Set<string>();

  for (const msg of messages) {
    if (isAssistantMessage(msg) && Array.isArray(msg.content)) {
      for (const item of msg.content) {
        if (
          typeof item === 'object' &&
          'type' in item &&
          item.type === 'tool-call' &&
          'toolName' in item
        ) {
          tools.add(item.toolName as string);
        }
      }
    }
  }

  return Array.from(tools);
}

/**
 * Format messages for analyst agent consumption
 * Ensures the initial user prompt is included if not already present
 */
export function formatMessagesForAnalyst(
  messages: MessageHistory,
  initialPrompt?: string
): CoreMessage[] {
  const formattedMessages: CoreMessage[] = [];

  // Check if we already have a user message with the initial prompt
  const hasInitialPrompt = messages.some(
    (msg) => msg.role === 'user' && typeof msg.content === 'string' && msg.content === initialPrompt
  );

  // Add initial prompt if not present
  if (initialPrompt && !hasInitialPrompt) {
    formattedMessages.push({
      role: 'user',
      content: initialPrompt,
    });
  }

  // Add all the messages from think-and-prep
  formattedMessages.push(...messages);

  return formattedMessages;
}

/**
 * Extract tool arguments from a message
 */
export function extractToolArguments(
  message: CoreMessage,
  toolName: string
): Record<string, any> | null {
  if (!isAssistantMessage(message) || !Array.isArray(message.content)) {
    return null;
  }

  const toolCall = message.content.find(
    (item): any =>
      typeof item === 'object' &&
      'type' in item &&
      item.type === 'tool-call' &&
      'toolName' in item &&
      item.toolName === toolName
  );

  return toolCall && 'args' in toolCall ? (toolCall.args as Record<string, any>) : null;
}

/**
 * Check if the message history ends with a specific tool
 */
export function endsWithTool(messages: MessageHistory, toolName: string): boolean {
  const lastTool = getLastToolUsed(messages);
  return lastTool === toolName;
}

/**
 * Remove system messages from history (if needed for certain contexts)
 */
export function removeSystemMessages(messages: MessageHistory): MessageHistory {
  return messages.filter((msg) => msg.role !== 'system');
}

/**
 * Get a summary of the conversation flow
 */
export function getConversationSummary(messages: MessageHistory): {
  userMessages: number;
  assistantMessages: number;
  toolCalls: number;
  toolResults: number;
  toolsUsed: string[];
} {
  let userMessages = 0;
  let assistantMessages = 0;
  let toolCalls = 0;
  let toolResults = 0;
  const toolsUsed = new Set<string>();

  for (const msg of messages) {
    switch (msg.role) {
      case 'user':
        userMessages++;
        break;
      case 'assistant':
        assistantMessages++;
        if (Array.isArray(msg.content)) {
          for (const item of msg.content) {
            if (
              typeof item === 'object' &&
              'type' in item &&
              item.type === 'tool-call' &&
              'toolName' in item
            ) {
              toolCalls++;
              toolsUsed.add(item.toolName as string);
            }
          }
        }
        break;
      case 'tool':
        toolResults++;
        break;
    }
  }

  return {
    userMessages,
    assistantMessages,
    toolCalls,
    toolResults,
    toolsUsed: Array.from(toolsUsed),
  };
}
