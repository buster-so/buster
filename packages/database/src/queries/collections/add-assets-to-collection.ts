import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { collectionsToAssets } from '../../schema';
import { AssetType, AssetTypeSchema } from '../../schema-types';

export const AddAssetToCollectionInputSchema = z.object({
  collectionId: z.string().uuid(),
  assets: z.array(
    z.object({
      id: z.string().uuid(),
      type: AssetTypeSchema,
    })
  ),
  userId: z.string().uuid(),
});

export type AddAssetToCollectionInput = z.infer<typeof AddAssetToCollectionInputSchema>;

export interface AddAssetsResult {
  added_count: number;
  failed_count: number;
  failed_assets: Array<{
    id: string;
    type: AssetType;
    error: string;
  }>;
}

/**
 * Add multiple assets to a collection
 * This function handles adding or re-activating (undeleting) assets in the collection
 */
export async function addAssetsToCollection(
  input: AddAssetToCollectionInput
): Promise<AddAssetsResult> {
  const validated = AddAssetToCollectionInputSchema.parse(input);

  const result: AddAssetsResult = {
    added_count: 0,
    failed_count: 0,
    failed_assets: [],
  };

  if (validated.assets.length === 0) {
    return result;
  }

  const now = new Date().toISOString();

  for (const asset of validated.assets) {
    try {
      // Check if asset already exists in collection
      const [existing] = await db
        .select()
        .from(collectionsToAssets)
        .where(
          and(
            eq(collectionsToAssets.collectionId, validated.collectionId),
            eq(collectionsToAssets.assetId, asset.id),
            eq(collectionsToAssets.assetType, asset.type)
          )
        )
        .limit(1);

      if (existing) {
        // If asset was previously deleted, restore it
        if (existing.deletedAt) {
          await db
            .update(collectionsToAssets)
            .set({
              deletedAt: null,
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
          result.added_count++;
        } else {
          // Asset already exists and is active
          result.added_count++;
        }
      } else {
        // Insert new asset
        await db.insert(collectionsToAssets).values({
          collectionId: validated.collectionId,
          assetId: asset.id,
          assetType: asset.type,
          createdAt: now,
          createdBy: validated.userId,
          updatedAt: now,
          updatedBy: validated.userId,
          deletedAt: null,
        });
        result.added_count++;
      }
    } catch (error) {
      console.error(`Failed to add asset ${asset.id} to collection:`, error);
      result.failed_count++;
      result.failed_assets.push({
        id: asset.id,
        type: asset.type,
        error: 'Failed during database operation',
      });
    }
  }

  return result;
}
