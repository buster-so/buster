import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { datasets } from '../../schema';

/**
 * Parameters for getting dataset metadata
 */
const GetDatasetMetadataParamsSchema = z.object({
  database: z.string().describe('Database name'),
  schema: z.string().describe('Schema name'),
  name: z.string().describe('Dataset/table name'),
  organizationId: z.string().uuid().describe('Organization UUID'),
});

type GetDatasetMetadataParams = z.infer<typeof GetDatasetMetadataParamsSchema>;

/**
 * Get dataset metadata by database, schema, name, and organization
 * Returns only the metadata column from the matching dataset
 */
export async function getDatasetMetadata(params: GetDatasetMetadataParams) {
  const validated = GetDatasetMetadataParamsSchema.parse(params);

  const conditions = [
    eq(datasets.databaseName, validated.database),
    eq(datasets.schema, validated.schema),
    eq(datasets.name, validated.name),
    eq(datasets.organizationId, validated.organizationId),
    isNull(datasets.deletedAt),
  ];

  const result = await db
    .select({
      metadata: datasets.metadata,
    })
    .from(datasets)
    .where(and(...conditions))
    .limit(1);

  return result[0] || null;
}
