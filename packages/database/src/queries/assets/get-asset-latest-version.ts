import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dashboardFiles, metricFiles, reportFiles } from '../../schema';
import { type ResponseMessageFileType, ResponseMessageFileTypeSchema } from '../../schema-types';

export const GetAssetLatestVersionInputSchema = z.object({
  assetId: z.string().uuid().describe('Asset ID to get version for'),
  assetType: ResponseMessageFileTypeSchema.describe('Type of asset'),
});

export type GetAssetLatestVersionInput = z.infer<typeof GetAssetLatestVersionInputSchema>;

/**
 * Get the latest version number for an asset
 * Extracts the maximum version from the versionHistory JSON field
 */
export async function getAssetLatestVersion(input: GetAssetLatestVersionInput): Promise<number> {
  const validated = GetAssetLatestVersionInputSchema.parse(input);
  const { assetId, assetType } = validated;

  if (assetType === 'metric_file') {
    const [metric] = await db
      .select({ versionHistory: metricFiles.versionHistory })
      .from(metricFiles)
      .where(and(eq(metricFiles.id, assetId), isNull(metricFiles.deletedAt)))
      .limit(1);

    if (!metric) {
      throw new Error(`Metric file not found: ${assetId}`);
    }

    const versions = Object.keys(metric.versionHistory || {})
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    return versions.length > 0 ? Math.max(...versions) : 1;
  }

  if (assetType === 'dashboard_file') {
    const [dashboard] = await db
      .select({ versionHistory: dashboardFiles.versionHistory })
      .from(dashboardFiles)
      .where(and(eq(dashboardFiles.id, assetId), isNull(dashboardFiles.deletedAt)))
      .limit(1);

    if (!dashboard) {
      throw new Error(`Dashboard file not found: ${assetId}`);
    }

    const versions = Object.keys(dashboard.versionHistory || {})
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    return versions.length > 0 ? Math.max(...versions) : 1;
  }

  if (assetType === 'report_file') {
    const [report] = await db
      .select({ versionHistory: reportFiles.versionHistory })
      .from(reportFiles)
      .where(and(eq(reportFiles.id, assetId), isNull(reportFiles.deletedAt)))
      .limit(1);

    if (!report) {
      throw new Error(`Report file not found: ${assetId}`);
    }

    const versions = Object.keys(report.versionHistory || {})
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    return versions.length > 0 ? Math.max(...versions) : 1;
  }

  // For other asset types that might not have version history yet
  return 1;
}
