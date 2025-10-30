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
 * Supports flexible partial updates:
 * 1. Name only: { name: "New Name" }
 * 2. Partial credentials: { type: "postgres", password: "new-pass" }
 * 3. Full credentials: { name?: "New Name", ...completeCredentials }
 * 4. Empty object: {} (no-op update)
 *
 * All fields are optional to allow partial updates.
 * The server-side logic validates that the update is valid for the existing data source.
 */
export const UpdateDataSourceRequestSchema = z
  .object({
    name: z.string().min(1).describe('Updated data source name'),
  })
  .partial()
  .passthrough();

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
