import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { metricFiles } from '../../schema';

export const GetMetricTitleInputSchema = z.object({
  assetId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
});

export type GetMetricTitleInput = z.infer<typeof GetMetricTitleInputSchema>;

// Updated return type to remove null since we now throw an error instead
export async function getMetricTitle(input: GetMetricTitleInput, isAdmin = false): Promise<string> {
  const validated = GetMetricTitleInputSchema.parse(input);

  const [metric] = await db
    .select({
      name: metricFiles.name,
      publiclyAccessible: metricFiles.publiclyAccessible,
      organizationId: metricFiles.organizationId,
    })
    .from(metricFiles)
    .where(and(eq(metricFiles.id, validated.assetId), isNull(metricFiles.deletedAt)))
    .limit(1);

  // Throw error instead of returning null
  if (!metric) {
    throw new Error(`Metric with ID ${validated.assetId} not found`);
  }

  // Throw error for permission failure instead of returning null
  if (
    !isAdmin &&
    !metric.publiclyAccessible &&
    metric.organizationId !== validated.organizationId
  ) {
    throw new Error(
      `Access denied: Metric with ID ${validated.assetId} is not publicly accessible and does not belong to the specified organization`
    );
  }

  return metric.name;
}
