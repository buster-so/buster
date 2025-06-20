import {
  ChatCreateRequestSchema,
  type ChatCreateResponse,
  ChatCreateResponseSchema,
  ChatError,
} from '@buster/server-shared/chats';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types'; //I added this to fix intermitent type errors. Could probably be removed.
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { createChatHandler } from './handler';

const app = new Hono()
  // Apply authentication middleware
  .use('*', requireAuth)
  // POST /chats - Create a new chat
  .post('/', zValidator('json', ChatCreateRequestSchema), async (c) => {
    try {
      const request = c.req.valid('json');
      const user = c.get('busterUser');

      // Call the handler function with user context
      const response = await createChatHandler(request, user);
      // Validate response against schema
      const validatedResponse: ChatCreateResponse = ChatCreateResponseSchema.parse(response);
      return c.json(validatedResponse);
    } catch (e) {
      if (e instanceof ChatError) {
        // we need to use this syntax instead of HTTPException because hono bubbles up 500 errors
        //  return c.json(e.toResponse(), e.statusCode);
        throw new HTTPException(e.statusCode, {
          message: e.message,
        });
      }

      throw new HTTPException(500, {
        message: 'Failed to create chat',
      });
    }
  })
  .patch(
    '/:chat_id',
    zValidator(
      'json',
      z.object({
        stop: z.boolean(),
      })
    ),
    async (c) => {
      //TODO
      return c.json({
        message: `TODO: Stop this chat ${c.req.param('chat_id')}`,
      });
    }
  );

export default app;
