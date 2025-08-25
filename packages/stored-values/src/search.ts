import { openai } from '@ai-sdk/openai';
import { getClient } from '@buster/database';
import { embed } from 'ai';
import {
  type EmbeddingOptions,
  EmbeddingOptionsSchema,
  EmbeddingSchema,
  ParallelSearchInputSchema,
  type SearchOptions,
  SearchOptionsSchema,
  type SearchTarget,
  SearchTargetSchema,
  SearchTermsSchema,
  type StoredValueResult,
  UuidSchema,
} from './schemas';
import { formatSchemaName } from './utils';

/**
 * Custom error class for stored values operations
 */
export class StoredValuesError extends Error {
  constructor(
    message: string,
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'StoredValuesError';
  }
}

/**
 * Searches for values based on semantic similarity using embeddings.
 *
 * @param dataSourceId - UUID of the data source to construct the schema name
 * @param queryEmbedding - The pre-computed embedding array for the query (1536 dimensions)
 * @param options - Search options including limit and similarity threshold
 * @returns A Promise containing an array of StoredValueResult ordered by similarity
 *
 * @throws {StoredValuesError} When validation fails or database operation fails
 *
 * @example
 * ```typescript
 * const embedding = await generateEmbedding(['user email']);
 * const results = await searchValuesByEmbedding(
 *   'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
 *   embedding,
 *   { limit: 10, similarityThreshold: 0.7 }
 * );
 * ```
 */
export async function searchValuesByEmbedding(
  dataSourceId: string,
  queryEmbedding: number[],
  options: SearchOptions = {
    limit: 10,
  }
): Promise<StoredValueResult[]> {
  try {
    // Validate inputs
    const validDataSourceId = UuidSchema.parse(dataSourceId);
    const validEmbedding = EmbeddingSchema.parse(queryEmbedding);
    const validOptions = SearchOptionsSchema.parse(options);

    const schemaName = formatSchemaName(validDataSourceId);
    const client = await getClient();

    // Build similarity expression with optional threshold
    const similarityExpr = validOptions.similarityThreshold
      ? '1 - (embedding <=> $1) as similarity'
      : 'embedding <=> $1 as distance';

    const whereClause = validOptions.similarityThreshold
      ? 'WHERE 1 - (embedding <=> $1) >= $3'
      : '';

    const orderClause = validOptions.similarityThreshold
      ? 'ORDER BY similarity DESC'
      : 'ORDER BY distance ASC';

    // Use parameterized query with postgres.js template literals
    const query = validOptions.similarityThreshold
      ? `
        SELECT
          id, value, database_name, column_name, table_name, schema_name, synced_at,
          ${similarityExpr}
        FROM "${schemaName}"."searchable_column_values"
        ${whereClause}
        ${orderClause}
        LIMIT $2
      `
      : `
        SELECT
          id, value, database_name, column_name, table_name, schema_name, synced_at,
          ${similarityExpr}
        FROM "${schemaName}"."searchable_column_values"
        ${orderClause}
        LIMIT $2
      `;

    // Format embedding as PostgreSQL array literal for halfvec
    const embeddingLiteral = `[${validEmbedding.join(',')}]`;

    const params = validOptions.similarityThreshold
      ? [embeddingLiteral, validOptions.limit, validOptions.similarityThreshold]
      : [embeddingLiteral, validOptions.limit];

    const results = await client.unsafe(query, params);
    return results as unknown as StoredValueResult[]; //TODO: fix this to make it more type safe
  } catch (error) {
    if (error instanceof Error) {
      throw new StoredValuesError(`Failed to search values by embedding: ${error.message}`, error);
    }
    throw new StoredValuesError('Failed to search values by embedding', error);
  }
}

/**
 * Searches for values based on semantic similarity using embeddings with specific filters.
 *
 * @param dataSourceId - UUID of the data source to construct the schema name
 * @param queryEmbedding - The pre-computed embedding array for the query (1536 dimensions)
 * @param options - Search options including limit and similarity threshold
 * @param databaseName - Optional filter for database name
 * @param schemaName - Optional filter for schema name within the source database
 * @param tableName - Optional filter for table name
 * @param columnName - Optional filter for column name
 * @returns A Promise containing an array of StoredValueResult ordered by similarity
 *
 * @throws {StoredValuesError} When validation fails or database operation fails
 *
 * @example
 * ```typescript
 * const results = await searchValuesByEmbeddingWithFilters(
 *   'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
 *   embedding,
 *   { limit: 10 },
 *   'production',  // database filter
 *   'public',      // schema filter
 *   'users',       // table filter
 *   'email'        // column filter
 * );
 * ```
 */
