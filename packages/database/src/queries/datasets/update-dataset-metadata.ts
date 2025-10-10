import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { datasets } from '../../schema';
import { DatasetMetadataSchema } from '../../schema-types/dataset-metadata';

const InputSchema = z.object({
  dataSourceId: z.string().uuid('Data source ID must be a valid UUID'),
  databaseIdentifier: z.string().min(1, 'Database identifier is required'),
  schema: z.string().min(1, 'Schema is required'),
  databaseName: z.string().min(1, 'Database name is required'),
  name: z.string().min(1, 'Dataset/table name is required'),
  metadata: DatasetMetadataSchema,
});

export type UpdateDatasetMetadataInput = z.infer<typeof InputSchema>;

/**
 * Update dataset metadata with table statistics and column profiles
 * @param input - Dataset identifiers and metadata from statistics collection
 * @returns The updated dataset record
 */
export async function updateDatasetMetadata(input: UpdateDatasetMetadataInput) {
  const validated = InputSchema.parse(input);

  const result = await db
    .update(datasets)
    .set({
      metadata: validated.metadata,
      updatedAt: sql`NOW()`,
    })
    .where(
      and(
        eq(datasets.dataSourceId, validated.dataSourceId),
        eq(datasets.databaseIdentifier, validated.databaseIdentifier),
        eq(datasets.schema, validated.schema),
        eq(datasets.databaseName, validated.databaseName),
        eq(datasets.name, validated.name),
        isNull(datasets.deletedAt)
      )
    )
    .returning();

  if (!result[0]) {
    throw new Error(
      `Dataset not found: ${validated.databaseIdentifier}.${validated.schema}.${validated.name}`
    );
  }

  return result[0];
}
