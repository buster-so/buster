// Export all search functionality

// Export schemas and validation
export {
  EmbeddingOptionsSchema,
  EmbeddingSchema,
  SearchOptionsSchema,
  SearchTargetSchema,
  SearchTermsSchema,
  StoredValueResultSchema,
  UuidSchema,
} from './schemas';
export {
  type EmbeddingOptions,
  extractSearchableColumnsFromYaml,
  healthCheck,
  type SearchOptions,
  type SearchTarget,
  type StoredValueResult,
  StoredValuesError,
  searchValuesAcrossTargets,
  searchValuesByEmbedding,
  searchValuesByEmbeddingWithFilters,
} from './search';

// Export utility functions (with prefixed names to avoid conflicts)
export {
  buildWhereClause as buildStoredValuesWhereClause,
  escapeSqlString as escapeStoredValuesSqlString,
  formatHalfvecLiteral,
  formatSchemaName as formatStoredValuesSchemaName,
  isValidEmbedding,
} from './utils';
