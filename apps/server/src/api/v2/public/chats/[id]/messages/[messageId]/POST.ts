import { checkPermission } from '@buster/access-controls';
import type { ModelMessage } from '@buster/ai';
import { db } from '@buster/database/connection';
import {
  createAssetPermission,
  createMessage,
  getChatById,
  getMessagesForChatWithUserDetails,
  getUser,
  type User,
} from '@buster/database/queries';
import { chats, messages } from '@buster/database/schema';
import {
  CreateMessageRequestBodySchema,
  CreateMessageRequestParamsSchema,
  type CreateMessageResponse,
} from '@buster/server-shared/message';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createApiKeyAuthMiddleware } from '../../../../../../../middleware/api-key-auth';
import { buildChatWithMessages } from '../../../../../chats/services/chat-helpers';

const app = new Hono();

/**
 * POST /api/v2/public/chats/:id/messages/:messageId
 *
 * Creates a message using an upsert pattern:
 * - If chat exists: adds message to existing chat (requires can_edit permission)
 * - If chat doesn't exist: creates new chat and adds message (user becomes owner)
 *
 * Requires API key authentication via Bearer token
 *
 * Request body:
 * {
 *   "prompt": "User's message"  // required
 * }
 */
app.post(
  '/',
  createApiKeyAuthMiddleware(),
  zValidator('param', CreateMessageRequestParamsSchema),
  zValidator('json', CreateMessageRequestBodySchema),
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
      const { prompt } = c.req.valid('json');

      // Get the user
      const user = await getUser({ id: apiKey.ownerId });
      if (!user) {
        throw new HTTPException(401, {
          message: 'User not found',
        });
      }

      // Check if chat exists
      const existingChat = await getChatById(chatId);

      if (existingChat) {
        // Path 1: Chat exists - check permissions and add message
        const { hasAccess } = await checkPermission({
          userId: apiKey.ownerId,
          assetId: existingChat.id,
          assetType: 'chat',
          requiredRole: 'can_edit',
          organizationId: existingChat.organizationId,
          workspaceSharing: existingChat.workspaceSharing || 'none',
          publiclyAccessible: existingChat.publiclyAccessible || false,
          publicExpiryDate: existingChat.publicExpiryDate ?? undefined,
          publicPassword: existingChat.publicPassword ?? undefined,
        });

        if (!hasAccess) {
          throw new HTTPException(403, {
            message: 'You do not have permission to add messages to this chat',
          });
        }

        // Create the message
        const newMessage = await createMessage({
          chatId,
          content: prompt,
          userId: user.id,
          messageId,
        });

        // Fetch all messages for the chat
        const allMessages = await getMessagesForChatWithUserDetails(chatId);

        // Build the response
        const chatWithMessages = await buildChatWithMessages(
          existingChat,
          allMessages,
          user,
          'can_edit',
          false
        );

        const response: CreateMessageResponse = {
          success: true,
          chatId,
          messageId: newMessage.id,
          chat: chatWithMessages,
        };

        return c.json(response);
      }

      // Path 2: Chat doesn't exist - create chat and message in transaction
      const result = await db.transaction(async (tx) => {
        // Create chat
        const [newChat] = await tx
          .insert(chats)
          .values({
            id: chatId,
            title: prompt.substring(0, 255),
            organizationId: apiKey.organizationId,
            createdBy: user.id,
            updatedBy: user.id,
            publiclyAccessible: false,
          })
          .returning();

        if (!newChat) {
          throw new Error('Failed to create chat');
        }

        // Create owner permission for the user
        await createAssetPermission({
          identityId: user.id,
          identityType: 'user',
          assetId: newChat.id,
          assetType: 'chat',
          role: 'owner',
          createdBy: user.id,
        });

        // Create the message
        const [newMessage] = await tx
          .insert(messages)
          .values({
            id: messageId,
            chatId: newChat.id,
            createdBy: user.id,
            requestMessage: prompt,
            title: prompt.substring(0, 255),
            isCompleted: false,
            responseMessages: [],
            reasoning: [],
            rawLlmMessages: [
              {
                role: 'user',
                content: prompt,
              } as ModelMessage,
            ],
            metadata: {},
          })
          .returning();

        if (!newMessage) {
          throw new Error('Failed to create message');
        }

        return { chat: newChat, message: newMessage };
      });

      // Build the response with the newly created chat and message
      const chatWithMessages = await buildChatWithMessages(
        result.chat,
        [{ message: result.message, user }],
        user,
        'owner',
        false
      );

      const response: CreateMessageResponse = {
        success: true,
        chatId: result.chat.id,
        messageId: result.message.id,
        chat: chatWithMessages,
      };

      return c.json(response);
    } catch (error) {
      // Re-throw HTTPException errors
      if (error instanceof HTTPException) {
        throw error;
      }

      // Handle unexpected errors
      console.error('Error creating message:', error);
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

export default app;