export async function searchValuesByEmbeddingWithFilters(
  dataSourceId: string,
  queryEmbedding: number[],
  options: SearchOptions = { limit: 10 },
  databaseName?: string,
  schemaName?: string,
  tableName?: string,
  columnName?: string
): Promise<StoredValueResult[]> {
  try {
    // Validate inputs
    const validDataSourceId = UuidSchema.parse(dataSourceId);
    const validEmbedding = EmbeddingSchema.parse(queryEmbedding);
    const validOptions = SearchOptionsSchema.parse(options);

    const pgSchemaName = formatSchemaName(validDataSourceId);
    const client = await getClient();

    // Build filter conditions and parameters
    const filters: string[] = [];
    // Format embedding as PostgreSQL array literal for halfvec
    const embeddingLiteral = `[${validEmbedding.join(',')}]`;
    const params = [embeddingLiteral, validOptions.limit];
    let paramIndex = 3;

    if (databaseName !== undefined) {
      filters.push(`database_name = $${paramIndex}`);
      params.push(databaseName);
      paramIndex++;
    }

    if (schemaName !== undefined) {
      filters.push(`schema_name = $${paramIndex}`);
      params.push(schemaName);
      paramIndex++;
    }

    if (tableName !== undefined) {
      filters.push(`table_name = $${paramIndex}`);
      params.push(tableName);
      paramIndex++;
    }

    if (columnName !== undefined) {
      filters.push(`column_name = $${paramIndex}`);
      params.push(columnName);
      paramIndex++;
    }

    // Add similarity threshold filter if provided
    if (validOptions.similarityThreshold !== undefined) {
      filters.push(`1 - (embedding <=> $1) >= $${paramIndex}`);
      params.push(validOptions.similarityThreshold);
      paramIndex++;
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const similarityExpr = validOptions.similarityThreshold
      ? '1 - (embedding <=> $1) as similarity'
      : 'embedding <=> $1 as distance';

    const orderClause = validOptions.similarityThreshold
      ? 'ORDER BY similarity DESC'
      : 'ORDER BY distance ASC';

    const query = `
      SELECT
        id, value, database_name, column_name, table_name, schema_name, synced_at,
        ${similarityExpr}
      FROM "${pgSchemaName}"."searchable_column_values"
      ${whereClause}
      ${orderClause}
      LIMIT $2
    `;

    const results = await client.unsafe(query, params);
    return results as unknown as StoredValueResult[];
  } catch (error) {
    if (error instanceof Error) {
      throw new StoredValuesError(`Failed to search values with filters: ${error.message}`, error);
    }
    throw new StoredValuesError('Failed to search values with filters', error);
  }
}

/**
 * Searches for values across multiple specified tables and columns in parallel.
 *
 * @param dataSourceId - UUID of the data source
 * @param queryEmbedding - The pre-computed embedding array for the query (1536 dimensions)
 * @param targets - Array of SearchTarget specifying which tables/columns to search
 * @param limitPerTarget - Maximum number of results per target
 * @param options - Search options including similarity threshold
 * @returns A Promise containing an array of StoredValueResult ordered by similarity
 *
 * @throws {StoredValuesError} When validation fails or all searches fail
 *
 * @example
 * ```typescript
 * const targets = [
 *   { database_name: 'prod', schema_name: 'public', table_name: 'users', column_name: 'email' },
 *   { database_name: 'prod', schema_name: 'public', table_name: 'products', column_name: 'name' }
 * ];
 * const results = await searchValuesAcrossTargets(
 *   'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
 *   embedding,
 *   targets,
 *   5,
 *   { similarityThreshold: 0.8 }
 * );
 * ```
 */
export async function searchValuesAcrossTargets(
  dataSourceId: string,
  queryEmbedding: number[],
  targets: SearchTarget[],
  limitPerTarget = 10,
  options: SearchOptions = { limit: 10 }
): Promise<StoredValueResult[]> {
  try {
    // Validate inputs
    const validInput = ParallelSearchInputSchema.parse({
      dataSourceId,
      queryEmbedding,
      targets,
      limitPerTarget,
    });
    const validOptions = SearchOptionsSchema.parse(options);

    // Create promises for each search target
    const searchPromises = validInput.targets.map((target) =>
      searchValuesByEmbeddingWithFilters(
        validInput.dataSourceId,
        validInput.queryEmbedding,
        { ...validOptions, limit: validInput.limitPerTarget },
        target.database_name,
        target.schema_name,
        target.table_name,
        target.column_name
      ).catch((_error) => {
        // Log the error internally but don't fail the entire operation
        // In production, you might want to use a proper logging library here
        return []; // Return empty array on error to continue with other targets
      })
    );

    // Wait for all searches to complete
    const results = await Promise.all(searchPromises);

    // Flatten all results into a single array
    return results.flat();
  } catch (error) {
    if (error instanceof Error) {
      throw new StoredValuesError(
        `Failed to search values across targets: ${error.message}`,
        error
      );
    }
    throw new StoredValuesError('Failed to search values across targets', error);
  }
}

/**
 * Generates embeddings for search terms using OpenAI's text-embedding-3-small model.
 *
 * @param searchTerms - Array of search terms to generate embeddings for
 * @param options - Embedding generation options including retry configuration
 * @returns A Promise containing the embedding array (1536 dimensions)
 *
 * @throws {StoredValuesError} When validation fails or embedding generation fails
 *
 * @example
 * ```typescript
 * const embedding = await generateEmbedding(
 *   ['user', 'email', 'address'],
 *   { maxRetries: 5 }
 * );
 * ```
 */
export async function generateEmbedding(
  searchTerms: string[],
  options: EmbeddingOptions = { maxRetries: 3 }
): Promise<number[]> {
  try {
    // Validate inputs
    const validSearchTerms = SearchTermsSchema.parse(searchTerms);
    const validOptions = EmbeddingOptionsSchema.parse(options);

    const embedOptions = {
      model: openai.embedding('text-embedding-3-small'),
      value: validSearchTerms.join(' '),
      maxRetries: validOptions.maxRetries,
      ...(validOptions.abortSignal && { abortSignal: validOptions.abortSignal }),
    };

    const { embedding } = await embed(embedOptions);

    // Validate output
    return EmbeddingSchema.parse(embedding);
  } catch (error) {
    if (error instanceof Error) {
      throw new StoredValuesError(`Failed to generate embedding: ${error.message}`, error);
    }
    throw new StoredValuesError('Failed to generate embedding', error);
  }
}

/**
 * Extracts searchable columns from dataset YAML content.
 *
 * @param ymlContent - The YAML content of the dataset as a JSON string
 * @returns An array of SearchTarget representing tables and columns to search
 *
 * @throws {StoredValuesError} When YAML parsing fails or validation fails
 *
 * @example
 * ```typescript
 * const yamlString = JSON.stringify({
 *   database: 'production',
 *   tables: [
 *     {
 *       name: 'users',
 *       schema: 'public',
 *       columns: [
 *         { name: 'email', type: 'varchar(255)' },
 *         { name: 'bio', type: 'text' }
 *       ]
 *     }
 *   ]
 * });
 * const targets = extractSearchableColumnsFromYaml(yamlString);
 * ```
 */
export function extractSearchableColumnsFromYaml(ymlContent: string): SearchTarget[] {
  try {
    // Parse YAML content (assuming it's JSON for now)
    const yaml = JSON.parse(ymlContent);

    const searchTargets: SearchTarget[] = [];

    // Extract database name
    const databaseName = yaml.database || 'unknown';

    // Process tables
    if (yaml.tables && Array.isArray(yaml.tables)) {
      for (const table of yaml.tables) {
        const schemaName = table.schema || 'public';
        const tableName = table.name || table.table || 'unknown_table';

        // Process columns
        if (table.columns && Array.isArray(table.columns)) {
          for (const column of table.columns) {
            const columnName = column.name || 'unknown_column';

            // For now, consider all text/string/varchar columns as searchable
            const dataType = (column.type || '').toLowerCase();
            const isSearchable =
              dataType.includes('text') || dataType.includes('char') || dataType.includes('string');

            if (isSearchable) {
              const target = {
                database_name: databaseName,
                schema_name: schemaName,
                table_name: tableName,
                column_name: columnName,
              };

              // Validate the target before adding
              const validTarget = SearchTargetSchema.parse(target);
              searchTargets.push(validTarget);
            }
          }
        }
      }
    }

    return searchTargets;
  } catch (error) {
    if (error instanceof Error) {
      throw new StoredValuesError(`Failed to parse dataset YAML content: ${error.message}`, error);
    }
    throw new StoredValuesError('Failed to parse dataset YAML content', error);
  }
}

/**
 * Health check function to verify database connectivity and table existence.
 *
 * @param dataSourceId - UUID of the data source to check
 * @returns A Promise that resolves to true if the table exists and is accessible
 *
 * @throws {StoredValuesError} When validation fails or health check fails
 *
 * @example
 * ```typescript
 * const isHealthy = await healthCheck('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
 * ```
 */
export async function healthCheck(dataSourceId: string): Promise<boolean> {
  try {
    const validDataSourceId = UuidSchema.parse(dataSourceId);
    const schemaName = formatSchemaName(validDataSourceId);
    const client = await getClient();

    // Check if the table exists and is accessible
    const result = await client.unsafe(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = 'searchable_column_values'
      ) as table_exists
    `,
      [schemaName]
    );

    return result[0]?.table_exists === true;
  } catch (error) {
    if (error instanceof Error) {
      throw new StoredValuesError(`Health check failed: ${error.message}`, error);
    }
    throw new StoredValuesError('Health check failed', error);
  }
}

// Re-export types for convenience
export type { StoredValueResult, SearchTarget, SearchOptions, EmbeddingOptions };
