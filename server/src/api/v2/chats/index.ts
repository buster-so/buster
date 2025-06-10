import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { 
  ChatCreateRequestSchema,
  ChatCreateResponseSchema,
  type ChatCreateRequest, 
  type ChatCreateHandlerRequest 
} from '../../../types/chat.types';
import { errorResponse } from '../../../utils/response';
import { createChatHandler } from './handler';

const app = new Hono();

/**
 * Convert REST request to handler request with backward compatibility logic
 */
function convertToHandlerRequest(request: ChatCreateRequest): ChatCreateHandlerRequest {
  // Handle backward compatibility - new fields take priority
  const asset_id = request.asset_id ?? request.metric_id ?? request.dashboard_id;
  
  let asset_type = request.asset_type;
  if (!asset_type) {
    if (request.metric_id) {
      asset_type = 'metric_file';
    } else if (request.dashboard_id) {
      asset_type = 'dashboard_file';
    }
  }
  
  return {
    prompt: request.prompt,
    chat_id: request.chat_id,
    message_id: request.message_id,
    asset_id,
    asset_type,
    metric_id: request.metric_id,
    dashboard_id: request.dashboard_id,
  };
}

/**
 * POST /chats - Create a new chat
 */
app.post('/', zValidator('json', ChatCreateRequestSchema), async (c) => {
  try {
    const request = c.req.valid('json');
    
    // Convert REST request to handler request
    const handlerRequest = convertToHandlerRequest(request);
    
    // Call the handler function
    const response = await createChatHandler(handlerRequest);
    
    // Validate response against schema
    const validatedResponse = ChatCreateResponseSchema.parse(response);
    
    return c.json(validatedResponse);
  } catch (error) {
    console.error('Error creating chat:', error);
    return errorResponse(c, 'Failed to create chat', 500);
  }
});

export default app;