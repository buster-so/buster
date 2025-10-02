import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '../../connection';
import { logsWriteBackConfigs } from '../../schema';

export interface LogsWriteBackConfig {
  id: string;
  organizationId: string;
  dataSourceId: string;
  database: string;
  schema: string;
  tableName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Get active logs writeback configuration for an organization
 */
export async function getLogsWriteBackConfig(
  organizationId: string
): Promise<LogsWriteBackConfig | null> {
  const db = getDb();
  const [config] = await db
    .select()
    .from(logsWriteBackConfigs)
    .where(
      and(
        eq(logsWriteBackConfigs.organizationId, organizationId),
        isNull(logsWriteBackConfigs.deletedAt)
      )
    )
    .limit(1);

  if (!config) {
    return null;
  }

  return {
    id: config.id,
    organizationId: config.organizationId,
    dataSourceId: config.dataSourceId,
    database: config.database,
    schema: config.schema,
    tableName: config.tableName,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    deletedAt: config.deletedAt,
  };
}

/**
 * Get logs writeback configuration by ID
 */
export async function getLogsWriteBackConfigById(id: string): Promise<LogsWriteBackConfig | null> {
  const db = getDb();
  const [config] = await db
    .select()
    .from(logsWriteBackConfigs)
    .where(and(eq(logsWriteBackConfigs.id, id), isNull(logsWriteBackConfigs.deletedAt)))
    .limit(1);

  if (!config) {
    return null;
  }

  return {
    id: config.id,
    organizationId: config.organizationId,
    dataSourceId: config.dataSourceId,
    database: config.database,
    schema: config.schema,
    tableName: config.tableName,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    deletedAt: config.deletedAt,
  };
}
