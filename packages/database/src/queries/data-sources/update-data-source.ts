import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';

const UpdateDataSourceParamsSchema = z.object({
  id: z.string().uuid().describe('Data source ID to update'),
  name: z.string().optional().describe('Updated data source name'),
  type: z.string().optional().describe('Updated data source type'),
  secretId: z.string().uuid().optional().describe('Updated secret ID'),
  updatedBy: z.string().uuid().describe('User ID performing the update'),
});

type UpdateDataSourceParams = z.infer<typeof UpdateDataSourceParamsSchema>;

export interface UpdateDataSourceResult {
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
 * Update a data source
 * Only updates provided fields, leaving others unchanged
 */
export async function updateDataSource(
  params: UpdateDataSourceParams
): Promise<UpdateDataSourceResult> {
  const validated = UpdateDataSourceParamsSchema.parse(params);

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {
    updatedBy: validated.updatedBy,
    updatedAt: new Date().toISOString(),
  };

  if (validated.name !== undefined) {
    updates.name = validated.name;
  }

  if (validated.type !== undefined) {
    updates.type = validated.type;
  }

  if (validated.secretId !== undefined) {
    updates.secretId = validated.secretId;
  }

  const [result] = await db
    .update(dataSources)
    .set(updates)
    .where(eq(dataSources.id, validated.id))
    .returning();

  if (!result) {
    throw new Error(`Data source with ID ${validated.id} not found`);
  }

  return result as UpdateDataSourceResult;
}
