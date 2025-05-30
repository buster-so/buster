import { z } from 'zod';

/**
 * UUID validation schema
 */
export const UuidSchema = z.string().uuid();

/**
 * Schema for a stored value result from the database
 */
export const StoredValueResultSchema = z.object({
  id: z.string(),
  value: z.string(),
  database_name: z.string(),
  column_name: z.string(),
  table_name: z.string(),
  schema_name: z.string(),
  synced_at: z.date().nullable(),
});

export type StoredValueResult = z.infer<typeof StoredValueResultSchema>;

/**
 * Schema for a search target
 */
export const SearchTargetSchema = z.object({
  database_name: z.string().min(1),
  schema_name: z.string().min(1),
  table_name: z.string().min(1),
  column_name: z.string().min(1),
});

export type SearchTarget = z.infer<typeof SearchTargetSchema>;

/**
 * Schema for embedding array (1536 dimensions for text-embedding-3-small)
 */
export const EmbeddingSchema = z.array(z.number()).length(1536);

/**
 * Schema for search options
 */
export const SearchOptionsSchema = z.object({
  /**
   * Maximum number of results to return
   * @default 10
   */
  limit: z.number().int().positive().max(1000).default(10),

  /**
   * Minimum similarity score (0-1) for results
   * @default undefined (no threshold)
   */
  similarityThreshold: z.number().min(0).max(1).optional(),
});

export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

/**
 * Schema for embedding generation options
 */
export const EmbeddingOptionsSchema = z.object({
  /**
   * Maximum number of retries for embedding generation
   * @default 3
   */
  maxRetries: z.number().int().min(0).max(10).default(3),

  /**
   * Abort signal for cancellation
   */
  abortSignal: z.instanceof(AbortSignal).optional(),
});

export type EmbeddingOptions = z.infer<typeof EmbeddingOptionsSchema>;

/**
 * Schema for search input validation
 */
export const SearchInputSchema = z.object({
  dataSourceId: UuidSchema,
  queryEmbedding: EmbeddingSchema,
  options: SearchOptionsSchema.optional(),
});

/**
 * Schema for filtered search input
 */
export const FilteredSearchInputSchema = SearchInputSchema.extend({
  databaseName: z.string().optional(),
  schemaName: z.string().optional(),
  tableName: z.string().optional(),
  columnName: z.string().optional(),
});

/**
 * Schema for parallel search input
 */
export const ParallelSearchInputSchema = z.object({
  dataSourceId: UuidSchema,
  queryEmbedding: EmbeddingSchema,
  targets: z.array(SearchTargetSchema).min(1).max(100),
  limitPerTarget: z.number().int().positive().max(100).default(10),
});

/**
 * Schema for YAML dataset content
 */
export const DatasetYamlSchema = z.object({
  database: z.string().default('unknown'),
  tables: z
    .array(
      z.object({
        name: z.string().optional(),
        table: z.string().optional(),
        schema: z.string().default('public'),
        columns: z
          .array(
            z.object({
              name: z.string().default('unknown_column'),
              type: z.string().default(''),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

/**
 * Validate and parse search terms
 */
export const SearchTermsSchema = z.array(z.string().trim()).min(1).max(100);
