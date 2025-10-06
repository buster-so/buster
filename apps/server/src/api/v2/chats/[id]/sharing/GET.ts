import { checkPermission } from '@buster/access-controls';
import { checkAssetPermission, getChatById, listAssetPermissions } from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { ShareGetResponse } from '@buster/server-shared/reports';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function getChatSharingHandler(chatId: string, user: User): Promise<ShareGetResponse> {
  // Check if chat exists
  const chat = await getChatById(chatId);
  if (!chat) {
    throw new HTTPException(404, { message: 'Chat not found' });
  }

  // Check if user has permission to view the chat
  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: chatId,
    assetType: 'chat',
    requiredRole: 'can_view',
    workspaceSharing: chat.workspaceSharing,
    organizationId: chat.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this chat',
    });
  }

  // Get all permissions for the chat
  const permissions = await listAssetPermissions({
    assetId: chatId,
    assetType: 'chat',
  });

  return {
    permissions,
  };
}

const app = new Hono().get('/', async (c) => {
  const chatId = c.req.param('id');
  const user = c.get('busterUser');

  if (!chatId) {
    throw new HTTPException(400, { message: 'Chat ID is required' });
  }

  const result = await getChatSharingHandler(chatId, user);

  return c.json(result);
});

export default app;
