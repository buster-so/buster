import type { CoreMessage } from 'ai';
import type { MessageHistory } from './types';
import { isAssistantMessage } from './types';

/**
 * @deprecated Use properlyInterleaveMessages instead for better tool call/result pairing
 *
 * Unbundles messages that have tool calls bundled with assistant messages
 * into separate assistant and tool messages following the expected structure.
 *
 * The AI SDK bundles tool calls into assistant messages with content arrays,
 * but for proper conversation history we need them as separate messages.
 *
 * Note: This function only separates tool calls but doesn't properly interleave
 * them with their corresponding tool results.
 *
 * @param messages - Array of messages that may contain bundled tool calls
 * @returns Array of messages with tool calls properly separated
 */
export function unbundleMessages(messages: CoreMessage[]): CoreMessage[] {
  const unbundled: CoreMessage[] = [];

  for (const message of messages) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      // Separate tool calls from other content
      const toolCalls = message.content.filter(
        (item) => typeof item === 'object' && 'type' in item && item.type === 'tool-call'
      );
      const nonToolContent = message.content.filter(
        (item) => !(typeof item === 'object' && 'type' in item && item.type === 'tool-call')
      );

      // If we have tool calls, create separate messages
      if (toolCalls.length > 0) {
        // First add any non-tool content as a separate assistant message
        if (nonToolContent.length > 0) {
          unbundled.push({
            ...message,
            content:
              nonToolContent.length === 1 && typeof nonToolContent[0] === 'string'
                ? nonToolContent[0]
                : nonToolContent,
          });
        }

        // Then add each tool call as a separate assistant message
        for (const toolCall of toolCalls) {
          const newMessage: CoreMessage = {
            ...message,
            content: [toolCall],
          };
          // Add ID if the original message has one
          if ('id' in message && message.id) {
            Object.assign(newMessage, { id: toolCall.toolCallId || message.id });
          }
          unbundled.push(newMessage);
        }
      } else {
        // No tool calls, just add the message as-is
        unbundled.push(message);
      }
    } else {
      // Non-assistant messages (user, tool, system) pass through unchanged
      unbundled.push(message);
    }
  }

  return unbundled;
}

/**
 * Properly interleaves tool calls with their corresponding tool results
 * Ensures messages follow the pattern: assistant(tool) -> tool result -> assistant(tool) -> tool result
 *
 * @param messages - Messages that may have bundled tool calls
 * @returns Messages in proper sequential order
 */
export function properlyInterleaveMessages(messages: CoreMessage[]): CoreMessage[] {
  const result: CoreMessage[] = [];
  const toolResultsMap = new Map<string, CoreMessage>();

  // First pass: collect all tool results indexed by toolCallId
  for (const message of messages) {
    if (message.role === 'tool' && Array.isArray(message.content)) {
      for (const item of message.content) {
        if (item.type === 'tool-result' && item.toolCallId) {
          toolResultsMap.set(item.toolCallId, message);
        }
      }
    }
  }

  // Second pass: process messages and interleave properly
  for (const message of messages) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      // Check if this contains tool calls
      const toolCalls = message.content.filter(
        (item) => typeof item === 'object' && 'type' in item && item.type === 'tool-call'
      );

      if (toolCalls.length > 0) {
        // This message has tool calls - we need to split them
        const nonToolContent = message.content.filter(
          (item) => !(typeof item === 'object' && 'type' in item && item.type === 'tool-call')
        );

        // Add non-tool content first if any
        if (nonToolContent.length > 0) {
          result.push({
            ...message,
            content:
              nonToolContent.length === 1 && typeof nonToolContent[0] === 'string'
                ? nonToolContent[0]
                : nonToolContent,
          });
        }

        // Add each tool call followed by its result
        for (const toolCall of toolCalls) {
          // Add the tool call as a separate assistant message
          const toolCallMessage: CoreMessage = {
            ...message,
            content: [toolCall],
          };
          // Add ID if needed
          if ('id' in message && message.id) {
            Object.assign(toolCallMessage, { id: toolCall.toolCallId || message.id });
          }
          result.push(toolCallMessage);

          // Find and add the corresponding tool result immediately after
          const toolResult = toolResultsMap.get(toolCall.toolCallId);
          if (toolResult) {
            result.push(toolResult);
            // Mark as used so we don't add it again
            toolResultsMap.delete(toolCall.toolCallId);
          }
        }
      } else {
        // No tool calls, add as-is
        result.push(message);
      }
    } else if (message.role !== 'tool') {
      // Not a tool result, add as-is (user, system messages)
      result.push(message);
    }
    // Tool results are added inline with their calls, so skip them here
  }

  // Add any orphaned tool results at the end (shouldn't happen in practice)
  for (const toolResult of toolResultsMap.values()) {
    result.push(toolResult);
  }

  return result;
}

