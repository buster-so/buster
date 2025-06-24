import './env';

// Export all search functionality
export {
  searchValuesByEmbedding,
  searchValuesByEmbeddingWithFilters,
  searchValuesAcrossTargets,
  generateEmbedding,
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

// Export utility functions
export {
  formatSchemaName,
  escapeSqlString,
  formatHalfvecLiteral,
  buildWhereClause,
  isValidEmbedding,
} from './utils';
