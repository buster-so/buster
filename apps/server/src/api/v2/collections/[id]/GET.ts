import { checkPermission } from '@buster/access-controls';
import {
  getCollectionAssets,
  getCollectionById,
  getOrganizationMemberCount,
  getUsersWithAssetPermissions,
  type User,
} from '@buster/database/queries';
import {
  BusterCollection,
  GetIndividualCollectionRequestParamsSchema,
} from '@buster/server-shared/collections';
import { zValidator } from '@hono/zod-validator';
import { convertScreenshotUrl } from '@shared-helpers/screenshots';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().get(
  '/',
  zValidator('param', GetIndividualCollectionRequestParamsSchema),
  async (c) => {
    const { id: collectionId } = c.req.valid('param');
    const user = c.get('busterUser');

    try {
      const response: BusterCollection = await getCollectionHandler(collectionId,user);

      return c.json(response);
    } catch (error) {
      console.error('Error fetching collection:', error);
      
      if (error instanceof HTTPException) {
        throw error;
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch collection' });
    }
  }
);

export default app;

/**
 * Handler to retrieve a collection by ID
 * This is the TypeScript equivalent of the Rust get_collection_handler
 */
export async function getCollectionHandler(
  collectionId: string,
  user: User
): Promise<BusterCollection> {

  // Fetch collection details with assets
  const collection = await getCollectionById({ collectionId });

  if (!collection) {
    console.warn(`Collection not found: ${collectionId}`);
    throw new HTTPException(404, {
      message: 'Collection not found',
    });
  }

  // Check if user has permission to access this collection
  const { hasAccess, effectiveRole } = await checkPermission({
    userId: user.id,
    assetId: collectionId,
    assetType: 'collection',
    requiredRole: 'can_view',
    organizationId: collection.organizationId,
    workspaceSharing: collection.workspaceSharing || 'none',
  });

  if (!hasAccess || !effectiveRole) {
    console.warn(`Permission denied for user ${user.id} to collection ${collectionId}`);
    throw new HTTPException(403, {
      message: "You don't have permission to view this collection",
    });
  }

  // Get the extra collection info concurrently
  const [individualPermissions, workspaceMemberCount, collectionAssets] = await Promise.all([
    getUsersWithAssetPermissions({ assetId: collectionId, assetType: 'collection' }),
    getOrganizationMemberCount(collection.organizationId),
    getCollectionAssets(collectionId),
  ]);

  const collectionAssetsWithUrls = await Promise.all(collectionAssets.map(asset => convertScreenshotUrl(asset, collection.organizationId)));

  // Build the response following the BusterCollection schema
  const response: BusterCollection = {
    id: collection.id,
    name: collection.name,
    created_at: collection.createdAt,
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
    created_by: collection.createdBy,
    deleted_at: collection.deletedAt,
    permission: effectiveRole,
    updated_at: collection.updatedAt,
    updated_by: collection.updatedBy,
    individual_permissions: individualPermissions,
    publicly_accessible: false, // Collections don't support public access
    public_expiry_date: null,
    public_enabled_by: null,
    public_password: null,
    workspace_sharing: collection.workspaceSharing || null,
    workspace_member_count: workspaceMemberCount,
    added_to_library: true,
  };

  return response;
}

