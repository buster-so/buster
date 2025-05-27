// Main data source class and configuration
export { DataSource, QueryRouter } from './data-source';
export type {
  DataSourceConfig,
  DataSourceManagerConfig,
  QueryRouterConfig, // Backward compatibility
} from './data-source';

// Adapter interfaces and implementations
export type { DatabaseAdapter, AdapterQueryResult, FieldMetadata } from './adapters/base';
export { BaseAdapter } from './adapters/base';

// Individual adapters
export { SnowflakeAdapter } from './adapters/snowflake';
export { BigQueryAdapter } from './adapters/bigquery';
export { PostgreSQLAdapter } from './adapters/postgresql';
export { MySQLAdapter } from './adapters/mysql';
export { SQLServerAdapter } from './adapters/sqlserver';
export { RedshiftAdapter } from './adapters/redshift';
export { DatabricksAdapter } from './adapters/databricks';

// Adapter factory functions
export {
  createAdapter,
  createAdapterInstance,
  getSupportedTypes,
  isSupported,
} from './adapters/factory';

// Introspection interfaces and implementations
export type { DataSourceIntrospector } from './introspection/base';
export { BaseIntrospector } from './introspection/base';

// Individual introspectors
export { SnowflakeIntrospector } from './introspection/snowflake';
export { PostgreSQLIntrospector } from './introspection/postgresql';
export { MySQLIntrospector } from './introspection/mysql';
export { BigQueryIntrospector } from './introspection/bigquery';
export { SQLServerIntrospector } from './introspection/sqlserver';
export { RedshiftIntrospector } from './introspection/redshift';
export { DatabricksIntrospector } from './introspection/databricks';

// Type definitions
export { DataSourceType } from './types/credentials';
export type { Credentials } from './types/credentials';
export type {
  SnowflakeCredentials,
  BigQueryCredentials,
  PostgreSQLCredentials,
  MySQLCredentials,
  SQLServerCredentials,
  RedshiftCredentials,
  DatabricksCredentials,
} from './types/credentials';

export type { QueryRequest, QueryResult, QueryParameter } from './types/query';

// Introspection types
export type {
  Database,
  Schema,
  Table,
  Column,
  View,
  TableStatistics,
  ColumnStatistics,
  ClusteringInfo,
  Index,
  ForeignKey,
  DataSourceIntrospectionResult,
  TableType,
} from './types/introspection';
