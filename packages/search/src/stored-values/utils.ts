/**
 * Utility functions for the stored-values package
 */

/**
 * Formats a schema name from a data source ID
 * @param dataSourceId - UUID of the data source
 * @returns Formatted schema name
 */
export function formatSchemaName(dataSourceId: string): string {
  return `ds_${dataSourceId.replace(/-/g, '_')}`;
}

/**
 * Escapes single quotes in SQL string values
 * @param value - The string value to escape
 * @returns Escaped string safe for SQL
 */
export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Formats an embedding array as a PostgreSQL halfvec literal
 * @param embedding - Array of numbers representing the embedding
 * @returns Formatted halfvec literal string
 */
export function formatHalfvecLiteral(embedding: number[]): string {
  return `'[${embedding.join(',')}]'::halfvec`;
}

/**
 * Builds a WHERE clause from filter conditions
 * @param filters - Array of SQL filter conditions
 * @returns WHERE clause string or empty string
 */
export function buildWhereClause(filters: string[]): string {
  return filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
}

/**
 * Validates an embedding array
 * @param embedding - Array to validate
 * @returns True if valid, false otherwise
 */
export function isValidEmbedding(embedding: number[]): boolean {
  return (
    embedding.length > 0 && embedding.every((val) => typeof val === 'number' && !Number.isNaN(val))
  );
}
