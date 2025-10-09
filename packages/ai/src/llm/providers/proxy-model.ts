import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2StreamPart,
} from '@ai-sdk/provider';
import { z } from 'zod';

const ProxyModelConfigSchema = z.object({
  baseURL: z.string().describe('Base URL of the proxy server'),
  modelId: z.string().describe('Model ID to proxy requests to'),
  apiKey: z.string().min(1).describe('API key for authentication'),
});

type ProxyModelConfig = z.infer<typeof ProxyModelConfigSchema>;

/**
 * Creates a LanguageModelV2-compatible proxy that routes requests through a server endpoint.
 *
 * The server endpoint is expected to:
 * 1. Accept POST requests with { model: string, options: LanguageModelV2CallOptions }
 * 2. Return a stream of LanguageModelV2StreamPart objects as newline-delimited JSON
 *
 * This allows CLI agents to proxy through the server's gateway logic while maintaining
 * full compatibility with the AI SDK's streaming and tool calling features.
 */
export function createProxyModel(config: ProxyModelConfig): LanguageModelV2 {
  const validated = ProxyModelConfigSchema.parse(config);

  return {
    specificationVersion: 'v2',
    modelId: validated.modelId,
    provider: 'proxy',
    supportedUrls: {},

    async doGenerate(options: LanguageModelV2CallOptions) {
      const response = await fetch(`${validated.baseURL}/api/v2/llm/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validated.apiKey}`,
        },
        body: JSON.stringify({
          model: validated.modelId,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
      }

      // Collect all stream parts
      const parts: LanguageModelV2StreamPart[] = [];
      if (!response.body) {
        throw new Error('Response body is null');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            parts.push(JSON.parse(line));
          }
        }
      }

      // Extract final result from stream parts
      const textDeltas = parts.filter((p) => p.type === 'text-delta');
      const toolCallParts = parts.filter(
        (p) =>
          p.type === 'tool-input-start' ||
          p.type === 'tool-input-delta' ||
          p.type === 'tool-input-end'
      );
      const finishPart = parts.find((p) => p.type === 'finish');

      if (!finishPart || finishPart.type !== 'finish') {
        throw new Error('Stream did not include finish part');
      }

      const content = [];

      // Add text content if present
      if (textDeltas.length > 0) {
        content.push({
          type: 'text' as const,
          text: textDeltas.map((p) => (p.type === 'text-delta' ? p.delta : '')).join(''),
        });
      }

      // Add tool calls if present
      if (toolCallParts.length > 0) {
        // Group tool call inputs by ID
        const toolCallsById = new Map<
          string,
          { toolCallId: string; toolName: string; input: string }
        >();

        for (const part of toolCallParts) {
          if (part.type === 'tool-input-start') {
            toolCallsById.set(part.id, {
              toolCallId: part.id,
              toolName: part.toolName,
              input: '',
            });
          } else if (part.type === 'tool-input-delta') {
            const call = toolCallsById.get(part.id);
            if (call) {
              call.input += part.delta;
            }
          }
        }

        // Add tool calls to content
        for (const call of toolCallsById.values()) {
          content.push({
            type: 'tool-call' as const,
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            input: call.input,
          });
        }
      }

      return {
        content,
        finishReason: finishPart.finishReason,
        usage: finishPart.usage,
        warnings: [],
        rawCall: { rawPrompt: '', rawSettings: {} },
      };
    },

    async doStream(options: LanguageModelV2CallOptions) {
      const response = await fetch(`${validated.baseURL}/api/v2/llm/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validated.apiKey}`,
        },
        body: JSON.stringify({
          model: validated.modelId,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
      }

      const stream = new ReadableStream<LanguageModelV2StreamPart>({
        async start(controller) {
          if (!response.body) {
            controller.error(new Error('Response body is null'));
            return;
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.trim()) {
                  const part = JSON.parse(line) as LanguageModelV2StreamPart;
                  controller.enqueue(part);
                }
              }
            }

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return {
        stream,
        rawCall: { rawPrompt: '', rawSettings: {} },
      };
    },
  };
}
