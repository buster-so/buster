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

// Metric query utilities
export { executeMetricQuery } from './utils/execute-metric-query';
export type {
  ExecuteMetricQueryOptions,
  ExecuteMetricQueryResult,
} from './utils/execute-metric-query';
export { createMetadataFromResults } from './utils/create-metadata-from-results';

// Sample query utilities
export { executeSampleQuery } from './utils/execute-sample-query';
export type {
  ExecuteSampleQueryOptions,
  ExecuteSampleQueryResult,
} from './utils/execute-sample-query';

// SQL validation utilities
export { checkQueryIsReadOnly } from './utils/sql-validation';
export type { QueryTypeCheckResult } from './utils/sql-validation';

// Credentials validation utilities
export { isValidCredentials, toCredentials } from './utils/validate-credentials';

// R2 cache utilities for metric data
export {
  checkCacheExists,
  getCachedMetricData,
  setCachedMetricData,
  batchCheckCacheExists,
  generateCacheKey,
} from './cache';

// Storage abstraction layer
export * from './storage';
