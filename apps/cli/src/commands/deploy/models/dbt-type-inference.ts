import type { DbtColumn } from './dbt-schemas';

/**
 * Type Inference Utilities for DBT Columns
 *
 * Determines whether a dbt column should be mapped to a Buster dimension (non-numeric)
 * or measure (numeric), and infers appropriate types for each.
 */

// ============================================================================
// Numeric Detection Patterns
// ============================================================================

/**
 * Column name patterns that indicate numeric values
 */
const NUMERIC_NAME_PATTERNS = [
  /_count$/,
  /_sum$/,
  /_total$/,
  /_amount$/,
  /_quantity$/,
  /_price$/,
  /_cost$/,
  /_value$/,
  /_revenue$/,
  /_sales$/,
  /^num_/,
  /^total_/,
  /^count_/,
  /^sum_/,
  /^avg_/,
  /^average_/,
  /^median_/,
  /^min_/,
  /^max_/,
];

/**
 * Column name patterns that indicate non-numeric (text) values
 */
const TEXT_NAME_PATTERNS = [
  /_id$/,
  /_name$/,
  /_type$/,
  /_status$/,
  /_code$/,
  /_date$/,
  /_at$/,
  /_time$/,
  /_key$/,
  /^id$/,
  /^name$/,
  /^email$/,
  /^description$/,
  /^title$/,
];

/**
 * Keywords in descriptions that indicate numeric values
 */
const NUMERIC_KEYWORDS = [
  'count',
  'sum',
  'total',
  'amount',
  'average',
  'median',
  'price',
  'cost',
  'revenue',
  'sales',
  'quantity',
  'number of',
  'value',
  'balance',
];

/**
 * Keywords in descriptions that indicate text/categorical values
 */
const TEXT_KEYWORDS = [
  'name',
  'identifier',
  'type',
  'status',
  'code',
  'description',
  'title',
  'category',
  'label',
];

// ============================================================================
// Numeric Detection
// ============================================================================

/**
 * Determine if a dbt column represents a numeric value that should be a Buster measure
 *
 * Detection logic (in order of priority):
 * 1. Check data_type field - most reliable source of truth
 * 2. Check config.meta.unit - presence indicates numeric
 * 3. Check config.meta.categorical - true → non-numeric
 * 4. Check config.meta.options - presence → non-numeric (categorical)
 * 5. Check name patterns for strong indicators
 * 6. Check description for numeric keywords
 * 7. Default to non-numeric (dimensions are more common)
 *
 * @param column - The dbt column to analyze
 * @returns True if column should be treated as numeric (measure)
 *
 * @example
 * ```typescript
 * isNumericColumn({ name: "amount", data_type: "decimal" }) // true
 * isNumericColumn({ name: "user_count", description: "Count of users" }) // true
 * isNumericColumn({ name: "email", data_type: "varchar" }) // false
 * isNumericColumn({ name: "price", config: { meta: { unit: "USD" } } }) // true
 * ```
 */
export function isNumericColumn(column: DbtColumn): boolean {
  // 1. Check data_type if available (most reliable)
  if (column.data_type) {
    return isNumericDataType(column.data_type);
  }

  const meta = column.config?.meta;

  // 2. Has unit meta field → numeric
  if (meta && 'unit' in meta && meta.unit) {
    return true;
  }

  // 3. Explicitly marked as categorical → non-numeric
  if (meta && 'categorical' in meta && meta.categorical === true) {
    return false;
  }

  // 4. Has options array → categorical/non-numeric
  // Check both top-level field (Custom Buster extension) and meta field
  if (column.options && Array.isArray(column.options) && column.options.length > 0) {
    return false;
  }
  if (meta && 'options' in meta && Array.isArray(meta.options) && meta.options.length > 0) {
    return false;
  }

  // 5. Check name patterns (strong indicators)
  const columnName = column.name.toLowerCase();

  // Text patterns are strong indicators of non-numeric
  if (TEXT_NAME_PATTERNS.some((pattern) => pattern.test(columnName))) {
    return false;
  }

  // Numeric patterns indicate numeric
  if (NUMERIC_NAME_PATTERNS.some((pattern) => pattern.test(columnName))) {
    return true;
  }

  // 6. Check description for keywords
  if (column.description) {
    const description = column.description.toLowerCase();

    // Check for text keywords first (higher priority)
    const hasTextKeyword = TEXT_KEYWORDS.some((keyword) => description.includes(keyword));
    if (hasTextKeyword) {
      return false;
    }

    // Check for numeric keywords
    const hasNumericKeyword = NUMERIC_KEYWORDS.some((keyword) => description.includes(keyword));
    if (hasNumericKeyword) {
      return true;
    }
  }

  // 7. Default to non-numeric (dimensions are more common than measures)
  return false;
}

