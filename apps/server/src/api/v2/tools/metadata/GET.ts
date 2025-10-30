import {
  type BigQueryCredentials,
  type Credentials,
  createAdapter,
  DataSourceType,
} from '@buster/data-source';
import { getDataSourceCredentials } from '@buster/database/queries';
import type {
  ApiKeyContext,
  GetMetadataRequest,
  GetMetadataResponse,
  GetTableStatisticsOutput,
} from '@buster/server-shared';
import { runs, tasks } from '@trigger.dev/sdk';
import { HTTPException } from 'hono/http-exception';

// Import machine sizing utilities for optimal resource allocation
interface SizingInfo {
  machinePreset:
    | 'micro'
    | 'small-1x'
    | 'small-2x'
    | 'medium-1x'
    | 'medium-2x'
    | 'large-1x'
    | 'large-2x';
  avgRowSizeBytes: number;
  estimatedSampleBytes: number;
  estimatedMemoryRequired: number;
  machineSpecs: string;
}

/**
 * Calculate the optimal machine size for table statistics collection
 * This mirrors the logic in apps/trigger/src/tasks/introspect-data/utils/machine-sizing.ts
 */
function calculateSizingInfo(
  rowCount: number,
  sizeBytes: number | undefined,
  sampleSize: number
): SizingInfo {
  type MachinePreset =
    | 'micro'
    | 'small-1x'
    | 'small-2x'
    | 'medium-1x'
    | 'medium-2x'
    | 'large-1x'
    | 'large-2x';

  const MACHINE_THRESHOLDS = {
    SMALL_1X: 250 * 1024 * 1024,
    SMALL_2X: 500 * 1024 * 1024,
    MEDIUM_1X: 1 * 1024 * 1024 * 1024,
    MEDIUM_2X: 2 * 1024 * 1024 * 1024,
    LARGE_1X: 4 * 1024 * 1024 * 1024,
  } as const;

  const DUCKDB_OVERHEAD_MULTIPLIER = 10;
  const SAFETY_BUFFER_MULTIPLIER = 2.0;
  const DUCKDB_BASE_OVERHEAD_BYTES = 500 * 1024 * 1024;

  function getMachineSpecs(preset: MachinePreset): string {
    const specs: Record<MachinePreset, string> = {
      micro: '0.25 vCPU, 0.25GB RAM',
      'small-1x': '0.5 vCPU, 0.5GB RAM',
      'small-2x': '1 vCPU, 1GB RAM',
      'medium-1x': '1 vCPU, 2GB RAM',
      'medium-2x': '2 vCPU, 4GB RAM',
      'large-1x': '4 vCPU, 8GB RAM',
      'large-2x': '8 vCPU, 16GB RAM',
    };
    return specs[preset] || 'Unknown';
  }

  // Default to large-1x if we don't have size information
  if (!sizeBytes || sizeBytes === 0 || rowCount === 0) {
    return {
      machinePreset: 'large-1x',
      avgRowSizeBytes: 0,
      estimatedSampleBytes: 0,
      estimatedMemoryRequired: 0,
      machineSpecs: getMachineSpecs('large-1x'),
    };
  }

  const avgRowSizeBytes = sizeBytes / rowCount;
  const estimatedSampleBytes = avgRowSizeBytes * sampleSize;
  const estimatedMemoryRequired =
    estimatedSampleBytes * DUCKDB_OVERHEAD_MULTIPLIER * SAFETY_BUFFER_MULTIPLIER +
    DUCKDB_BASE_OVERHEAD_BYTES;

  // Apply minimum thresholds based on sample size
  let minimumPreset: MachinePreset = 'small-2x';

  if (sampleSize >= 750000) {
    minimumPreset = 'large-2x';
  } else if (sampleSize >= 500000) {
    minimumPreset = 'large-1x';
  } else if (sampleSize >= 200000) {
    minimumPreset = 'large-1x';
  } else if (sampleSize >= 100000) {
    minimumPreset = 'medium-2x';
  } else if (sampleSize >= 50000) {
    minimumPreset = 'medium-1x';
  }

  // Select machine based on estimated memory requirements
  let calculatedPreset: MachinePreset;

  if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.SMALL_1X) {
    calculatedPreset = 'small-1x';
  } else if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.SMALL_2X) {
    calculatedPreset = 'small-2x';
  } else if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.MEDIUM_1X) {
    calculatedPreset = 'medium-1x';
  } else if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.MEDIUM_2X) {
    calculatedPreset = 'medium-2x';
  } else if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.LARGE_1X) {
    calculatedPreset = 'large-1x';
  } else {
    calculatedPreset = 'large-2x';
  }

  // Return the larger of the calculated preset and the minimum preset
  const presetOrder: MachinePreset[] = [
    'micro',
    'small-1x',
    'small-2x',
    'medium-1x',
    'medium-2x',
    'large-1x',
    'large-2x',
  ];
  const minimumIndex = presetOrder.indexOf(minimumPreset);
  const calculatedIndex = presetOrder.indexOf(calculatedPreset);

  const machinePreset = presetOrder[Math.max(minimumIndex, calculatedIndex)] as MachinePreset;

  return {
    machinePreset,
    avgRowSizeBytes,
    estimatedSampleBytes,
    estimatedMemoryRequired,
    machineSpecs: getMachineSpecs(machinePreset),
  };
}

