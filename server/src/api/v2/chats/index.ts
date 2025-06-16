import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import {
  ChatCreateRequestSchema,
  type ChatCreateResponse,
  ChatCreateResponseSchema,
} from '../../../types/chat-types/chat.types';
import '../../../types/hono.types'; //I added this to fix intermitent type errors. Could probably be removed.
import { HTTPException } from 'hono/http-exception';
import { ChatError } from '../../../types';
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
        return c.json(e.toResponse(), e.statusCode);
      }

      throw new HTTPException(500, {
        message: 'Failed to create chat',
      });
    }
  });

export default app;
