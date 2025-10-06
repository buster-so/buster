import { checkQueryIsReadOnly } from '@buster/access-controls';
import { type DataSource, withRateLimit } from '@buster/data-source';
import { wrapTraced } from 'braintrust';
import { getDataSource } from '../../../utils/get-data-source';
import { truncateQueryResults } from '../../shared/smart-truncate';
import type {
  SuperExecuteSqlContext,
  SuperExecuteSqlInput,
  SuperExecuteSqlOutput,
  SuperExecuteSqlState,
} from './super-execute-sql';

async function executeSingleStatement(
  sqlStatement: string,
  dataSource: DataSource
): Promise<{
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
}> {
  // Retry configuration
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 30000; // 30 seconds
  const RETRY_DELAYS = [1000, 3000, 6000]; // 1s, 3s, 6s

  if (!sqlStatement.trim()) {
    return { success: false, error: 'SQL statement cannot be empty' };
  }

  // Check if query is read-only (SELECT statements only)
  const readOnlyCheck = checkQueryIsReadOnly(sqlStatement);
  if (!readOnlyCheck.isReadOnly) {
    return {
      success: false,
      error: readOnlyCheck.error || 'Only SELECT statements are allowed',
    };
  }

  // Attempt execution with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Execute the SQL query using the DataSource with timeout
      // Pass maxRows to the adapter instead of modifying the SQL
      const result = await dataSource.execute({
        sql: sqlStatement,
        options: {
          timeout: TIMEOUT_MS,
          maxRows: 100, // Limit results at the adapter level, not in SQL
        },
      });

      if (result.success) {
        return {
          success: true,
          data: truncateQueryResults(result.rows || []),
        };
      }

      // Check if error is timeout-related
      const errorMessage = result.error?.message || 'Query execution failed';
      const isTimeout =
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('timed out');

      if (isTimeout && attempt < MAX_RETRIES) {
        // Wait before retry
        const delay = RETRY_DELAYS[attempt] || 6000;
        console.warn(
          `[super-execute-sql] Query timeout on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
          {
            sql: `${sqlStatement.substring(0, 100)}...`,
            attempt: attempt + 1,
            nextDelay: delay,
          }
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Retry
      }

      // Not a timeout or no more retries
      return {
        success: false,
        error: errorMessage,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQL execution failed';
      const isTimeout =
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('timed out');

      if (isTimeout && attempt < MAX_RETRIES) {
        // Wait before retry
        const delay = RETRY_DELAYS[attempt] || 6000;
        console.warn(
          `[super-execute-sql] Query timeout (exception) on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
          {
            sql: `${sqlStatement.substring(0, 100)}...`,
            attempt: attempt + 1,
            nextDelay: delay,
            error: errorMessage,
          }
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Retry
      }

      // Not a timeout or no more retries
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Should not reach here, but just in case
  return {
    success: false,
    error: 'Max retries exceeded for SQL execution',
  };
}

// Factory function that creates the execute function with proper context typing
export function createSuperExecuteSqlExecute(
  state: SuperExecuteSqlState,
  context: SuperExecuteSqlContext
) {
  return wrapTraced(
    async (input: SuperExecuteSqlInput): Promise<SuperExecuteSqlOutput> => {
      let { statements } = input;

      // Handle various edge cases for statements
      if (statements === undefined || statements === null) {
        console.error('[super-execute-sql] Invalid input: statements is undefined or null', {
          params: input,
        });
        return {
          results: [
            {
              status: 'error' as const,
              sql: '',
              error_message: 'Invalid input: statements is required',
            },
          ],
        };
      }

      // If statements is not an array, try to convert it
      if (!Array.isArray(statements)) {
        console.error('[super-execute-sql] Invalid input: statements is not an array', {
          type: typeof statements,
          value: statements,
          params: input,
        });

        // Try to recover from common edge cases
        if (typeof statements === 'string') {
          const stringStatement = statements;
          try {
            // Try parsing as JSON array
            const parsed = JSON.parse(stringStatement);
            if (Array.isArray(parsed)) {
              statements = parsed;
              console.warn('[super-execute-sql] Recovered statements from JSON string');
            } else {
              // Treat as single statement
              statements = [stringStatement];
              console.warn('[super-execute-sql] Treating string as single statement');
            }
          } catch {
            // Treat as single statement
            statements = [stringStatement];
            console.warn('[super-execute-sql] Treating unparseable string as single statement');
          }
        } else if (typeof statements === 'object' && statements !== null) {
          // Handle object with map method that's not an array (edge case)
          if ('map' in statements && typeof (statements as { map?: unknown }).map === 'function') {
            try {
              statements = Array.from(statements as Iterable<string>);
              console.warn('[super-execute-sql] Recovered statements from array-like object');
            } catch {
              return {
                results: [
                  {
                    status: 'error' as const,
                    sql: JSON.stringify(statements),
                    error_message: 'Invalid input: statements must be an array of SQL strings',
                  },
                ],
              };
            }
          } else {
            return {
              results: [
                {
                  status: 'error' as const,
                  sql: JSON.stringify(statements),
                  error_message: 'Invalid input: statements must be an array of SQL strings',
                },
              ],
            };
          }
        } else {
          return {
            results: [
              {
                status: 'error' as const,
                sql: String(statements),
                error_message: 'Invalid input: statements must be an array of SQL strings',
              },
            ],
          };
        }
      }

      // Final validation - ensure all elements are strings
      if (!statements.every((stmt) => typeof stmt === 'string')) {
        console.error(
          '[super-execute-sql] Invalid input: statements contains non-string elements',
          {
            statements: statements,
          }
        );
        statements = statements.map((stmt) => String(stmt));
      }

      // Check for empty array
      if (statements.length === 0) {
        return {
          results: [],
        };
      }

      const dataSourceId = context.dataSourceId;

      let dataSource: DataSource | null = null;

      try {
        // Get a new DataSource instance
        dataSource = await getDataSource(dataSourceId);

        // Execute SQL statements with rate limiting
        const executionPromises = statements.map((sqlStatement) =>
          withRateLimit(
            'sql-execution',
            async () => {
              if (!dataSource) {
                throw new Error('DataSource is not available');
              }

              const result = await executeSingleStatement(sqlStatement, dataSource);
              return { sql: sqlStatement, result };
            },
            {
              maxConcurrent: 50, // Increased from 10 to allow more concurrent queries per workflow
              maxPerSecond: 100, // Increased from 25 to handle higher throughput
              maxPerMinute: 3000, // Increased from 300 for sustained load
              queueTimeout: 180000, // 180 seconds (increased for queue management)
            }
          )
        );

        // Wait for all executions to complete
        const executionResults = await Promise.allSettled(executionPromises);

        // Process results
        const results: SuperExecuteSqlOutput['results'] = executionResults.map(
          (executionResult, index) => {
            const sql = statements[index] || '';

            if (executionResult.status === 'fulfilled') {
              const { result } = executionResult.value;
              if (result.success) {
                return {
                  status: 'success' as const,
                  sql,
                  results: result.data || [],
                };
              }
              return {
                status: 'error' as const,
                sql,
                error_message: result.error || 'Unknown error occurred',
              };
            }

            return {
              status: 'error' as const,
              sql,
              error_message: executionResult.reason?.message || 'Execution failed',
            };
          }
        );

        // Update state with results
        const endTime = Date.now();
        const executionTime = endTime - (state.startTime || endTime);

        state.executionResults = results;
        state.executionTime = executionTime;
        state.isComplete = true;

        return { results };
      } catch (error) {
        // If we can't get data source, return error for all statements
        console.error('[super-execute-sql] Failed to get data source:', error);
        return {
          results: statements.map((sql) => ({
            status: 'error' as const,
            sql,
            error_message: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
          })),
        };
      } finally {
        // Always close the data source to clean up connections
        if (dataSource) {
          try {
            await dataSource.close();
          } catch (closeError) {
            console.warn('[super-execute-sql] Error closing data source:', closeError);
          }
        }
      }
    },
    { name: 'super-execute-sql' }
  );
}
