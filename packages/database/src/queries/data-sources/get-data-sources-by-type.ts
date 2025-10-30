import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { dataSources } from '../../schema';
import type { DataSourceTypeValue } from '../../schema-types';

/**
 * Data source item without credentials
 */
export interface DataSourceItem {
  id: string;
  name: string;
  type: string;
  secretId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all data sources of a specific type
 * Filters out soft-deleted sources
 *
 * @param type - The data source type to filter by
 * @returns Array of data sources of the specified type
 *
 * @example
 * ```typescript
 * const snowflakeSources = await getDataSourcesByType('snowflake');
 * console.log(`Found ${snowflakeSources.length} Snowflake data sources`);
 * ```
 */
export async function getDataSourcesByType(type: DataSourceTypeValue): Promise<DataSourceItem[]> {
  const results = await db
    .select({
      id: dataSources.id,
      name: dataSources.name,
      type: dataSources.type,
      secretId: dataSources.secretId,
      organizationId: dataSources.organizationId,
      createdAt: dataSources.createdAt,
      updatedAt: dataSources.updatedAt,
    })
    .from(dataSources)
    .where(and(eq(dataSources.type, type), isNull(dataSources.deletedAt)));

  return results;
}
