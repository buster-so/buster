/**
 * Turbopuffer client with composable functions and Zod validation
 * This is a refactored version emphasizing functional composition
 */

import Turbopuffer from '@turbopuffer/turbopuffer';
import type { Filter } from '@turbopuffer/turbopuffer/resources/custom';
import type { Namespace } from '@turbopuffer/turbopuffer/resources/namespaces';
import { z } from 'zod';
import {
  createUniqueKey,
  generateNamespace,
  isValidForEmbedding,
  type SearchableValue,
  SearchableValueSchema,
  type SearchRequest,
  SearchRequestSchema,
  type SearchResponse,
  type TurbopufferQuery,
  TurbopufferQuerySchema,
  type UpsertResult,
  UpsertResultSchema,
} from './types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for a single row returned from Turbopuffer query
 */
const TurbopufferRowSchema = z.object({
  id: z.string(),
  $dist: z.number().optional(),
  value: z.string(),
  database: z.string(),
  schema: z.string(),
  table: z.string(),
  column: z.string(),
  synced_at: z.string(),
});

/**
 * Schema for fused result after reciprocal rank fusion
 */
const FusedResultSchema = TurbopufferRowSchema.extend({
  fusedScore: z.number(),
});

/**
 * Schema for multiQuery response from Turbopuffer
 */
const TurbopufferMultiQueryResponseSchema = z.object({
  results: z.array(
    z.object({
      rows: z.array(TurbopufferRowSchema),
    })
  ),
});

// Inferred types from schemas
type TurbopufferRow = z.infer<typeof TurbopufferRowSchema>;
type FusedResult = z.infer<typeof FusedResultSchema>;

const DataSourceIdSchema = z.string().uuid();

const DeleteKeysInputSchema = z.object({
  dataSourceId: DataSourceIdSchema,
  keys: z.array(z.string()),
});

const UpsertInputSchema = z.object({
  dataSourceId: DataSourceIdSchema,
  values: z.array(SearchableValueSchema),
});

const QueryInputSchema = z.object({
  dataSourceId: DataSourceIdSchema,
  query: TurbopufferQuerySchema.omit({ dataSourceId: true }),
});

const GetAllInputSchema = z.object({
  dataSourceId: DataSourceIdSchema,
  limit: z.number().int().min(1).max(1200).optional().default(1000),
});

// ============================================================================
// ERROR TYPES (keeping minimal class for error handling)
// ============================================================================

export class TurbopufferError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'TurbopufferError';
  }
}

// ============================================================================
// PURE UTILITY FUNCTIONS
// ============================================================================

/**
 * Determine if an error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof TurbopufferError) return error.retryable;
  if (!(error instanceof Error)) return false;

  const retryablePatterns = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'fetch failed',
    'network',
    'rate limit',
    'too many requests',
    '429',
  ];

  const errorMessage = error.message.toLowerCase();
  return retryablePatterns.some((pattern) => errorMessage.includes(pattern.toLowerCase()));
};

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (
  attempt: number,
  baseDelay = 1000,
  maxDelay = 10000
): number => Math.min(baseDelay * 2 ** attempt, maxDelay);

/**
 * Build Turbopuffer filter from query
 */
export const buildFilter = (query: Partial<TurbopufferQuery>): Filter | undefined => {
  const filters: Filter[] = [];

  if (query.database) filters.push(['database', 'Eq', query.database]);
  if (query.schema) filters.push(['schema', 'Eq', query.schema]);
  if (query.table) filters.push(['table', 'Eq', query.table]);
  if (query.column) filters.push(['column', 'Eq', query.column]);

  return filters.length === 0 ? undefined : filters.length === 1 ? filters[0] : ['And', filters];
};

/**
 * Transform SearchableValue to columnar format for batch operations
 */
