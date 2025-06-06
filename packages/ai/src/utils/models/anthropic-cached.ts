import { createAnthropic } from '@ai-sdk/anthropic';
import { wrapAISDKModel } from 'braintrust';

export const anthropicCachedModel = (modelId: string) => {
  const anthropic = createAnthropic({
    fetch: ((url, options) => {
      if (options?.body) {
        try {
          // Parse existing body if it's a string
          const existingBody =
            typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

          // Append cache_control to system messages
          const modifiedBody = {
            ...existingBody,
          };

          if (modifiedBody.system && Array.isArray(modifiedBody.system)) {
            modifiedBody.system = modifiedBody.system.map((systemMessage: any) => ({
              ...systemMessage,
              cache_control: { type: 'ephemeral' },
            }));
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
