import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, metricFiles } from '../../schema';

// Zod-first: Define schemas first, derive types from them
export const GetMetricWithDataSourceInputSchema = z.object({
  metricId: z.string().uuid(),
  versionNumber: z.number().optional(),
});

export type GetMetricWithDataSourceInput = z.infer<typeof GetMetricWithDataSourceInputSchema>;

// Zod schema for MetricContent (matches MetricYml from server-shared)
export const MetricContentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  timeFrame: z.string().optional(),
  sql: z.string(),
  chartConfig: z.record(z.unknown()).optional(),
});

export type MetricContent = z.infer<typeof MetricContentSchema>;

// Zod schema for version history entry
export const VersionHistoryEntrySchema = z.object({
  content: MetricContentSchema,
  updated_at: z.string(),
  version_number: z.number(),
});

export type VersionHistoryEntry = z.infer<typeof VersionHistoryEntrySchema>;

// Zod schema for the full metric with data source
export const MetricWithDataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: MetricContentSchema,
  dataSourceId: z.string(),
  organizationId: z.string(),
  dataMetadata: z.record(z.unknown()).nullable(),
  versionHistory: z.record(VersionHistoryEntrySchema),
  secretId: z.string(),
  dataSourceType: z.string(),
  versionNumber: z.number().optional(),
});

export type MetricWithDataSource = z.infer<typeof MetricWithDataSourceSchema>;

/**
 * Fetches metric details along with data source information
 * Supports fetching specific versions from the versionHistory field
 */
export async function getMetricWithDataSource(
  input: GetMetricWithDataSourceInput
): Promise<MetricWithDataSource | null> {
  const validated = GetMetricWithDataSourceInputSchema.parse(input);

  // Fetch the metric with its data source
  const [result] = await db
    .select({
      id: metricFiles.id,
      name: metricFiles.name,
      content: metricFiles.content,
      dataSourceId: metricFiles.dataSourceId,
      organizationId: metricFiles.organizationId,
      dataMetadata: metricFiles.dataMetadata,
      versionHistory: metricFiles.versionHistory,
      secretId: dataSources.secretId,
      dataSourceType: dataSources.type,
    })
    .from(metricFiles)
    .innerJoin(dataSources, eq(metricFiles.dataSourceId, dataSources.id))
    .where(
      and(
        eq(metricFiles.id, validated.metricId),
        isNull(metricFiles.deletedAt),
        isNull(dataSources.deletedAt)
      )
    )
    .limit(1);

  if (!result) {
    return null;
  }

  // Parse and validate the content
  const parsedContent = MetricContentSchema.safeParse(result.content);
  if (!parsedContent.success) {
    console.error('Invalid metric content structure:', parsedContent.error);
    return null;
  }

  // Parse version history if it exists
  const versionHistory: Record<string, VersionHistoryEntry> = {};
  if (result.versionHistory && typeof result.versionHistory === 'object') {
    // Validate each version entry
    for (const [key, value] of Object.entries(result.versionHistory as Record<string, unknown>)) {
      const parsed = VersionHistoryEntrySchema.safeParse(value);
      if (parsed.success) {
        versionHistory[key] = parsed.data;
      }
    }
  }

  // Determine which content to use (specific version or current)
  let content = parsedContent.data;
  let versionNumber: number | undefined;

  if (validated.versionNumber !== undefined && versionHistory) {
    const versionKey = validated.versionNumber.toString();
    const versionData = versionHistory[versionKey];

    if (versionData?.content) {
      content = versionData.content;
      versionNumber = validated.versionNumber;
    }
    // If version not found, fall back to current content
  }

  // Parse and validate dataMetadata
  const dataMetadata =
    result.dataMetadata && typeof result.dataMetadata === 'object'
      ? (result.dataMetadata as Record<string, unknown>)
      : null;

  const metricData: MetricWithDataSource = {
    id: result.id,
    name: result.name,
    content,
    dataSourceId: result.dataSourceId,
    organizationId: result.organizationId,
    dataMetadata,
    versionHistory,
    secretId: result.secretId,
    dataSourceType: result.dataSourceType,
    ...(versionNumber !== undefined && { versionNumber }),
  };

  return metricData;
}

/**
 * Extracts SQL query from metric content
 * The content should follow the MetricYml schema where SQL is a direct field
 */
export function extractSqlFromMetricContent(content: MetricContent): string {
  return content.sql;
}
