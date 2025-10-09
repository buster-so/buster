import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { chats, collections, dashboardFiles, metricFiles, reportFiles } from '../../schema';
import { type AssetType, AssetTypeSchema } from '../../schema-types';

export const UpdateAssetScreenshotBucketKeyInputSchema = z.object({
  assetId: z.string().uuid('Asset ID must be a valid UUID'),
  assetType: AssetTypeSchema,
  screenshotBucketKey: z.string().min(1, 'Screenshot bucket key is required'),
});

export type UpdateAssetScreenshotBucketKeyInput = z.infer<
  typeof UpdateAssetScreenshotBucketKeyInputSchema
>;

type ScreenshotTable =
  | typeof chats
  | typeof collections
  | typeof dashboardFiles
  | typeof metricFiles
  | typeof reportFiles;

export const assetTableMap: Record<AssetType, ScreenshotTable> = {
  chat: chats,
  collection: collections,
  dashboard_file: dashboardFiles,
  metric_file: metricFiles,
  report_file: reportFiles,
};

export const updateAssetScreenshotBucketKey = async (
  input: UpdateAssetScreenshotBucketKeyInput
): Promise<{ updated: boolean }> => {
  const { assetId, assetType, screenshotBucketKey } =
    UpdateAssetScreenshotBucketKeyInputSchema.parse(input);

  const table = assetTableMap[assetType];

  const [existing] = await db
    .select({ screenshotBucketKey: table.screenshotBucketKey })
    .from(table)
    .where(and(eq(table.id, assetId), isNull(table.deletedAt)));

  if (!existing) {
    throw new Error(`Asset ${assetType} with id ${assetId} not found`);
  }

  await db
    .update(table)
    .set({
      screenshotBucketKey,
      screenshotTakenAt: new Date().toISOString(),
    })
    .where(and(eq(table.id, assetId), isNull(table.deletedAt)));

  return { updated: true };
};
