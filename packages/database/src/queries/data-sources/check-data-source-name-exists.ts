import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';

const CheckDataSourceNameExistsInputSchema = z.object({
  name: z.string().describe('Data source name'),
  organizationId: z.string().uuid().describe('Organization ID'),
});

type CheckDataSourceNameExistsInput = z.infer<typeof CheckDataSourceNameExistsInputSchema>;

/**
 * Check if a data source with the given name exists in the organization
 * Only checks non-deleted data sources
 */
export async function checkDataSourceNameExists(
  input: CheckDataSourceNameExistsInput
): Promise<{ id: string } | null> {
  const validated = CheckDataSourceNameExistsInputSchema.parse(input);

  const result = await db
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(
      and(
        eq(dataSources.name, validated.name),
        eq(dataSources.organizationId, validated.organizationId),
        isNull(dataSources.deletedAt)
      )
    )
    .limit(1);

  return result[0] || null;
}
