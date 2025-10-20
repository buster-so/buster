import type { Dimension, Measure } from '@buster/server-shared';
import type { DbtColumn } from '../dbt-schemas';
import { inferDimensionType, inferNumericType, isNumericColumn } from '../dbt-type-inference';

/**
 * Column Transformation Utilities
 *
 * Transforms dbt model columns into Buster dimensions and measures based on type inference.
 *
 * CUSTOM BUSTER EXTENSIONS:
 * Supports top-level searchable and options fields as Buster extensions to the dbt format.
 *
 * Precedence for metadata extraction:
 * 1. Top-level fields (column.searchable, column.options) - Custom Buster extensions
 * 2. Meta fields (column.config.meta.searchable, column.config.meta.options)
 * 3. Default/inferred values
 */

/**
 * Result of transforming columns into dimensions and measures
 */
export interface ColumnTransformResult {
  dimensions: Dimension[];
  measures: Measure[];
}

/**
 * Transform dbt columns into Buster dimensions and measures
 *
 * Split logic:
 * - Numeric columns → Buster measures
 * - Non-numeric columns → Buster dimensions
 *
 * Meta field extraction:
 * - config.meta.searchable → dimension.searchable
 * - config.meta.options → dimension.options
 * - config.meta.unit → included in description or ignored for measures
 *
 * @param columns - Array of dbt columns to transform
 * @returns Object with dimensions and measures arrays
 *
 * @example
 * ```typescript
 * const columns = [
 *   { name: "email", description: "User email", config: { meta: { searchable: true } } },
 *   { name: "order_count", description: "Number of orders" }
 * ];
 *
 * const result = transformColumnsToDimensionsAndMeasures(columns);
 * // result.dimensions: [{ name: "email", searchable: true, ... }]
 * // result.measures: [{ name: "order_count", type: "integer", ... }]
 * ```
 */
export function transformColumnsToDimensionsAndMeasures(
  columns: DbtColumn[]
): ColumnTransformResult {
  const dimensions: Dimension[] = [];
  const measures: Measure[] = [];

  for (const column of columns) {
    if (isNumericColumn(column)) {
      // Transform to measure
      measures.push(transformColumnToMeasure(column));
    } else {
      // Transform to dimension
      dimensions.push(transformColumnToDimension(column));
    }
  }

  return { dimensions, measures };
}

/**
 * Transform a single dbt column to a Buster dimension
 *
 * Precedence for custom Buster fields:
 * 1. Top-level fields (column.searchable, column.options) - Custom Buster extensions
 * 2. Meta fields (column.config.meta.searchable, column.config.meta.options)
 * 3. Default values
 *
 * @param column - The dbt column
 * @returns Buster dimension object
 */
export function transformColumnToDimension(column: DbtColumn): Dimension {
  const meta = column.config?.meta || {};

  // Extract searchable flag with precedence:
  // 1. Top-level field (custom Buster extension)
  // 2. Meta field
  // 3. Default: false
  let searchable = false;
  if (typeof column.searchable === 'boolean') {
    searchable = column.searchable;
  } else if (typeof meta.searchable === 'boolean') {
    searchable = meta.searchable;
  }

  // Extract options array with precedence:
  // 1. Top-level field (custom Buster extension)
  // 2. Meta field
  let options: Dimension['options'];
  if (column.options && Array.isArray(column.options)) {
    options = normalizeOptions(column.options);
  } else if ('options' in meta && meta.options) {
    options = normalizeOptions(meta.options);
  }

  // Infer dimension type
  const type = inferDimensionType(column);

  // Build dimension
  const dimension: Dimension = {
    name: column.name,
    description: column.description,
    type,
    searchable,
  };

  // Add options if present
  if (options && options.length > 0) {
    dimension.options = options;
  }

  return dimension;
}

/**
 * Transform a single dbt column to a Buster measure
 *
 * @param column - The dbt column
 * @returns Buster measure object
 */
export function transformColumnToMeasure(column: DbtColumn): Measure {
  const meta = column.config?.meta || {};

  // Infer numeric type
  const type = inferNumericType(column);

  // Build description with unit if present
  let description = column.description || '';
  if ('unit' in meta && meta.unit && typeof meta.unit === 'string') {
    // Append unit to description if not already mentioned
    if (description && !description.toLowerCase().includes(meta.unit.toLowerCase())) {
      description = `${description} (${meta.unit})`;
    } else if (!description) {
      description = `Measured in ${meta.unit}`;
    }
  }

  return {
    name: column.name,
    description,
    type,
  };
}

/**
 * Normalize options from various formats to Buster's expected format
 *
 * dbt meta.options can be:
 * - Array of strings: ["active", "inactive"]
 * - Array of numbers: [1, 2, 3]
 * - Array of booleans: [true, false]
 * - Array of objects: [{ value: "active", description: "Active user" }]
 * - Mixed array
 *
 * Buster options format:
 * - Array of strings, numbers, booleans, or objects with value + description
 *
 * @param options - Raw options from dbt meta
 * @returns Normalized options array
 */
function normalizeOptions(options: unknown): Dimension['options'] {
  if (!Array.isArray(options)) {
    return undefined;
  }

  // Map each option to the appropriate format
  return options.map((option) => {
    // Already in object format with value field
    if (typeof option === 'object' && option !== null && 'value' in option) {
      return option as { value: string | number | boolean; description?: string };
    }

    // Primitive value - return as-is (string, number, or boolean)
    if (typeof option === 'string' || typeof option === 'number' || typeof option === 'boolean') {
      return option;
    }

    // Fallback: convert to string
    return String(option);
  });
}

/**
 * Enrich dimensions with metadata from semantic layer dimensions
 *
 * This is useful when we have both model columns and semantic dimensions.
 * The semantic dimensions might provide additional context or overrides.
 *
 * @param dimensions - Buster dimensions from columns
 * @param semanticDimensionNames - Names of dimensions defined in semantic layer
 * @returns Enriched dimensions (currently just filters to semantic dimensions)
 */
export function filterToSemanticDimensions(
  dimensions: Dimension[],
  semanticDimensionNames: string[]
): Dimension[] {
  // If we have semantic dimensions defined, we might want to filter
  // to only include dimensions that are in the semantic layer.
  // However, this could be too restrictive. For now, include all.
  // This function is a placeholder for future enhancements.
  return dimensions;
}