export const valuesToColumns = (values: SearchableValue[]) => {
  const ids = values.map(createUniqueKey);
  const vectors = values.map((v) => v.embedding || []);

  return {
    id: ids,
    vector: vectors,
    database: values.map((v) => v.database),
    schema: values.map((v) => v.schema),
    table: values.map((v) => v.table),
    column: values.map((v) => v.column),
    value: values.map((v) => v.value),
    synced_at: values.map((v) => v.synced_at || new Date().toISOString()),
  };
};

/**
 * Partition array into chunks
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// ============================================================================
// CLIENT FACTORY
// ============================================================================

/**
 * Create a Turbopuffer client with validated API key and region
 */
export const createClient = (): Turbopuffer => {
  const apiKey = process.env.TURBOPUFFER_API_KEY;
  const region = process.env.TURBOPUFFER_REGION || 'aws-us-east-1';

  if (!apiKey) {
    throw new TurbopufferError(
      'TURBOPUFFER_API_KEY environment variable is not set',
      'MISSING_API_KEY',
      false
    );
  }

  return new Turbopuffer({
    apiKey,
    region,
  });
};

/**
 * Get namespace for a data source
 */
export const getNamespace = (dataSourceId: string): Namespace => {
  const validatedId = DataSourceIdSchema.parse(dataSourceId);
  const client = createClient();
  return client.namespace(generateNamespace(validatedId));
};

// ============================================================================
// RETRY WRAPPER (Higher-order function)
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

/**
 * Higher-order function to add retry logic to any async operation
 */
export const withRetry = <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  const attemptOperation = async (attempt = 0): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);
      console.warn(`Retrying operation (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return attemptOperation(attempt + 1);
    }
  };

  return attemptOperation();
};

// ============================================================================
// CORE OPERATIONS (Composable functions)
// ============================================================================

/**
 * Check if namespace exists (will be created on first write)
 */
export const checkNamespaceExists = async (dataSourceId: string): Promise<boolean> => {
  const validatedId = DataSourceIdSchema.parse(dataSourceId);
  const ns = getNamespace(validatedId);

  return withRetry(async () => {
    try {
      return await ns.exists();
    } catch (error) {
      // Namespace doesn't exist yet, will be created on first write
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      throw error;
    }
  });
};

/**
 * Query existing keys with validation
 * Note: Turbopuffer has a maximum top_k limit of 1200
 * For larger datasets, this will return up to 1200 most recent values
 */
export const queryExistingKeys = async (
  input: z.infer<typeof QueryInputSchema>
): Promise<string[]> => {
  const validated = QueryInputSchema.parse(input);
  const ns = getNamespace(validated.dataSourceId);
  const filter = buildFilter(validated.query);

  return withRetry(async () => {
    const response = await ns.query({
      top_k: 1200, // Maximum allowed by Turbopuffer
      ...(filter && { filters: filter }),
      include_attributes: ['database', 'schema', 'table', 'column', 'value'],
    });

    return (response.rows || []).map((row: unknown) => {
      const attrs = ((row as Record<string, unknown>).attributes as Record<string, unknown>) || {};
      return createUniqueKey({
        database: attrs.database as string,
        schema: attrs.schema as string,
        table: attrs.table as string,
        column: attrs.column as string,
        value: attrs.value as string,
      });
    });
  });
};

/**
 * Process a single batch of upserts
 */
const processBatch = async (
  ns: Namespace,
  batch: SearchableValue[]
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    // Validate all values have embeddings
    const invalidValues = batch.filter((v) => !v.embedding || v.embedding.length === 0);
    if (invalidValues.length > 0) {
      throw new Error(`${invalidValues.length} values missing valid embeddings`);
    }

    const columns = valuesToColumns(batch);
    await ns.write({
      upsert_columns: columns,
      distance_metric: 'cosine_distance',
      // Enable full-text search on the value field for BM25 search
      schema: {
        value: { type: 'string', full_text_search: true },
        database: { type: 'string' },
        schema: { type: 'string' },
        table: { type: 'string' },
        column: { type: 'string' },
        synced_at: { type: 'string' },
      },
    });

    return { success: true, count: batch.length };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Upsert searchable values with validation and batching
 */
export const upsertSearchableValues = async (
  input: z.infer<typeof UpsertInputSchema>
): Promise<UpsertResult> => {
  const validated = UpsertInputSchema.parse(input);

  if (validated.values.length === 0) {
    return {
      namespace: generateNamespace(validated.dataSourceId),
      upserted: 0,
    };
  }

  const ns = getNamespace(validated.dataSourceId);
  const batches = chunk(validated.values, 100);

  return withRetry(async () => {
    const results = await Promise.all(batches.map((batch) => processBatch(ns, batch)));

    const totalUpserted = results.filter((r) => r.success).reduce((sum, r) => sum + r.count, 0);

    const errors = results.filter((r) => !r.success && r.error).map((r) => r.error as string);

    return UpsertResultSchema.parse({
      namespace: generateNamespace(validated.dataSourceId),
      upserted: totalUpserted,
      ...(errors.length > 0 && { errors }),
    });
  });
};

/**
 * Delete searchable values with validation
 */
export const deleteSearchableValues = async (
  input: z.infer<typeof DeleteKeysInputSchema>
): Promise<{ deleted: number }> => {
  const validated = DeleteKeysInputSchema.parse(input);

  if (validated.keys.length === 0) {
    return { deleted: 0 };
  }

  const ns = getNamespace(validated.dataSourceId);
  const batches = chunk(validated.keys, 100);

  return withRetry(async () => {
    let totalDeleted = 0;

    for (const batch of batches) {
      try {
        await ns.write({ deletes: batch });
        totalDeleted += batch.length;
      } catch (error) {
        console.error(
          `Failed to delete batch:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return { deleted: totalDeleted };
  });
};

