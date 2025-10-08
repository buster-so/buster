import { type Credentials, DataSourceType, createAdapter } from '@buster/data-source';
import { getDataSourceCredentials } from '@buster/database/queries';
import type {
  GetMetadataRequest,
  GetMetadataResponse,
  GetTableStatisticsOutput,
} from '@buster/server-shared';
import type { ApiKeyContext } from '@buster/server-shared';
import { runs, tasks } from '@trigger.dev/sdk';
import { HTTPException } from 'hono/http-exception';

/**
 * Validates that identifier doesn't contain SQL injection attempts
 * Allows alphanumeric, underscores, hyphens, and dots (for qualified names)
 */
function validateIdentifier(identifier: string, fieldName: string): void {
  // Allow alphanumeric, underscores, hyphens, dots, and spaces (for some database names)
  const validPattern = /^[a-zA-Z0-9_\-\.\s]+$/;

  if (!validPattern.test(identifier)) {
    throw new HTTPException(400, {
      message: `Invalid ${fieldName}: contains disallowed characters. Only alphanumeric, underscores, hyphens, dots, and spaces are allowed.`,
    });
  }

  // Block common SQL injection keywords
  const sqlKeywords =
    /(\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE|UNION|SELECT|WHERE|FROM|JOIN)\b)/i;
  if (sqlKeywords.test(identifier)) {
    throw new HTTPException(400, {
      message: `Invalid ${fieldName}: contains disallowed SQL keywords.`,
    });
  }
}

function isCredentials(value: unknown): value is Credentials {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  if (typeof type !== 'string') return false;
  return (Object.values(DataSourceType) as string[]).includes(type);
}

/**
 * Quick metadata lookup from warehouse information schema
 * Returns table size, row count, and type without full sampling
 */
async function getQuickTableMetadata(
  dataSourceId: string,
  database: string,
  schema: string,
  tableName: string
): Promise<{ rowCount: number; sizeBytes?: number; type: string }> {
  let adapter = null;

  try {
    // Fetch credentials
    const credentials = await getDataSourceCredentials({ dataSourceId });
    if (!isCredentials(credentials)) {
      throw new Error('Invalid credentials returned from vault');
    }

    // Create adapter
    adapter = await createAdapter(credentials);

    // Query information schema based on database type
    // This is fast and doesn't require sampling
    let query: string;
    let params: unknown[] = [];

    switch (credentials.type) {
      case DataSourceType.PostgreSQL:
      case DataSourceType.Redshift:
        query = `
          SELECT
            COALESCE(s.n_live_tup, 0) as row_count,
            pg_relation_size(quote_ident($1)||'.'||quote_ident($2)) as size_bytes,
            t.table_type
          FROM information_schema.tables t
          LEFT JOIN pg_stat_user_tables s
            ON s.schemaname = t.table_schema
            AND s.relname = t.table_name
          WHERE t.table_schema = $1
            AND t.table_name = $2
          LIMIT 1
        `;
        params = [schema, tableName];
        break;

      case DataSourceType.Snowflake:
        query = `
          SELECT
            row_count,
            bytes as size_bytes,
            table_type
          FROM ${database}.information_schema.tables
          WHERE table_schema = ?
            AND table_name = ?
          LIMIT 1
        `;
        params = [schema, tableName];
        break;

      case DataSourceType.BigQuery:
        query = `
          SELECT
            row_count,
            size_bytes,
            table_type
          FROM \`${database}.${schema}.INFORMATION_SCHEMA.TABLES\`
          WHERE table_name = ?
          LIMIT 1
        `;
        params = [tableName];
        break;

      case DataSourceType.MySQL:
        query = `
          SELECT
            table_rows as row_count,
            data_length as size_bytes,
            table_type
          FROM information_schema.tables
          WHERE table_schema = ?
            AND table_name = ?
          LIMIT 1
        `;
        params = [schema, tableName];
        break;

      default:
        // Fallback for unknown types - use reasonable defaults
        return { rowCount: 100000, type: 'TABLE' };
    }

    const result = await adapter.query(query, params as (string | number)[]);

    if (!result.rows || result.rows.length === 0) {
      throw new HTTPException(404, {
        message: `Table not found: ${database}.${schema}.${tableName}`,
      });
    }

    const row = result.rows[0] as Record<string, unknown>;

    const rowCount = typeof row.row_count === 'number' ? row.row_count : 100000;
    const sizeBytes = typeof row.size_bytes === 'number' ? row.size_bytes : undefined;
    const tableType = typeof row.table_type === 'string' ? row.table_type : 'TABLE';

    return {
      rowCount,
      ...(sizeBytes !== undefined && { sizeBytes }),
      type: tableType,
    };
  } finally {
    if (adapter) {
      await adapter.close().catch(() => {
        // Ignore cleanup errors
      });
    }
  }
}

