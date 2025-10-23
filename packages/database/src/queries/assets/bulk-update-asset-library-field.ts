import { and, db, eq, isNull } from '../../connection';
import { userLibrary } from '../../schema';
import type {
  BulkUpdateLibraryFieldInput,
  BulkUpdateLibraryFieldResponse,
  LibraryAssetType,
} from '../../schema-types';

export async function bulkUpdateLibraryField(
  input: BulkUpdateLibraryFieldInput,
  userId: string,
  savedToLibrary: boolean
): Promise<BulkUpdateLibraryFieldResponse> {
  const failedItems: BulkUpdateLibraryFieldResponse['failedItems'] = [];
  const successItems: BulkUpdateLibraryFieldResponse['successItems'] = [];
  const promises: Promise<void>[] = [];

  for (const asset of input) {
    promises.push(updateAssetLibraryField(asset.assetId, asset.assetType, userId, savedToLibrary));
  }
  const results = await Promise.allSettled(promises);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const asset = input[i];

    if (asset && result) {
      if (result.status === 'fulfilled') {
        successItems.push(asset);
      } else {
        failedItems.push({
          ...asset,
          error: result.reason?.message || 'Unknown error',
        });
      }
    }
  }

  const success = failedItems.length === 0;

  return {
    success,
    successItems,
    failedItems,
  };
}

async function updateAssetLibraryField(
  assetId: string,
  assetType: LibraryAssetType,
  userId: string,
  savedToLibrary: boolean
): Promise<void> {
  if (savedToLibrary) {
    // Add to library: insert or update the userLibrary entry
    await db
      .insert(userLibrary)
      .values({
        userId,
        assetId,
        assetType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: [userLibrary.userId, userLibrary.assetType, userLibrary.assetId],
        set: {
          deletedAt: null,
          updatedAt: new Date().toISOString(),
        },
      });
  } else {
    // Remove from library: soft delete the userLibrary entry
    await db
      .update(userLibrary)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(userLibrary.userId, userId),
          eq(userLibrary.assetId, assetId),
          eq(userLibrary.assetType, assetType),
          isNull(userLibrary.deletedAt)
        )
      );
  }
}
