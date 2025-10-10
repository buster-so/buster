import { tool } from 'ai';
import { z } from 'zod';
import type { AnalyticsEngineerAgentOptions } from '../../../agents/analytics-engineer-agent/types';
import { createSuperExecuteSqlExecute } from './super-execute-sql-execute';

export const SuperExecuteSqlInputSchema = z.object({
  statements: z.array(z.string()).describe(
    `Array of lightweight, optimized SQL statements to execute for documentation purposes. 
      Each statement should be small and focused. 
      This tool is specifically for the docs agent to gather metadata and validation information.
      SELECT queries without a LIMIT clause will automatically have LIMIT 100 added for performance.
      Existing LIMIT clauses will be preserved.
      YOU MUST USE THE <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names.
      Common documentation queries:
      - Row counts: SELECT COUNT(*) FROM schema.table;
      - Sample values: SELECT DISTINCT column FROM schema.table LIMIT 10;
      - Min/Max values: SELECT MIN(column), MAX(column) FROM schema.table;
      - Distinct counts: SELECT COUNT(DISTINCT column) FROM schema.table;
      - Referential integrity: SELECT COUNT(*) FROM schema.table_a WHERE foreign_key NOT IN (SELECT primary_key FROM schema.table_b);
      - Match percentage: SELECT (SELECT COUNT(*) FROM schema.table_a JOIN schema.table_b ON a.key = b.key) * 100.0 / (SELECT COUNT(*) FROM schema.table_a);`
  ),
});

const SuperExecuteSqlContextSchema = z.object({
  dataSourceId: z.string().describe('ID of the data source to execute SQL against'),
});

const SuperExecuteSqlStateSchema = z.object({
  startTime: z.number().optional().describe('Execution start time'),
  executionTime: z.number().optional().describe('Total execution time in ms'),
  isComplete: z.boolean().optional().describe('Whether execution is complete'),
  executionResults: z
    .array(
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
    )
    .optional()
    .describe('Execution results'),
});

export type SuperExecuteSqlInput = z.infer<typeof SuperExecuteSqlInputSchema>;
export type SuperExecuteSqlContext = z.infer<typeof SuperExecuteSqlContextSchema>;
export type SuperExecuteSqlState = z.infer<typeof SuperExecuteSqlStateSchema>;

const SuperExecuteSqlOutputSchema = z.object({
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

export type SuperExecuteSqlOutput = z.infer<typeof SuperExecuteSqlOutputSchema>;

// Factory function to create the super-execute-sql tool
export function createSuperExecuteSqlTool(context: SuperExecuteSqlContext) {
  // Initialize state
  const state: SuperExecuteSqlState = {
    startTime: Date.now(),
    executionTime: undefined,
    isComplete: false,
    executionResults: undefined,
  };

  // Create the execute function with the context and state passed
  const execute = createSuperExecuteSqlExecute(state, context);

  return tool({
    description: `Use this to run lightweight validation and metadata queries for documentation purposes.
    This tool is specifically for the docs agent to gather metadata, validate assumptions, and collect context.
    Please limit your queries to 100 rows for performance.
    Query results will be limited to 100 rows for performance. 
    You must use the <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names. 
    Common documentation queries include row counts, sample values, min/max values, distinct counts, 
    referential integrity checks, and match percentage calculations.`,
    inputSchema: SuperExecuteSqlInputSchema,
    outputSchema: SuperExecuteSqlOutputSchema,
    execute,
  });
}

// Legacy export for backward compatibility - renamed to match previous naming
export const executeSqlDocsAgent = tool({
  description: `Use this to run lightweight validation and metadata queries for documentation purposes.
    This tool is specifically for the docs agent to gather metadata, validate assumptions, and collect context.
    Please limit your queries to 100 rows for performance.
    Query results will be limited to 100 rows for performance. 
    You must use the <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names. 
    Common documentation queries include row counts, sample values, min/max values, distinct counts, 
    referential integrity checks, and match percentage calculations.`,
  inputSchema: SuperExecuteSqlInputSchema,
  outputSchema: SuperExecuteSqlOutputSchema,
  execute: async (input, { experimental_context: context }) => {
    const rawContext = context as AnalyticsEngineerAgentOptions;

    const superExecuteSqlContext = SuperExecuteSqlContextSchema.parse({
      dataSourceId: rawContext.dataSourceId,
    });

    // Create temporary state for this execution
    const state: SuperExecuteSqlState = {
      startTime: Date.now(),
      executionTime: undefined,
      isComplete: false,
      executionResults: undefined,
    };

    const executeFunction = createSuperExecuteSqlExecute(state, superExecuteSqlContext);
    return await executeFunction(input);
  },
});

export default executeSqlDocsAgent;