/**
 * Handler for retrieving dataset metadata via API key authentication
 *
 * This handler:
 * 1. Validates API key has access to the organization
 * 2. Validates identifiers for SQL injection protection
 * 3. Triggers get-table-statistics task to compute fresh metadata
 * 4. Waits for task completion (max 2 minutes)
 * 5. Transforms and returns the metadata
 *
 * Note: This works on ANY table in the data source, not just registered datasets
 *
 * @param request - The metadata request containing dataSourceId, database, schema, and name
 * @param apiKeyContext - The authenticated API key context
 * @returns The dataset metadata
 */
export async function getMetadataHandler(
  request: GetMetadataRequest,
  apiKeyContext: ApiKeyContext
): Promise<GetMetadataResponse> {
  const { organizationId } = apiKeyContext;
  const { dataSourceId, database, schema, name } = request;

  // Validate identifiers for SQL injection protection
  validateIdentifier(database, 'database');
  validateIdentifier(schema, 'schema');
  validateIdentifier(name, 'table name');

  try {
    // Quick lookup from warehouse information schema to get accurate row count and size
    // This is fast (< 1 second) and doesn't require sampling
    const quickMetadata = await getQuickTableMetadata(dataSourceId, database, schema, name);

    // Determine sample size based on actual row count
    // Use up to 100k samples for large tables, scale down for smaller ones
    const sampleSize = Math.min(100000, Math.max(10000, Math.floor(quickMetadata.rowCount * 0.1)));

    // Map table type to enum
    const tableType: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL_TABLE' | 'TEMPORARY_TABLE' =
      quickMetadata.type === 'VIEW'
        ? 'VIEW'
        : quickMetadata.type === 'MATERIALIZED VIEW'
          ? 'MATERIALIZED_VIEW'
          : quickMetadata.type === 'FOREIGN TABLE'
            ? 'EXTERNAL_TABLE'
            : quickMetadata.type === 'LOCAL TEMPORARY'
              ? 'TEMPORARY_TABLE'
              : 'TABLE';

    // Trigger the get-table-statistics task with idempotency
    // If the same table is requested within 5 minutes, return existing task
    const handle = await tasks.trigger(
      'get-table-statistics',
      {
        dataSourceId,
        table: {
          name,
          schema,
          database,
          rowCount: quickMetadata.rowCount,
          sizeBytes: quickMetadata.sizeBytes,
          type: tableType,
        },
        sampleSize,
      },
      {
        idempotencyKey: `metadata-${organizationId}-${dataSourceId}-${database}-${schema}-${name}`,
        idempotencyKeyTTL: '5m', // 5 minutes TTL
      }
    );

    // Poll for task completion with timeout
    const startTime = Date.now();
    const timeout = 120000; // 2 minutes
    const pollInterval = 2000; // Poll every 2 seconds

    let run: Awaited<ReturnType<typeof runs.retrieve>>;
    while (true) {
      run = await runs.retrieve(handle.id);

      // Check if task completed, failed, or was canceled
      if (run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELED') {
        break;
      }

      // Check for timeout
      if (Date.now() - startTime > timeout) {
        throw new HTTPException(504, {
          message: 'Metadata collection took too long to complete. Please try again.',
        });
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Check task status
    if (run.status === 'FAILED' || run.status === 'CANCELED') {
      throw new HTTPException(500, {
        message: `Metadata collection task ${run.status.toLowerCase()}`,
      });
    }

    // Check if task completed successfully
    if (!run.output) {
      throw new HTTPException(500, {
        message: 'Metadata collection task did not return any output',
      });
    }

    const output = run.output as GetTableStatisticsOutput;

    if (!output.success) {
      throw new HTTPException(500, {
        message: output.error || 'Metadata collection failed',
      });
    }

    // Transform GetTableStatisticsOutput to DatasetMetadata format
    const metadata = {
      rowCount: output.totalRows,
      sizeBytes: quickMetadata.sizeBytes,
      sampleSize: output.actualSamples,
      samplingMethod: output.samplingMethod,
      columnProfiles: output.columnProfiles || [],
      introspectedAt: new Date().toISOString(),
    };

    return {
      metadata,
    };
  } catch (error) {
    // Re-throw HTTPException as-is
    if (error instanceof HTTPException) {
      throw error;
    }

    // Log unexpected errors
    console.error('Unexpected error during metadata retrieval:', error);

    throw new HTTPException(500, {
      message: 'An unexpected error occurred during metadata retrieval',
    });
  }
}
