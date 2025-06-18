import { type DataSource, withRateLimit } from '@buster/data-source';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { getWorkflowDataSourceManager } from '../../utils/data-source-manager';
import type { AnalystRuntimeContext } from '../../workflows/analyst-workflow';
import { ensureSqlLimit } from './sql-limit-helper';

const executeSqlStatementInputSchema = z.object({
  statements: z.array(z.string()).describe(
    `Array of lightweight, optimized SQL statements to execute. 
      Each statement should be small and focused. 
      SELECT queries without a LIMIT clause will automatically have LIMIT 25 added for performance.
      Existing LIMIT clauses will be preserved.
      YOU MUST USE THE <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names. 
      NEVER use SELECT * - you must explicitly list the columns you want to query from the documentation provided. 
      NEVER query system tables or use 'SHOW' statements as these will fail to execute.
      Queries without these requirements will fail to execute.`
  ),
});

/**
 * Processes a single column value for truncation
 */
function processColumnValue(value: unknown, maxLength: number): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return value.length > maxLength ? `${value.slice(0, maxLength)}...[TRUNCATED]` : value;
  }

  if (typeof value === 'object') {
    // Always stringify objects/arrays to prevent parser issues
    const stringValue = JSON.stringify(value);
    return stringValue.length > maxLength
      ? `${stringValue.slice(0, maxLength)}...[TRUNCATED]`
      : stringValue;
  }

  // For numbers, booleans, etc.
  const stringValue = String(value);
  return stringValue.length > maxLength
    ? `${stringValue.slice(0, maxLength)}...[TRUNCATED]`
    : value; // Keep original value and type if not too long
}

/**
 * Truncates query results to prevent overwhelming responses with large JSON objects, arrays, or text
 * Always converts objects/arrays to strings to ensure parser safety
 */
function truncateQueryResults(
  rows: Record<string, unknown>[],
  maxLength = 100
): Record<string, unknown>[] {
  return rows.map((row) => {
    const truncatedRow: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      truncatedRow[key] = processColumnValue(value, maxLength);
    }

    return truncatedRow;
  });
}

