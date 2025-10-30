import { z } from 'zod';
import { PrivateKeySchema } from './validate-private-key';

/**
 * Data source types supported by the query router
 */
export const DataSourceTypeSchema = z.enum([
  'snowflake',
  'bigquery',
  'postgres',
  'mysql',
  'sqlserver',
  'redshift',
  'motherduck',
]);

/**
 * Single source of truth for data source type values
 * Derived directly from the Zod schema enum - tied to the credential validation
 *
 * This const object provides PascalCase property names for backward compatibility
 * while ensuring values stay in sync with the schema definition.
 *
 * @example
 * ```typescript
 * import { DataSourceType } from '@buster/database/schema-types';
 *
 * const type = DataSourceType.Snowflake; // 'snowflake'
 * if (credentials.type === DataSourceType.PostgreSQL) { ... }
 * ```
 */
export const DataSourceType = {
  Snowflake: DataSourceTypeSchema.enum.snowflake,
  BigQuery: DataSourceTypeSchema.enum.bigquery,
  PostgreSQL: DataSourceTypeSchema.enum.postgres,
  MySQL: DataSourceTypeSchema.enum.mysql,
  SQLServer: DataSourceTypeSchema.enum.sqlserver,
  Redshift: DataSourceTypeSchema.enum.redshift,
  MotherDuck: DataSourceTypeSchema.enum.motherduck,
} as const;

/**
 * TypeScript type representing the union of data source type strings
 * Inferred directly from DataSourceTypeSchema for type annotations
 *
 * Use this for function parameters, return types, and interface properties:
 * @example
 * ```typescript
 * function getAdapter(type: DataSourceTypeValue) { ... }
 * interface Config { type: DataSourceTypeValue; }
 * ```
 */
export type DataSourceTypeValue = z.infer<typeof DataSourceTypeSchema>;

/**
 * Base schema with fields common to all Snowflake authentication methods
 */
const SnowflakeBaseSchema = z.object({
  type: z.literal('snowflake').describe('Data source type'),
  account_id: z
    .string()
    .min(1)
    .describe('Snowflake account identifier (e.g., "ABC12345.us-central1.gcp")'),
  warehouse_id: z
    .string()
    .min(1)
    .optional()
    .describe('Warehouse identifier for compute resources (optional, can be set later)'),
  username: z.string().min(1).describe('Username for authentication'),
  role: z.string().optional().describe('Optional role to assume after authentication'),
  default_database: z
    .string()
    .min(1)
    .optional()
    .describe('Default database to use (optional, can be set later)'),
  default_schema: z.string().optional().describe('Default schema to use'),
  custom_host: z
    .string()
    .optional()
    .describe(
      'Optional custom host for load balancers (e.g., "ridedvp-angel.yukicomputing.com:443")'
    ),
});

/**
 * Username/password authentication schema
 */
const SnowflakePasswordAuthSchema = SnowflakeBaseSchema.extend({
  auth_method: z
    .literal('password')
    .default('password')
    .describe('Authentication method - username and password'),
  password: z.string().min(1).describe('Password for authentication'),
});

/**
 * Key-pair authentication schema
 * Uses PEM-encoded PKCS8 private key for JWT-based authentication
 */
const SnowflakeKeyPairAuthSchema = SnowflakeBaseSchema.extend({
  auth_method: z.literal('key_pair').describe('Authentication method - public/private key pair'),
  private_key: PrivateKeySchema.describe('PEM-encoded PKCS8 private key for JWT authentication'),
  private_key_passphrase: z
    .string()
    .optional()
    .describe('Optional passphrase for encrypted private key'),
});

/**
 * Snowflake credentials schema that supports multiple authentication methods
 * Uses discriminated union on auth_method for type-safe authentication
 *
 * Backward compatibility: When auth_method is missing, defaults to 'password'
 * if password field is present, otherwise validation will fail.
 */
const SnowflakeCredentialsUnion = z.discriminatedUnion('auth_method', [
  SnowflakePasswordAuthSchema,
  SnowflakeKeyPairAuthSchema,
]);