/**
 * Determine if a SQL data type represents a numeric value
 *
 * @param dataType - SQL data type string (case-insensitive)
 * @returns True if the data type is numeric
 *
 * @example
 * ```typescript
 * isNumericDataType('integer') // true
 * isNumericDataType('DECIMAL(10,2)') // true
 * isNumericDataType('varchar') // false
 * isNumericDataType('timestamp') // false
 * ```
 */
export function isNumericDataType(dataType: string): boolean {
  const normalized = dataType.toLowerCase().trim();

  // Integer types
  if (
    normalized === 'integer' ||
    normalized === 'int' ||
    normalized === 'bigint' ||
    normalized === 'smallint' ||
    normalized === 'tinyint' ||
    normalized === 'int2' ||
    normalized === 'int4' ||
    normalized === 'int8' ||
    normalized === 'serial' ||
    normalized === 'bigserial'
  ) {
    return true;
  }

  // Decimal/Float types
  if (
    normalized === 'numeric' ||
    normalized === 'decimal' ||
    normalized === 'float' ||
    normalized === 'real' ||
    normalized === 'double' ||
    normalized === 'double precision' ||
    normalized === 'float4' ||
    normalized === 'float8' ||
    normalized === 'money'
  ) {
    return true;
  }

  // Check for parameterized types (e.g., DECIMAL(10,2), NUMERIC(5))
  if (normalized.startsWith('decimal(') || normalized.startsWith('numeric(')) {
    return true;
  }

  return false;
}

// ============================================================================
// Numeric Type Inference
// ============================================================================

/**
 * Patterns that indicate integer types (whole numbers)
 */
const INTEGER_PATTERNS = [/_count$/, /^count_/, /^num_/, /_id$/, /_quantity$/];

/**
 * Patterns that indicate decimal types (fractional numbers)
 */
const DECIMAL_PATTERNS = [
  /_price$/,
  /_cost$/,
  /_amount$/,
  /_revenue$/,
  /_sales$/,
  /^avg_/,
  /^average_/,
  /^median_/,
];

/**
 * Infer the specific numeric type for a Buster measure
 *
 * @param column - The dbt column (assumed to be numeric)
 * @returns Buster measure type: "integer", "decimal", or "float"
 *
 * @example
 * ```typescript
 * inferNumericType({ name: "user_count", data_type: "integer" }) // "integer"
 * inferNumericType({ name: "unit_price", data_type: "decimal" }) // "decimal"
 * inferNumericType({ name: "value" }) // "float" (fallback)
 * ```
 */
export function inferNumericType(column: DbtColumn): string {
  // If data_type is available, use it directly
  if (column.data_type) {
    return mapSqlTypeToMeasureType(column.data_type);
  }

  const columnName = column.name.toLowerCase();
  const description = column.description?.toLowerCase() || '';

  // Check for integer indicators
  if (
    INTEGER_PATTERNS.some((pattern) => pattern.test(columnName)) ||
    description.includes('count') ||
    description.includes('quantity') ||
    description.includes('number of')
  ) {
    return 'integer';
  }

  // Check for decimal indicators
  if (
    DECIMAL_PATTERNS.some((pattern) => pattern.test(columnName)) ||
    description.includes('price') ||
    description.includes('cost') ||
    description.includes('amount') ||
    description.includes('revenue') ||
    description.includes('average') ||
    description.includes('median')
  ) {
    return 'decimal';
  }

  // Default to float
  return 'float';
}

/**
 * Map SQL data type to Buster measure type
 *
 * @param dataType - SQL data type string
 * @returns Buster measure type: "integer", "decimal", or "float"
 */
function mapSqlTypeToMeasureType(dataType: string): string {
  const normalized = dataType.toLowerCase().trim();

  // Integer types
  if (
    normalized === 'integer' ||
    normalized === 'int' ||
    normalized === 'bigint' ||
    normalized === 'smallint' ||
    normalized === 'tinyint' ||
    normalized === 'int2' ||
    normalized === 'int4' ||
    normalized === 'int8' ||
    normalized === 'serial' ||
    normalized === 'bigserial'
  ) {
    return 'integer';
  }

  // Decimal types (fixed precision)
  if (
    normalized === 'numeric' ||
    normalized === 'decimal' ||
    normalized === 'money' ||
    normalized.startsWith('decimal(') ||
    normalized.startsWith('numeric(')
  ) {
    return 'decimal';
  }

  // Float types (approximate)
  return 'float';
}