/**
 * Optimistic parsing function for streaming execute-sql tool arguments
 * Extracts the statements array as it's being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof executeSqlStatementInputSchema>> | null {
  // Validate input type
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    // First try to parse as complete JSON
    const parsed = JSON.parse(accumulatedText);
    
    // Ensure statements is an array if present
    if (parsed.statements !== undefined && !Array.isArray(parsed.statements)) {
      console.warn('[execute-sql parseStreamingArgs] statements is not an array:', {
        type: typeof parsed.statements,
        value: parsed.statements,
      });
      return null; // Return null to indicate invalid parse
    }
    
    return {
      statements: parsed.statements || undefined,
    };
  } catch (error) {
    // Only catch JSON parse errors - let other errors bubble up
    if (error instanceof SyntaxError) {
      // JSON parsing failed - try regex extraction for partial content
      // If JSON is incomplete, try to extract and reconstruct the statements array
      const statementsMatch = accumulatedText.match(/"statements"\s*:\s*\[(.*)/s);
      if (statementsMatch && statementsMatch[1] !== undefined) {
        const arrayContent = statementsMatch[1];

        try {
          // Try to parse the array content by adding closing bracket
          const testArray = `[${arrayContent}]`;
          const parsed = JSON.parse(testArray);
          return { statements: parsed };
        } catch {
          // If that fails, try to extract individual statement strings that are complete
          const statements: string[] = [];

          // Match complete string statements within the array
          const statementMatches = arrayContent.matchAll(/"((?:[^"\\]|\\.)*)"/g);

          for (const match of statementMatches) {
            if (match[1] !== undefined) {
              const statement = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              statements.push(statement);
            }
          }

          return { statements };
        }
      }

      // Check if we at least have the start of the statements field
      const partialMatch = accumulatedText.match(/"statements"\s*:\s*\[/);
      if (partialMatch) {
        return { statements: [] };
      }

      return null;
    }

    // Unexpected error - re-throw with context
    throw new Error(
      `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

const executeSqlStatementOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        sql: z.string(),
        results: z.array(z.record(z.unknown())),
      }),
      z.object({
        status: z.literal('error'),
        sql: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

const executeSqlStatement = wrapTraced(
  async (
    params: z.infer<typeof executeSqlStatementInputSchema>,
    runtimeContext: RuntimeContext<AnalystRuntimeContext>
  ): Promise<z.infer<typeof executeSqlStatementOutputSchema>> => {
    const { statements } = params;

    // Ensure statements is an array
    if (!Array.isArray(statements)) {
      console.error('[execute-sql] Invalid input: statements is not an array', {
        type: typeof statements,
        value: statements,
        params: params,
      });
      return {
        results: [{
          status: 'error' as const,
          sql: typeof statements === 'string' ? statements : JSON.stringify(statements),
          error_message: 'Invalid input: statements must be an array of SQL strings',
        }],
      };
    }

    // Check for empty array
    if (statements.length === 0) {
      return {
        results: [],
      };
    }

    const dataSourceId = runtimeContext.get('dataSourceId');
    const workflowStartTime = runtimeContext.get('workflowStartTime') as number | undefined;

    // Generate a unique workflow ID using start time and data source
    const workflowId = workflowStartTime
      ? `workflow-${workflowStartTime}-${dataSourceId}`
      : `workflow-${Date.now()}-${dataSourceId}`;

    // Get data source from workflow manager (reuses existing connections)
    const manager = getWorkflowDataSourceManager(workflowId);

    try {
      const dataSource = await manager.getDataSource(dataSourceId);

      // Execute SQL statements with rate limiting
      const executionPromises = statements.map((sqlStatement) =>
        withRateLimit(
          'sql-execution',
          async () => {
            const result = await executeSingleStatement(sqlStatement, dataSource);
            return { sql: sqlStatement, result };
          },
          {
            maxConcurrent: 10,    // Increased from 3 to allow more concurrent queries per workflow
            maxPerSecond: 25,     // Increased from 10 to handle higher throughput
            maxPerMinute: 300,    // Increased from 100 for sustained load
            queueTimeout: 90000,  // 90 seconds (increased for queue management)
          }
        )
      );

      // Wait for all executions to complete
      const executionResults = await Promise.allSettled(executionPromises);

      // Process results
      const results: z.infer<typeof executeSqlStatementOutputSchema>['results'] =
        executionResults.map((executionResult, index) => {
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
        });

      return { results };
    } catch (error) {
      // If we can't get data source, return error for all statements
      console.error('[execute-sql] Failed to get data source:', error);
      return {
        results: statements.map((sql) => ({
          status: 'error' as const,
          sql,
          error_message: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
        })),
      };
    }
    // Note: We don't close the data source here anymore - it's managed by the workflow manager
  },
  { name: 'execute-sql' }
);

async function executeSingleStatement(
  sqlStatement: string,
  dataSource: DataSource
): Promise<{
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
}> {
  try {
    if (!sqlStatement.trim()) {
      return { success: false, error: 'SQL statement cannot be empty' };
    }

    // Ensure the SQL statement has a LIMIT clause to prevent excessive results
    const limitedSql = ensureSqlLimit(sqlStatement, 25);

    // Execute the SQL query using the DataSource with timeout
    const result = await dataSource.execute({
      sql: limitedSql,
      options: {
        timeout: 60000, // 60 second timeout for complex analytical queries
      },
    });

    if (result.success) {
      return {
        success: true,
        data: truncateQueryResults(result.rows || []),
      };
    }
    return {
      success: false,
      error: result.error?.message || 'Query execution failed',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SQL execution failed',
    };
  }
}

// Export the tool
export const executeSql = createTool({
  id: 'execute-sql',
  description: `Use this to run lightweight, validation queries to understand values in columns, date ranges, etc. 
    SELECT queries without LIMIT will automatically have LIMIT 25 added. 
    You must use the <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names. 
    Otherwise the queries wont run successfully.`,
  inputSchema: executeSqlStatementInputSchema,
  outputSchema: executeSqlStatementOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof executeSqlStatementInputSchema>;
    runtimeContext: RuntimeContext<AnalystRuntimeContext>;
  }) => {
    return await executeSqlStatement(context, runtimeContext);
  },
});

export default executeSql;
