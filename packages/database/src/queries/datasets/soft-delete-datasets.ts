import { and, eq, inArray, isNull, not, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { datasets } from '../../schema';

/**
 * Soft delete datasets that are not in the provided list
 * This is used to clean up datasets that were removed from the deployment
 */
export async function softDeleteDatasetsNotIn(
  db: PostgresJsDatabase,
  modelNames: string[],
  dataSourceId: string,
  organizationId: string
): Promise<string[]> {
  if (modelNames.length === 0) {
    // If no models provided, soft delete all datasets for this data source
    const toDelete = await db
      .select({ id: datasets.id, name: datasets.name })
      .from(datasets)
      .where(
        and(
          eq(datasets.dataSourceId, dataSourceId),
          eq(datasets.organizationId, organizationId),
          isNull(datasets.deletedAt)
        )
      );

    if (toDelete.length > 0) {
      await db
        .update(datasets)
        .set({
          deletedAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(datasets.dataSourceId, dataSourceId),
            eq(datasets.organizationId, organizationId),
            isNull(datasets.deletedAt)
          )
        );
    }

    return toDelete.map((d) => d.name);
  }

  // Find datasets to soft delete
  const toDelete = await db
    .select({ id: datasets.id, name: datasets.name })
    .from(datasets)
    .where(
      and(
        eq(datasets.dataSourceId, dataSourceId),
        eq(datasets.organizationId, organizationId),
        not(inArray(datasets.name, modelNames)),
        isNull(datasets.deletedAt)
      )
    );

  if (toDelete.length > 0) {
    const idsToDelete = toDelete.map((d) => d.id);

    await db
      .update(datasets)
      .set({
        deletedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(inArray(datasets.id, idsToDelete), isNull(datasets.deletedAt)));
  }

  return toDelete.map((d) => d.name);
}

/**
 * Get all active datasets for an organization and data source
 */
export async function getOrganizationDatasets(
  db: PostgresJsDatabase,
  organizationId: string,
  dataSourceId?: string
) {
  const conditions = [eq(datasets.organizationId, organizationId), isNull(datasets.deletedAt)];

  if (dataSourceId) {
    conditions.push(eq(datasets.dataSourceId, dataSourceId));
  }

  return db
    .select({
      id: datasets.id,
      name: datasets.name,
      dataSourceId: datasets.dataSourceId,
      schema: datasets.schema,
      database: datasets.databaseIdentifier,
    })
    .from(datasets)
    .where(and(...conditions));
}
