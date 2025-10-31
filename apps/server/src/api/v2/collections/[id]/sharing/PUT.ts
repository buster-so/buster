import { checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import {
  bulkCreateAssetPermissions,
  findUsersByEmails,
  getCollectionById,
  getUserOrganizationId,
  updateCollection,
} from '@buster/database/queries';
import type { BusterCollection } from '@buster/server-shared/collections';
import { type ShareUpdateRequest, ShareUpdateRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getCollectionHandler } from '../GET';

export async function updateCollectionShareHandler(
  collectionId: string,
  request: ShareUpdateRequest,
  user: User & { organizationId: string }
) {
  // Check if collection exists
  const collection = await getCollectionById({ collectionId });
  if (!collection) {
    throw new HTTPException(404, { message: 'Collection not found' });
  }

  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: collectionId,
    assetType: 'collection',
    requiredRole: 'full_access',
    workspaceSharing: collection.workspaceSharing,
    organizationId: collection.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to update sharing for this collection',
    });
  }

  const { workspace_sharing, users } = request;

  // Handle user permissions if provided
  if (users && users.length > 0) {
    const emails = users.map((u) => u.email);

    const userMap = await findUsersByEmails(emails);

    const permissions = [];

    for (const userPermission of users) {
      const targetUser = userMap.get(userPermission.email);

      if (!targetUser) {
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
        assetId: collectionId,
        assetType: 'collection' as const,
        role: mappedRole,
        createdBy: user.id,
      });
    }

    // Create/update permissions in bulk
    if (permissions.length > 0) {
      await bulkCreateAssetPermissions({ permissions });
    }
  }

  // Update collection sharing settings
  await updateCollection({
    collectionId,
    userId: user.id,
    workspace_sharing,
  });

  const updatedCollection: BusterCollection = await getCollectionHandler(collectionId, user);

  return updatedCollection;
}

const app = new Hono().put('/', zValidator('json', ShareUpdateRequestSchema), async (c) => {
  const collectionId = c.req.param('id');
  const request = c.req.valid('json');
  const user = c.get('busterUser');

  if (!collectionId) {
    throw new HTTPException(404, { message: 'Collection not found' });
  }

  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, { message: 'User is not associated with an organization' });
  }

  const updatedCollection: BusterCollection = await updateCollectionShareHandler(
    collectionId,
    request,
    {
      ...user,
      organizationId: userOrg.organizationId,
    }
  );

  return c.json(updatedCollection);
});

export default app;
