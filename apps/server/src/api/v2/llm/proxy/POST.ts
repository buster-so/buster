import { gateway } from '@buster/ai/llm/providers/gateway';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { z } from 'zod';
import { createApiKeyAuthMiddleware } from '../../../../middleware/api-key-auth';

const ProxyRequestSchema = z.object({
  model: z.string().describe('Model ID to use'),
  options: z.any().describe('LanguageModelV2CallOptions from AI SDK'),
});

export const POST = new Hono().post(
  '/',
  createApiKeyAuthMiddleware(),
  zValidator('json', ProxyRequestSchema),
  async (c) => {
    try {
      const { model, options } = c.req.valid('json');

      console.info('[PROXY] Request received', { model });

      // Use raw gateway without Braintrust middleware to avoid double logging
      // Logging happens at the CLI level (proxy model) instead
      const modelInstance = gateway(model);

      // Call the model's doStream method directly (this is a model-level operation)
      const result = await modelInstance.doStream(options);

      // Stream the LanguageModelV2StreamPart objects
      return stream(c, async (stream) => {
        try {
          const reader = result.stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await stream.write(`${JSON.stringify(value)}\n`);
          }
        } catch (streamError) {
          console.error('[PROXY] Stream error:', streamError);
          throw streamError;
        }
      });
    } catch (error) {
      console.error('[PROXY] Endpoint error:', error);
      return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  }
);
