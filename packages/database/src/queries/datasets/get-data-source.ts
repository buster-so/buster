import { and, eq, isNull } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { dataSources } from '../../schema';

/**
 * Get a data source by name and organization
 */
export async function getDataSourceByName(
  db: PostgresJsDatabase,
  dataSourceName: string,
  organizationId: string
) {
  const result = await db
    .select({
      id: dataSources.id,
      name: dataSources.name,
      type: dataSources.type,
      organizationId: dataSources.organizationId,
    })
    .from(dataSources)
    .where(
      and(
        eq(dataSources.name, dataSourceName),
        eq(dataSources.organizationId, organizationId),
        isNull(dataSources.deletedAt)
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Check if user has access to data source
 * For now, just checks if the data source belongs to the user's organization
 */
export async function userHasDataSourceAccess(
  db: PostgresJsDatabase,
  dataSourceId: string,
  organizationId: string
): Promise<boolean> {
  const result = await db
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(
      and(
        eq(dataSources.id, dataSourceId),
        eq(dataSources.organizationId, organizationId),
        isNull(dataSources.deletedAt)
      )
    )
    .limit(1);

  return result.length > 0;
}
