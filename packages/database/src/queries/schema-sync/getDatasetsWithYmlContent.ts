import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { datasets } from '../../schema';

// Type inference from schema
export type Dataset = InferSelectModel<typeof datasets>;

/**
 * Input schema for getting datasets
 */
export const GetDatasetsWithYmlContentInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  dataSourceId: z.string().uuid('Data source ID must be a valid UUID'),
});

export type GetDatasetsWithYmlContentInput = z.infer<typeof GetDatasetsWithYmlContentInputSchema>;

/**
 * Get all datasets that have YML content for a specific organization and data source
 * Filters out datasets without YML content as they cannot be validated
 */
export async function getDatasetsWithYmlContent(
  params: GetDatasetsWithYmlContentInput
): Promise<Dataset[]> {
  try {
    const { organizationId, dataSourceId } = GetDatasetsWithYmlContentInputSchema.parse(params);

    const result = await db
      .select()
      .from(datasets)
      .where(
        and(
          eq(datasets.organizationId, organizationId),
          eq(datasets.dataSourceId, dataSourceId),
          isNotNull(datasets.ymlFile),
          eq(datasets.enabled, true),
          isNull(datasets.deletedAt)
        )
      );

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid input for getDatasetsWithYmlContent: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }

    console.error('Error fetching datasets with YML content:', {
      params,
      error: error instanceof Error ? error.message : error,
    });

    throw error;
  }
}
