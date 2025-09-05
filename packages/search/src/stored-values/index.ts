// Export all search functionality
export {
  searchValuesByEmbedding,
  searchValuesByEmbeddingWithFilters,
  searchValuesAcrossTargets,
  extractSearchableColumnsFromYaml,
  healthCheck,
  StoredValuesError,
  type StoredValueResult,
  type SearchTarget,
  type SearchOptions,
  type EmbeddingOptions,
} from './search';

// Export schemas and validation
export {
  StoredValueResultSchema,
  SearchTargetSchema,
  SearchOptionsSchema,
  EmbeddingOptionsSchema,
  UuidSchema,
  EmbeddingSchema,
  SearchTermsSchema,
} from './schemas';

// Export utility functions (with prefixed names to avoid conflicts)
export {
  formatSchemaName as formatStoredValuesSchemaName,
  escapeSqlString as escapeStoredValuesSqlString,
  formatHalfvecLiteral,
  buildWhereClause as buildStoredValuesWhereClause,
  isValidEmbedding,
} from './utils';
