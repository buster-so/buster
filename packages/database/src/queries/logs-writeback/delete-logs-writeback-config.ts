import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '../../connection';
import { logsWriteBackConfigs } from '../../schema';

/**
 * Soft delete logs writeback configuration for an organization
 */
export async function deleteLogsWriteBackConfig(organizationId: string): Promise<boolean> {
  const db = getDb();
  const now = new Date().toISOString();

  // Find the active config
  const [existingConfig] = await db
    .select({ id: logsWriteBackConfigs.id })
    .from(logsWriteBackConfigs)
    .where(
      and(
        eq(logsWriteBackConfigs.organizationId, organizationId),
        isNull(logsWriteBackConfigs.deletedAt)
      )
    )
    .limit(1);

  if (!existingConfig) {
    return false; // No config to delete
  }

  // Soft delete by setting deletedAt
  await db
    .update(logsWriteBackConfigs)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(logsWriteBackConfigs.id, existingConfig.id));

  return true;
}
