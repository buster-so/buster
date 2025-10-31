import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { collectionsToAssets } from '../../schema';
import { AssetType, AssetTypeSchema } from '../../schema-types';

export const RemoveAssetFromCollectionInputSchema = z.object({
  collectionId: z.string().uuid(),
  assets: z.array(
    z.object({
      id: z.string().uuid(),
      type: AssetTypeSchema,
    })
  ),
  userId: z.string().uuid(),
});

export type RemoveAssetFromCollectionInput = z.infer<typeof RemoveAssetFromCollectionInputSchema>;

export interface RemoveAssetsResult {
  removed_count: number;
  failed_count: number;
  failed_assets: Array<{
    id: string;
    type: AssetType;
    error: string;
  }>;
}

/**
 * Remove multiple assets from a collection (soft delete)
 */
export async function removeAssetsFromCollection(
  input: RemoveAssetFromCollectionInput
): Promise<RemoveAssetsResult> {
  const validated = RemoveAssetFromCollectionInputSchema.parse(input);

  const result: RemoveAssetsResult = {
    removed_count: 0,
    failed_count: 0,
    failed_assets: [],
  };

  if (validated.assets.length === 0) {
    return result;
  }

  const now = new Date().toISOString();

  for (const asset of validated.assets) {
    try {
      // Check if asset exists in collection and is not already deleted
      const [existing] = await db
        .select()
        .from(collectionsToAssets)
        .where(
          and(
            eq(collectionsToAssets.collectionId, validated.collectionId),
            eq(collectionsToAssets.assetId, asset.id),
            eq(collectionsToAssets.assetType, asset.type),
            isNull(collectionsToAssets.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        // Asset not found in collection
        result.failed_count++;
        result.failed_assets.push({
          id: asset.id,
          type: asset.type,
          error: 'Asset not found in collection',
        });
        continue;
      }

      // Soft delete the asset from collection
      await db
        .update(collectionsToAssets)
        .set({
          deletedAt: now,
          updatedAt: now,
          updatedBy: validated.userId,
        })
        .where(
          and(
            eq(collectionsToAssets.collectionId, validated.collectionId),
            eq(collectionsToAssets.assetId, asset.id),
            eq(collectionsToAssets.assetType, asset.type)
          )
        );

      result.removed_count++;
    } catch (error) {
      console.error(`Failed to remove asset ${asset.id} from collection:`, error);
      result.failed_count++;
      result.failed_assets.push({
        id: asset.id,
        type: asset.type,
        error: 'Error removing asset during database operation',
      });
    }
  }

  return result;
}
