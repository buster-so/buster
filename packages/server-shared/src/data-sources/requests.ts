import {
  BigQueryCredentialsSchema,
  MotherDuckCredentialsSchema,
  MySQLCredentialsSchema,
  PostgreSQLCredentialsSchema,
  RedshiftCredentialsSchema,
  SnowflakeCredentialsSchema,
  SQLServerCredentialsSchema,
  CredentialsSchema as VaultCredentialsSchema,
} from '@buster/database/schema-types';
import { z } from 'zod';

/**
 * API Request Schemas for Data Source Management
 *
 * Note: These schemas are imported directly from the vault credential schemas in @buster/database
 * to ensure consistency between the API layer and storage layer.
 */

// Re-export vault credential schemas for API use
export {
  BigQueryCredentialsSchema,
  MotherDuckCredentialsSchema,
  MySQLCredentialsSchema,
  PostgreSQLCredentialsSchema,
  RedshiftCredentialsSchema,
  SnowflakeCredentialsSchema,
  SQLServerCredentialsSchema,
};

/**
 * Databricks credentials schema
 * Note: Databricks is not yet in the vault schemas, keeping local definition
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
 * Discriminated union of all credential types
 * Uses vault credentials as the source of truth
 * Note: Databricks is defined above but not yet included in the union
 * because it's missing the adapter implementation
 */
export const CredentialsSchema = VaultCredentialsSchema;

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
  // Postgres/MySQL/Redshift fields
  host: z.string().min(1).optional(),
  port: z.number().int().positive().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  default_database: z.string().min(1).optional(),
  default_schema: z.string().optional(),
  database: z.string().optional(),
  schema: z.string().optional(),
  ssl: z.union([z.boolean(), z.record(z.unknown())]).optional(),
  // BigQuery fields
  service_account_key: z.union([z.string(), z.record(z.unknown())]).optional(),
  project_id: z.string().optional(),
  default_dataset: z.string().optional(),
  key_file_path: z.string().optional(),
  location: z.string().optional(),
  // Snowflake fields
  account_id: z.string().optional(),
  warehouse_id: z.string().optional(),
  role: z.string().optional(),
  custom_host: z.string().optional(),
  // Databricks fields
  api_key: z.string().optional(),
  default_catalog: z.string().optional(),
  // SQL Server fields
  domain: z.string().optional(),
  instance: z.string().optional(),
  encrypt: z.boolean().optional(),
  trust_server_certificate: z.boolean().optional(),
  request_timeout: z.number().optional(),
  // Redshift fields
  cluster_identifier: z.string().optional(),
  // MotherDuck fields
  token: z.string().optional(),
  saas_mode: z.boolean().optional(),
  attach_mode: z.enum(['multi', 'single']).optional(),
  // Shared timeout fields
  connection_timeout: z.number().optional(),
  query_timeout: z.number().optional(),
  // MySQL specific
  charset: z.string().optional(),
});

/**
 * Query parameters for list endpoint with pagination
 */
export const ListDataSourcesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number (1-indexed)'),
  page_size: z.coerce.number().int().min(1).max(100).default(25).describe('Items per page'),
});

// Export inferred types from vault schemas
export type PostgreSQLCredentials = z.infer<typeof PostgreSQLCredentialsSchema>;
export type MySQLCredentials = z.infer<typeof MySQLCredentialsSchema>;
export type BigQueryCredentials = z.infer<typeof BigQueryCredentialsSchema>;
export type SnowflakeCredentials = z.infer<typeof SnowflakeCredentialsSchema>;
export type DatabricksCredentials = z.infer<typeof DatabricksCredentialsSchema>;
export type SQLServerCredentials = z.infer<typeof SQLServerCredentialsSchema>;
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
