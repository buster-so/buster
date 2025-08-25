import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { s3Integrations } from '../../schema';

export interface S3IntegrationListItem {
  id: string;
  provider: 's3' | 'r2' | 'gcs';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListS3IntegrationsOptions {
  organizationId?: string;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * List S3 integrations with optional filtering
 */
export async function listS3Integrations(
  options: ListS3IntegrationsOptions = {}
): Promise<S3IntegrationListItem[]> {
  const { organizationId, includeDeleted = false, limit = 100, offset = 0 } = options;

  const conditions = [];

  if (organizationId) {
    conditions.push(eq(s3Integrations.organizationId, organizationId));
  }

  if (!includeDeleted) {
    conditions.push(isNull(s3Integrations.deletedAt));
  }

  const query = db
    .select()
    .from(s3Integrations)
    .orderBy(desc(s3Integrations.createdAt))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const integrations = await query;

  return integrations.map((integration: any) => ({
    id: integration.id,
    provider: integration.provider,
    organizationId: integration.organizationId,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    deletedAt: integration.deletedAt,
  }));
}

/**
 * Count S3 integrations with optional filtering
 */
export async function countS3Integrations(
  options: Omit<ListS3IntegrationsOptions, 'limit' | 'offset'> = {}
): Promise<number> {
  const { organizationId, includeDeleted = false } = options;

  const conditions = [];

  if (organizationId) {
    conditions.push(eq(s3Integrations.organizationId, organizationId));
  }

  if (!includeDeleted) {
    conditions.push(isNull(s3Integrations.deletedAt));
  }

  const query = db.select().from(s3Integrations);

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const result = await query;
  return result.length;
}
