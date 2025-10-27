import { z } from 'zod';

/**
 * PostgreSQL credentials schema
 */
export const PostgresCredentialsSchema = z.object({
  type: z.literal('postgres').describe('Data source type'),
  host: z.string().min(1).describe('Database host'),
  port: z.number().int().positive().describe('Database port'),
  username: z.string().min(1).describe('Database username'),
  password: z.string().min(1).describe('Database password'),
  default_database: z.string().min(1).describe('Default database name'),
  default_schema: z.string().optional().describe('Default schema name'),
  jump_host: z.string().optional().describe('SSH jump host for tunneling'),
  ssh_username: z.string().optional().describe('SSH username'),
  ssh_private_key: z.string().optional().describe('SSH private key'),
});

/**
 * MySQL credentials schema
 */
export const MySqlCredentialsSchema = z.object({
  type: z.literal('mysql').describe('Data source type'),
  host: z.string().min(1).describe('Database host'),
  port: z.number().int().positive().describe('Database port'),
  username: z.string().min(1).describe('Database username'),
  password: z.string().min(1).describe('Database password'),
  default_database: z.string().min(1).describe('Default database name'),
  default_schema: z.string().optional().describe('Default schema name'),
});

/**
 * BigQuery credentials schema with JSON validation
 */
export const BigqueryCredentialsSchema = z.object({
  type: z.literal('bigquery').describe('Data source type'),
  credentials_json: z
    .string()
    .min(1)
    .refine(
      (val) => {
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'credentials_json must be valid JSON' }
    )
    .describe('Service account JSON key'),
  default_project_id: z.string().min(1).describe('Default GCP project ID'),
  default_dataset_id: z.string().min(1).describe('Default dataset ID'),
});

/**
 * Snowflake credentials schema
 */
export const SnowflakeCredentialsSchema = z.object({
  type: z.literal('snowflake').describe('Data source type'),
  account_id: z.string().min(1).describe('Snowflake account identifier'),
  warehouse_id: z.string().min(1).describe('Warehouse ID'),
  username: z.string().min(1).describe('Snowflake username'),
  password: z.string().min(1).describe('Snowflake password'),
  default_database: z.string().min(1).describe('Default database name'),
  default_schema: z.string().optional().describe('Default schema name'),
  role: z.string().optional().describe('Snowflake role'),
});

/**
 * Databricks credentials schema
 */
export const DatabricksCredentialsSchema = z.object({
  type: z.literal('databricks').describe('Data source type'),
  host: z.string().min(1).describe('Databricks workspace host'),
  api_key: z.string().min(1).describe('Databricks API key'),
  warehouse_id: z.string().min(1).describe('SQL warehouse ID'),
  default_catalog: z.string().min(1).describe('Default catalog name'),
  default_schema: z.string().optional().describe('Default schema name'),
});

/**
 * SQL Server credentials schema
 */
export const SqlServerCredentialsSchema = z.object({
  type: z.literal('sqlserver').describe('Data source type'),
  host: z.string().min(1).describe('SQL Server host'),
  port: z.number().int().positive().describe('SQL Server port'),
  username: z.string().min(1).describe('SQL Server username'),
  password: z.string().min(1).describe('SQL Server password'),
  default_database: z.string().min(1).describe('Default database name'),
});

/**
 * Redshift credentials schema
 */
export const RedshiftCredentialsSchema = z.object({
  type: z.literal('redshift').describe('Data source type'),
  host: z.string().min(1).describe('Redshift cluster endpoint'),
  port: z.number().int().positive().describe('Redshift port'),
  username: z.string().min(1).describe('Redshift username'),
  password: z.string().min(1).describe('Redshift password'),
  default_database: z.string().min(1).describe('Default database name'),
  default_schema: z.string().optional().describe('Default schema name'),
});

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
 * Discriminated union of all credential types
 * Uses 'type' field as the discriminator for type-safe credential handling
 */
export const CredentialsSchema = z.discriminatedUnion('type', [
  PostgresCredentialsSchema,
  MySqlCredentialsSchema,
  BigqueryCredentialsSchema,
  SnowflakeCredentialsSchema,
  DatabricksCredentialsSchema,
  SqlServerCredentialsSchema,
  RedshiftCredentialsSchema,
  MotherDuckCredentialsSchema,
]);

/**
 * Create data source request schema
 * Combines name field with credential union for type-safe data source creation
 */
export const CreateDataSourceRequestSchema = z
  .object({
    name: z.string().min(1).describe('Human-readable name for the data source'),
  })
  .and(CredentialsSchema);

/**
 * Update data source request schema
 * All fields are optional to allow partial updates
 * Note: Since discriminated unions don't support .partial(), we make the entire
 * credentials optional instead
 */
export const UpdateDataSourceRequestSchema = z.object({
  name: z.string().min(1).optional().describe('Updated data source name'),
  // Credentials are optional and when provided, must match one of the valid types
  type: z.string().optional().describe('Data source type (if updating credentials)'),
  // Postgres fields
  host: z.string().min(1).optional(),
  port: z.number().int().positive().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  default_database: z.string().min(1).optional(),
  default_schema: z.string().optional(),
  jump_host: z.string().optional(),
  ssh_username: z.string().optional(),
  ssh_private_key: z.string().optional(),
  // BigQuery fields
  credentials_json: z.string().optional(),
  default_project_id: z.string().optional(),
  default_dataset_id: z.string().optional(),
  // Snowflake fields
  account_id: z.string().optional(),
  warehouse_id: z.string().optional(),
  role: z.string().optional(),
  // Databricks fields
  api_key: z.string().optional(),
  default_catalog: z.string().optional(),
  // MotherDuck fields
  token: z.string().optional(),
  saas_mode: z.boolean().optional(),
  attach_mode: z.enum(['single', 'multi']).optional(),
  connection_timeout: z.number().optional(),
  query_timeout: z.number().optional(),
});

/**
 * Query parameters for list endpoint with pagination
 */
export const ListDataSourcesQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0).describe('Page number (0-indexed)'),
  pageSize: z.coerce.number().int().min(1).max(100).default(25).describe('Items per page'),
});

// Export inferred types
export type PostgresCredentials = z.infer<typeof PostgresCredentialsSchema>;
export type MySqlCredentials = z.infer<typeof MySqlCredentialsSchema>;
export type BigqueryCredentials = z.infer<typeof BigqueryCredentialsSchema>;
export type SnowflakeCredentials = z.infer<typeof SnowflakeCredentialsSchema>;
export type DatabricksCredentials = z.infer<typeof DatabricksCredentialsSchema>;
export type SqlServerCredentials = z.infer<typeof SqlServerCredentialsSchema>;
export type RedshiftCredentials = z.infer<typeof RedshiftCredentialsSchema>;
export type MotherDuckCredentials = z.infer<typeof MotherDuckCredentialsSchema>;
export type Credentials = z.infer<typeof CredentialsSchema>;
export type CreateDataSourceRequest = z.infer<typeof CreateDataSourceRequestSchema>;
export type UpdateDataSourceRequest = z.infer<typeof UpdateDataSourceRequestSchema>;
export type ListDataSourcesQuery = z.infer<typeof ListDataSourcesQuerySchema>;

/**
 * Union type of all valid data source type strings
 * Extracted from the Credentials discriminated union for exhaustive type checking
 */
export type DataSourceType = Credentials['type'];
