import './env';

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

// Utility exports
export {
  RateLimiter,
  getRateLimiter,
  withRateLimit,
  batchWithRateLimit,
  getAllRateLimiterStats,
} from './utils/rate-limiter';

// Schema sync exports
export {
  parseDatasetYml,
  extractColumnsFromYml,
  normalizeColumnNames,
} from './schema-sync/yml-parser';
export type {
  ParsedDatasetYml,
  YmlDimension,
  YmlMeasure,
  YmlColumnInfo,
} from './schema-sync/yml-parser';

export {
  compareSchemaWithYml,
  categorizeDiscrepancies,
  dedupDiscrepancies,
} from './schema-sync/schema-comparator';

export {
  createIntrospectionService,
} from './schema-sync/introspection-service';
export type {
  SchemaIntrospectionService,
  IntrospectionResult,
} from './schema-sync/introspection-service';
