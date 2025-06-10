import { db } from '@buster/database/src/connection';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { DataSource } from '../../../../data-source/src/data-source';
import type { Credentials } from '../../../../data-source/src/types/credentials';
import type { AnalystRuntimeContext } from '../../workflows/analyst-workflow';

const executeSqlStatementInputSchema = z.object({
  statements: z.array(z.string()).describe(
    `Array of lightweight, optimized SQL statements to execute. 
      Each statement should be small and focused. 
      All queries will be automatically limited to 25 results maximum for performance. 
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
    } else {
      // Unexpected error - re-throw with context
      throw new Error(
        `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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

    // Extract context values
    const dataSourceId = runtimeContext.get('dataSourceId') as string;
    const userId = runtimeContext.get('userId') as string;
    const organizationId = runtimeContext.get('organizationId') as string;

    if (!dataSourceId) {
      throw new Error('Unable to identify the data source. Please refresh and try again.');
    }
    if (!userId) {
      throw new Error('Unable to verify your identity. Please log in again.');
    }
    if (!organizationId) {
      throw new Error('Unable to access your organization. Please check your permissions.');
    }

    // Get data source credentials from vault
    let dataSource: DataSource;
    try {
      const credentials = await getDataSourceCredentials(dataSourceId);
      dataSource = new DataSource({
        dataSources: [
          {
            name: `datasource-${dataSourceId}`,
            type: credentials.type as any,
            credentials: credentials,
          },
        ],
        defaultDataSource: `datasource-${dataSourceId}`,
      });
    } catch (_error) {
      // If we can't get credentials, return error for all statements
      return {
        results: statements.map((sql) => ({
          status: 'error' as const,
          sql,
          error_message: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
        })),
      };
    }

    try {
      // Execute all SQL statements concurrently
      const executionResults = await Promise.allSettled(
        statements.map(async (sqlStatement) => {
          const result = await executeSingleStatement(sqlStatement, dataSource);
          return { sql: sqlStatement, result };
        })
      );

      // Process results and format according to output schema
      const results = executionResults.map((executionResult, index) => {
        const sql = statements[index] ?? ''; // Use nullish coalescing instead of non-null assertion

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
    } finally {
      // Always close the data source connection
      await dataSource.close();
    }
  },
  { name: 'execute-sql' }
);

async function getDataSourceCredentials(dataSourceId: string): Promise<Credentials> {
  try {
    // Query the vault to get the credentials
    const secretResult = await db.execute(
      sql`SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ${dataSourceId} LIMIT 1`
    );

    if (!secretResult || secretResult.length === 0) {
      throw new Error(
        'Unable to access your data source credentials. Please ensure the data source is properly configured.'
      );
    }

    const secretString = secretResult[0]?.decrypted_secret as string;
    if (!secretString) {
      throw new Error(
        'The data source credentials appear to be invalid. Please reconfigure your data source.'
      );
    }

    // Parse the credentials JSON
    const credentials = JSON.parse(secretString) as Credentials;
    return credentials;
  } catch (error) {
    console.error('Error getting data source credentials:', error);
    throw new Error(
      'Unable to retrieve data source credentials. Please contact support if this issue persists.'
    );
  }
}

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

    // Execute the SQL query using the DataSource
    const result = await dataSource.execute({
      sql: sqlStatement,
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
  description:
    'Use this to run lightweight, validation queries to understand values in columns, date ranges, etc. Will only ever return 25 results max. You must use the <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names. Otherwise the queries wont run successfully.',
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
