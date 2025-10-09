import { screenshots_task_keys } from '@buster-app/trigger/task-keys';
import type { TakeChatScreenshotTrigger } from '@buster-app/trigger/task-schemas';
import { checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import {
  getChatWithDetails,
  getMessagesForChatWithUserDetails,
  getUserOrganizationId,
} from '@buster/database/queries';
import {
  GetChatRequestParamsSchema,
  GetChatRequestQuerySchema,
  type GetChatResponse,
} from '@buster/server-shared/chats';
import { zValidator } from '@hono/zod-validator';
import { triggerScreenshotIfNeeded } from '@shared-helpers/screenshots';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { throwUnauthorizedError } from '../../../../shared-helpers/asset-public-access';
import { buildChatWithMessages } from '../services/chat-helpers';

interface GetChatHandlerParams {
  chatId: string;
  user: User;
  userSuppliedPassword?: string;
}

const app = new Hono().get(
  '/',
  zValidator('param', GetChatRequestParamsSchema),
  zValidator('query', GetChatRequestQuerySchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const { password } = c.req.valid('query');
    const user = c.get('busterUser');

    console.info(`Processing GET request for chat with ID: ${id}, user_id: ${user.id}`);

    const getChatHandlerParams: GetChatHandlerParams = {
      chatId: id,
      user,
    };

    if (password) {
      getChatHandlerParams.userSuppliedPassword = password;
    }

    const response: GetChatResponse = await getChatHandler(getChatHandlerParams);

    await triggerScreenshotIfNeeded<TakeChatScreenshotTrigger>({
      tag: `take-chat-screenshot-${id}`,
      key: screenshots_task_keys.take_chat_screenshot,
      context: c,
      payload: {
        chatId: id,
        isNewChatMessage: false,
        organizationId: (await getUserOrganizationId(user.id))?.organizationId || '',
        accessToken: c.get('accessToken'),
      },
      shouldTrigger: !response.screenshot_taken_at,
    });

    return c.json(response);
  }
);

export default app;

/**
 * Handler to retrieve a chat by ID with messages and permissions
 * This is the TypeScript equivalent of the Rust get_chat_handler
 */
export async function getChatHandler(params: GetChatHandlerParams): Promise<GetChatResponse> {
  const { chatId, user, userSuppliedPassword } = params;

  // Fetch chat with messages and related data
  const chatData = await getChatWithDetails({
    chatId,
    userId: user.id,
  });

  if (!chatData) {
    console.warn(`Chat not found: ${chatId}`);
    throw new HTTPException(404, {
      message: 'Chat not found',
    });
  }

  const { chat, user: creator } = chatData;

  // Check permissions using the access control system
  const { hasAccess, effectiveRole } = await checkPermission({
    userId: user.id,
    assetId: chatId,
    assetType: 'chat',
    requiredRole: 'can_view',
    organizationId: chat.organizationId,
    workspaceSharing: chat.workspaceSharing || 'none',
    publiclyAccessible: chat.publiclyAccessible || false,
    publicExpiryDate: chat.publicExpiryDate ?? undefined,
    publicPassword: chat.publicPassword ?? undefined,
    userSuppliedPassword,
  });

  if (!hasAccess || !effectiveRole) {
    throwUnauthorizedError({
      publiclyAccessible: chat.publiclyAccessible || false,
      publicExpiryDate: chat.publicExpiryDate ?? undefined,
    });
  }

  const messages = await getMessagesForChatWithUserDetails(chatId);

  const response: GetChatResponse = await buildChatWithMessages(
    chat,
    messages,
    creator,
    effectiveRole
  );

  return response;
}
