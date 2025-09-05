/**
 * Searchable values module exports
 * Provides types, schemas, and utilities for managing searchable text values
 */

// Export all types and schemas
export {
  // Core schemas
  SearchableValueSchema,
  TurbopufferQuerySchema,
  DeduplicationResultSchema,
  TurbopufferDocumentSchema,
  UpsertResultSchema,
  // Sync job schemas
  SyncJobPayloadSchema,
  SyncJobStatusSchema,
  SyncJobMetadataSchema,
  // Configuration schemas
  BatchConfigSchema,
  // Search schemas
  SearchRequestSchema,
  SearchResultSchema,
  SearchResponseSchema,
  // Error handling schemas
  ErrorTypeSchema,
  SyncErrorSchema,
  // Types
  type SearchableValue,
  type TurbopufferQuery,
  type DeduplicationResult,
  type TurbopufferDocument,
  type UpsertResult,
  type SyncJobPayload,
  type SyncJobStatus,
  type SyncJobMetadata,
  type BatchConfig,
  type SearchRequest,
  type SearchResult,
  type SearchResponse,
  type ErrorType,
  type SyncError,
  // Utility functions
  createUniqueKey,
  parseUniqueKey,
  generateNamespace,
  isValidForEmbedding,
} from './types';

// Export client functionality with composable functions
export {
  // Core functions
  queryExistingKeys,
  upsertSearchableValues,
  createNamespaceIfNotExists,
  deleteSearchableValues,
  getAllSearchableValues,
  searchSimilarValues,
  checkNamespaceExists,
  // Pure utility functions
  isRetryableError,
  calculateBackoffDelay,
  buildFilter,
  valuesToColumns,
  chunk,
  // Higher-order functions
  withRetry,
  // Client factory functions
  createClient,
  getNamespace,
  // Error class
  TurbopufferError,
  // Types
  type RetryOptions,
} from './client';

// Export deduplication functionality
export {
  // Main deduplication functions
  deduplicateValues,
  checkExistence,
  getDeduplicationStats,
  // Utility functions
  batchArray,
  escapeSqlString,
  formatSqlInClause,
  // Connection management (for advanced use cases)
  createConnection,
  closeConnection,
  executeQuery,
  // Types
  type DuckDBConnection,
} from './deduplicate';

// Export parquet caching functionality
export {
  // Cache operations
  processWithCache,
  updateCache,
  downloadParquetCache,
  uploadParquetCache,
  // Parquet operations
  exportValuesToParquet,
  readValuesFromParquet,
  findNewValues,
  // Utility functions
  generateColumnHash,
  generateStorageKey,
  // Types
  type ParquetCacheResult,
} from './parquet-cache';
