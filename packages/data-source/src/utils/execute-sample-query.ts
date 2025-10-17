import type { common } from '@buster/server-shared';

type DataResult = common.DataResult;

import { z } from 'zod';
import { DataSource } from '../data-source';
import type { Credentials } from '../types/credentials';
import { checkQueryIsReadOnly } from './sql-validation';

/**
 * Options for executing a sample query
 */
export interface ExecuteSampleQueryOptions {
  limit?: number;
  timeout?: number;
  retryDelays?: number[];
}

/**
 * Result from executing a sample query
 */
export interface ExecuteSampleQueryResult {
  data: DataResult;
  executionTime?: number;
  rowCount: number;
}

/**
 * Executes a sample SQL query for datasets with strict read-only validation
 * This is specifically designed for dataset sample queries that retrieve a limited set of rows
 *
 * @param dataSourceId - The ID of the data source to query
 * @param sql - The SQL query to execute (must be SELECT only)
 * @param credentials - The credentials for the data source
 * @param options - Query options including limit and timeout
 * @returns Query results as DataResult format
 */
export async function executeSampleQuery(
  dataSourceId: string,
  sql: string,
  credentials: Credentials,
  options: ExecuteSampleQueryOptions = {}
): Promise<ExecuteSampleQueryResult> {
  const { limit = 50, timeout = 30000, retryDelays = [1000, 3000] } = options;

  // Validate query is read-only - ALWAYS enforced for sample queries
  const readOnlyCheck = checkQueryIsReadOnly(sql, credentials.type);
  if (!readOnlyCheck.isReadOnly) {
    throw new Error(
      readOnlyCheck.error ||
        'Only SELECT statements are allowed for dataset samples. Write operations are not permitted.'
    );
  }

  // Validate column names in the SQL to prevent injection
  // This is an extra layer of security for sample queries
  const columnPattern = /SELECT\s+(.*?)\s+FROM/i;
  const columnMatch = sql.match(columnPattern);
  if (columnMatch?.[1]) {
    const columns = columnMatch[1];
    // Check for suspicious patterns that might indicate injection attempts
    const suspiciousPatterns = [';', '--', '/*', '*/', 'xp_', 'sp_', 'exec', 'execute'];
    for (const pattern of suspiciousPatterns) {
      if (columns.toLowerCase().includes(pattern)) {
        throw new Error(
          `Suspicious SQL pattern detected: ${pattern}. Query rejected for security.`
        );
      }
    }
  }

  // Create DataSource instance
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
    // Execute with retries
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      try {
        const startTime = Date.now();

        // Execute the SQL query with the specified limit
        const result = await dataSource.execute({
          sql,
          options: {
            maxRows: limit,
            timeout,
          },
        });

        const executionTime = Date.now() - startTime;

        if (result.success) {
          const rows = result.rows || [];

          // Convert to DataResult format (array of records with string/number/null values)
          const data: DataResult = rows.map((row) => {
            const typedRow: Record<string, string | number | null> = {};
            for (const [key, value] of Object.entries(row)) {
              if (value === null || value === undefined) {
                typedRow[key] = null;
              } else if (typeof value === 'string' || typeof value === 'number') {
                typedRow[key] = value;
              } else if (typeof value === 'boolean') {
                typedRow[key] = value.toString();
              } else if (value instanceof Date) {
                typedRow[key] = value.toISOString();
              } else {
                // Convert other types to string representation
                typedRow[key] = JSON.stringify(value);
              }
            }
            return typedRow;
          });

          return {
            data,
            executionTime,
            rowCount: rows.length,
          };
        }

        // Handle errors
        const errorMessage = result.error?.message || 'Query execution failed';
        const isTimeout =
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('timed out');

        if (isTimeout && attempt < retryDelays.length) {
          // Wait before retry
          const delay = retryDelays[attempt] || 3000;
          console.warn(
            `[execute-sample-query] Query timeout on attempt ${attempt + 1}. Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(errorMessage);
      } catch (error) {
        // If this is the last attempt, throw the error
        if (attempt === retryDelays.length) {
          throw error;
        }
        // Otherwise, wait and retry
        const delay = retryDelays[attempt] || 3000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Should not reach here, but throw error if we do
    throw new Error('Failed to execute sample query after all retries');
  } finally {
    // Clean up data source connections
    await dataSource.close?.();
  }
}