/**
 * Get all searchable values with validation
 */
export const getAllSearchableValues = async (
  input: z.infer<typeof GetAllInputSchema>
): Promise<SearchableValue[]> => {
  const validated = GetAllInputSchema.parse(input);
  const ns = getNamespace(validated.dataSourceId);

  return withRetry(async () => {
    const response = await ns.query({
      top_k: validated.limit,
      include_attributes: ['database', 'schema', 'table', 'column', 'value', 'synced_at'],
    });

    return (response.rows || []).map((row: unknown) =>
      SearchableValueSchema.parse({
        database: ((row as Record<string, unknown>).attributes as Record<string, unknown>)
          ?.database as string,
        schema: ((row as Record<string, unknown>).attributes as Record<string, unknown>)
          ?.schema as string,
        table: ((row as Record<string, unknown>).attributes as Record<string, unknown>)
          ?.table as string,
        column: ((row as Record<string, unknown>).attributes as Record<string, unknown>)
          ?.column as string,
        value: ((row as Record<string, unknown>).attributes as Record<string, unknown>)
          ?.value as string,
        synced_at: ((row as Record<string, unknown>).attributes as Record<string, unknown>)
          ?.synced_at as string,
        // Note: vectors not available from query response
      })
    );
  });
};

/**
 * Reciprocal Rank Fusion for combining multiple result lists
 * Combines results from different ranking methods (vector similarity and BM25)
 */
const reciprocalRankFusion = (resultLists: TurbopufferRow[][], k = 60): FusedResult[] => {
  const scores: Map<string, number> = new Map();
  const allResults: Map<string, TurbopufferRow> = new Map();

  for (const results of resultLists) {
    for (let rank = 1; rank <= results.length; rank++) {
      const item = results[rank - 1];
      if (!item) continue; // Skip if item doesn't exist

      const id = item.id;

      // Calculate RRF score
      const currentScore = scores.get(id) || 0;
      scores.set(id, currentScore + 1.0 / (k + rank));

      // Store the full result object
      if (!allResults.has(id)) {
        allResults.set(id, item);
      }
    }
  }

  // Sort by RRF score and return combined results
  const fusedResults: FusedResult[] = [];

  Array.from(scores.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([id, score]) => {
      const result = allResults.get(id);
      if (result) {
        fusedResults.push({ ...result, fusedScore: score });
      }
    });

  return fusedResults;
};

