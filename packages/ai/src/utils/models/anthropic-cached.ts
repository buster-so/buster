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
            modifiedBody.system = modifiedBody.system.map(
              (systemMessage: {
                text?: string;
                cache_control?: { type: string };
              }) => ({
                ...systemMessage,
                cache_control: { type: 'ephemeral' },
              })
            );
          }

          // Add disable_parallel_tool_use if tool_choice is present
          if (modifiedBody.tool_choice) {
            modifiedBody.tool_choice = {
              ...modifiedBody.tool_choice,
              disable_parallel_tool_use: true,
            };
          }

          // Return modified options with anthropic-beta header
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
            },
            body: JSON.stringify(modifiedBody),
          });
        } catch (error) {
          console.error('Failed to parse request body:', error);
          // If body parsing fails, fall back to original request with header
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
            },
          });
        }
      }

      // For requests without body, still add the header
      return fetch(url, {
        ...(options || {}),
        headers: {
          ...(options?.headers || {}),
          'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
        },
      });
    }) as typeof fetch,
  });

  // Wrap the model with Braintrust tracing and return it
  return wrapAISDKModel(anthropic(modelId));
};
