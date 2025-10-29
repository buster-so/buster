import { checkPermission } from '@buster/access-controls';
import { getChatById, type User, updateChat } from '@buster/database/queries';
import type { UpdateChatRequest, UpdateChatResponse } from '@buster/server-shared/chats';
import { UpdateChatParamsSchema, UpdateChatRequestSchema } from '@buster/server-shared/chats';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getChatHandler } from './GET';

/**
 * Handler to update a chat by ID
 * This is the TypeScript equivalent of the Rust update_chat_handler
 */
export async function updateChatHandler(
  chatId: string,
  request: UpdateChatRequest,
  user: User
): Promise<UpdateChatResponse> {
  const { title } = request;

  // Fetch the chat to check if it exists
  const chat = await getChatById(chatId);

  if (!chat) {
    console.warn(`Chat not found: ${chatId}`);
    throw new HTTPException(404, {
      message: 'Chat not found',
    });
  }

  // Check if user has permission to update this chat
  const { hasAccess, effectiveRole } = await checkPermission({
    userId: user.id,
    assetId: chatId,
    assetType: 'chat',
    requiredRole: 'can_edit',
    organizationId: chat.organizationId,
    workspaceSharing: chat.workspaceSharing || 'none',
  });

  if (!hasAccess || !effectiveRole) {
    console.warn(`Permission denied for user ${user.id} to update chat ${chatId}`);
    throw new HTTPException(403, {
      message: "You don't have permission to update this chat",
    });
  }

  if (!title) {
    throw new HTTPException(400, {
      message: 'Title is required',
    });
  }

  // Update the chat title
  await updateChat(
    chatId,
    {
      title,
      updatedBy: user.id,
    },
    title ? 'user' : 'agent'
  );

  console.info(`Successfully updated chat ${chatId} with title: ${title}`);

  // Return the updated chat with messages using the GET handler
  return getChatHandler({
    chatId,
    user,
  });
}

const app = new Hono().put(
  '/',
  zValidator('param', UpdateChatParamsSchema),
  zValidator('json', UpdateChatRequestSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const request = c.req.valid('json');
    const user = c.get('busterUser');

    console.info(`Processing PUT request for chat with ID: ${id}, user_id: ${user.id}`);

    const response: UpdateChatResponse = await updateChatHandler(id, request, user);

    return c.json(response);
  }
);

export default app;
