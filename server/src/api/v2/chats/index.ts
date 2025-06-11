import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../../middleware/auth';
import { 
  ChatCreateRequestSchema,
  ChatCreateResponseSchema,
  type ChatCreateRequest, 
  type ChatCreateHandlerRequest 
} from '../../../types/chat.types';
import { ChatError } from '../../../types/chat-errors.types';
import { errorResponse } from '../../../utils/response';
import { createChatHandler } from './handler';

const app = new Hono();

// Apply authentication middleware
app.use('*', requireAuth);

/**
 * Convert REST request to handler request
 */
function convertToHandlerRequest(request: ChatCreateRequest): ChatCreateHandlerRequest {
  return {
    prompt: request.prompt,
    chat_id: request.chat_id,
    message_id: request.message_id,
    asset_id: request.asset_id,
    asset_type: request.asset_type,
  };
}

/**
 * POST /chats - Create a new chat
 */
app.post('/', zValidator('json', ChatCreateRequestSchema), async (c) => {
  try {
    const request = c.req.valid('json');
    const user = c.get('supabaseUser');
    
    // Convert REST request to handler request
    const handlerRequest = convertToHandlerRequest(request);
    
    // Call the handler function with user context
    const response = await createChatHandler(handlerRequest, user);
    
    // Validate response against schema
    const validatedResponse = ChatCreateResponseSchema.parse(response);
    
    return c.json(validatedResponse);
  } catch (error) {
    // Handle ChatError instances with proper status codes
    if (error instanceof ChatError) {
      return errorResponse(c, error.message, error.statusCode as any);
    }
    
    console.error('Error creating chat:', error);
    return errorResponse(c, 'Failed to create chat', 500);
  }
});

export default app;