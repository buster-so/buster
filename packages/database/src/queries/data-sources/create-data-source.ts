import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';

const CreateDataSourceInputSchema = z.object({
  name: z.string().describe('Data source name'),
  type: z.string().describe('Data source type (e.g., "motherduck")'),
  organizationId: z.string().uuid().describe('Organization ID'),
  createdBy: z.string().uuid().describe('User ID who created this'),
  secretId: z.string().uuid().describe('Vault secret ID for credentials'),
});

type CreateDataSourceInput = z.infer<typeof CreateDataSourceInputSchema>;

export interface CreateDataSourceResult {
  id: string;
  name: string;
  type: string;
  organizationId: string;
  createdBy: string;
  updatedBy: string;
  secretId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  onboardingStatus: string;
  onboardingError: string | null;
}

/**
 * Create a new data source record
 * Returns the created data source with all fields
 */
export async function createDataSource(
  input: CreateDataSourceInput
): Promise<CreateDataSourceResult> {
  const validated = CreateDataSourceInputSchema.parse(input);

  const [result] = await db
    .insert(dataSources)
    .values({
      name: validated.name,
      type: validated.type,
      organizationId: validated.organizationId,
      createdBy: validated.createdBy,
      updatedBy: validated.createdBy, // Initially same as createdBy
      secretId: validated.secretId,
      onboardingStatus: 'notStarted',
    })
    .returning();

  if (!result) {
    throw new Error('Failed to create data source');
  }

  return result as CreateDataSourceResult;
}
