import { checkPermission } from '@buster/access-controls';
import { findUsersByEmails, getChatById, removeAssetPermission } from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { ShareDeleteRequest, ShareDeleteResponse } from '@buster/server-shared/share';
import { ShareDeleteRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function deleteChatSharingHandler(
  chatId: string,
  emails: ShareDeleteRequest,
  user: User
): Promise<ShareDeleteResponse> {
  // Get the chat to verify it exists and get owner info
  const chat = await getChatById(chatId);
  if (!chat) {
    throw new HTTPException(404, { message: 'Chat not found' });
  }

  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: chatId,
    assetType: 'chat',
    requiredRole: 'full_access',
    workspaceSharing: chat.workspaceSharing,
    organizationId: chat.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to delete sharing for this chat',
    });
  }

  // Find users by emails
  const userMap = await findUsersByEmails(emails);

  const removedEmails = [];
  const notFoundEmails = [];

  for (const email of emails) {
    const targetUser = userMap.get(email);

    if (!targetUser) {
      notFoundEmails.push(email);
      continue;
    }

    // Don't allow removing permissions from the owner
    if (targetUser.id === chat.createdBy) {
      continue; // Skip the owner
    }

    // Remove the permission
    await removeAssetPermission({
      identityId: targetUser.id,
      identityType: 'user',
      assetId: chatId,
      assetType: 'chat',
      updatedBy: user.id,
    });

    removedEmails.push(email);
  }

  return {
    success: true,
    removed: removedEmails,
    notFound: notFoundEmails,
  };
}

const app = new Hono().delete('/', zValidator('json', ShareDeleteRequestSchema), async (c) => {
  const chatId = c.req.param('id');
  const emails = c.req.valid('json');
  const user = c.get('busterUser');

  if (!chatId) {
    throw new HTTPException(400, { message: 'Chat ID is required' });
  }

  const result = await deleteChatSharingHandler(chatId, emails, user);

  return c.json(result);
});

export default app;
