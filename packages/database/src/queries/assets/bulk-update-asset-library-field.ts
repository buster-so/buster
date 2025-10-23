import { and, db, eq, isNull } from '../../connection';
import { chats, dashboardFiles, metricFiles, reportFiles } from '../../schema';
import type {
  BulkUpdateLibraryFieldInput,
  BulkUpdateLibraryFieldResponse,
  LibraryAssetType,
} from '../../schema-types';

type LibraryAssetTable =
  | typeof chats
  | typeof dashboardFiles
  | typeof metricFiles
  | typeof reportFiles;

export const libraryAssetTableMap: Record<LibraryAssetType, LibraryAssetTable> = {
  chat: chats,
  dashboard_file: dashboardFiles,
  metric_file: metricFiles,
  report_file: reportFiles,
};

export async function bulkUpdateLibraryField(
  input: BulkUpdateLibraryFieldInput,
  savedToLibrary: boolean
): Promise<BulkUpdateLibraryFieldResponse> {
  const failedItems: BulkUpdateLibraryFieldResponse['failedItems'] = [];
  const successItems: BulkUpdateLibraryFieldResponse['successItems'] = [];
  const promises: Promise<void>[] = [];

  for (const asset of input) {
    promises.push(updateAssetLibraryField(asset.assetId, asset.assetType, savedToLibrary));
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
  savedToLibrary: boolean
): Promise<void> {
  // Handle each asset type explicitly to satisfy TypeScript
  if (assetType === 'chat') {
    await db
      .update(chats)
      .set({
        savedToLibrary,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(chats.id, assetId), isNull(chats.deletedAt)));
  } else if (assetType === 'dashboard_file') {
    await db
      .update(dashboardFiles)
      .set({
        savedToLibrary,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(dashboardFiles.id, assetId), isNull(dashboardFiles.deletedAt)));
  } else if (assetType === 'metric_file') {
    await db
      .update(metricFiles)
      .set({
        savedToLibrary,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(metricFiles.id, assetId), isNull(metricFiles.deletedAt)));
  } else if (assetType === 'report_file') {
    await db
      .update(reportFiles)
      .set({
        savedToLibrary,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(reportFiles.id, assetId), isNull(reportFiles.deletedAt)));
  } else {
    const exhaustiveCheck: never = assetType;
    throw new Error(`Invalid asset type: ${exhaustiveCheck}`);
  }
}
