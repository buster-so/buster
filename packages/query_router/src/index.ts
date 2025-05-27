// Main router class and configuration
export { QueryRouter } from './router';
export type { DataSourceConfig, QueryRouterConfig } from './router';

// Credential types and enums
export { DataSourceType } from './types/credentials';
export type {
  Credentials,
  SnowflakeCredentials,
  BigQueryCredentials,
  PostgreSQLCredentials,
  MySQLCredentials,
  SQLServerCredentials,
  RedshiftCredentials,
  DatabricksCredentials,
  SnowflakeConnectionConfig,
  WarehouseConfig,
} from './types/credentials';

// Query types
export type { QueryRequest, QueryResult, ColumnMetadata, QueryError } from './types/query';

// Adapters (for advanced usage)
export type { DatabaseAdapter, AdapterQueryResult } from './adapters';
export { createAdapter, getSupportedTypes, isSupported } from './adapters';
