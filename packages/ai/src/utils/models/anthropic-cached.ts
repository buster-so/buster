import { createAnthropic } from '@ai-sdk/anthropic';
import { wrapAISDKModel } from 'braintrust';

// Token estimation using: tokens = number of words + number of punctuation marks
const estimateTokens = (text: string): number => {
  if (!text) return 0;
  
  // Count words (split by whitespace and filter out empty strings)
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  
  // Count punctuation marks
  const punctuation = text.match(/[.,;:!?'"()\[\]{}\-–—]/g) || [];
  
  return words.length + punctuation.length;
};

const getTokensFromMessage = (message: any): number => {
  let tokens = 0;
  
  if (typeof message === 'string') {
    tokens += estimateTokens(message);
  } else if (message && typeof message === 'object') {
    if (message.text) {
      tokens += estimateTokens(message.text);
    }
    if (message.content) {
      if (typeof message.content === 'string') {
        tokens += estimateTokens(message.content);
      } else if (Array.isArray(message.content)) {
        tokens += message.content.reduce((sum: number, item: any) => {
          if (item.text) {
            return sum + estimateTokens(item.text);
          }
          return sum;
        }, 0);
      }
    }
  }
  
  return tokens;
};

export const anthropicCachedModel = (modelId: string) => {
  const anthropic = createAnthropic({
    fetch: ((url, options) => {
      if (options?.body) {
        try {
          // Parse existing body if it's a string
          const existingBody =
            typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

          const modifiedBody = {
            ...existingBody,
          };

          // Always cache system messages
          if (modifiedBody.system && Array.isArray(modifiedBody.system)) {
            modifiedBody.system = modifiedBody.system.map((systemMessage: any) => ({
              ...systemMessage,
              cache_control: { type: 'ephemeral' },
            }));
          }

          // Calculate tokens from conversation messages only (excluding system)
          let conversationTokens = 0;
          if (modifiedBody.messages && Array.isArray(modifiedBody.messages)) {
            for (const message of modifiedBody.messages) {
              conversationTokens += getTokensFromMessage(message);
            }
          }

          // Apply caching at 1k milestones (1k, 2k, 3k, 4k, etc.)
          const shouldCacheConversation = conversationTokens >= 1000 && Math.floor(conversationTokens / 1000) >= 1;

          if (shouldCacheConversation && modifiedBody.messages && Array.isArray(modifiedBody.messages) && modifiedBody.messages.length > 0) {
            // Apply cache to the last message in conversation
            const lastMessageIndex = modifiedBody.messages.length - 1;
            modifiedBody.messages[lastMessageIndex] = {
              ...modifiedBody.messages[lastMessageIndex],
              cache_control: { type: 'ephemeral' },
            };
          }

          // Return modified options
          return fetch(url, {
            ...options,
            body: JSON.stringify(modifiedBody),
          });
        } catch (error) {
          // If body parsing fails, fall back to original request
          console.warn('Failed to parse request body:', error);
          return fetch(url, options);
        }
      }

      return fetch(url, options);
    }) as typeof fetch,
  });

  // Wrap the model with Braintrust tracing and return it
  return wrapAISDKModel(anthropic(modelId));
};