export const SnowflakeCredentialsSchema = z.preprocess((data) => {
  // Backward compatibility: default to password auth when auth_method is missing
  if (typeof data === 'object' && data !== null && !('auth_method' in data)) {
    return { ...data, auth_method: 'password' };
  }
  return data;
}, SnowflakeCredentialsUnion);

export type SnowflakeCredentials = z.infer<typeof SnowflakeCredentialsSchema>;

/**
 * BigQuery credentials schema
 */
export const BigQueryCredentialsSchema = z.object({
  type: z.literal('bigquery').describe('Data source type'),
  project_id: z.string().min(1).describe('Google Cloud project ID'),
  service_account_key: z
    .union([z.string(), z.record(z.unknown())])
    .optional()
    .describe('Service account key - can be JSON string, parsed object, or path to key file'),
  key_file_path: z.string().optional().describe('Path to service account key file'),
  default_dataset: z.string().optional().describe('Default dataset to use'),
  location: z.string().optional().describe('Location/region for BigQuery operations'),
});

export type BigQueryCredentials = z.infer<typeof BigQueryCredentialsSchema>;

/**
 * PostgreSQL credentials schema
 */
export const PostgreSQLCredentialsSchema = z.object({
  type: z.literal('postgres').describe('Data source type'),
  host: z.string().min(1).describe('Database host'),
  port: z.number().int().positive().optional().describe('Database port'),
  default_database: z.string().min(1).describe('Database name'),
  database: z.string().optional().describe('Database name (alias for default_database)'),
  username: z.string().min(1).describe('Username for authentication'),
  password: z.string().min(1).describe('Password for authentication'),
  default_schema: z.string().optional().describe('Default schema to use'),
  schema: z.string().optional().describe('Schema name (alias for default_schema)'),
  ssl: z
    .union([
      z.boolean(),
      z.object({
        rejectUnauthorized: z.boolean().optional(),
        ca: z.string().optional(),
        cert: z.string().optional(),
        key: z.string().optional(),
      }),
    ])
    .optional()
    .describe('SSL configuration'),
  connection_timeout: z.number().optional().describe('Connection timeout in milliseconds'),
});

export type PostgreSQLCredentials = z.infer<typeof PostgreSQLCredentialsSchema>;

/**
 * MySQL credentials schema
 */
export const MySQLCredentialsSchema = z.object({
  type: z.literal('mysql').describe('Data source type'),
  host: z.string().min(1).describe('Database host'),
  port: z.number().int().positive().optional().describe('Database port'),
  default_database: z.string().min(1).describe('Database name'),
  username: z.string().min(1).describe('Username for authentication'),
  password: z.string().min(1).describe('Password for authentication'),
  default_schema: z.string().optional().describe('Default schema to use'),
  ssl: z
    .union([
      z.boolean(),
      z.object({
        rejectUnauthorized: z.boolean().optional(),
        ca: z.string().optional(),
        cert: z.string().optional(),
        key: z.string().optional(),
      }),
    ])
    .optional()
    .describe('SSL configuration'),
  connection_timeout: z.number().optional().describe('Connection timeout in milliseconds'),
  charset: z.string().optional().describe('Character set'),
});

export type MySQLCredentials = z.infer<typeof MySQLCredentialsSchema>;

/**
 * SQL Server credentials schema
 */
export const SQLServerCredentialsSchema = z.object({
  type: z.literal('sqlserver').describe('Data source type'),
  host: z.string().min(1).describe('Database host'),
  port: z.number().int().positive().optional().describe('Database port'),
  default_database: z.string().min(1).describe('Database name'),
  username: z.string().min(1).describe('Username for authentication'),
  password: z.string().min(1).describe('Password for authentication'),
  domain: z.string().optional().describe('Domain for Windows authentication'),
  instance: z.string().optional().describe('Instance name'),
  encrypt: z.boolean().optional().describe('Encrypt connection'),
  trust_server_certificate: z.boolean().optional().describe('Trust server certificate'),
  connection_timeout: z.number().optional().describe('Connection timeout in milliseconds'),
  request_timeout: z.number().optional().describe('Request timeout in milliseconds'),
});

