import {
  CancelChatParamsSchema,
  ChatCreateRequestSchema,
  ChatError,
  type ChatWithMessages,
  ChatWithMessagesSchema,
} from '@buster/server-shared/chats';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import '../../../types/hono.types'; //I added this to fix intermitent type errors. Could probably be removed.
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import GET from './GET';
import chatById from './[id]';
import { cancelChatHandler } from './cancel-chat';
import { createChatHandler } from './handler';

const app = new Hono()
  // Apply authentication middleware
  .use('*', requireAuth)
  .route('/', GET)
  .route('/:id', chatById)
  // POST /chats - Create a new chat
  .post('/', zValidator('json', ChatCreateRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');

    const response: ChatWithMessages = await createChatHandler(request, user, c);

    const validatedResponse = ChatWithMessagesSchema.safeParse(response);

    if (validatedResponse.success) {
      return c.json(validatedResponse.data);
    }

    return c.json(
      { ...validatedResponse.error, response, validatedResponse: validatedResponse.data },
      400
    );
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
  // DELETE /chats/:chat_id/cancel - Cancel a chat and its running triggers
  .delete('/:chat_id/cancel', zValidator('param', CancelChatParamsSchema), async (c) => {
    const params = c.req.valid('param');
    const user = c.get('busterUser');

    await cancelChatHandler(params.chat_id, user);
    return c.json({ success: true, message: 'Chat cancelled successfully' });
  })
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