/**
 * Extract and validate message history from step response
 * If messages are bundled, properly interleaves them
 */
export function extractMessageHistory(stepMessages: CoreMessage[]): MessageHistory {
  // Validate it's an array
  if (!Array.isArray(stepMessages)) {
    return [];
  }

  // Check if messages need interleaving
  const messages = stepMessages;

  // Detect if we have bundled tool calls (multiple tool calls in one assistant message
  // followed by multiple tool results)
  let needsInterleaving = false;

  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];

    // Check if we have an assistant message with multiple tool calls
    if (current && current.role === 'assistant' && Array.isArray(current.content)) {
      const toolCallCount = current.content.filter(
        (item) => typeof item === 'object' && 'type' in item && item.type === 'tool-call'
      ).length;

      // If we have multiple tool calls followed by a tool result, we need interleaving
      if (toolCallCount > 1 && next?.role === 'tool') {
        needsInterleaving = true;
        break;
      }
    }
  }

  // If messages are bundled, interleave them properly
  if (needsInterleaving) {
    const result = properlyInterleaveMessages(messages);
    return result;
  }

  // Otherwise return as-is - they're already properly formatted
  return messages;
}

/**
 * Get the last tool used in the message history
 * Works with unbundled messages where each tool call is a separate assistant message
 */
export function getLastToolUsed(messages: MessageHistory): string | null {
  // Iterate backwards through messages looking for assistant messages with tool calls
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg) continue;

    if (isAssistantMessage(msg) && Array.isArray(msg.content)) {
      // Check if this assistant message contains a tool call
      for (const item of msg.content) {
        if (
          typeof item === 'object' &&
          'type' in item &&
          item.type === 'tool-call' &&
          'toolName' in item
        ) {
          return item.toolName as string;
        }
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
): Record<string, unknown> | null {
  if (!isAssistantMessage(message) || !Array.isArray(message.content)) {
    return null;
  }

  const toolCall = message.content.find(
    (item) =>
      typeof item === 'object' &&
      'type' in item &&
      item.type === 'tool-call' &&
      'toolName' in item &&
      item.toolName === toolName
  );

  if (toolCall && typeof toolCall === 'object' && 'args' in toolCall) {
    return toolCall.args as Record<string, unknown>;
  }

  return null;
}

/**
 * Check if the message history ends with a specific tool
 */
export function endsWithTool(messages: MessageHistory, toolName: string): boolean {
  const lastTool = getLastToolUsed(messages);
  return lastTool === toolName;
}

/**
 * Check if an assistant message contains only tool calls
 * Useful for identifying tool-call-only messages in unbundled format
 */
export function isToolCallOnlyMessage(message: CoreMessage): boolean {
  if (!isAssistantMessage(message) || !Array.isArray(message.content)) {
    return false;
  }

  // Check if all content items are tool calls
  return (
    message.content.length > 0 &&
    message.content.every(
      (item) => typeof item === 'object' && 'type' in item && item.type === 'tool-call'
    )
  );
}

/**
 * Remove system messages from history (if needed for certain contexts)
 */
export function removeSystemMessages(messages: MessageHistory): MessageHistory {
  return messages.filter((msg) => msg.role !== 'system');
}

/**
 * Get a summary of the conversation flow
 * Works with unbundled messages where tool calls and results are separate messages
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
        // In unbundled format, an assistant message with tool calls
        // should only contain tool calls, not mixed content
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
