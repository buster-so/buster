import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, metricFiles } from '../../schema';

export const GetMetricForExportInputSchema = z.object({
  metricId: z.string().uuid(),
  versionNumber: z.number().optional(),
});

export type GetMetricForExportInput = z.infer<typeof GetMetricForExportInputSchema>;

export interface MetricForExport {
  id: string;
  name: string;
  content: Record<string, unknown>; // JSONB content containing SQL and other metadata
  dataSourceId: string;
  organizationId: string;
  secretId: string;
  dataSourceType: string;
  sql?: string;
}

/**
 * Fetches metric details along with data source information for export
 * Includes the SQL query and credentials needed to execute it
 */
export async function getMetricForExport(input: GetMetricForExportInput): Promise<MetricForExport> {
  const validated = GetMetricForExportInputSchema.parse(input);

  const [result] = await db
    .select({
      id: metricFiles.id,
      name: metricFiles.name,
      content: metricFiles.content,
      dataSourceId: metricFiles.dataSourceId,
      organizationId: metricFiles.organizationId,
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
    throw new Error(`Metric with ID ${validated.metricId} not found or has been deleted`);
  }

  // Handle version-specific content if requested
  let contentToUse = result.content as Record<string, unknown>;

  if (validated.versionNumber !== undefined && result.versionHistory) {
    const versionKey = validated.versionNumber.toString();
    const versionHistory = result.versionHistory as Record<
      string,
      {
        content: Record<string, unknown>;
        updated_at: string;
        version_number: number;
      }
    >;
    const versionData = versionHistory[versionKey];

    if (versionData?.content) {
      contentToUse = versionData.content;
    } else {
      throw new Error(
        `Version ${validated.versionNumber} not found for metric ${validated.metricId}`
      );
    }
  }

  // Extract SQL from metric content
  // The content structure may vary, so we check multiple possible locations
  let sql: string | undefined;

  //TODO: we need to use the metric type when we merge in the new ai sdk v5 branch date: 08/14/2025

  if (typeof contentToUse === 'object' && contentToUse !== null) {
    // Check common locations for SQL in metric content
    const content = contentToUse;
    sql =
      (typeof content.sql === 'string' ? content.sql : undefined) ||
      (typeof content.query === 'string' ? content.query : undefined) ||
      (typeof content.sqlQuery === 'string' ? content.sqlQuery : undefined) ||
      (typeof content.definition === 'object' && content.definition !== null
        ? typeof (content.definition as Record<string, unknown>).sql === 'string'
          ? ((content.definition as Record<string, unknown>).sql as string)
          : typeof (content.definition as Record<string, unknown>).query === 'string'
            ? ((content.definition as Record<string, unknown>).query as string)
            : undefined
        : undefined);
  }

  if (!sql) {
    throw new Error(`No SQL query found in metric ${validated.metricId}`);
  }

  return {
    id: result.id,
    name: result.name,
    content: contentToUse,
    dataSourceId: result.dataSourceId,
    organizationId: result.organizationId,
    secretId: result.secretId,
    dataSourceType: result.dataSourceType,
    sql,
  };
}
