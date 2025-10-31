import { checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import {
  bulkCreateAssetPermissions,
  findUsersByEmails,
  getCollectionById,
} from '@buster/database/queries';
import {
  GetIndividualCollectionRequestParamsSchema,
  SharePostRequestSchema,
} from '@buster/server-shared';
import type { SharePostRequest, SharePostResponse } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function createCollectionSharingHandler(
  collectionId: string,
  shareRequests: SharePostRequest,
  user: User
): Promise<SharePostResponse> {
  // Get the collection to verify it exists
  const collection = await getCollectionById({ collectionId });
  if (!collection) {
    throw new HTTPException(404, { message: 'Collection not found' });
  }

  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: collectionId,
    assetType: 'collection',
    requiredRole: 'can_edit',
    workspaceSharing: collection.workspaceSharing,
    organizationId: collection.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to edit this collection',
    });
  }

  // Extract emails from the share requests
  const emails = shareRequests.map((req) => req.email);

  // Find users by emails
  const userMap = await findUsersByEmails(emails);

  const permissions = [];
  const sharedEmails = [];
  const notFoundEmails = [];

  for (const shareRequest of shareRequests) {
    const targetUser = userMap.get(shareRequest.email);

    if (!targetUser) {
      notFoundEmails.push(shareRequest.email);
      continue;
    }

    sharedEmails.push(shareRequest.email);

    // Map ShareRole to AssetPermissionRole
    const roleMapping = {
      owner: 'owner',
      full_access: 'full_access',
      can_edit: 'can_edit',
      can_filter: 'can_filter',
      can_view: 'can_view',
      viewer: 'can_view', // Map viewer to can_view
    } as const;

    const mappedRole = roleMapping[shareRequest.role];
    if (!mappedRole) {
      throw new HTTPException(400, {
        message: `Invalid role: ${shareRequest.role} for user ${shareRequest.email}`,
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

  // Create permissions in bulk
  if (permissions.length > 0) {
    await bulkCreateAssetPermissions({ permissions });
  }

  return {
    success: true,
    shared: sharedEmails,
    notFound: notFoundEmails,
  };
}

const app = new Hono().post(
  '/',
  zValidator('param', GetIndividualCollectionRequestParamsSchema),
  zValidator('json', SharePostRequestSchema),
  async (c) => {
    const collectionId = c.req.param('id');
    const shareRequests = c.req.valid('json');
    const user = c.get('busterUser');

    if (!collectionId) {
      throw new HTTPException(400, { message: 'Collection ID is required' });
    }

    const result = await createCollectionSharingHandler(collectionId, shareRequests, user);

    return c.json(result);
  }
);

export default app;
