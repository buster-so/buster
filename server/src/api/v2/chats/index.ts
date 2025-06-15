import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { ChatCreateRequestSchema, type ChatCreateResponse, ChatCreateResponseSchema } from '../../../types/chat.types';
import '../../../types/hono.types'; //I added this to fix intermitent type errors. Could probably be removed.
import { HTTPException } from 'hono/http-exception';
import { ChatError } from '../../../types/chat-errors.types';
import { errorResponse } from '../../../utils/response';
import { createChatHandler } from './handler';

const app = new Hono()
  // Apply authentication middleware
  .use('*', requireAuth)
  // POST /chats - Create a new chat
  .post('/', zValidator('json', ChatCreateRequestSchema), async (c) => {
    try {
      const request = c.req.valid('json');
      const user = c.get('supabaseUser');
      // Call the handler function with user context
      const response = await createChatHandler(request, user);
      // Validate response against schema
      const validatedResponse: ChatCreateResponse = ChatCreateResponseSchema.parse(response);
      return c.json(validatedResponse);
    } catch (error: unknown) {
      // Handle ChatError instances with proper status codes
      if (error instanceof ChatError) {
        throw new HTTPException(error.statusCode, {
          message: error.message
        });
      }

      console.error('Error creating chat:', error);
      throw new HTTPException(500, {
        message: 'Failed to create chat'
      });
    }
  });

export default app;
