import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

const executeSqlStatementInputSchema = z.object({
  statements: z
    .array(z.string())
    .describe(
      'Array of lightweight, optimized SQL statements to execute. Each statement should be small and focused. All queries will be automatically limited to 25 results maximum for performance.'
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
  async (): Promise<z.infer<typeof executeSqlStatementOutputSchema>> => {
    return await executeSqlStatement();
  },
  { name: 'execute-sql-statement' }
);

// Export the tool
export const executeSqlStatementTool = createTool({
  id: 'execute-sql-statement',
  description:
    'Use this to run lightweight, validation queries to understand values in columns, date ranges, etc. Will only ever return 25 results max',
  inputSchema: executeSqlStatementInputSchema,
  outputSchema: executeSqlStatementOutputSchema,
  execute: async () => {
    return await executeSqlStatement();
  },
});

export default executeSqlStatementTool;
