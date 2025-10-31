import { checkPermission } from '@buster/access-controls';
import {
  getCollectionAssets,
  getCollectionById,
  getOrganizationMemberCount,
  getUsersWithAssetPermissions,
  type User,
  updateCollection,
} from '@buster/database/queries';
import { type BusterCollection, UpdateCollectionRequestBodySchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { convertScreenshotUrl } from '@shared-helpers/screenshots';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const app = new Hono().put(
  '/',
  zValidator('param', ParamsSchema),
  zValidator('json', UpdateCollectionRequestBodySchema),
  async (c) => {
    const { id: collectionId } = c.req.valid('param');
    const body = c.req.valid('json');
    const user = c.get('busterUser');

    try {
      const response: BusterCollection = await updateCollectionHandler(collectionId, body, user);
      return c.json(response);
    } catch (error) {
      console.error('Error updating collection:', error);

      if (error instanceof HTTPException) {
        throw error;
      }

      throw new HTTPException(500, { message: 'Failed to update collection' });
    }
  }
);

export default app;

interface UpdateCollectionHandlerParams {
  name?: string | undefined;
  description?: string | undefined;
}

/**
 * Handler to update a collection
 */
async function updateCollectionHandler(
  collectionId: string,
  params: UpdateCollectionHandlerParams,
  user: User
): Promise<BusterCollection> {
  const { name, description } = params;

  // First, get the collection to check if it exists
  const collection = await getCollectionById({ collectionId });

  if (!collection) {
    throw new HTTPException(404, {
      message: 'Collection not found',
    });
  }

  // Check if user has permission to update this collection (CanEdit, FullAccess, or Owner)
  const { hasAccess, effectiveRole } = await checkPermission({
    userId: user.id,
    assetId: collectionId,
    assetType: 'collection',
    requiredRole: 'can_edit',
    organizationId: collection.organizationId,
    workspaceSharing: collection.workspaceSharing || 'none',
  });

  if (!hasAccess || !effectiveRole) {
    throw new HTTPException(403, {
      message: "You don't have permission to update this collection",
    });
  }

  const updatedCollection = await updateCollection({
    collectionId,
    name,
    description,
    userId: user.id,
  });

  if (!updatedCollection) {
    throw new HTTPException(404, {
      message: 'Collection not found after update',
    });
  }

  // Get the extra collection info concurrently
  const [individualPermissions, workspaceMemberCount, collectionAssets] = await Promise.all([
    getUsersWithAssetPermissions({ assetId: collectionId, assetType: 'collection' }),
    getOrganizationMemberCount(updatedCollection.organizationId),
    getCollectionAssets(collectionId),
  ]);

  const collectionAssetsWithUrls = await Promise.all(
    collectionAssets.map((asset) => convertScreenshotUrl(asset, updatedCollection.organizationId))
  );

  // Build the response
  const response: BusterCollection = {
    id: updatedCollection.id,
    name: updatedCollection.name,
    created_at: updatedCollection.createdAt,
    assets:
      collectionAssetsWithUrls.length > 0
        ? collectionAssetsWithUrls.map((asset) => ({
            ...asset,
            created_by: {
              email: asset.created_by.email,
              name: asset.created_by.name || '',
              avatar_url: null,
            },
          }))
        : null,
    created_by: updatedCollection.createdBy,
    deleted_at: updatedCollection.deletedAt,
    permission: effectiveRole,
    updated_at: updatedCollection.updatedAt,
    updated_by: updatedCollection.updatedBy,
    individual_permissions: individualPermissions,
    publicly_accessible: false,
    public_expiry_date: null,
    public_enabled_by: null,
    public_password: null,
    workspace_sharing: updatedCollection.workspaceSharing || null,
    workspace_member_count: workspaceMemberCount,
    added_to_library: true,
  };

  return response;
}
