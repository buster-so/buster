import { and, eq, isNull, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { getErrorHint, parseDatabaseError } from '../../helpers/error-parser';
import { datasetColumns, datasets } from '../../schema';

// Export input type for consistency with other queries
export type UpsertDatasetInput = {
  model: DeployModel;
  userId: string;
  organizationId: string;
  dataSourceId: string;
};

// Import the actual type from the proper location
import type { DatasetMetadata } from '../../types/dataset-metadata';

// Local type definitions to avoid circular dependency
interface DeployColumn {
  name: string;
  type?: string;
  description?: string;
  semantic_type?: string;
  expr?: string;
  searchable?: boolean;
  agg?: string;
}

interface DeployModel {
  name: string;
  data_source_name: string;
  database?: string;
  schema: string;
  description?: string;
  sql_definition?: string;
  columns: DeployColumn[];
  yml_file?: string;
  metrics?: unknown[];
  filters?: unknown[];
  relationships?: unknown[];
}

/**
 * Upsert a dataset and its columns
 * Returns the dataset ID and whether it was updated or created
 */
export async function upsertDataset(
  db: PostgresJsDatabase,
  model: DeployModel,
  userId: string,
  organizationId: string,
  dataSourceId: string
): Promise<{ datasetId: string; updated: boolean }> {
  const debug = process.env.BUSTER_DEBUG === 'true';

  if (debug) {
    console.info(`[upsertDataset] Starting upsert for model: ${model.name}`);
    console.info(`[upsertDataset] Data source: ${model.data_source_name} (${dataSourceId})`);
  }

  try {
    // First check if dataset exists (needed for soft delete handling)
    // Must check all fields that are part of the unique constraint
    const existingDataset = await db
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

    const isUpdate = existingDataset.length > 0;

    if (debug) {
      console.info(`[upsertDataset] Dataset exists: ${isUpdate}`);
    }

    // Prepare the dataset data
    const emptyMetadata: DatasetMetadata = {
      rowCount: 0,
      sampleSize: 0,
      samplingMethod: 'PENDING',
      columnProfiles: [],
      introspectedAt: new Date().toISOString(),
    };

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
      metadata: emptyMetadata,
      updatedAt: sql`now()`,
      deletedAt: null, // Ensure we're not soft-deleted
    };

    let datasetId: string;

    if (isUpdate) {
      const dataset = existingDataset[0];
      if (!dataset) {
        throw new Error('Dataset not found');
      }
      datasetId = dataset.id;

      if (debug) {
        console.info(`[upsertDataset] Updating existing dataset: ${datasetId}`);
      }

      await db.update(datasets).set(datasetData).where(eq(datasets.id, datasetId));
    } else {
      if (debug) {
        console.info(`[upsertDataset] Creating new dataset`);
      }

      const result = await db
        .insert(datasets)
        .values({
          id: crypto.randomUUID(),
          ...datasetData,
          createdBy: userId,
          createdAt: sql`now()`,
        })
        .returning({ id: datasets.id });

      const insertedDataset = result[0];
      if (!insertedDataset) {
        throw new Error('Failed to insert dataset');
      }
      datasetId = insertedDataset.id;

      if (debug) {
        console.info(`[upsertDataset] Created dataset: ${datasetId}`);
      }
    }

    // Upsert columns
    if (debug) {
      console.info(`[upsertDataset] Upserting ${model.columns.length} columns`);
    }

    await upsertDatasetColumns(db, datasetId, model.columns);

    if (debug) {
      console.info(`[upsertDataset] Successfully upserted model: ${model.name}`);
    }

    return { datasetId, updated: isUpdate };
  } catch (error) {
    const parsed = parseDatabaseError(error);
    const hint = getErrorHint(parsed);

    // Log detailed error information
    console.error(`[upsertDataset] Failed to upsert model: ${model.name}`);
    console.error(`[upsertDataset] Error type: ${parsed.type}`);
    console.error(`[upsertDataset] Error message: ${parsed.message}`);
    if (parsed.detail) {
      console.error(`[upsertDataset] Detail: ${parsed.detail}`);
    }
    if (hint) {
      console.error(`[upsertDataset] Hint: ${hint}`);
    }

    if (debug) {
      console.error(`[upsertDataset] Full error:`, parsed.originalError);
      console.error(`[upsertDataset] Model data:`, JSON.stringify(model, null, 2));
    }

    // Create enhanced error message
    let errorMessage = parsed.message;
    if (hint) {
      errorMessage += `. ${hint}`;
    }

    const enhancedError = new Error(errorMessage) as Error & { parsedError: typeof parsed };
    enhancedError.parsedError = parsed;
    throw enhancedError;
  }
}

/**
 * Upsert columns for a dataset
 * Deletes columns not in the new list and upserts the provided columns
 */
async function upsertDatasetColumns(
  db: PostgresJsDatabase,
  datasetId: string,
  columns: DeployColumn[]
): Promise<void> {
  // Get existing columns
  const existingColumns = await db
    .select({ name: datasetColumns.name })
    .from(datasetColumns)
    .where(and(eq(datasetColumns.datasetId, datasetId), isNull(datasetColumns.deletedAt)));

  const existingColumnNames = new Set(existingColumns.map((c) => c.name));
  const newColumnNames = new Set(columns.map((c) => c.name));

  // Soft delete columns that are no longer in the model
  const columnsToDelete = existingColumns.filter((c) => !newColumnNames.has(c.name));
  if (columnsToDelete.length > 0) {
    await db
      .update(datasetColumns)
      .set({
        deletedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(datasetColumns.datasetId, datasetId),
          sql`${datasetColumns.name} IN (${sql.join(
            columnsToDelete.map((c) => sql`${c.name}`),
            sql`, `
          )})`
        )
      );
  }

  // Upsert columns
  for (const column of columns) {
    const columnData = {
      datasetId,
      name: column.name,
      type: column.type || 'string',
      description: column.description || null,
      nullable: true,
      semanticType: column.semantic_type,
      expr: column.expr,
      updatedAt: sql`now()`,
    };

    if (existingColumnNames.has(column.name)) {
      // Update existing column
      await db
        .update(datasetColumns)
        .set(columnData)
        .where(
          and(
            eq(datasetColumns.datasetId, datasetId),
            eq(datasetColumns.name, column.name),
            isNull(datasetColumns.deletedAt)
          )
        );
    } else {
      // Insert new column
      await db.insert(datasetColumns).values({
        id: crypto.randomUUID(),
        ...columnData,
        createdAt: sql`now()`,
      });
    }
  }
}
