import { tool } from 'ai';
import { z } from 'zod';
import { createRunSqlExecute } from './run-sql-execute';

export const RUN_SQL_TOOL_NAME = 'runSql';

export const RunSqlInputSchema = z.object({
  data_source_id: z.string().uuid().describe('UUID of the data source to execute SQL against'),
  sql: z
    .string()
    .min(1)
    .describe(
      `SQL query to execute.
      YOU MUST USE THE <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names.
      NEVER use SELECT * on physical tables - for security purposes you must explicitly select the columns you intend to use.
      NEVER query system tables or use 'SHOW' statements as these will fail to execute.
      Queries without these requirements will fail to execute.`
    ),
});

const RunSqlContextSchema = z.object({
  apiKey: z.string().describe('API key for authentication'),
  apiUrl: z.string().describe('Base URL of the API server'),
});

export type RunSqlInput = z.infer<typeof RunSqlInputSchema>;
export type RunSqlContext = z.infer<typeof RunSqlContextSchema>;

const RunSqlOutputSchema = z.object({
  data: z.array(z.record(z.unknown())).describe('Query results'),
  data_metadata: z.record(z.unknown()).describe('Metadata about the data columns'),
  has_more_records: z.boolean().describe('Whether there are more records available'),
});

export type RunSqlOutput = z.infer<typeof RunSqlOutputSchema>;

// Factory function to create the run-sql tool
export function createRunSqlTool(context: RunSqlContext) {
  return tool({
    description: `Use this to run SQL queries against a data source via API.
    This tool executes queries remotely and returns results with metadata.
    You must use the <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names.
    Results are limited to 5000 rows for performance.
    
    The data source(s) you are connected to is:
    - buster (POSTGRESQL): cc3ef3bc-44ec-4a43-8dc4-681cae5c996a`,
    inputSchema: RunSqlInputSchema,
    outputSchema: RunSqlOutputSchema,
    execute: createRunSqlExecute(context),
  });
}
