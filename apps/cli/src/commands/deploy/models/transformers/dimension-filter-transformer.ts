import type { Filter } from '@buster/server-shared';
import type { DbtDimension } from '../dbt-schemas';

/**
 * Dimension to Filter Transformation Utilities
 *
 * Transforms dbt semantic layer dimensions into Buster filters by generating
 * filter expressions based on dimension type (time vs categorical).
 */

/**
 * Transform a dbt dimension to Buster filters
 *
 * Generates different filter types based on dimension type:
 * - Time dimensions → multiple time-based filters (last 7/30/90 days, YTD, etc.)
 * - Categorical dimensions → basic non-null filter
 *
 * @param dimension - The dbt semantic dimension
 * @returns Array of Buster filter objects
 *
 * @example
 * ```typescript
 * const timeDimension = {
 *   name: "order_date",
 *   type: "time",
 *   description: "Order date"
 * };
 *
 * const filters = transformDimensionToFilters(timeDimension);
 * // [
 * //   { name: "order_date_last_7_days", expr: "order_date >= ...", ... },
 * //   { name: "order_date_last_30_days", expr: "order_date >= ...", ... },
 * //   ...
 * // ]
 * ```
 */
export function transformDimensionToFilters(dimension: DbtDimension): Filter[] {
  // Use expr if provided, otherwise use dimension name
  const columnExpr = dimension.expr || dimension.name;

  if (dimension.type === 'time') {
    return generateTimeFilters(dimension.name, columnExpr, dimension.description);
  } else {
    // Categorical or undefined type
    return generateCategoricalFilters(dimension.name, columnExpr, dimension.description);
  }
}

/**
 * Generate time-based filters for a time dimension
 *
 * Creates commonly useful time filters:
 * - Last 7 days
 * - Last 30 days
 * - Last 90 days
 * - Year to date (YTD)
 * - Current month
 * - Current quarter
 *
 * @param name - Dimension name
 * @param expr - SQL expression for the dimension
 * @param description - Optional description
 * @returns Array of time-based filters
 */
function generateTimeFilters(name: string, expr: string, description?: string): Filter[] {
  const baseDescription = description || name;

  return [
    {
      name: `${name}_last_7_days`,
      expr: `${expr} >= CURRENT_DATE - INTERVAL '7 days'`,
      description: `${baseDescription} in last 7 days`,
      args: [],
    },
    {
      name: `${name}_last_30_days`,
      expr: `${expr} >= CURRENT_DATE - INTERVAL '30 days'`,
      description: `${baseDescription} in last 30 days`,
      args: [],
    },
    {
      name: `${name}_last_90_days`,
      expr: `${expr} >= CURRENT_DATE - INTERVAL '90 days'`,
      description: `${baseDescription} in last 90 days`,
      args: [],
    },
    {
      name: `${name}_ytd`,
      expr: `${expr} >= DATE_TRUNC('year', CURRENT_DATE)`,
      description: `${baseDescription} year to date`,
      args: [],
    },
    {
      name: `${name}_current_month`,
      expr: `${expr} >= DATE_TRUNC('month', CURRENT_DATE)`,
      description: `${baseDescription} in current month`,
      args: [],
    },
    {
      name: `${name}_current_quarter`,
      expr: `${expr} >= DATE_TRUNC('quarter', CURRENT_DATE)`,
      description: `${baseDescription} in current quarter`,
      args: [],
    },
  ];
}

/**
 * Generate categorical filters for a categorical dimension
 *
 * Creates a basic non-null filter as a starting point.
 * Additional filters could be created if we had access to the column's
 * options/enum values from the model definition.
 *
 * @param name - Dimension name
 * @param expr - SQL expression for the dimension
 * @param description - Optional description
 * @returns Array with basic filter
 */
function generateCategoricalFilters(name: string, expr: string, description?: string): Filter[] {
  const baseDescription = description || name;

  return [
    {
      name: `${name}_exists`,
      expr: `${expr} IS NOT NULL`,
      description: `${baseDescription} has a value`,
      args: [],
    },
  ];
}

/**
 * Transform multiple dbt dimensions to Buster filters
 *
 * @param dimensions - Array of dbt dimensions
 * @returns Flattened array of Buster filters from all dimensions
 */
export function transformDimensionsToFilters(dimensions: DbtDimension[]): Filter[] {
  return dimensions.flatMap(transformDimensionToFilters);
}

/**
 * Generate a custom time range filter
 *
 * Utility for creating a parameterized time range filter.
 * This can be used when we want to allow users to specify custom date ranges.
 *
 * @param name - Filter name
 * @param dimensionExpr - SQL expression for the time dimension
 * @param description - Filter description
 * @returns Buster filter with date range parameters
 *
 * @example
 * ```typescript
 * const filter = generateCustomTimeRangeFilter(
 *   "order_date_range",
 *   "order_date",
 *   "Filter orders by custom date range"
 * );
 * // {
 * //   name: "order_date_range",
 * //   expr: "order_date BETWEEN {{start_date}} AND {{end_date}}",
 * //   args: [{ name: "start_date", type: "date" }, { name: "end_date", type: "date" }]
 * // }
 * ```
 */
export function generateCustomTimeRangeFilter(
  name: string,
  dimensionExpr: string,
  description: string
): Filter {
  return {
    name,
    expr: `${dimensionExpr} BETWEEN {{start_date}} AND {{end_date}}`,
    description,
    args: [
      {
        name: 'start_date',
        type: 'date',
        description: 'Start date of range',
      },
      {
        name: 'end_date',
        type: 'date',
        description: 'End date of range',
      },
    ],
  };
}

/**
 * Generate filters for specific categorical values
 *
 * If we know the possible values for a categorical dimension,
 * we can create equality filters for each value.
 *
 * @param dimensionName - Dimension name
 * @param dimensionExpr - SQL expression for the dimension
 * @param values - Array of possible values
 * @returns Array of equality filters, one per value
 *
 * @example
 * ```typescript
 * const filters = generateValueFilters(
 *   "status",
 *   "order_status",
 *   ["active", "pending", "completed"]
 * );
 * // [
 * //   { name: "status_active", expr: "order_status = 'active'", ... },
 * //   { name: "status_pending", expr: "order_status = 'pending'", ... },
 * //   { name: "status_completed", expr: "order_status = 'completed'", ... }
 * // ]
 * ```
 */
export function generateValueFilters(
  dimensionName: string,
  dimensionExpr: string,
  values: Array<string | number | boolean>
): Filter[] {
  return values.map((value) => {
    const normalizedValue = normalizeFilterValue(value);
    const filterName = `${dimensionName}_${String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')}`;

    return {
      name: filterName,
      expr: `${dimensionExpr} = ${normalizedValue}`,
      description: `Filter to ${dimensionName} = ${value}`,
      args: [],
    };
  });
}

/**
 * Normalize a value for use in a SQL filter expression
 *
 * @param value - The value to normalize
 * @returns SQL-safe string representation
 */
function normalizeFilterValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    // Escape single quotes and wrap in quotes
    return `'${value.replace(/'/g, "''")}'`;
  } else if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  } else {
    // Number
    return String(value);
  }
}
