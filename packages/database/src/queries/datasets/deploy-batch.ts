import { and, eq, isNull, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { parseDatabaseError } from '../../helpers/error-parser';
import { dataSources, datasets } from '../../schema';

// Local type definitions to avoid circular dependency
interface DeployModel {
  name: string;
  data_source_name: string;
  database?: string;
  schema: string;
  description?: string;
  sql_definition?: string;
  columns: Array<{
    name: string;
    type?: string;
    description?: string;
    semantic_type?: string;
    expr?: string;
    searchable?: boolean;
    agg?: string;
  }>;
  yml_file?: string;
}

export interface BatchDeployResult {
  successes: Array<{ name: string; dataSource: string; updated: boolean }>;
  failures: Array<{ name: string; dataSource: string; error: string }>;
  deleted: string[];
}

/**
 * Deploy multiple datasets in a single transaction for atomicity
 * All models are validated and deployed together, or the entire operation is rolled back
 */
export async function deployDatasetsBatch(
  db: PostgresJsDatabase,
  models: DeployModel[],
  userId: string,
  organizationId: string,
  deleteAbsentModels = true
): Promise<BatchDeployResult> {
  const debug = process.env.BUSTER_DEBUG === 'true';

  try {
    return await db.transaction(async (tx) => {
      const successes: BatchDeployResult['successes'] = [];
      const failures: BatchDeployResult['failures'] = [];
      const dataSourceCache = new Map<string, string>();

      // Validate all data sources exist
      const uniqueDataSources = [...new Set(models.map((m) => m.data_source_name))];
      for (const dsName of uniqueDataSources) {
        const [dataSource] = await tx
          .select({ id: dataSources.id })
          .from(dataSources)
          .where(
            and(
              eq(dataSources.name, dsName),
              eq(dataSources.organizationId, organizationId),
              isNull(dataSources.deletedAt)
            )
          )
          .limit(1);

        if (!dataSource) {
          throw new Error(`Data source '${dsName}' not found`);
        }
        dataSourceCache.set(dsName, dataSource.id);
      }

      // Deploy each model
      for (const model of models) {
        const dataSourceId = dataSourceCache.get(model.data_source_name);
        if (!dataSourceId) {
          throw new Error(`Data source ID not found in cache for ${model.data_source_name}`);
        }

        try {
          const updated = await upsertDatasetInTransaction(
            tx,
            model,
            userId,
            organizationId,
            dataSourceId
          );

          successes.push({
            name: model.name,
            dataSource: model.data_source_name,
            updated,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          failures.push({
            name: model.name,
            dataSource: model.data_source_name,
            error: message,
          });
          // In transaction mode, fail fast
          throw new Error(`Failed to deploy ${model.name}: ${message}`);
        }
      }

      // Handle soft deletion
      const deleted: string[] = [];
      if (deleteAbsentModels) {
        for (const [dsName, dsId] of dataSourceCache) {
          const modelNames = models.filter((m) => m.data_source_name === dsName).map((m) => m.name);

          if (modelNames.length === 0) continue;

          const toDelete = await tx
            .update(datasets)
            .set({
              deletedAt: sql`now()`,
              updatedAt: sql`now()`,
              updatedBy: userId,
            })
            .where(
              and(
                eq(datasets.dataSourceId, dsId),
                eq(datasets.organizationId, organizationId),
                isNull(datasets.deletedAt),
                sql`${datasets.name} NOT IN (${sql.join(
                  modelNames.map((n) => sql`${n}`),
                  sql`, `
                )})`
              )
            )
            .returning({ name: datasets.name });

          deleted.push(...toDelete.map((d) => d.name));
        }
      }

      if (debug) {
        console.info(
          `[deployDatasetsBatch] Deployed ${successes.length} models, deleted ${deleted.length}`
        );
      }

      return { successes, failures, deleted };
    });
  } catch (error) {
    const parsed = parseDatabaseError(error);
    console.error('[deployDatasetsBatch] Transaction failed:', parsed.message);

    // Return all models as failures
    return {
      successes: [],
      failures: models.map((m) => ({
        name: m.name,
        dataSource: m.data_source_name,
        error: parsed.message,
      })),
      deleted: [],
    };
  }
}

/**
 * Upsert a single dataset within a transaction
 */
async function upsertDatasetInTransaction(
  tx: PostgresJsDatabase,
  model: DeployModel,
  userId: string,
  organizationId: string,
  dataSourceId: string
): Promise<boolean> {
  // Check if exists
  const [existing] = await tx
    .select({ id: datasets.id })
    .from(datasets)
    .where(
      and(
        eq(datasets.name, model.name),
        eq(datasets.schema, model.schema),
        model.database
          ? eq(datasets.databaseIdentifier, model.database)
          : isNull(datasets.databaseIdentifier),
        eq(datasets.dataSourceId, dataSourceId),
        eq(datasets.organizationId, organizationId),
        isNull(datasets.deletedAt)
      )
    )
    .limit(1);

  const datasetData = {
    name: model.name,
    databaseName: model.database || model.schema,
    schema: model.schema,
    type: 'view' as const,
    definition: model.sql_definition || `SELECT * FROM ${model.schema}.${model.name}`,
    enabled: true,
    imported: true,
    dataSourceId,
    organizationId,
    updatedBy: userId,
    model: model.name,
    ymlFile: model.yml_file,
    databaseIdentifier: model.database,
    metadata: {
      rowCount: 0,
      sampleSize: 0,
      samplingMethod: 'none',
      columnProfiles: [],
      introspectedAt: new Date().toISOString(),
    },
    updatedAt: sql`now()`,
    deletedAt: null,
  };

  let datasetId: string;
  const isUpdate = !!existing;

  if (isUpdate) {
    datasetId = existing.id;
    await tx.update(datasets).set(datasetData).where(eq(datasets.id, datasetId));
  } else {
    const [result] = await tx
      .insert(datasets)
      .values({
        id: crypto.randomUUID(),
        ...datasetData,
        createdBy: userId,
        createdAt: sql`now()`,
      })
      .returning({ id: datasets.id });

    if (!result) {
      throw new Error('Failed to insert dataset');
    }
    datasetId = result.id;
  }

  // Column updates are no longer supported - datasetColumns table has been deprecated
  // await updateColumnsInTransaction(tx, datasetId, model.columns);

  return isUpdate;
}

/**
 * Update dataset columns within a transaction
 * @deprecated datasetColumns table has been deprecated and moved to deprecated schema
 */
// async function updateColumnsInTransaction(
//   tx: PostgresJsDatabase,
//   datasetId: string,
//   columns: DeployModel['columns']
// ): Promise<void> {
//   // Function deprecated - datasetColumns table no longer exists
// }
