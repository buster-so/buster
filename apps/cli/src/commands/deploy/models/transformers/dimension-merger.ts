import type { Dimension } from '@buster/server-shared';
import type { DbtDimension } from '../dbt-schemas';

/**
 * Dimension Merger Utilities
 *
 * Handles intelligent deduplication and merging of dimensions from two sources:
 * 1. Column-based dimensions (from model columns)
 * 2. Semantic dimensions (from semantic_models)
 *
 * Precedence Rules:
 * - Column metadata wins for: description, searchable, options, inferred type
 * - Semantic metadata adds: time_granularity, explicit type override
 * - Complex semantic expressions (with SQL) remain as separate dimensions
 */

/**
 * SQL keywords and operators that indicate a complex expression
 */
const COMPLEX_EXPR_PATTERNS = [
  // SQL keywords
  /\bCASE\b/i,
  /\bWHEN\b/i,
  /\bTHEN\b/i,
  /\bELSE\b/i,
  /\bEND\b/i,
  /\bCAST\b/i,
  /\bCOALESCE\b/i,
  /\bNULLIF\b/i,
  /\bCONCAT\b/i,
  /\bSUBSTRING\b/i,
  /\bDATE_TRUNC\b/i,
  /\bEXTRACT\b/i,
  // Operators
  /\+/,
  /-/,
  /\*/,
  /\//,
  /\|\|/,
  /\bAND\b/i,
  /\bOR\b/i,
  /\bNOT\b/i,
  // Comparisons
  /=/,
  />/,
  /</,
  /!=/,
  /<>/,
  /\bIS\s+NULL\b/i,
  /\bIS\s+NOT\s+NULL\b/i,
];

/**
 * Check if a semantic dimension expression is complex (contains SQL logic)
 * Complex expressions should remain as separate dimensions rather than being merged
 *
 * @param expr - The semantic dimension expression
 * @returns True if expression is complex and should remain separate
 */
export function isComplexExpression(expr: string | undefined): boolean {
  if (!expr) {
    return false;
  }

  // Check for complex SQL patterns
  return COMPLEX_EXPR_PATTERNS.some((pattern) => pattern.test(expr));
}

/**
 * Check if a semantic dimension matches a column dimension
 * Dimensions match if:
 * 1. Names are exactly equal
 * 2. Semantic expr equals column name (simple column reference)
 * 3. Semantic expr is normalized version of column name
 *
 * @param columnDim - Dimension created from model column
 * @param semanticDim - Dimension from semantic model
 * @returns True if dimensions should be merged
 */
export function dimensionsMatch(columnDim: Dimension, semanticDim: DbtDimension): boolean {
  const columnName = columnDim.name.toLowerCase().trim();
  const semanticName = semanticDim.name.toLowerCase().trim();

  // 1. Name exact match
  if (semanticName === columnName) {
    return true;
  }

  // 2. Semantic expr matches column name (simple column reference)
  if (semanticDim.expr) {
    const expr = semanticDim.expr.toLowerCase().trim();

    // Exact expr match
    if (expr === columnName) {
      return true;
    }

    // Expr is just column name with whitespace
    if (expr.replace(/\s+/g, '') === columnName.replace(/\s+/g, '')) {
      return true;
    }
  }

  return false;
}

/**
 * Normalize dbt semantic types to Buster dimension types
 *
 * @param dbtType - The dbt semantic type
 * @returns Normalized Buster dimension type
 */
function normalizeDimensionType(dbtType: string | undefined): string {
  if (!dbtType) {
    return 'string';
  }

  // Normalize categorical to string (categorical = string with options)
  if (dbtType === 'categorical') {
    return 'string';
  }

  // Pass through other types as-is (time, etc.)
  return dbtType;
}

