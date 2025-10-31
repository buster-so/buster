import { checkPermission } from '@buster/access-controls';
import { addAssetsToCollection, getCollectionById, type User } from '@buster/database/queries';
import {
  type AddAndRemoveFromCollectionResponse,
  type AddOrRemoveAssetToCollectionRequestBody,
  AddOrRemoveAssetToCollectionRequestBodySchema,
  GetIndividualCollectionRequestParamsSchema,
} from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().post(
  '/',
  zValidator('param', GetIndividualCollectionRequestParamsSchema),
  zValidator('json', AddOrRemoveAssetToCollectionRequestBodySchema),
  async (c) => {
    const { id: collectionId } = c.req.valid('param');
    const body = c.req.valid('json');
    const user = c.get('busterUser');

    try {
      const response: AddAndRemoveFromCollectionResponse = await addAssetsToCollectionHandler(
        collectionId,
        body.assets,
        user
      );
      return c.json(response);
    } catch (error) {
      console.error('Error adding assets to collection:', error);

      if (error instanceof HTTPException) {
        throw error;
      }

      throw new HTTPException(500, { message: 'Failed to add assets to collection' });
    }
  }
);

export default app;

/**
 * Handler to add assets to a collection
 */
async function addAssetsToCollectionHandler(
  collectionId: string,
  assets: AddOrRemoveAssetToCollectionRequestBody['assets'],
  user: User
): Promise<AddAndRemoveFromCollectionResponse> {
  // First, verify the collection exists
  const collection = await getCollectionById({ collectionId });

  if (!collection) {
    throw new HTTPException(404, {
      message: 'Collection not found',
    });
  }

  // Check if user has permission to edit this collection (CanEdit, FullAccess, or Owner)
  const { hasAccess } = await checkPermission({
    userId: user.id,
    assetId: collectionId,
    assetType: 'collection',
    requiredRole: 'can_edit',
    organizationId: collection.organizationId,
    workspaceSharing: collection.workspaceSharing || 'none',
  });

  if (!hasAccess) {
    throw new HTTPException(403, {
      message: "You don't have permission to edit this collection",
    });
  }

  // Add assets to collection
  const result = await addAssetsToCollection({
    collectionId,
    assets,
    userId: user.id,
  });

  return {
    message: 'Assets processed',
    added_count: result.added_count,
    removed_count: 0,
    failed_count: result.failed_count,
    failed_assets: result.failed_assets,
  };
}
