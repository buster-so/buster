/**
 * DuckDB/MotherDuck type mappings
 * Reference: https://duckdb.org/docs/sql/data_types/overview
 */

/**
 * Maps DuckDB type names to normalized type names
 * DuckDB returns type names as strings from the SDK
 */
export const DUCKDB_TYPE_MAP: Record<string, string> = {
  // Integer types
  TINYINT: 'smallint',
  SMALLINT: 'smallint',
  INTEGER: 'integer',
  INT: 'integer',
  BIGINT: 'bigint',
  HUGEINT: 'hugeint',

  // Unsigned integer types
  UTINYINT: 'utinyint',
  USMALLINT: 'usmallint',
  UINTEGER: 'uinteger',
  UBIGINT: 'ubigint',

  // Floating point types
  FLOAT: 'float',
  REAL: 'float',
  DOUBLE: 'double',
  'DOUBLE PRECISION': 'double',

  // Fixed-point types
  DECIMAL: 'decimal',
  NUMERIC: 'decimal',

  // String types
  VARCHAR: 'varchar',
  CHAR: 'char',
  TEXT: 'text',
  STRING: 'text',

  // Boolean type
  BOOLEAN: 'boolean',
  BOOL: 'boolean',

  // Date/Time types
  DATE: 'date',
  TIME: 'time',
  TIMESTAMP: 'timestamp',
  'TIMESTAMP WITH TIME ZONE': 'timestamptz',
  TIMESTAMPTZ: 'timestamptz',
  INTERVAL: 'interval',

  // Binary types
  BLOB: 'bytea',
  BYTEA: 'bytea',

  // Complex types
  ARRAY: 'array',
  LIST: 'array',
  MAP: 'json',
  STRUCT: 'json',
  UNION: 'json',

  // Special types
  JSON: 'json',
  UUID: 'uuid',
  ENUM: 'varchar',
};

/**
 * Maps DuckDB type to a normalized type name
 * @param duckdbType - DuckDB type string or number
 * @returns Normalized type name
 */
export function mapDuckDBType(duckdbType: string | number): string {
  if (!duckdbType || typeof duckdbType === 'number') {
    return 'text';
  }

  // Convert to uppercase for case-insensitive matching
  const upperType = duckdbType.toUpperCase();

  // Handle parameterized types like DECIMAL(18,2), VARCHAR(255), LIST<INTEGER>
  // Extract base type before the first ( or <
  const baseType = upperType.split(/[(<]/)[0]?.trim() || upperType;

  // Look up in the type map
  return DUCKDB_TYPE_MAP[baseType] || 'text';
}

/**
 * Determines the simple type category for metadata
 * @param normalizedType - The normalized DuckDB type name
 * @returns Simple type category: 'number', 'text', or 'date'
 */
export function getDuckDBSimpleType(normalizedType: string): 'number' | 'text' | 'date' {
  const lowerType = normalizedType.toLowerCase();

  // Date/time types (check first to avoid matching 'interval' as 'int')
  if (
    lowerType.includes('date') ||
    lowerType.includes('time') ||
    lowerType.includes('timestamp') ||
    lowerType === 'interval'
  ) {
    return 'date';
  }

  // Numeric types (including unsigned)
  if (
    lowerType === 'smallint' ||
    lowerType === 'integer' ||
    lowerType === 'bigint' ||
    lowerType === 'hugeint' ||
    lowerType === 'utinyint' ||
    lowerType === 'usmallint' ||
    lowerType === 'uinteger' ||
    lowerType === 'ubigint' ||
    lowerType === 'float' ||
    lowerType === 'double' ||
    lowerType === 'decimal' ||
    lowerType.includes('int') ||
    lowerType.includes('numeric') ||
    lowerType.includes('number')
  ) {
    return 'number';
  }

  // Everything else is text (including boolean, binary, complex types)
  return 'text';
}
