import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { s3Integrations } from '../../schema';

export interface CreateS3IntegrationInput {
  provider: 's3' | 'r2' | 'gcs';
  organizationId: string;
}

export interface CreateS3IntegrationResult {
  id: string;
  provider: 's3' | 'r2' | 'gcs';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Create a new S3 integration for an organization
 * @throws Error if organization already has an active integration
 */
export async function createS3Integration(
  input: CreateS3IntegrationInput
): Promise<CreateS3IntegrationResult> {
  // Check if organization already has an active integration
  const existingIntegration = await db
    .select()
    .from(s3Integrations)
    .where(
      and(eq(s3Integrations.organizationId, input.organizationId), isNull(s3Integrations.deletedAt))
    )
    .limit(1);

  if (existingIntegration.length > 0) {
    throw new Error('Organization already has an active storage integration');
  }

  // Create new integration
  const [newIntegration] = await db
    .insert(s3Integrations)
    .values({
      provider: input.provider,
      organizationId: input.organizationId,
    })
    .returning();

  if (!newIntegration) {
    throw new Error('Failed to create S3 integration');
  }

  return {
    id: newIntegration.id,
    provider: newIntegration.provider,
    organizationId: newIntegration.organizationId,
    createdAt: newIntegration.createdAt,
    updatedAt: newIntegration.updatedAt,
    deletedAt: newIntegration.deletedAt,
  };
}
