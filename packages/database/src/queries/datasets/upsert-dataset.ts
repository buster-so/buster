import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { datasets } from '../../schema';
import type { DatasetMetadata } from '../../types/dataset-metadata';

const InputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  databaseName: z.string().min(1, 'Database name is required'),
  databaseIdentifier: z.string().min(1, 'Database identifier is required'),
  schema: z.string().min(1, 'Schema is required'),
  type: z.enum(['table', 'view', 'materializedView']),
  definition: z.string().min(1, 'Definition is required'),
  dataSourceId: z.string().uuid('Data source ID must be a valid UUID'),
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  createdBy: z.string().uuid('Created by must be a valid UUID'),
  updatedBy: z.string().uuid('Updated by must be a valid UUID'),
});

export type UpsertDatasetInput = z.infer<typeof InputSchema>;

/**
 * Upsert a dataset record for introspected tables
 * Uses soft delete pattern - sets deleted_at to NULL on upsert
 * @param input - Dataset information from introspection
 * @returns The created or updated dataset record
 */
export async function upsertDataset(input: UpsertDatasetInput) {
  const validated = InputSchema.parse(input);

  // Create a valid empty metadata object
  const emptyMetadata: DatasetMetadata = {
    rowCount: 0,
    sampleSize: 0,
    samplingMethod: 'PENDING',
    columnProfiles: [],
    introspectedAt: new Date().toISOString(),
  };

  const result = await db
    .insert(datasets)
    .values({
      ...validated,
      enabled: false,
      imported: false,
      ymlFile: null,
      model: null,
      metadata: emptyMetadata,
      whenToUse: null,
      whenNotToUse: null,
    })
    .onConflictDoUpdate({
      target: [datasets.databaseName, datasets.dataSourceId],
      set: {
        databaseIdentifier: validated.databaseIdentifier,
        schema: validated.schema,
        type: validated.type,
        definition: validated.definition,
        updatedBy: validated.updatedBy,
        updatedAt: sql`NOW()`,
        deletedAt: null, // Undelete if previously soft deleted
      },
    })
    .returning();

  if (!result[0]) {
    throw new Error('Failed to upsert dataset');
  }

  return result[0];
}
