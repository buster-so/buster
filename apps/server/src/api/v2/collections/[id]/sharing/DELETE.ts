import { checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import {
  findUsersByEmails,
  getCollectionById,
  removeAssetPermission,
} from '@buster/database/queries';
import type { ShareDeleteRequest, ShareDeleteResponse } from '@buster/server-shared/share';
import { ShareDeleteRequestSchema } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function deleteCollectionSharingHandler(
  collectionId: string,
  emails: ShareDeleteRequest,
  user: User
): Promise<ShareDeleteResponse> {
  // Get the collection to verify it exists and get owner info
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
      message: 'You do not have permission to delete sharing for this collection',
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
    if (targetUser.id === collection.createdBy) {
      continue;
    }

    // Remove the permission
    await removeAssetPermission({
      identityId: targetUser.id,
      identityType: 'user',
      assetId: collectionId,
      assetType: 'collection',
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
  const collectionId = c.req.param('id');
  const emails = c.req.valid('json');
  const user = c.get('busterUser');

  if (!collectionId) {
    throw new HTTPException(400, { message: 'Collection ID is required' });
  }

  const result = await deleteCollectionSharingHandler(collectionId, emails, user);

  return c.json(result);
});

export default app;