export type SQLServerCredentials = z.infer<typeof SQLServerCredentialsSchema>;

/**
 * Redshift credentials schema (extends PostgreSQL since Redshift is PostgreSQL-compatible)
 */
export const RedshiftCredentialsSchema = z.object({
  type: z.literal('redshift').describe('Data source type'),
  host: z.string().min(1).describe('Redshift cluster endpoint'),
  port: z.number().int().positive().optional().describe('Database port'),
  default_database: z.string().min(1).describe('Database name'),
  username: z.string().min(1).describe('Username for authentication'),
  password: z.string().min(1).describe('Password for authentication'),
  default_schema: z.string().optional().describe('Default schema to use'),
  ssl: z.boolean().optional().describe('SSL configuration (required for Redshift)'),
  connection_timeout: z.number().optional().describe('Connection timeout in milliseconds'),
  cluster_identifier: z.string().optional().describe('Cluster identifier'),
});

export type RedshiftCredentials = z.infer<typeof RedshiftCredentialsSchema>;

/**
 * MotherDuck credentials schema (cloud-native DuckDB)
 */
export const MotherDuckCredentialsSchema = z.object({
  type: z.literal('motherduck').describe('Data source type'),
  token: z.string().min(1).describe('MotherDuck access token (Read/Write or Read Scaling)'),
  default_database: z.string().min(1).describe('Default database name to connect to'),
  saas_mode: z
    .boolean()
    .optional()
    .describe(
      'Enable SaaS mode for additional security isolation (defaults to true for server-side execution)'
    ),
  attach_mode: z
    .enum(['multi', 'single'])
    .optional()
    .describe(
      'Database attachment mode: "multi" allows multiple databases, "single" restricts to one'
    ),
  connection_timeout: z.number().optional().describe('Connection timeout in milliseconds'),
  query_timeout: z.number().optional().describe('Query timeout in milliseconds'),
});

export type MotherDuckCredentials = z.infer<typeof MotherDuckCredentialsSchema>;

/**
 * Discriminated union for all supported credential types
 * Uses the 'type' field as the discriminator for type-safe narrowing
 *
 * Note: Snowflake has its own discriminated union on 'auth_method', but both
 * password and key-pair variants share the same 'type: snowflake' field.
 * We wrap the Snowflake union to maintain type compatibility.
 */
export const CredentialsSchema = z.union([
  SnowflakeCredentialsSchema,
  BigQueryCredentialsSchema,
  PostgreSQLCredentialsSchema,
  MySQLCredentialsSchema,
  SQLServerCredentialsSchema,
  RedshiftCredentialsSchema,
  MotherDuckCredentialsSchema,
]);

export type Credentials = z.infer<typeof CredentialsSchema>;

/**
 * Configuration options for Snowflake connection (extends base credentials with additional options)
 */
export const SnowflakeConnectionConfigSchema = z.intersection(
  SnowflakeCredentialsSchema,
  z.object({
    timeout: z.number().optional().describe('Connection timeout in milliseconds (default: 60000)'),
    clientSessionKeepAlive: z
      .boolean()
      .optional()
      .describe('Whether to keep the client session alive (default: true)'),
    validateDefaultParameters: z
      .boolean()
      .optional()
      .describe('Whether to validate SSL certificates (default: true)'),
    options: z.record(z.unknown()).optional().describe('Additional connection options'),
  })
);

export type SnowflakeConnectionConfig = z.infer<typeof SnowflakeConnectionConfigSchema>;

/**
 * Warehouse configuration schema
 */
export const WarehouseConfigSchema = z.object({
  name: z.string().min(1).describe('Warehouse name'),
  type: DataSourceTypeSchema.describe('Data source type'),
  credentials: CredentialsSchema.describe('Data source credentials'),
  config: z.record(z.unknown()).optional().describe('Additional configuration'),
});

export type WarehouseConfig = z.infer<typeof WarehouseConfigSchema>;
