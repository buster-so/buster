/**
 * Data source types supported by the query router
 */
export enum DataSourceType {
  Snowflake = 'snowflake',
  BigQuery = 'bigquery',
  PostgreSQL = 'postgres',
  MySQL = 'mysql',
  SQLServer = 'sqlserver',
  Redshift = 'redshift',
}

/**
 * Snowflake credentials interface that matches the Rust SnowflakeCredentials structure
 * from api/libs/query_engine/src/credentials.rs
 */
export interface SnowflakeCredentials {
  /** Data source type */
  type: DataSourceType.Snowflake;

  /** Snowflake account identifier (e.g., "ABC12345.us-central1.gcp") */
  account_id: string;

  /** Warehouse identifier for compute resources */
  warehouse_id: string;

  /** Username for authentication */
  username: string;

  /** Password for authentication */
  password: string;

  /** Optional role to assume after authentication */
  role?: string;

  /** Default database to use (aliased as 'database' for compatibility) */
  default_database: string;

  /** Default schema to use */
  default_schema?: string;
}

/**
 * BigQuery credentials interface
 */
export interface BigQueryCredentials {
  /** Data source type */
  type: DataSourceType.BigQuery;

  /** Google Cloud project ID */
  project_id: string;

  /** Service account key JSON (as string) or path to key file */
  service_account_key?: string;

  /** Path to service account key file */
  key_file_path?: string;

  /** Default dataset to use */
  default_dataset?: string;

  /** Location/region for BigQuery operations */
  location?: string;
}

/**
 * PostgreSQL credentials interface
 */
export interface PostgreSQLCredentials {
  /** Data source type */
  type: DataSourceType.PostgreSQL;

  /** Database host */
  host: string;

  /** Database port */
  port?: number;

  /** Database name */
  default_database: string;

  /** Database name */
  database?: string;

  /** Username for authentication */
  username: string;

  /** Password for authentication */
  password: string;

  /** Default schema to use */
  schema?: string;

  /** SSL configuration */
  ssl?:
    | boolean
    | {
        rejectUnauthorized?: boolean;
        ca?: string;
        cert?: string;
        key?: string;
      };

  /** Connection timeout in milliseconds */
  connection_timeout?: number;
}

/**
 * MySQL credentials interface
 */
export interface MySQLCredentials {
  /** Data source type */
  type: DataSourceType.MySQL;

  /** Database host */
  host: string;

  /** Database port */
  port?: number;

  /** Database name */
  default_database: string;

  /** Username for authentication */
  username: string;

  /** Password for authentication */
  password: string;

  /** SSL configuration */
  ssl?:
    | boolean
    | {
        rejectUnauthorized?: boolean;
        ca?: string;
        cert?: string;
        key?: string;
      };

  /** Connection timeout in milliseconds */
  connection_timeout?: number;

  /** Character set */
  charset?: string;
}

/**
 * SQL Server credentials interface
 */
export interface SQLServerCredentials {
  /** Data source type */
  type: DataSourceType.SQLServer;

  /** Database server */
  server: string;

  /** Database port */
  port?: number;

  /** Database name */
  default_database: string;

  /** Username for authentication */
  username: string;

  /** Password for authentication */
  password: string;

  /** Domain for Windows authentication */
  domain?: string;

  /** Instance name */
  instance?: string;

  /** Encrypt connection */
  encrypt?: boolean;

  /** Trust server certificate */
  trust_server_certificate?: boolean;

  /** Connection timeout in milliseconds */
  connection_timeout?: number;

  /** Request timeout in milliseconds */
  request_timeout?: number;
}

/**
 * Redshift credentials interface (extends PostgreSQL since Redshift is PostgreSQL-compatible)
 */
export interface RedshiftCredentials {
  /** Data source type */
  type: DataSourceType.Redshift;

  /** Redshift cluster endpoint */
  host: string;

  /** Database port */
  port?: number;

  /** Database name */
  default_database: string;

  /** Username for authentication */
  username: string;

  /** Password for authentication */
  password: string;

  /** Default schema to use */
  default_schema?: string;

  /** SSL configuration (required for Redshift) */
  ssl?: boolean;

  /** Connection timeout in milliseconds */
  connection_timeout?: number;

  /** Cluster identifier */
  cluster_identifier?: string;
}

/**
 * Union type for all supported credential types
 */
export type Credentials =
  | SnowflakeCredentials
  | BigQueryCredentials
  | PostgreSQLCredentials
  | MySQLCredentials
  | SQLServerCredentials
  | RedshiftCredentials;

/**
 * Type guard to check if credentials are for Snowflake
 */
export function isSnowflakeCredentials(
  credentials: Credentials
): credentials is SnowflakeCredentials {
  return credentials.type === DataSourceType.Snowflake;
}

/**
 * Type guard to check if credentials are for BigQuery
 */
export function isBigQueryCredentials(
  credentials: Credentials
): credentials is BigQueryCredentials {
  return credentials.type === DataSourceType.BigQuery;
}

/**
 * Type guard to check if credentials are for PostgreSQL
 */
export function isPostgreSQLCredentials(
  credentials: Credentials
): credentials is PostgreSQLCredentials {
  return credentials.type === DataSourceType.PostgreSQL;
}

/**
 * Type guard to check if credentials are for MySQL
 */
export function isMySQLCredentials(credentials: Credentials): credentials is MySQLCredentials {
  return credentials.type === DataSourceType.MySQL;
}

/**
 * Type guard to check if credentials are for SQL Server
 */
export function isSQLServerCredentials(
  credentials: Credentials
): credentials is SQLServerCredentials {
  return credentials.type === DataSourceType.SQLServer;
}

/**
 * Type guard to check if credentials are for Redshift
 */
export function isRedshiftCredentials(
  credentials: Credentials
): credentials is RedshiftCredentials {
  return credentials.type === DataSourceType.Redshift;
}

/**
 * Configuration options for Snowflake connection
 */
export interface SnowflakeConnectionConfig extends SnowflakeCredentials {
  /** Connection timeout in milliseconds (default: 60000) */
  timeout?: number;

  /** Whether to keep the client session alive (default: true) */
  clientSessionKeepAlive?: boolean;

  /** Whether to validate SSL certificates (default: true) */
  validateDefaultParameters?: boolean;

  /** Additional connection options */
  options?: Record<string, unknown>;
}

/**
 * Warehouse configuration
 */
export interface WarehouseConfig {
  name: string;
  type: DataSourceType;
  credentials: Credentials;
  config?: Record<string, unknown>;
}
