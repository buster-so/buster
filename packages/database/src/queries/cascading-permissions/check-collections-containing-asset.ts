import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { collections, collectionsToAssets } from '../../schema';
import type { AssetType } from '../../schema-types';

export async function checkCollectionsContainingAsset(
  assetId: string,
  assetType: 'metric' | 'dashboard' | 'chat'
): Promise<{ id: string }[]> {
  // Map our asset type strings to the enum values expected by the database
  const assetTypeMap: Record<string, AssetType> = {
    metric: 'metric_file',
    dashboard: 'dashboard_file',
    chat: 'chat',
  };

  const dbAssetType = assetTypeMap[assetType];
  if (!dbAssetType) {
    throw new Error(`Invalid asset type: ${assetType}`);
  }

  const result = await db
    .select({
      id: collections.id,
    })
    .from(collectionsToAssets)
    .innerJoin(collections, eq(collections.id, collectionsToAssets.collectionId))
    .where(
      and(
        eq(collectionsToAssets.assetId, assetId),
        eq(collectionsToAssets.assetType, dbAssetType),
        isNull(collectionsToAssets.deletedAt),
        isNull(collections.deletedAt)
      )
    );

  return result;
}
