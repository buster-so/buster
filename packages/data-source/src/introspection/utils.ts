/**
 * Utility functions for introspection operations
 */

/**
 * Calculate dynamic sample size based on total row count
 * @param totalRows - Total number of rows in the table
 * @returns Optimal sample size for statistical analysis
 */
export function getDynamicSampleSize(totalRows: number): number {
  // For empty tables, return minimum sample size of 1 to avoid validation errors
  if (totalRows === 0) return 1;
  if (totalRows <= 100_000) return totalRows; // Small: take all
  if (totalRows <= 1_000_000) return 100_000; // Medium: 100K sample
  if (totalRows <= 10_000_000) return 250_000; // Large: 250K sample
  return 500_000; // XL: cap at 500K
}

/**
 * Helper to safely parse dates from database results
 * Extracted from BaseIntrospector for reuse
 */
export function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Helper to safely parse numbers from database results
 * Extracted from BaseIntrospector for reuse
 */
export function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (typeof value === 'bigint') return Number(value);
  return undefined;
}

/**
 * Helper to safely parse booleans from database results
 * Extracted from BaseIntrospector for reuse
 */
export function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1' || lower === 't' || lower === 'y';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

/**
 * Helper to safely get string values from database results
 * Extracted from BaseIntrospector for reuse
 */
export function getString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

/**
 * Build a qualified table name for SQL queries
 * @param database - Database name
 * @param schema - Schema name
 * @param table - Table name
 * @returns Fully qualified table name
 */
export function getQualifiedTableName(
  database: string,
  schema: string,
  table: string,
  dialect: 'snowflake' | 'postgresql' | 'mysql' | 'bigquery' | 'sqlserver' | 'redshift'
): string {
  switch (dialect) {
    case 'snowflake':
    case 'sqlserver':
      return `"${database}"."${schema}"."${table}"`;
    case 'postgresql':
    case 'redshift':
      return `"${schema}"."${table}"`;
    case 'mysql':
      return `\`${database}\`.\`${table}\``;
    case 'bigquery':
      return `\`${database}.${schema}.${table}\``;
    default:
      return `"${schema}"."${table}"`;
  }
}

/**
 * Format row count for display and storage
 * Handles BigInt and other numeric types safely
 */
export function formatRowCount(value: unknown): number {
  const parsed = parseNumber(value);
  return parsed ?? 0;
}

/**
 * Calculate percentage for sampling
 * @param sampleSize - Desired sample size
 * @param totalRows - Total rows in table
 * @returns Percentage to use in TABLESAMPLE (capped at 100)
 */
export function calculateSamplePercentage(sampleSize: number, totalRows: number): number {
  if (totalRows === 0) return 100;
  const percentage = (sampleSize / totalRows) * 100;
  return Math.min(100, Math.max(0.01, percentage)); // Between 0.01% and 100%
}

/**
 * Validate that filters are not empty arrays
 * @param filters - Introspection filters
 * @throws Error if any filter array is empty
 */
export function validateFilters(filters?: {
  databases?: string[] | undefined;
  schemas?: string[] | undefined;
  tables?: string[] | undefined;
}): void {
  if (filters?.databases && filters.databases.length === 0) {
    throw new Error(
      'Database filter array is empty. Please provide at least one database name or remove the filter.'
    );
  }
  if (filters?.schemas && filters.schemas.length === 0) {
    throw new Error(
      'Schema filter array is empty. Please provide at least one schema name or remove the filter.'
    );
  }
  if (filters?.tables && filters.tables.length === 0) {
    throw new Error(
      'Table filter array is empty. Please provide at least one table name or remove the filter.'
    );
  }
}
