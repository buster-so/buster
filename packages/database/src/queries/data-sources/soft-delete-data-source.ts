import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';

const SoftDeleteDataSourceParamsSchema = z.object({
  id: z.string().uuid().describe('Data source ID to soft delete'),
});

type SoftDeleteDataSourceParams = z.infer<typeof SoftDeleteDataSourceParamsSchema>;

export interface SoftDeleteDataSourceResult {
  id: string;
  name: string;
  type: string;
  organizationId: string;
  secretId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  onboardingStatus: string;
  onboardingError: string | null;
}

/**
 * Soft delete a data source by setting deletedAt timestamp
 * Does not physically remove the record from the database
 */
export async function softDeleteDataSource(
  params: SoftDeleteDataSourceParams
): Promise<SoftDeleteDataSourceResult> {
  const validated = SoftDeleteDataSourceParamsSchema.parse(params);

  const [result] = await db
    .update(dataSources)
    .set({
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(dataSources.id, validated.id))
    .returning();

  if (!result) {
    throw new Error(`Data source with ID ${validated.id} not found`);
  }

  return result as SoftDeleteDataSourceResult;
}
