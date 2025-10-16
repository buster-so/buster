// Export new functional API

// Legacy exports - keeping for backward compatibility temporarily
export type { DataSourceIntrospector } from './base';
export { BaseIntrospector } from './base';
export { BigQueryIntrospector } from './bigquery';
export {
  createStructuralMetadataFetcher,
  createTableSampler,
  getStructuralMetadata,
  sampleTable,
} from './factory';
export { MySQLIntrospector } from './mysql';
export { PostgreSQLIntrospector } from './postgresql';
export { RedshiftIntrospector } from './redshift';
export { SnowflakeIntrospector } from './snowflake';
export { SQLServerIntrospector } from './sqlserver';
// Export types from new system
export * from './types';
// Export utilities
export {
  calculateSamplePercentage,
  formatRowCount,
  getDynamicSampleSize,
  getQualifiedTableName,
  getString,
  parseBoolean,
  parseDate,
  parseNumber,
  validateFilters,
} from './utils';
