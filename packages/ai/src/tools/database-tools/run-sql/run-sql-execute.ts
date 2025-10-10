import { wrapTraced } from 'braintrust';
import {
  RUN_SQL_TOOL_NAME,
  type RunSqlContext,
  type RunSqlInput,
  type RunSqlOutput,
} from './run-sql';

/**
 * Execute SQL query via API endpoint
 */
async function executeApiRequest(
  dataSourceId: string,
  sql: string,
  context: RunSqlContext
): Promise<{
  success: boolean;
  data?: RunSqlOutput;
  error?: string;
}> {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 3000, 6000]; // 1s, 3s, 6s

  if (!sql.trim()) {
    return { success: false, error: 'SQL query cannot be empty' };
  }

  // Attempt execution with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const apiEndpoint = `${context.apiUrl}/api/v2/tools/sql`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.apiKey}`,
        },
        body: JSON.stringify({
          data_source_id: dataSourceId,
          sql,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;

        // Check if error is timeout-related
        const isTimeout =
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('timed out');

        if (isTimeout && attempt < MAX_RETRIES) {
          // Wait before retry
          const delay = RETRY_DELAYS[attempt] || 6000;
          console.warn(
            `[run-sql] Query timeout on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
            {
              sql: `${sql.substring(0, 100)}...`,
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
      }

      const result = (await response.json()) as RunSqlOutput;

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQL execution failed';
      const isTimeout =
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('timed out') ||
        errorMessage.toLowerCase().includes('fetch failed');

      if (isTimeout && attempt < MAX_RETRIES) {
        // Wait before retry
        const delay = RETRY_DELAYS[attempt] || 6000;
        console.warn(
          `[run-sql] Query timeout (exception) on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
          {
            sql: `${sql.substring(0, 100)}...`,
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
export function createRunSqlExecute(context: RunSqlContext) {
  return wrapTraced(
    async (input: RunSqlInput): Promise<RunSqlOutput> => {
      const { data_source_id, sql } = input;

      // Execute SQL via API
      const result = await executeApiRequest(data_source_id, sql, context);

      if (result.success && result.data) {
        return result.data;
      }

      // Throw error with clear message - API server handles logging
      throw new Error(result.error || 'Query execution failed');
    },
    { name: RUN_SQL_TOOL_NAME }
  );
}
