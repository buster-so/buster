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
  statements: z
    .array(z.string())
    .describe(
      'Array of lightweight, optimized SQL statements to execute. Each statement should be small and focused. All queries will be automatically limited to 25 results maximum for performance. YOU MUST USE THE <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names. NEVER use SELECT * - you must explicitly list the columns you want to query from the documentation provided. Queries without these requirements will fail to execute.'
    ),
});

const executeSqlStatementOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        sql: z.string(),
        results: z.array(z.any()),
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
        const sql = statements[index]!; // We know this exists since we're mapping over statements

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
  data?: Record<string, any>[];
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
        data: result.rows,
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