/**
 * Search for similar values using hybrid search (vector + BM25)
 */
export const searchSimilarValues = async (
  request: SearchRequest,
  queryEmbedding?: number[]
): Promise<SearchResponse> => {
  const validated = SearchRequestSchema.parse(request);

  if (!queryEmbedding || queryEmbedding.length !== 1536) {
    throw new TurbopufferError(
      'Query embedding is required for similarity search (1536 dimensions)',
      'MISSING_EMBEDDING',
      false
    );
  }

  const ns = getNamespace(validated.dataSourceId);
  const filter = buildFilter(validated.filters || {});
  const startTime = Date.now();

  // Use 30 as default limit (as mentioned for stored values)
  const topK = validated.limit || 30;

  return withRetry(async () => {
    // Perform hybrid search with both vector and BM25
    const response = await ns.multiQuery({
      queries: [
        // Vector similarity search
        {
          rank_by: ['vector', 'ANN', queryEmbedding],
          top_k: topK,
          ...(filter && { filters: filter }),
          include_attributes: ['database', 'schema', 'table', 'column', 'value', 'synced_at'],
        },
        // BM25 full-text search on the value field
        {
          rank_by: ['value', 'BM25', validated.query],
          top_k: topK,
          ...(filter && { filters: filter }),
          include_attributes: ['database', 'schema', 'table', 'column', 'value', 'synced_at'],
        },
      ],
    });

    // Validate and extract results from both queries
    const parsedResponse = TurbopufferMultiQueryResponseSchema.parse(response);
    const vectorResults = parsedResponse.results[0]?.rows || [];
    const bm25Results = parsedResponse.results[1]?.rows || [];

    // Apply reciprocal rank fusion to combine results
    const fusedResults = reciprocalRankFusion([vectorResults, bm25Results]);

    // Process and format the fused results with proper types
    const results = fusedResults
      .slice(0, topK) // Limit to requested number of results
      .map((row) => {
        // For fused results, use the fused score as similarity
        const similarity = row.fusedScore || (row.$dist ? 1 - row.$dist : 0);

        return {
          value: row.value,
          database: row.database,
          schema: row.schema,
          table: row.table,
          column: row.column,
          similarity,
          synced_at: row.synced_at,
        };
      })
      .filter((result) => {
        // Apply similarity threshold if specified
        return !validated.similarityThreshold || result.similarity >= validated.similarityThreshold;
      });

    return {
      results,
      totalCount: results.length,
      query: validated.query,
      processingTime: Date.now() - startTime,
    };
  });
};

// ============================================================================
// CONVENIENCE EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Ensure namespace exists (namespaces are auto-created on first write in TurboPuffer)
 * This function verifies the namespace can be accessed and logs the status
 */
export const createNamespaceIfNotExists = async (dataSourceId: string): Promise<void> => {
  const validatedId = DataSourceIdSchema.parse(dataSourceId);
  const namespaceName = generateNamespace(validatedId);

  try {
    const exists = await checkNamespaceExists(validatedId);
    if (exists) {
      console.info(`TurboPuffer namespace ${namespaceName} already exists`);
    } else {
      console.info(`TurboPuffer namespace ${namespaceName} will be created on first write`);
      // Note: TurboPuffer auto-creates namespaces on first write
      // We cannot explicitly create empty namespaces
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to check TurboPuffer namespace ${namespaceName}: ${errorMsg}`);
    throw new TurbopufferError(
      `Failed to verify namespace ${namespaceName}: ${errorMsg}`,
      'NAMESPACE_CHECK_FAILED',
      true
    );
  }
};