function _formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validates that identifier doesn't contain SQL injection attempts
 * Allows alphanumeric, underscores, hyphens, and dots (for qualified names)
 */
function validateIdentifier(identifier: string, fieldName: string): void {
  // Allow alphanumeric, underscores, hyphens, dots, and spaces (for some database names)
  const validPattern = /^[a-zA-Z0-9_\-.\s]+$/;

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
 *
 * Note: For BigQuery views, rowCount and sizeBytes will be null since these
 * metrics are not available in INFORMATION_SCHEMA.TABLE_STORAGE for views.
 */
async function getQuickTableMetadata(
  dataSourceId: string,
  database: string,
  schema: string,
  tableName: string
): Promise<{ rowCount: number | null; sizeBytes?: number | null; type: string }> {
  let adapter = null;

  try {
    console.info('[getQuickTableMetadata] Starting metadata lookup', {
      dataSourceId,
      database,
      schema,
      tableName,
    });

    // Fetch credentials
    const credentials = await getDataSourceCredentials({ dataSourceId });
    if (!isCredentials(credentials)) {
      console.error('[getQuickTableMetadata] Invalid credentials', { dataSourceId });
      throw new Error('Invalid credentials returned from vault');
    }

    console.info('[getQuickTableMetadata] Credentials fetched successfully', {
      dataSourceId,
      type: credentials.type,
    });

    // Create adapter
    adapter = await createAdapter(credentials);
    console.info('[getQuickTableMetadata] Adapter created successfully', {
      dataSourceId,
      type: credentials.type,
    });

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

      case DataSourceType.BigQuery: {
        // BigQuery: INFORMATION_SCHEMA is at the region level, not dataset level
        // Query TABLES (includes views) and LEFT JOIN with TABLE_STORAGE (tables/materialized views only)
        // This mirrors the PostgreSQL approach where we get all table types but metrics only for tables
        // Documentation: https://cloud.google.com/bigquery/docs/information-schema-table-storage

        const bigqueryCredentials = credentials as BigQueryCredentials;
        const location = bigqueryCredentials.location || 'us'; // Default to US multi-region

        // Use region-qualified INFORMATION_SCHEMA
        // Format: region-{location}.INFORMATION_SCHEMA.*
        const regionQualifier = `region-${location}`;

        console.info('[getQuickTableMetadata] Using BigQuery region-qualified INFORMATION_SCHEMA', {
          dataSourceId,
          location,
          regionQualifier,
          schema,
          tableName,
        });

        // Query TABLES and LEFT JOIN with TABLE_STORAGE to get metrics when available
        // For views: table_type will be present, but row_count and size_bytes will be NULL
        query = `
          SELECT
            ts.total_rows as row_count,
            ts.total_logical_bytes as size_bytes,
            t.table_type
          FROM \`${regionQualifier}.INFORMATION_SCHEMA.TABLES\` t
          LEFT JOIN \`${regionQualifier}.INFORMATION_SCHEMA.TABLE_STORAGE\` ts
            ON ts.table_schema = t.table_schema
            AND ts.table_name = t.table_name
          WHERE t.table_schema = ?
            AND t.table_name = ?
          LIMIT 1
        `;
        params = [schema, tableName]; // Filter by schema (dataset) and table name
        break;
      }

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

    console.info('[getQuickTableMetadata] Executing query', {
      dataSourceId,
      database,
      schema,
      tableName,
      query: query.trim(),
      params,
    });

    const result = await adapter.query(query, params as (string | number)[]);

    console.info('[getQuickTableMetadata] Query executed successfully', {
      dataSourceId,
      rowsReturned: result.rows?.length || 0,
    });

    if (!result.rows || result.rows.length === 0) {
      console.warn('[getQuickTableMetadata] Table not found', {
        dataSourceId,
        database,
        schema,
        tableName,
      });
      throw new HTTPException(404, {
        message: `Table not found: ${database}.${schema}.${tableName}`,
      });
    }

    const row = result.rows[0] as Record<string, unknown>;

    console.info('[getQuickTableMetadata] Raw row data', {
      dataSourceId,
      row,
      rowCountType: typeof row.row_count,
      rowCountValue: row.row_count,
      sizeBytesType: typeof row.size_bytes,
      sizeBytesValue: row.size_bytes,
      tableTypeType: typeof row.table_type,
      tableTypeValue: row.table_type,
    });

    const tableType = typeof row.table_type === 'string' ? row.table_type : 'TABLE';

    // Handle row_count: can be number, null (for BigQuery views), or missing
    let rowCount: number | null;
    if (typeof row.row_count === 'number') {
      rowCount = row.row_count;
    } else if (row.row_count === null && tableType.toUpperCase().includes('VIEW')) {
      // For views (BigQuery), row_count is null - use default for sampling
      rowCount = null;
      console.info('[getQuickTableMetadata] View detected, row_count is null', {
        dataSourceId,
        tableType,
      });
    } else {
      // Fallback for unknown cases
      rowCount = 100000;
    }

    // Handle size_bytes: can be number, null (for BigQuery views), or missing
    let sizeBytes: number | null | undefined;
    if (typeof row.size_bytes === 'number') {
      sizeBytes = row.size_bytes;
    } else if (row.size_bytes === null && tableType.toUpperCase().includes('VIEW')) {
      // For views (BigQuery), size_bytes is null
      sizeBytes = null;
    } else {
      // Undefined for other databases that don't provide this metric
      sizeBytes = undefined;
    }

    console.info('[getQuickTableMetadata] Metadata extracted successfully', {
      dataSourceId,
      rowCount,
      sizeBytes,
      tableType,
    });

    return {
      rowCount,
      ...(sizeBytes !== undefined && { sizeBytes }),
      type: tableType,
    };
  } catch (error) {
    // Log the error with full context before rethrowing
    console.error('[getQuickTableMetadata] Error during metadata lookup', {
      dataSourceId,
      database,
      schema,
      tableName,
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw error;
  } finally {
    if (adapter) {
      await adapter.close().catch((closeError) => {
        console.warn('[getQuickTableMetadata] Error closing adapter', {
          dataSourceId,
          closeError,
        });
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

  console.info('[getMetadataHandler] Starting metadata retrieval', {
    organizationId,
    dataSourceId,
    database,
    schema,
    name,
  });

  // Validate identifiers for SQL injection protection
  validateIdentifier(database, 'database');
  validateIdentifier(schema, 'schema');
  validateIdentifier(name, 'table name');

  try {
    // Quick lookup from warehouse information schema to get accurate row count and size
    // This is fast (< 1 second) and doesn't require sampling
    const quickMetadata = await getQuickTableMetadata(dataSourceId, database, schema, name);

    // Determine sample size based on actual row count
    // For views or tables without row count info, use a default sample size
    const effectiveRowCount = quickMetadata.rowCount ?? 100000;
    const sampleSize = Math.min(100000, Math.max(10000, Math.floor(effectiveRowCount * 0.1)));

    console.info('[getMetadataHandler] Calculated sample size', {
      dataSourceId,
      originalRowCount: quickMetadata.rowCount,
      effectiveRowCount,
      sampleSize,
    });

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

    // Calculate optimal machine size based on table statistics
    // Use effective row count for sizing calculation (views will use default)
    const sizingInfo = calculateSizingInfo(
      effectiveRowCount,
      quickMetadata.sizeBytes ?? undefined,
      sampleSize
    );

    // Trigger the get-table-statistics task with idempotency and optimal machine sizing
    // If the same table is requested within 5 minutes, return existing task
    console.info('[getMetadataHandler] Triggering get-table-statistics task', {
      dataSourceId,
      database,
      schema,
      name,
      sampleSize,
      machinePreset: sizingInfo.machinePreset,
      rowCount: quickMetadata.rowCount,
      effectiveRowCount,
      sizeBytes: quickMetadata.sizeBytes,
      tableType,
    });

    const handle = await tasks.trigger(
      'get-table-statistics',
      {
        dataSourceId,
        table: {
          name,
          schema,
          database,
          rowCount: effectiveRowCount, // Use effective row count for trigger task
          sizeBytes: quickMetadata.sizeBytes ?? undefined,
          type: tableType,
        },
        sampleSize,
      },
      {
        idempotencyKey: `metadata-${organizationId}-${dataSourceId}-${database}-${schema}-${name}`,
        idempotencyKeyTTL: '5m', // 5 minutes TTL
        machine: sizingInfo.machinePreset, // Use calculated machine size for optimal performance
      }
    );

    console.info('[getMetadataHandler] Task triggered successfully', {
      dataSourceId,
      runId: handle.id,
    });

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
    console.info('[getMetadataHandler] Task completed', {
      dataSourceId,
      runId: run.id,
      status: run.status,
    });

    if (run.status === 'FAILED' || run.status === 'CANCELED') {
      console.error('[getMetadataHandler] Task failed or was canceled', {
        dataSourceId,
        runId: run.id,
        status: run.status,
        output: run.output,
      });
      throw new HTTPException(500, {
        message: `Metadata collection task ${run.status.toLowerCase()}`,
      });
    }

    // Check if task completed successfully
    if (!run.output) {
      console.error('[getMetadataHandler] Task completed but has no output', {
        dataSourceId,
        runId: run.id,
      });
      throw new HTTPException(500, {
        message: 'Metadata collection task did not return any output',
      });
    }

    const output = run.output as GetTableStatisticsOutput;

    if (!output.success) {
      console.error('[getMetadataHandler] Task output indicates failure', {
        dataSourceId,
        runId: run.id,
        error: output.error,
      });
      throw new HTTPException(500, {
        message: output.error || 'Metadata collection failed',
      });
    }

    // Transform GetTableStatisticsOutput to DatasetMetadata format
    // Note: Convert null to undefined for sizeBytes (views don't have size metrics)
    const metadata = {
      rowCount: output.totalRows,
      sizeBytes: quickMetadata.sizeBytes ?? undefined, // Convert null to undefined
      sampleSize: output.actualSamples,
      samplingMethod: output.samplingMethod,
      columnProfiles: output.columnProfiles || [],
      introspectedAt: new Date().toISOString(),
    };

    console.info('[getMetadataHandler] Metadata retrieval successful', {
      dataSourceId,
      runId: run.id,
      rowCount: metadata.rowCount,
      sampleSize: metadata.sampleSize,
      columnCount: metadata.columnProfiles.length,
    });

    return {
      metadata,
    };
  } catch (error) {
    // Re-throw HTTPException as-is
    if (error instanceof HTTPException) {
      console.warn('[getMetadataHandler] HTTP exception occurred', {
        dataSourceId,
        database,
        schema,
        name,
        status: error.status,
        message: error.message,
      });
      throw error;
    }

    // Log the actual error with full context before wrapping it
    console.error('[getMetadataHandler] Unexpected error during metadata retrieval', {
      dataSourceId,
      database,
      schema,
      name,
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.constructor.name : typeof error,
      errorDetails:
        error instanceof Error
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : String(error),
    });

    throw new HTTPException(500, {
      message: 'An unexpected error occurred during metadata retrieval',
    });
  }
}
