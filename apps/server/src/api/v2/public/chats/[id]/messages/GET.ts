import { checkPermission } from '@buster/access-controls';
import type { ModelMessage } from '@buster/ai';
import {
  getChatById,
  getChatConversationHistory,
  getLatestMessageForChat,
} from '@buster/database/queries';
import {
  GetRawMessagesRequestParamsSchema,
  type GetRawMessagesResponse,
} from '@buster/server-shared/message';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createApiKeyAuthMiddleware } from '../../../../../../middleware/api-key-auth';

const app = new Hono();

/**
 * GET /api/v2/public/chats/:id/messages
 *
 * Fetches raw LLM messages for a chat to resume conversations
 * Returns the aggregated and cleaned conversation history (orphaned tool calls removed)
 *
 * Requires API key authentication via Bearer token
 * Requires can_view permission on the chat
 */
app.get(
  '/',
  createApiKeyAuthMiddleware(),
  zValidator('param', GetRawMessagesRequestParamsSchema),
  async (c) => {
    try {
      // Get the validated API key context
      const apiKey = c.get('apiKey');
      if (!apiKey) {
        throw new HTTPException(401, {
          message: 'Authentication required',
        });
      }

      // Get the validated request data
      const { chatId } = c.req.valid('param');

      // Check if chat exists
      const chat = await getChatById(chatId);
      if (!chat) {
        throw new HTTPException(404, {
          message: 'Chat not found',
        });
      }

      // Check permissions
      const { hasAccess } = await checkPermission({
        userId: apiKey.ownerId,
        assetId: chat.id,
        assetType: 'chat',
        requiredRole: 'can_view',
        organizationId: chat.organizationId,
        workspaceSharing: chat.workspaceSharing || 'none',
        publiclyAccessible: chat.publiclyAccessible || false,
        publicExpiryDate: chat.publicExpiryDate ?? undefined,
        publicPassword: chat.publicPassword ?? undefined,
      });

      if (!hasAccess) {
        throw new HTTPException(403, {
          message: 'You do not have permission to view this chat',
        });
      }

      // Get conversation history with orphaned tool calls cleaned up
      // Use the latest message to get all conversation history up to now
      const latestMessage = await getLatestMessageForChat(chatId);

      let rawLlmMessages: ModelMessage[] = [];
      if (latestMessage) {
        // Use getChatConversationHistory which handles:
        // 1. Deduplication of messages
        // 2. Conversion from CoreMessage to ModelMessage
        // 3. Removal of orphaned tool calls
        rawLlmMessages = await getChatConversationHistory({
          messageId: latestMessage.id,
        });
      }

      const response: GetRawMessagesResponse = {
        success: true,
        chatId: chat.id,
        rawLlmMessages,
      };

      return c.json(response);
    } catch (error) {
      // Re-throw HTTPException errors
      if (error instanceof HTTPException) {
        throw error;
      }

      // Handle unexpected errors
      console.error('Error fetching raw messages:', error);
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

export default app;
