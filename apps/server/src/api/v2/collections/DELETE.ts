import { checkPermission } from '@buster/access-controls';
import { deleteCollection, getCollectionById, type User } from '@buster/database/queries';
import {
  DeleteCollectionRequestBodySchema,
  type DeleteCollectionsResponse,
} from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().delete(
  '/',
  zValidator('json', DeleteCollectionRequestBodySchema),
  async (c) => {
    const { ids: collectionIds } = c.req.valid('json');
    const user = c.get('busterUser');

    try {
      const response: DeleteCollectionsResponse = await deleteCollectionsHandler(
        collectionIds,
        user
      );
      return c.json(response);
    } catch (error) {
      console.error('Error deleting collections:', error);

      if (error instanceof HTTPException) {
        throw error;
      }

      throw new HTTPException(500, { message: 'Failed to delete collections' });
    }
  }
);

export default app;

/**
 * Handler to delete multiple collections
 */
async function deleteCollectionsHandler(
  collectionIds: string[],
  user: User
): Promise<DeleteCollectionsResponse> {
  if (collectionIds.length === 0) {
    return { success_ids: [], failure_ids: [] };
  }

  const successfullyDeletedIds: string[] = [];
  const failureDeletedIds: string[] = [];

  // Check permissions for each collection and delete if authorized
  for (const collectionId of collectionIds) {
    try {
      // Get the collection to check if it exists
      const collection = await getCollectionById({ collectionId });

      if (!collection) {
        console.warn(`Collection not found: ${collectionId}`);
        failureDeletedIds.push(collectionId);
        continue;
      }

      // Check if user has permission to delete (FullAccess or Owner)
      const { hasAccess } = await checkPermission({
        userId: user.id,
        assetId: collectionId,
        assetType: 'collection',
        requiredRole: 'full_access',
        organizationId: collection.organizationId,
        workspaceSharing: collection.workspaceSharing || 'none',
      });

      if (!hasAccess) {
        console.warn(`Permission denied for user ${user.id} to delete collection ${collectionId}`);
        failureDeletedIds.push(collectionId);
        continue;
      }

      // Delete the collection (soft delete)
      const deletionResult = await deleteCollection(collectionId);

      if (deletionResult) {
        successfullyDeletedIds.push(collectionId);
      } else {
        failureDeletedIds.push(collectionId);
      }
    } catch (error) {
      console.error(`Error processing collection ${collectionId}:`, error);
      failureDeletedIds.push(collectionId);
    }
  }
  return { success_ids: successfullyDeletedIds, failure_ids: failureDeletedIds };
}