/**
 * Merge a column dimension with a semantic dimension
 * Column metadata takes priority for basic fields, semantic adds context
 *
 * Precedence:
 * - name: column name (canonical)
 * - description: column description (more detailed)
 * - type: semantic type if provided, otherwise column type (explicit > inferred)
 * - searchable: column only (semantic doesn't have this)
 * - options: column only (semantic doesn't have this)
 * - time_granularity: semantic only (column doesn't have this)
 *
 * @param columnDim - Dimension from model column
 * @param semanticDim - Dimension from semantic model
 * @returns Merged dimension with best of both sources
 */
export function mergeDimension(columnDim: Dimension, semanticDim: DbtDimension): Dimension {
  // Start with column dimension as base
  const merged: Dimension = {
    name: columnDim.name, // Column name is canonical
    type: columnDim.type, // Default to column type
    searchable: columnDim.searchable, // Column-only field
  };

  // Description: prefer column (more detailed), fallback to semantic
  merged.description = columnDim.description || semanticDim.description;

  // Type: semantic type overrides if provided (explicit > inferred)
  // Normalize categorical → string for consistency
  if (semanticDim.type) {
    merged.type = normalizeDimensionType(semanticDim.type);
  }

  // Options: column-only field (if present)
  if (columnDim.options) {
    merged.options = columnDim.options;
  }

  // Time granularity: semantic-only field (if present)
  if (semanticDim.type_params?.time_granularity) {
    merged.time_granularity = semanticDim.type_params.time_granularity;
  }

  return merged;
}

/**
 * Convert a semantic dimension to a Buster dimension
 * Used for semantic dimensions that don't match any column
 *
 * @param semanticDim - Semantic dimension to convert
 * @returns Buster dimension
 */
export function semanticDimensionToDimension(semanticDim: DbtDimension): Dimension {
  const dimension: Dimension = {
    name: semanticDim.name,
    type: normalizeDimensionType(semanticDim.type), // Normalize categorical → string
    description: semanticDim.description,
    searchable: false, // Semantic dimensions don't have searchable flag
  };

  // Add time_granularity if present
  if (semanticDim.type_params?.time_granularity) {
    dimension.time_granularity = semanticDim.type_params.time_granularity;
  }

  return dimension;
}

/**
 * Merge column dimensions with semantic dimensions
 *
 * Algorithm:
 * 1. For each semantic dimension:
 *    - If it has a complex expr, keep it as separate dimension
 *    - If it matches a column dimension, merge them
 *    - If it doesn't match any column, add it as-is
 * 2. Keep all column dimensions that weren't matched
 *
 * @param columnDimensions - Dimensions created from model columns
 * @param semanticDimensions - Dimensions from semantic model
 * @returns Merged array of dimensions without duplicates
 */
export function mergeDimensions(
  columnDimensions: Dimension[],
  semanticDimensions: DbtDimension[]
): Dimension[] {
  const result: Dimension[] = [];
  const matchedColumnIndices = new Set<number>();

  // Process each semantic dimension
  for (const semanticDim of semanticDimensions) {
    // Check if this is a complex expression (should remain separate)
    if (isComplexExpression(semanticDim.expr)) {
      // Complex expr - add as separate dimension
      result.push(semanticDimensionToDimension(semanticDim));
      continue;
    }

    // Try to find matching column dimension
    let matched = false;
    for (let i = 0; i < columnDimensions.length; i++) {
      const columnDim = columnDimensions[i];
      if (!columnDim) continue;

      // Skip if this column was already matched
      if (matchedColumnIndices.has(i)) {
        continue;
      }

      // Check if dimensions match
      if (dimensionsMatch(columnDim, semanticDim)) {
        // Merge and add to result
        result.push(mergeDimension(columnDim, semanticDim));
        matchedColumnIndices.add(i);
        matched = true;
        break;
      }
    }

    // If no matching column found, add semantic dimension as-is
    if (!matched) {
      result.push(semanticDimensionToDimension(semanticDim));
    }
  }

  // Add any column dimensions that weren't matched
  for (let i = 0; i < columnDimensions.length; i++) {
    if (!matchedColumnIndices.has(i)) {
      const columnDim = columnDimensions[i];
      if (columnDim) {
        result.push(columnDim);
      }
    }
  }

  return result;
}
