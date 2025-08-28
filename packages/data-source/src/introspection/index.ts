// Export new functional API
export {
  createStructuralMetadataFetcher,
  createTableSampler,
  getStructuralMetadata,
  sampleTable,
} from './factory';

// Export utilities
export {
  getDynamicSampleSize,
  parseDate,
  parseNumber,
  parseBoolean,
  getString,
  getQualifiedTableName,
  formatRowCount,
  calculateSamplePercentage,
  validateFilters,
} from './utils';

// Export types from new system
export * from './types';

// Legacy exports - keeping for backward compatibility temporarily
export type { DataSourceIntrospector } from './base';
export { BaseIntrospector } from './base';
export { SnowflakeIntrospector } from './snowflake';
export { PostgreSQLIntrospector } from './postgresql';
export { MySQLIntrospector } from './mysql';
export { BigQueryIntrospector } from './bigquery';
export { SQLServerIntrospector } from './sqlserver';
export { RedshiftIntrospector } from './redshift';
