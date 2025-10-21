import { checkPermission } from '@buster/access-controls';
import { getChatWithDetails, updateMessageFields } from '@buster/database/queries';
import {
  UpdateMessageRequestBodySchema,
  type UpdateMessageResponse,
} from '@buster/server-shared/message';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { createApiKeyAuthMiddleware } from '../../../../../../../middleware/api-key-auth';

const app = new Hono();

// Params schema for chatId and messageId
const UpdateMessageParamsSchema = z.object({
  chatId: z.string().uuid().describe('Chat ID'),
  messageId: z.string().uuid().describe('Message ID to update'),
});

/**
 * PUT /api/v2/public/chats/:id/messages/:messageId
 *
 * Updates a message's isCompleted status, rawLlmMessages, and errorReason
 * Requires API key authentication via Bearer token
 * User must have can_edit permission on the chat
 *
 * Request body:
 * {
 *   "isCompleted": true,     // optional
 *   "rawLlmMessages": [],    // optional
 *   "errorReason": "error"   // optional
 * }
 */
app.put(
  '/',
  createApiKeyAuthMiddleware(),
  zValidator('param', UpdateMessageParamsSchema),
  zValidator('json', UpdateMessageRequestBodySchema),
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
      const { chatId, messageId } = c.req.valid('param');
      const updateData = c.req.valid('json');

      // Step 1: Get the chat details to check permissions
      const chatData = await getChatWithDetails({
        chatId,
        userId: apiKey.ownerId,
      });

      if (!chatData) {
        throw new HTTPException(404, {
          message: 'Chat not found',
        });
      }

      const { chat } = chatData;

      // Step 2: Check permissions - user must have can_edit permission on the chat
      const { hasAccess } = await checkPermission({
        userId: apiKey.ownerId,
        assetId: chat.id,
        assetType: 'chat',
        requiredRole: 'can_edit',
        organizationId: chat.organizationId,
        workspaceSharing: chat.workspaceSharing || 'none',
        publiclyAccessible: chat.publiclyAccessible || false,
        publicExpiryDate: chat.publicExpiryDate ?? undefined,
        publicPassword: chat.publicPassword ?? undefined,
      });

      if (!hasAccess) {
        throw new HTTPException(403, {
          message: 'You do not have permission to edit messages in this chat',
        });
      }

      // Step 3: Update the message
      const result = await updateMessageFields(messageId, {
        ...(updateData.isCompleted !== undefined && { isCompleted: updateData.isCompleted }),
        ...(updateData.rawLlmMessages !== undefined && {
          rawLlmMessages: updateData.rawLlmMessages,
        }),
        ...(updateData.errorReason !== undefined && { errorReason: updateData.errorReason }),
      });

      if (!result.success) {
        throw new HTTPException(500, {
          message: 'Failed to update message',
        });
      }

      // Return success response
      const response: UpdateMessageResponse = {
        success: true,
        messageId,
      };

      return c.json(response);
    } catch (error) {
      // Re-throw HTTPException errors
      if (error instanceof HTTPException) {
        throw error;
      }

      // Handle unexpected errors
      console.error('Error updating message:', error);
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

export default app;
