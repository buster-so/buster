import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { s3Integrations } from '../../schema';

export interface DeleteS3IntegrationResult {
  success: boolean;
  deletedId?: string;
}

/**
 * Soft delete an S3 integration by ID
 */
export async function deleteS3IntegrationById(id: string): Promise<DeleteS3IntegrationResult> {
  const [deletedIntegration] = await db
    .update(s3Integrations)
    .set({
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(s3Integrations.id, id), isNull(s3Integrations.deletedAt)))
    .returning();

  if (!deletedIntegration) {
    return {
      success: false,
    };
  }

  return {
    success: true,
    deletedId: deletedIntegration.id,
  };
}

/**
 * Soft delete all S3 integrations for an organization
 * Used when cleaning up organization data
 */
export async function deleteS3IntegrationsByOrganizationId(
  organizationId: string
): Promise<DeleteS3IntegrationResult> {
  const deletedIntegrations = await db
    .update(s3Integrations)
    .set({
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(s3Integrations.organizationId, organizationId), isNull(s3Integrations.deletedAt)))
    .returning();

  return {
    success: deletedIntegrations.length > 0,
    ...(deletedIntegrations[0] && { deletedId: deletedIntegrations[0].id }),
  };
}
