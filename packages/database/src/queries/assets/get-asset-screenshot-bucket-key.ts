import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { chats, collections, dashboardFiles, metricFiles, reportFiles } from '../../schema';
import { type AssetType, AssetTypeSchema } from '../../schema-types';

export const GetAssetScreenshotBucketKeyInputSchema = z.object({
  assetId: z.string().uuid('Asset ID must be a valid UUID'),
  assetType: AssetTypeSchema,
});

export type GetAssetScreenshotBucketKeyInput = z.infer<
  typeof GetAssetScreenshotBucketKeyInputSchema
>;

type ScreenshotTable =
  | typeof chats
  | typeof collections
  | typeof dashboardFiles
  | typeof metricFiles
  | typeof reportFiles;

const assetTableMap: Record<AssetType, ScreenshotTable> = {
  chat: chats,
  collection: collections,
  dashboard_file: dashboardFiles,
  metric_file: metricFiles,
  report_file: reportFiles,
};

export const getAssetScreenshotBucketKey = async (
  input: GetAssetScreenshotBucketKeyInput
): Promise<string | null> => {
  const { assetId, assetType } = GetAssetScreenshotBucketKeyInputSchema.parse(input);

  const table = assetTableMap[assetType];

  const [existing] = await db
    .select({ screenshotBucketKey: table.screenshotBucketKey })
    .from(table)
    .where(and(eq(table.id, assetId), isNull(table.deletedAt)));

  if (!existing) {
    throw new Error(`Asset ${assetType} with id ${assetId} not found`);
  }

  return existing.screenshotBucketKey ?? null;
};
