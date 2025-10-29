import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { assetPermissions, collections, collectionsToAssets } from '../../schema';
import type { AssetType, IdentityType } from '../../schema-types';

export interface AssociatedCollection {
  id: string;
  name: string;
}

/**
 * Get all collections associated with a chat that the user has permission to view
 */
export async function getCollectionsAssociatedWithChat(
  chatId: string,
  userId: string
): Promise<AssociatedCollection[]> {
  const collectionResults = await db
    .select({
      id: collections.id,
      name: collections.name,
    })
    .from(collectionsToAssets)
    .innerJoin(collections, eq(collectionsToAssets.collectionId, collections.id))
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, collections.id),
        eq(assetPermissions.assetType, 'collection' as AssetType),
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user' as IdentityType),
        isNull(assetPermissions.deletedAt)
      )
    )
    .where(
      and(
        eq(collectionsToAssets.assetId, chatId),
        eq(collectionsToAssets.assetType, 'chat' as AssetType),
        isNull(collections.deletedAt),
        isNull(collectionsToAssets.deletedAt)
      )
    );

  return collectionResults.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}
