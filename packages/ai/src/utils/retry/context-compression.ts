import type { CoreMessage } from 'ai';

/**
 * Compresses conversation history when hitting token limits
 */
export function compressConversationHistory(
  messages: CoreMessage[],
  maxMessages: number = 10
): CoreMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }

  // Keep the first message (usually system/context) and recent messages
  const firstMessage = messages[0];
  const recentMessages = messages.slice(-maxMessages + 1);

  // Add a compression indicator
  const compressionMessage: CoreMessage = {
    role: 'user',
    content: '[Previous conversation history has been summarized to reduce context length]',
  };

  // Handle case where firstMessage might be undefined (empty array)
  if (!firstMessage) {
    return [compressionMessage, ...recentMessages];
  }

  return [firstMessage, compressionMessage, ...recentMessages];
}

/**
 * Estimates token count (rough approximation)
 */
export function estimateTokenCount(messages: CoreMessage[]): number {
  const totalText = messages
    .map(msg => {
      if (typeof msg.content === 'string') {
        return msg.content;
      }
      return JSON.stringify(msg.content);
    })
    .join(' ');

  // Rough approximation: 4 characters per token
  return Math.ceil(totalText.length / 4);
}

/**
 * Checks if conversation history is likely to exceed token limits
 */
export function shouldCompressHistory(messages: CoreMessage[], maxTokens: number = 100000): boolean {
  return estimateTokenCount(messages) > maxTokens;
}