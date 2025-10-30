import type { z } from 'zod';
import type {
  BigQueryCredentialsSchema,
  CredentialsSchema,
  DataSourceTypeSchema,
  MotherDuckCredentialsSchema,
  MySQLCredentialsSchema,
  PostgreSQLCredentialsSchema,
  RedshiftCredentialsSchema,
  SnowflakeConnectionConfigSchema,
  SnowflakeCredentialsSchema,
  SQLServerCredentialsSchema,
  WarehouseConfigSchema,
} from './schemas';

/**
 * Data source types supported by the query router
 */
export type DataSourceType = z.infer<typeof DataSourceTypeSchema>;

/**
 * Snowflake credentials type that matches the Rust SnowflakeCredentials structure
 */
export type SnowflakeCredentials = z.infer<typeof SnowflakeCredentialsSchema>;

/**
 * BigQuery credentials type
 */
export type BigQueryCredentials = z.infer<typeof BigQueryCredentialsSchema>;

/**
 * PostgreSQL credentials type
 */
export type PostgreSQLCredentials = z.infer<typeof PostgreSQLCredentialsSchema>;

/**
 * MySQL credentials type
 */
export type MySQLCredentials = z.infer<typeof MySQLCredentialsSchema>;

/**
 * SQL Server credentials type
 */
export type SQLServerCredentials = z.infer<typeof SQLServerCredentialsSchema>;

/**
 * Redshift credentials type (extends PostgreSQL since Redshift is PostgreSQL-compatible)
 */
export type RedshiftCredentials = z.infer<typeof RedshiftCredentialsSchema>;

/**
 * MotherDuck credentials type (cloud-native DuckDB)
 */
export type MotherDuckCredentials = z.infer<typeof MotherDuckCredentialsSchema>;

/**
 * Union type for all supported credential types
 */
export type Credentials = z.infer<typeof CredentialsSchema>;

/**
 * Configuration options for Snowflake connection
 */
export type SnowflakeConnectionConfig = z.infer<typeof SnowflakeConnectionConfigSchema>;

/**
 * Warehouse configuration type
 */
export type WarehouseConfig = z.infer<typeof WarehouseConfigSchema>;
