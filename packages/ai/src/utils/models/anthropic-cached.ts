import { createAnthropic } from '@ai-sdk/anthropic';
import { wrapAISDKModel } from 'braintrust';
import https from 'node:https';
import http from 'node:http';

// Create shared agents with connection pooling for better performance
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000, // Send keep-alive packets every 30 seconds
  maxSockets: 10, // Maximum concurrent connections
  timeout: 120000, // 120 second timeout
});

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 10,
  timeout: 60000,
});

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

          // Return modified options with anthropic-beta header and agent
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
            },
            body: JSON.stringify(modifiedBody),
            // @ts-ignore - agent might not be in fetch type definition
            agent: url.startsWith('https') ? httpsAgent : httpAgent,
          });
        } catch (error) {
          console.error('Failed to parse request body:', error);
          // If body parsing fails, fall back to original request with header and agent
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
            },
            // @ts-ignore - agent might not be in fetch type definition
            agent: url.startsWith('https') ? httpsAgent : httpAgent,
          });
        }
      }

      // For requests without body, still add the header and agent
      return fetch(url, {
        ...(options || {}),
        headers: {
          ...(options?.headers || {}),
          'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
        },
        // @ts-ignore - agent might not be in fetch type definition
        agent: url.startsWith('https') ? httpsAgent : httpAgent,
      });
    }) as typeof fetch,
  });

  // Wrap the model with Braintrust tracing and return it
  return wrapAISDKModel(anthropic(modelId));
};
