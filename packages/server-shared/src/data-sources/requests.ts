import { z } from 'zod';

/**
 * MotherDuck credentials schema for data source creation
 * Matches the MotherDuckCredentials interface from @buster/data-source
 */
export const MotherDuckCredentialsSchema = z.object({
  type: z.literal('motherduck').describe('Data source type'),
  token: z.string().min(1).describe('MotherDuck access token'),
  default_database: z.string().min(1).describe('Default database name to connect to'),
  saas_mode: z
    .boolean()
    .optional()
    .describe('Enable SaaS mode for server-side security isolation (defaults to true)'),
  attach_mode: z
    .enum(['single', 'multi'])
    .optional()
    .describe('Database attachment mode: single or multi'),
  connection_timeout: z.number().optional().describe('Connection timeout in milliseconds'),
  query_timeout: z.number().optional().describe('Query timeout in milliseconds'),
});

/**
 * Create data source request schema
 * Currently only supports MotherDuck, will be expanded to discriminated union for other types
 */
export const CreateDataSourceRequestSchema = z
  .object({
    name: z.string().min(1).describe('Human-readable name for the data source'),
  })
  .merge(MotherDuckCredentialsSchema);

// Types
export type MotherDuckCredentials = z.infer<typeof MotherDuckCredentialsSchema>;
export type CreateDataSourceRequest = z.infer<typeof CreateDataSourceRequestSchema>;
