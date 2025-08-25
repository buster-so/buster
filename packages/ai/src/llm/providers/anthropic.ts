import { createAnthropic } from '@ai-sdk/anthropic';
import { AI_KEYS, getSecretSync } from '@buster/secrets';
import { wrapLanguageModel } from 'ai';
import { BraintrustMiddleware } from 'braintrust';

export const anthropicModel = (modelId: string) => {
  const anthropic = createAnthropic({
    apiKey: getSecretSync(AI_KEYS.ANTHROPIC_API_KEY),
    headers: {
      'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14,extended-cache-ttl-2025-04-11',
    },
    fetch: ((url, options) => {
      if (options?.body) {
        try {
          // Parse existing body if it's a string
          const existingBody =
            typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

          // Append disable_parallel_tool_use if tool_choice is present
          const modifiedBody = {
            ...existingBody,
          };

          if (modifiedBody.tool_choice) {
            modifiedBody.tool_choice = {
              ...modifiedBody.tool_choice,
              disable_parallel_tool_use: true,
            };
          }

          // Return modified options
          return fetch(url, {
            ...options,
            body: JSON.stringify(modifiedBody),
          });
        } catch (error) {
          console.error('Failed to parse request body:', error);
          // If body parsing fails, fall back to original request
          return fetch(url, options);
        }
      }

      // For requests without body, pass through unchanged
      return fetch(url, options);
    }) as typeof fetch,
  });

  // Wrap the model with Braintrust middleware
  return wrapLanguageModel({
    model: anthropic(modelId),
    middleware: BraintrustMiddleware({ debug: true }),
  });
};
