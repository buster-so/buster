import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';

const InputSchema = z.object({
  dataSourceId: z.string().uuid('Data source ID must be a valid UUID'),
});

const OutputSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  createdBy: z.string(),
  type: z.string(),
});

export type GetDataSourceWithDetailsInput = z.infer<typeof InputSchema>;
export type GetDataSourceWithDetailsOutput = z.infer<typeof OutputSchema>;

/**
 * Get data source with organization and user details for dataset creation
 * @param input - Contains the data source ID
 * @returns Data source with organizationId and createdBy for dataset records
 */
export async function getDataSourceWithDetails(
  input: GetDataSourceWithDetailsInput
): Promise<GetDataSourceWithDetailsOutput> {
  const validated = InputSchema.parse(input);

  const results = await db
    .select({
      id: dataSources.id,
      organizationId: dataSources.organizationId,
      createdBy: dataSources.createdBy,
      type: dataSources.type,
    })
    .from(dataSources)
    .where(and(eq(dataSources.id, validated.dataSourceId), isNull(dataSources.deletedAt)))
    .limit(1);

  if (!results[0]) {
    throw new Error(`Data source not found: ${validated.dataSourceId}`);
  }

  return OutputSchema.parse(results[0]);
}
