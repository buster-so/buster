import { PublicChatError, PublicChatRequestSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { createApiKeyAuthMiddleware } from '../../../../middleware/api-key-auth';
import { chatById } from './[id]';
import GET from './GET';
import { publicChatHandler } from './handler';

const app = new Hono();

// Mount GET route for listing chats
app.route('/', GET);

/**
 * POST /api/v2/public/chats
 *
 * Creates a new chat session with SSE streaming response
 * Requires API key authentication via Bearer token
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "prompt": "Your question here"
 * }
 *
 * Response: Server-Sent Events stream
 */
app.post(
  '/',
  createApiKeyAuthMiddleware(),
  zValidator('json', PublicChatRequestSchema),
  async (c) => {
    try {
      // Get the validated API key context
      const apiKey = c.get('apiKey');
      if (!apiKey) {
        return c.json(
          {
            error: 'Authentication required',
            code: 'INVALID_API_KEY',
          },
          401
        );
      }

      // Get the validated request body
      const request = c.req.valid('json');

      // Process the chat request and return the SSE stream
      // The handler now uses Hono's streamSSE internally
      return await publicChatHandler(c, request, apiKey);
    } catch (error) {
      // Handle errors that occur during handler execution
      console.error('Public chat endpoint error:', error);

      // Return SSE stream with error event using Hono's streamSSE
      return streamSSE(c, async (stream) => {
        const errorMessage =
          error instanceof PublicChatError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Internal server error';

        await stream.writeSSE({
          data: JSON.stringify({
            type: 'error',
            error: errorMessage,
          }),
          event: 'error',
        });
      });
    }
  }
);

// Mount chat by ID route (includes messages)
app.route('/:chatId', chatById);

export default app;
