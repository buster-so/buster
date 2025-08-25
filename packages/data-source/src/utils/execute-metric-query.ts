import type { DataMetadata } from '@buster/server-shared/metrics';
import { z } from 'zod';
import { DataSource } from '../data-source';
import type { Credentials } from '../types/credentials';
import { createMetadataFromResults } from './create-metadata-from-results';
import { checkQueryIsReadOnly } from './sql-validation';

export interface ExecuteMetricQueryOptions {
  maxRows?: number;
  timeout?: number;
  retryDelays?: number[];
  skipReadOnlyCheck?: boolean; // Allow skipping for special cases
}

export interface ExecuteMetricQueryResult {
  data: Record<string, string | number | null>[];
  dataMetadata: DataMetadata;
  hasMoreRecords: boolean;
  executionTime?: number;
}

const resultMetadataSchema = z.object({
  totalRowCount: z.number().optional(),
  limited: z.boolean().optional(),
  maxRows: z.number().optional(),
});

/**
 * Executes a metric SQL query with retry logic and returns standardized results
 * This utility is used by metric creation, modification, and data retrieval handlers
 *
 * @param dataSourceId - The ID of the data source to query
 * @param sql - The SQL query to execute
 * @param credentials - The credentials for the data source
 * @param options - Query options including maxRows, timeout, and retry delays
 * @returns Query results with data, metadata, and pagination info
 */
export async function executeMetricQuery(
  dataSourceId: string,
  sql: string,
  credentials: Credentials,
  options: ExecuteMetricQueryOptions = {}
): Promise<ExecuteMetricQueryResult> {
  const {
    maxRows = 5000,
    timeout = 120000, // 2 minutes default
    retryDelays = [1000, 3000, 6000], // 1s, 3s, 6s
    skipReadOnlyCheck = false,
  } = options;

  // Validate query is read-only unless explicitly skipped
  if (!skipReadOnlyCheck) {
    const readOnlyCheck = checkQueryIsReadOnly(sql, credentials.type);
    if (!readOnlyCheck.isReadOnly) {
      throw new Error(
        readOnlyCheck.error ||
          'Only SELECT statements are allowed for metric queries. Write operations are not permitted.'
      );
    }
  }

  // Create DataSource instance with single data source config
  const dataSource = new DataSource({
    dataSources: [
      {
        name: dataSourceId,
        type: credentials.type,
        credentials,
      },
    ],
    defaultDataSource: dataSourceId,
  });

  try {
    // Add 1 to limit to check if there are more records
    const queryLimitWithCheck = maxRows + 1;

    // Attempt execution with retries
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      try {
        const startTime = Date.now();

        // Execute the SQL query using the DataSource
        const result = await dataSource.execute({
          sql,
          options: {
            maxRows: queryLimitWithCheck,
            timeout,
          },
        });

        const executionTime = Date.now() - startTime;

        if (result.success) {
          const allResults = result.rows || [];

          // Check if we have more records than the requested limit
          const hasMoreRecords = allResults.length > maxRows;

          // Trim results to requested limit if we have more
          const data = hasMoreRecords ? allResults.slice(0, maxRows) : allResults;

          // Convert data to match expected type (string | number | null)
          const typedData = data.map((row) => {
            const typedRow: Record<string, string | number | null> = {};
            for (const [key, value] of Object.entries(row)) {
              if (value === null || typeof value === 'string' || typeof value === 'number') {
                typedRow[key] = value;
              } else if (typeof value === 'boolean') {
                typedRow[key] = value.toString();
              } else if (value instanceof Date) {
                typedRow[key] = value.toISOString();
              } else {
                // Convert other types to string (JSON objects, arrays, etc)
                typedRow[key] = JSON.stringify(value);
              }
            }
            return typedRow;
          });

          // Create metadata from results and column information
          const dataMetadata = createMetadataFromResults(typedData, result.columns);

          // Validate and parse result metadata if available
          const validatedMetadata = resultMetadataSchema.safeParse(result.metadata);
          const parsedMetadata = validatedMetadata.success ? validatedMetadata.data : undefined;

          return {
            data: typedData,
            dataMetadata,
            hasMoreRecords: parsedMetadata?.limited ?? hasMoreRecords,
            executionTime,
          };
        }

        // Check if error is timeout-related
        const errorMessage = result.error?.message || 'Query execution failed';
        const isTimeout =
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('timed out');

        if (isTimeout && attempt < retryDelays.length) {
          // Wait before retry
          const delay = retryDelays[attempt] || 6000;
          console.warn(
            `[execute-metric-query] SQL execution timeout on attempt ${attempt + 1}/${retryDelays.length + 1}. Retrying in ${delay}ms...`,
            {
              sqlPreview: `${sql.substring(0, 100)}...`,
              attempt: attempt + 1,
              nextDelay: delay,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        // Not a timeout or no more retries
        throw new Error(errorMessage);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'SQL execution failed';
        const isTimeout =
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('timed out');

        if (isTimeout && attempt < retryDelays.length) {
          // Wait before retry
          const delay = retryDelays[attempt] || 6000;
          console.warn(
            `[execute-metric-query] SQL execution timeout (exception) on attempt ${attempt + 1}/${retryDelays.length + 1}. Retrying in ${delay}ms...`,
            {
              sqlPreview: `${sql.substring(0, 100)}...`,
              attempt: attempt + 1,
              nextDelay: delay,
              error: errorMessage,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        // Not a timeout or no more retries
        throw error;
      }
    }

    // Should not reach here, but just in case
    throw new Error('Max retries exceeded for SQL execution');
  } finally {
    // Always close the data source connection
    await dataSource.close().catch((err) => {
      console.error('Failed to close data source connection:', err);
    });
  }
}
