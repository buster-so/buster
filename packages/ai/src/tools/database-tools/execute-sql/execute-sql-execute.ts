import { createPermissionErrorMessage, validateSqlPermissions } from '@buster/access-controls';
import { type DataSource, withRateLimit } from '@buster/data-source';
import { updateMessageEntries } from '@buster/database/queries';
import { wrapTraced } from 'braintrust';
import { getDataSource } from '../../../utils/get-data-source';
import { cleanupState } from '../../shared/cleanup-state';
import { createRawToolResultEntry } from '../../shared/create-raw-llm-tool-result-entry';
import { truncateQueryResults } from '../../shared/smart-truncate';
import {
  EXECUTE_SQL_TOOL_NAME,
  type ExecuteSqlContext,
  type ExecuteSqlInput,
  type ExecuteSqlOutput,
  type ExecuteSqlState,
} from './execute-sql';
import {
  createExecuteSqlRawLlmMessageEntry,
  createExecuteSqlReasoningEntry,
} from './helpers/execute-sql-transform-helper';

async function executeSingleStatement(
  sqlStatement: string,
  dataSource: DataSource,
  context: ExecuteSqlContext
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

  // Validate permissions before execution
  const userId = context.userId;
  if (!userId) {
    return { success: false, error: 'User authentication required for SQL execution' };
  }

  const dataSourceSyntax = context.dataSourceSyntax;
  const permissionResult = await validateSqlPermissions(sqlStatement, userId, dataSourceSyntax);
  if (!permissionResult.isAuthorized) {
    return {
      success: false,
      error: createPermissionErrorMessage(
        permissionResult.unauthorizedTables,
        permissionResult.unauthorizedColumns
      ),
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
          maxRows: 50, // Limit results at the adapter level, not in SQL
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
          `[execute-sql] Query timeout on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
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
          `[execute-sql] Query timeout (exception) on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
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
export function createExecuteSqlExecute(state: ExecuteSqlState, context: ExecuteSqlContext) {
  return wrapTraced(
    async (input: ExecuteSqlInput): Promise<ExecuteSqlOutput> => {
      let { statements } = input;

      // Handle various edge cases for statements
      if (statements === undefined || statements === null) {
        console.error('[execute-sql] Invalid input: statements is undefined or null', {
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
        console.error('[execute-sql] Invalid input: statements is not an array', {
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
              console.warn('[execute-sql] Recovered statements from JSON string');
            } else {
              // Treat as single statement
              statements = [stringStatement];
              console.warn('[execute-sql] Treating string as single statement');
            }
          } catch {
            // Treat as single statement
            statements = [stringStatement];
            console.warn('[execute-sql] Treating unparseable string as single statement');
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
        console.error('[execute-sql] Invalid input: statements contains non-string elements', {
          statements: statements,
        });
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
        const ds = await getDataSource(dataSourceId);
        dataSource = ds;

        // Execute SQL statements with rate limiting
        const executionPromises = statements.map((sqlStatement) =>
          withRateLimit(
            'sql-execution',
            async () => {
              const result = await executeSingleStatement(sqlStatement, ds, context);
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
        const results: ExecuteSqlOutput['results'] = executionResults.map(
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

        // Update reasoning entry with results
        const endTime = Date.now();
        const executionTime = endTime - (state.startTime || endTime);

        // Update state with results
        state.executionResults = results;
        state.executionTime = executionTime;
        state.isComplete = true;

        // Create final reasoning entry with complete status
        const reasoningEntry = createExecuteSqlReasoningEntry(state, state.toolCallId || '');
        const rawLlmMessage = createExecuteSqlRawLlmMessageEntry(state, state.toolCallId || '');
        const rawLlmResultEntry = createRawToolResultEntry(
          state.toolCallId || '',
          EXECUTE_SQL_TOOL_NAME,
          {
            results,
          }
        );

        // Update database with final status
        const messagesToSave: Parameters<typeof updateMessageEntries>[0] = {
          messageId: context.messageId,
        };

        if (reasoningEntry) {
          messagesToSave.reasoningMessages = [reasoningEntry];
        }

        if (rawLlmMessage) {
          messagesToSave.rawLlmMessages = [rawLlmMessage, rawLlmResultEntry];
        }

        if (messagesToSave.reasoningMessages || messagesToSave.rawLlmMessages) {
          try {
            await updateMessageEntries(messagesToSave);
          } catch (error) {
            console.error('[execute-sql] Failed to update final entries:', {
              messageId: context.messageId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        cleanupState(state);
        return { results };
      } catch (error) {
        // If we can't get data source, return error for all statements
        console.error('[execute-sql] Failed to get data source:', error);
        cleanupState(state);
        return {
          results: statements.map((sql) => ({
            status: 'error' as const,
            sql,
            error_message: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
          })),
        };
      } finally {
        cleanupState(state);
        // Always close the data source to clean up connections
        if (dataSource) {
          try {
            await dataSource.close();
          } catch (closeError) {
            console.warn('[execute-sql] Error closing data source:', closeError);
          }
        }
      }
    },
    { name: EXECUTE_SQL_TOOL_NAME }
  );
}
