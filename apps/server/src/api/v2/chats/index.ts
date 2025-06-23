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
    const request = c.req.valid('json');
    const user = c.get('busterUser');

    const response = await createChatHandler(request, user);

    const validatedResponse: ChatCreateResponse = ChatCreateResponseSchema.parse(response);
    return c.json(validatedResponse);
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
  )
  .onError((e, c) => {
    if (e instanceof ChatError) {
      // we need to use this syntax instead of HTTPException because hono bubbles up 500 errors
      return c.json(e.toResponse(), e.statusCode);
    }
    if (e instanceof HTTPException) {
      return e.getResponse();
    }

    throw new HTTPException(500, {
      message: 'Internal server error',
    });
  });

export default app;
