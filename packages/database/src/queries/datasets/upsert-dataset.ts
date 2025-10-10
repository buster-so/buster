import { and, eq, isNull, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';
import { db } from '../../connection';
import { getErrorHint, parseDatabaseError } from '../../helpers/error-parser';
import { datasets } from '../../schema';

// Define the schema for upserting a dataset
export const UpsertDatasetSchema = z.object({
  name: z.string(),
  dataSourceId: z.string().uuid(),
  organizationId: z.string().uuid(),
  database: z.string().optional(),
  schema: z.string(),
  description: z.string().optional(),
  sql_definition: z.string().optional(),
  yml_file: z.string().optional(),
  userId: z.string().uuid(),
});

export type UpsertDatasetParams = z.infer<typeof UpsertDatasetSchema>;

/**
 * Upsert a dataset
 * Returns the dataset ID and whether it was updated or created
 */
export async function upsertDataset(
  params: UpsertDatasetParams
): Promise<{ datasetId: string; updated: boolean }> {
  // Validate params at runtime
  const validatedParams = UpsertDatasetSchema.parse(params);
  const { name, dataSourceId, organizationId, database, schema, sql_definition, yml_file, userId } =
    validatedParams;

  const debug = process.env.BUSTER_DEBUG === 'true';

  if (debug) {
    console.info(`[upsertDataset] Starting upsert for dataset: ${name}`);
    console.info(`[upsertDataset] Data source ID: ${dataSourceId}`);
  }

  try {
    // First check if dataset exists (needed for soft delete handling)
    // Must check all fields that are part of the unique constraint
    const existingDataset = await db
      .select({ id: datasets.id })
      .from(datasets)
      .where(
        and(
          eq(datasets.name, name),
          eq(datasets.schema, schema),
          database
            ? eq(datasets.databaseIdentifier, database)
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
    const datasetData = {
      name,
      databaseName: database || schema,
      schema,
      type: 'view' as const,
      definition: sql_definition || `SELECT * FROM ${schema}.${name}`,
      enabled: true,
      imported: true,
      dataSourceId,
      organizationId,
      updatedBy: userId,
      model: name,
      ymlFile: yml_file,
      databaseIdentifier: database,
      metadata: {
        rowCount: 0,
        sampleSize: 0,
        samplingMethod: 'none',
        columnProfiles: [],
        introspectedAt: new Date().toISOString(),
      },
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

    if (debug) {
      console.info(`[upsertDataset] Successfully upserted dataset: ${name}`);
    }

    return { datasetId, updated: isUpdate };
  } catch (error) {
    const parsed = parseDatabaseError(error);
    const hint = getErrorHint(parsed);

    // Log detailed error information
    console.error(`[upsertDataset] Failed to upsert dataset: ${name}`);
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
      console.error(`[upsertDataset] Dataset data:`, JSON.stringify(params, null, 2));
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
