/**
 * Searchable values module exports
 * Provides types, schemas, and utilities for managing searchable text values
 */

// Export client functionality with composable functions
export {
  buildFilter,
  calculateBackoffDelay,
  checkNamespaceExists,
  chunk,
  // Client factory functions
  createClient,
  createNamespaceIfNotExists,
  deleteSearchableValues,
  getAllSearchableValues,
  getNamespace,
  // Pure utility functions
  isRetryableError,
  // Core functions
  queryExistingKeys,
  // Types
  type RetryOptions,
  searchSimilarValues,
  // Error class
  TurbopufferError,
  upsertSearchableValues,
  valuesToColumns,
  // Higher-order functions
  withRetry,
} from './client';
// Export deduplication functionality
export {
  // Utility functions
  batchArray,
  checkExistence,
  closeConnection,
  // Connection management (for advanced use cases)
  createConnection,
  // Types
  type DuckDBContext,
  // Main deduplication functions
  deduplicateValues,
  escapeSqlString,
  executeQuery,
  formatSqlInClause,
  getDeduplicationStats,
} from './deduplicate';
// Export DuckDB helper functions for type safety
export {
  createConnectionWithCleanup,
  hasActiveConnection,
  isConnectionOpen,
  safeCleanup,
  withConnection,
  withContext,
} from './duckdb-helpers';
// Export parquet caching functionality
export {
  downloadParquetCache,
  // Parquet operations
  exportValuesToParquet,
  findNewValues,
  // Utility functions
  generateColumnHash,
  generateStorageKey,
  // Types
  type ParquetCacheResult,
  // Cache operations
  processWithCache,
  readValuesFromParquet,
  updateCache,
  uploadParquetCache,
} from './parquet-cache';
// Export all types and schemas
export {
  type BatchConfig,
  // Configuration schemas
  BatchConfigSchema,
  // Utility functions
  createUniqueKey,
  type DeduplicationResult,
  DeduplicationResultSchema,
  type ErrorType,
  // Error handling schemas
  ErrorTypeSchema,
  generateNamespace,
  isValidForEmbedding,
  parseUniqueKey,
  // Types
  type SearchableValue,
  // Core schemas
  SearchableValueSchema,
  type SearchRequest,
  // Search schemas
  SearchRequestSchema,
  type SearchResponse,
  SearchResponseSchema,
  type SearchResult,
  SearchResultSchema,
  type SyncError,
  SyncErrorSchema,
  type SyncJobMetadata,
  SyncJobMetadataSchema,
  type SyncJobPayload,
  // Sync job schemas
  SyncJobPayloadSchema,
  type SyncJobStatus,
  SyncJobStatusSchema,
  type TurbopufferDocument,
  TurbopufferDocumentSchema,
  type TurbopufferQuery,
  TurbopufferQuerySchema,
  type UpsertResult,
  UpsertResultSchema,
} from './types';
