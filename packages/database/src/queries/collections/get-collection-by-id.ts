import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import {
  chats,
  collections,
  collectionsToAssets,
  dashboardFiles,
  metricFiles,
  reportFiles,
  users,
} from '../../schema';

export const GetCollectionByIdInputSchema = z.object({
  collectionId: z.string().uuid(),
});

export type GetCollectionByIdInput = z.infer<typeof GetCollectionByIdInputSchema>;
export type Collection = typeof collections.$inferSelect;

export interface CollectionAsset {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  asset_type: 'metric_file' | 'dashboard_file' | 'chat' | 'report_file' | 'collection';
  created_by: {
    email: string;
    name: string | null;
  };
  screenshot_url: string | null;
}

export interface CollectionWithAssets {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organizationId: string;
  workspaceSharing: 'none' | 'can_view' | 'can_edit' | 'full_access';
  workspaceSharingEnabledBy: string | null;
  workspaceSharingEnabledAt: string | null;
  screenshotBucketKey: string | null;
  screenshotTakenAt: string | null;
  assets: CollectionAsset[];
}

/**
 * Get collection details by ID with all associated assets
 */
export async function getCollectionById(
  input: GetCollectionByIdInput
): Promise<Collection | undefined> {
  const validated = GetCollectionByIdInputSchema.parse(input);

  // Fetch the collection
  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, validated.collectionId), isNull(collections.deletedAt)))
    .limit(1);

  if (!collection) {
    return undefined;
  }

  return collection;
}


export async function getCollectionAssets(collectionId: string): Promise<CollectionAsset[]> {

  const metricsPromise = db
  .select({
    id: metricFiles.id,
    name: metricFiles.name,
    createdAt: metricFiles.createdAt,
    updatedAt: metricFiles.updatedAt,
    assetType: collectionsToAssets.assetType,
    userEmail: users.email,
    userName: users.name,
    screenshotUrl: metricFiles.screenshotBucketKey,
  })
  .from(collectionsToAssets)
  .innerJoin(metricFiles, eq(metricFiles.id, collectionsToAssets.assetId))
  .leftJoin(users, eq(users.id, metricFiles.createdBy))
  .where(
    and(
      eq(collectionsToAssets.collectionId, collectionId),
      eq(collectionsToAssets.assetType, 'metric_file'),
      isNull(collectionsToAssets.deletedAt),
      isNull(metricFiles.deletedAt)
    )
  );

  const dashboardPromise =     db
  .select({
    id: dashboardFiles.id,
    name: dashboardFiles.name,
    createdAt: dashboardFiles.createdAt,
    updatedAt: dashboardFiles.updatedAt,
    assetType: collectionsToAssets.assetType,
    userEmail: users.email,
    userName: users.name,
    screenshotUrl: dashboardFiles.screenshotBucketKey,
  })
  .from(collectionsToAssets)
  .innerJoin(dashboardFiles, eq(dashboardFiles.id, collectionsToAssets.assetId))
  .leftJoin(users, eq(users.id, dashboardFiles.createdBy))
  .where(
    and(
      eq(collectionsToAssets.collectionId, collectionId),
      eq(collectionsToAssets.assetType, 'dashboard_file'),
      isNull(collectionsToAssets.deletedAt),
      isNull(dashboardFiles.deletedAt)
    )
  );

  const chatPromise = db
  .select({
    id: chats.id,
    name: chats.title,
    createdAt: chats.createdAt,
    updatedAt: chats.updatedAt,
    assetType: collectionsToAssets.assetType,
    userEmail: users.email,
    userName: users.name,
    screenshotUrl: chats.screenshotBucketKey,
  })
  .from(collectionsToAssets)
  .innerJoin(chats, eq(chats.id, collectionsToAssets.assetId))
  .leftJoin(users, eq(users.id, chats.createdBy))
  .where(
    and(
      eq(collectionsToAssets.collectionId, collectionId),
      eq(collectionsToAssets.assetType, 'chat'),
      isNull(collectionsToAssets.deletedAt),
      isNull(chats.deletedAt)
    )
  )
  const reportPromise = db
  .select({
    id: reportFiles.id,
    name: reportFiles.name,
    createdAt: reportFiles.createdAt,
    updatedAt: reportFiles.updatedAt,
    assetType: collectionsToAssets.assetType,
    userEmail: users.email,
    userName: users.name,
    screenshotUrl: reportFiles.screenshotBucketKey,
  })
  .from(collectionsToAssets)
  .innerJoin(reportFiles, eq(reportFiles.id, collectionsToAssets.assetId))
  .leftJoin(users, eq(users.id, reportFiles.createdBy))
  .where(
    and(
      eq(collectionsToAssets.collectionId, collectionId),
      eq(collectionsToAssets.assetType, 'report_file'),
      isNull(collectionsToAssets.deletedAt),
      isNull(reportFiles.deletedAt)
    )
  )
  // Fetch all associated assets in parallel
  const [metricAssets, dashboardAssets, chatAssets, reportAssets] = await Promise.all([
    metricsPromise,
    dashboardPromise,
    chatPromise,
    reportPromise,
  ]);

  // Combine all assets
  const allAssets: CollectionAsset[] = [
    ...chatAssets,
    ...reportAssets,
    ...dashboardAssets,
    ...metricAssets,
  ].map((asset) => ({
    id: asset.id,
    name: asset.name,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
    asset_type: asset.assetType,
    created_by: {
      email: asset.userEmail || '',
      name: asset.userName,
    },
    screenshot_url: asset.screenshotUrl,
  }));

  return allAssets;
}
