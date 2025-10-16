import './env';

// Adapter interfaces and implementations
export type { AdapterQueryResult, DatabaseAdapter, FieldMetadata } from './adapters/base';
export { BaseAdapter } from './adapters/base';
export { BigQueryAdapter } from './adapters/bigquery';
// Adapter factory functions
export {
  createAdapter,
  createAdapterInstance,
  getSupportedTypes,
  isSupported,
} from './adapters/factory';
export { MySQLAdapter } from './adapters/mysql';
export { PostgreSQLAdapter } from './adapters/postgresql';
export { RedshiftAdapter } from './adapters/redshift';
// Individual adapters
export { SnowflakeAdapter } from './adapters/snowflake';
export { SQLServerAdapter } from './adapters/sqlserver';
// R2 cache utilities for metric data
export {
  batchCheckCacheExists,
  checkCacheExists,
  generateCacheKey,
  getCachedMetricData,
  setCachedMetricData,
} from './cache';
export type {
  DataSourceConfig,
  DataSourceManagerConfig,
  QueryRouterConfig, // Backward compatibility
} from './data-source';
// Main data source class and configuration
export { DataSource, QueryRouter } from './data-source';
// Error handling utilities
export { classifyError } from './errors/data-source-errors';
// Introspection utilities
export {
  getDynamicSampleSize,
  getStructuralMetadata,
  sampleTable,
  validateFilters,
} from './introspection';
// Introspection interfaces and implementations
export type { DataSourceIntrospector } from './introspection/base';
export { BaseIntrospector } from './introspection/base';
export { BigQueryIntrospector } from './introspection/bigquery';
export { MySQLIntrospector } from './introspection/mysql';
export { PostgreSQLIntrospector } from './introspection/postgresql';
export { RedshiftIntrospector } from './introspection/redshift';
// Individual introspectors
export { SnowflakeIntrospector } from './introspection/snowflake';
export { SQLServerIntrospector } from './introspection/sqlserver';
// New introspection types
export type {
  ColumnSchema,
  IntrospectionFilters,
  StructuralMetadata,
  TableMetadata,
  TableSample,
} from './introspection/types';
// Storage abstraction layer
export * from './storage';
export type {
  BigQueryCredentials,
  Credentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  RedshiftCredentials,
  SnowflakeCredentials,
  SQLServerCredentials,
} from './types/credentials';
// Type definitions
export { DataSourceType } from './types/credentials';
// Introspection types
export type {
  ClusteringInfo,
  Column,
  ColumnStatistics,
  Database,
  DataSourceIntrospectionResult,
  ForeignKey,
  Index,
  Schema,
  Table,
  TableStatistics,
  TableType,
  View,
} from './types/introspection';
export type { QueryParameter, QueryRequest, QueryResult } from './types/query';
export { createMetadataFromResults } from './utils/create-metadata-from-results';
export type {
  ExecuteMetricQueryOptions,
  ExecuteMetricQueryResult,
} from './utils/execute-metric-query';
// Metric query utilities
export { executeMetricQuery } from './utils/execute-metric-query';
export type {
  ExecuteSampleQueryOptions,
  ExecuteSampleQueryResult,
} from './utils/execute-sample-query';
// Sample query utilities
export { executeSampleQuery } from './utils/execute-sample-query';
// Utility exports
export {
  batchWithRateLimit,
  getAllRateLimiterStats,
  getRateLimiter,
  RateLimiter,
  withRateLimit,
} from './utils/rate-limiter';
export type { QueryTypeCheckResult } from './utils/sql-validation';
// SQL validation utilities
export { checkQueryIsReadOnly } from './utils/sql-validation';
// Credentials validation utilities
export { isValidCredentials, toCredentials } from './utils/validate-credentials';
