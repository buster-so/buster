import { ChatError } from '@/types/chat-errors.types';
import { ChatCreateRequestSchema, ChatCreateResponseSchema } from '@/types/chat.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { errorResponse } from '../../../utils/response';
import { createChatHandler } from './handler';

const app = new Hono();

// Apply authentication middleware
app
  .use('*', requireAuth)
  // POST /chats - Create a new chat
  .post('/', zValidator('json', ChatCreateRequestSchema), async (c) => {
    try {
      const request = c.req.valid('json');
      const user = c.get('supabaseUser');

      // Convert REST request to handler request
      const handlerRequest = request;

      // Call the handler function with user context
      const response = await createChatHandler(handlerRequest, user);

      // Validate response against schema
      const validatedResponse = ChatCreateResponseSchema.parse(response);

      return c.json(validatedResponse);
    } catch (error) {
      // Handle ChatError instances with proper status codes
      if (error instanceof ChatError) {
        return errorResponse(c, error.message, error.statusCode);
      }

      console.error('Error creating chat:', error);
      return errorResponse(c, 'Failed to create chat', 500);
    }
  });

export default app;
