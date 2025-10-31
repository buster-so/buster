import { checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import { getCollectionById, listAssetPermissions } from '@buster/database/queries';
import { GetIndividualCollectionRequestParamsSchema } from '@buster/server-shared';
import type { ShareGetResponse } from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export async function getCollectionSharingHandler(
  collectionId: string,
  user: User
): Promise<ShareGetResponse> {
  // Check if collection exists
  const collection = await getCollectionById({ collectionId });
  if (!collection) {
    throw new HTTPException(404, { message: 'Collection not found' });
  }

  // Check if user has permission to view the collection
  const permissionCheck = await checkPermission({
    userId: user.id,
    assetId: collectionId,
    assetType: 'collection',
    requiredRole: 'can_view',
    workspaceSharing: collection.workspaceSharing,
    organizationId: collection.organizationId,
  });

  if (!permissionCheck.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to view this collection',
    });
  }

  // Get all permissions for the collection
  const permissions = await listAssetPermissions({
    assetId: collectionId,
    assetType: 'collection',
  });

  return {
    permissions,
  };
}

const app = new Hono().get(
  '/',
  zValidator('param', GetIndividualCollectionRequestParamsSchema),
  async (c) => {
    const user = c.get('busterUser');
    const collectionId = c.req.valid('param').id;

    const result = await getCollectionSharingHandler(collectionId, user);

    return c.json(result);
  }
);

export default app;
