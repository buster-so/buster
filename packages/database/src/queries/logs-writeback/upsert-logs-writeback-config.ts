import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '../../connection';
import { logsWriteBackConfigs } from '../../schema';
import type { LogsWriteBackConfig } from './get-logs-writeback-config';

export interface UpsertLogsWriteBackConfigParams {
  organizationId: string;
  dataSourceId: string;
  database: string;
  schema: string;
  tableName?: string;
}

/**
 * Upsert logs writeback configuration for an organization
 * - Creates new config if none exists
 * - Updates existing config if one exists
 * - Ensures only one active config per organization
 */
export async function upsertLogsWriteBackConfig(
  params: UpsertLogsWriteBackConfigParams
): Promise<LogsWriteBackConfig> {
  const db = getDb();
  const now = new Date().toISOString();

  // Check if config already exists for this organization
  const [existingConfig] = await db
    .select()
    .from(logsWriteBackConfigs)
    .where(
      and(
        eq(logsWriteBackConfigs.organizationId, params.organizationId),
        isNull(logsWriteBackConfigs.deletedAt)
      )
    )
    .limit(1);

  if (existingConfig) {
    // Update existing config
    const updatedRows = await db
      .update(logsWriteBackConfigs)
      .set({
        dataSourceId: params.dataSourceId,
        database: params.database,
        schema: params.schema,
        tableName: params.tableName || 'buster_query_logs',
        updatedAt: now,
      })
      .where(eq(logsWriteBackConfigs.id, existingConfig.id))
      .returning();

    const updated = updatedRows[0];
    if (!updated) {
      throw new Error('Failed to update logs writeback configuration');
    }

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      dataSourceId: updated.dataSourceId,
      database: updated.database,
      schema: updated.schema,
      tableName: updated.tableName,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      deletedAt: updated.deletedAt,
    };
  }
  // Create new config
  const createdRows = await db
    .insert(logsWriteBackConfigs)
    .values({
      organizationId: params.organizationId,
      dataSourceId: params.dataSourceId,
      database: params.database,
      schema: params.schema,
      tableName: params.tableName || 'buster_query_logs',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const created = createdRows[0];
  if (!created) {
    throw new Error('Failed to create logs writeback configuration');
  }

  return {
    id: created.id,
    organizationId: created.organizationId,
    dataSourceId: created.dataSourceId,
    database: created.database,
    schema: created.schema,
    tableName: created.tableName,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    deletedAt: created.deletedAt,
  };
}
