import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { s3Integrations } from '../../schema';

export interface S3IntegrationResult {
  id: string;
  provider: 's3' | 'r2' | 'gcs';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Get S3 integration by ID
 */
export async function getS3IntegrationById(id: string): Promise<S3IntegrationResult | null> {
  const [integration] = await db
    .select()
    .from(s3Integrations)
    .where(and(eq(s3Integrations.id, id), isNull(s3Integrations.deletedAt)))
    .limit(1);

  if (!integration) {
    return null;
  }

  return {
    id: integration.id,
    provider: integration.provider,
    organizationId: integration.organizationId,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    deletedAt: integration.deletedAt,
  };
}

/**
 * Get active S3 integration for an organization
 */
export async function getS3IntegrationByOrganizationId(
  organizationId: string
): Promise<S3IntegrationResult | null> {
  const [integration] = await db
    .select()
    .from(s3Integrations)
    .where(and(eq(s3Integrations.organizationId, organizationId), isNull(s3Integrations.deletedAt)))
    .limit(1);

  if (!integration) {
    return null;
  }

  return {
    id: integration.id,
    provider: integration.provider,
    organizationId: integration.organizationId,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    deletedAt: integration.deletedAt,
  };
}
