import { createGateway } from '@ai-sdk/gateway';
import { wrapLanguageModel } from 'ai';
import { BraintrustMiddleware } from 'braintrust';

export const DEFAULT_ANTHROPIC_OPTIONS = {
  gateway: {
    order: ['bedrock', 'anthropic', 'vertex'],
  },
  headers: {},
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

export const DEFAULT_OPENAI_OPTIONS = {
  gateway: {
    order: ['openai'],
    openai: {
      parallelToolCalls: false,
      reasoningEffort: 'minimal',
      verbosity: 'low',
    },
  },
};

// Create gateway instance with custom fetch for Anthropic headers
const gateway = createGateway({
  ...(process.env.AI_GATEWAY_API_KEY && { apiKey: process.env.AI_GATEWAY_API_KEY }),
  // Custom fetch to inject Anthropic beta headers when needed
  fetch: ((url, options) => {
    // Check if this is an Anthropic request
    if (typeof url === 'string' && url.includes('anthropic')) {
      // Parse and modify the request body to add disable_parallel_tool_use
      if (options?.body) {
        try {
          const existingBody =
            typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

          const modifiedBody = { ...existingBody };
          if (modifiedBody.tool_choice) {
            modifiedBody.tool_choice = {
              ...modifiedBody.tool_choice,
              disable_parallel_tool_use: true,
            };
          }

          // Add Anthropic beta headers
          const headers = {
            ...options.headers,
            'anthropic-beta':
              'fine-grained-tool-streaming-2025-05-14,extended-cache-ttl-2025-04-11',
          };

          return fetch(url, {
            ...options,
            headers,
            body: JSON.stringify(modifiedBody),
          });
        } catch (error) {
          console.error('Failed to parse request body:', error);
          // If parsing fails, still add headers but don't modify body
          const headers = {
            ...options.headers,
            'anthropic-beta':
              'fine-grained-tool-streaming-2025-05-14,extended-cache-ttl-2025-04-11',
          };
          return fetch(url, { ...options, headers });
        }
      }

      // For requests without body, just add headers
      const headers = {
        ...(options?.headers || {}),
        'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14,extended-cache-ttl-2025-04-11',
      };
      return fetch(url, { ...options, headers });
    }

    // For non-Anthropic requests, pass through unchanged
    return fetch(url, options);
  }) as typeof fetch,
});

// Export a function that creates wrapped models with Braintrust middleware
export const gatewayModel = (modelId: string) => {
  return wrapLanguageModel({
    model: gateway(modelId),
    middleware: BraintrustMiddleware({ debug: true }),
  });
};