// ============================================================================
// Dimension Type Inference
// ============================================================================

/**
 * Patterns that indicate datetime types
 */
const DATETIME_PATTERNS = [
  /_date$/,
  /_at$/,
  /_time$/,
  /_timestamp$/,
  /^date_/,
  /^created/,
  /^updated/,
  /^modified/,
  /^deleted/,
];

/**
 * Patterns that indicate boolean types
 */
const BOOLEAN_PATTERNS = [/^is_/, /^has_/, /^can_/, /^should_/, /_flag$/, /_enabled$/];

/**
 * Infer the specific type for a Buster dimension
 *
 * @param column - The dbt column (assumed to be non-numeric)
 * @returns Buster dimension type: "datetime", "boolean", or "string"
 *
 * @example
 * ```typescript
 * inferDimensionType({ name: "created_at", data_type: "timestamp" }) // "datetime"
 * inferDimensionType({ name: "is_active", data_type: "boolean" }) // "boolean"
 * inferDimensionType({ name: "email", data_type: "varchar" }) // "string"
 * ```
 */
export function inferDimensionType(column: DbtColumn): string {
  // If data_type is available, use it directly
  if (column.data_type) {
    return mapSqlTypeToDimensionType(column.data_type);
  }

  const columnName = column.name.toLowerCase();
  const description = column.description?.toLowerCase() || '';

  // Check for datetime indicators
  if (
    DATETIME_PATTERNS.some((pattern) => pattern.test(columnName)) ||
    description.includes('date') ||
    description.includes('timestamp') ||
    description.includes('time')
  ) {
    return 'datetime';
  }

  // Check for boolean indicators
  if (
    BOOLEAN_PATTERNS.some((pattern) => pattern.test(columnName)) ||
    description.includes('boolean') ||
    description.includes('true/false') ||
    description.includes('yes/no')
  ) {
    return 'boolean';
  }

  // Default to string
  return 'string';
}

/**
 * Map SQL data type to Buster dimension type
 *
 * @param dataType - SQL data type string
 * @returns Buster dimension type: "datetime", "boolean", or "string"
 */
function mapSqlTypeToDimensionType(dataType: string): string {
  const normalized = dataType.toLowerCase().trim();

  // Datetime types
  if (
    normalized === 'timestamp' ||
    normalized === 'timestamptz' ||
    normalized === 'timestamp with time zone' ||
    normalized === 'timestamp without time zone' ||
    normalized === 'datetime' ||
    normalized === 'date' ||
    normalized === 'time'
  ) {
    return 'datetime';
  }

  // Boolean types
  if (normalized === 'boolean' || normalized === 'bool') {
    return 'boolean';
  }

  // Default to string for all other types
  return 'string';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a human-readable explanation of why a column was classified as numeric or non-numeric
 * Useful for debugging and validation
 *
 * @param column - The dbt column to explain
 * @returns A description of the classification reasoning
 */
export function explainNumericClassification(column: DbtColumn): string {
  const meta = column.config?.meta;
  const columnName = column.name.toLowerCase();
  const description = column.description?.toLowerCase() || '';

  if (meta && 'unit' in meta && meta.unit) {
    return `Numeric: has unit meta field (${meta.unit})`;
  }

  if (meta && 'categorical' in meta && meta.categorical === true) {
    return 'Non-numeric: explicitly marked as categorical';
  }

  if (column.options && Array.isArray(column.options)) {
    return `Non-numeric: has ${column.options.length} top-level option(s)`;
  }

  if (meta && 'options' in meta && Array.isArray(meta.options)) {
    return `Non-numeric: has ${meta.options.length} meta option(s)`;
  }

  const textPattern = TEXT_NAME_PATTERNS.find((pattern) => pattern.test(columnName));
  if (textPattern) {
    return `Non-numeric: name matches text pattern (${textPattern})`;
  }

  const numericPattern = NUMERIC_NAME_PATTERNS.find((pattern) => pattern.test(columnName));
  if (numericPattern) {
    return `Numeric: name matches numeric pattern (${numericPattern})`;
  }

  const textKeyword = TEXT_KEYWORDS.find((keyword) => description.includes(keyword));
  if (textKeyword) {
    return `Non-numeric: description contains text keyword "${textKeyword}"`;
  }

  const numericKeyword = NUMERIC_KEYWORDS.find((keyword) => description.includes(keyword));
  if (numericKeyword) {
    return `Numeric: description contains numeric keyword "${numericKeyword}"`;
  }

  return 'Non-numeric: default (no strong indicators found)';
}
