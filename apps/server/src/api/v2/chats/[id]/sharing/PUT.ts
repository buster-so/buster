import { checkPermission } from '@buster/access-controls';
import {
  bulkCreateAssetPermissions,
  findUsersByEmails,
  getChatById,
  getUserOrganizationId,
  updateChatSharing,
} from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { GetChatResponse } from '@buster/server-shared/chats';
import { type ShareUpdateRequest, ShareUpdateRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getChatHandler } from '../GET';

export async function updateChatShareHandler(
  chatId: string,
  request: ShareUpdateRequest,
  user: User & { organizationId: string }
) {
  // Check if chat exists
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
      message: 'You do not have permission to update sharing for this chat',
    });
  }

  const { publicly_accessible, public_expiry_date, workspace_sharing, users } = request;

  // Handle user permissions if provided
  if (users && users.length > 0) {
    // Extract emails from the user permissions
    const emails = users.map((u) => u.email);

    // Find users by emails
    const userMap = await findUsersByEmails(emails);

    const permissions = [];

    for (const userPermission of users) {
      const targetUser = userMap.get(userPermission.email);

      if (!targetUser) {
        // Skip users that don't exist - you may want to collect these and return as warnings
        continue;
      }

      // Map ShareRole to AssetPermissionRole
      const roleMapping = {
        owner: 'owner',
        full_access: 'full_access',
        can_edit: 'can_edit',
        can_filter: 'can_filter',
        can_view: 'can_view',
        viewer: 'can_view', // Map viewer to can_view
      } as const;

      const mappedRole = roleMapping[userPermission.role];
      if (!mappedRole) {
        throw new HTTPException(400, {
          message: `Invalid role: ${userPermission.role} for user ${userPermission.email}`,
        });
      }

      permissions.push({
        identityId: targetUser.id,
        identityType: 'user' as const,
        assetId: chatId,
        assetType: 'chat' as const,
        role: mappedRole,
        createdBy: user.id,
      });
    }

    // Create/update permissions in bulk
    if (permissions.length > 0) {
      await bulkCreateAssetPermissions({ permissions });
    }
  }

  // Update chat sharing settings - only pass defined values
  const updateOptions: Parameters<typeof updateChatSharing>[2] = {};
  if (publicly_accessible !== undefined) {
    updateOptions.publicly_accessible = publicly_accessible;
  }
  if (public_expiry_date !== undefined) {
    updateOptions.public_expiry_date = public_expiry_date;
  }
  if (workspace_sharing !== undefined) {
    updateOptions.workspace_sharing = workspace_sharing;
  }
  await updateChatSharing(chatId, user.id, updateOptions);

  const updatedChat: GetChatResponse = await getChatHandler({
    chatId,
    user,
  });

  return updatedChat;
}

const app = new Hono().put('/', zValidator('json', ShareUpdateRequestSchema), async (c) => {
  const chatId = c.req.param('id');
  const request = c.req.valid('json');
  const user = c.get('busterUser');

  if (!chatId) {
    throw new HTTPException(404, { message: 'Chat not found' });
  }

  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, { message: 'User is not associated with an organization' });
  }

  const updatedChat: GetChatResponse = await updateChatShareHandler(chatId, request, {
    ...user,
    organizationId: userOrg.organizationId,
  });

  return c.json(updatedChat);
});

export default app;
