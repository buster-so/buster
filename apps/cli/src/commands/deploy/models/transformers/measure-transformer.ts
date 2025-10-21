import type { DatasetMetric } from '@buster/server-shared';
import type { DbtMeasure } from '../dbt-schemas';

/**
 * Measure Transformation Utilities
 *
 * Transforms dbt semantic layer measures into Buster metrics by building
 * SQL expressions from aggregation types and expressions.
 */

/**
 * Transform a dbt measure to a Buster metric
 *
 * Builds SQL expression based on aggregation type:
 * - count → "count(*)"
 * - count_distinct → "count(distinct {expr})"
 * - sum → "sum({expr})"
 * - average → "average({expr})"
 * - median → "median({expr})"
 * - min → "min({expr})"
 * - max → "max({expr})"
 * - percentile → "percentile({expr}, {percentile})"
 * - sum_boolean → "sum(case when {expr} then 1 else 0 end)"
 *
 * @param measure - The dbt semantic measure
 * @returns Buster metric object
 * @throws Error if measure configuration is invalid
 *
 * @example
 * ```typescript
 * const measure = {
 *   name: "total_revenue",
 *   agg: "sum",
 *   expr: "amount",
 *   description: "Total revenue"
 * };
 *
 * const metric = transformMeasureToMetric(measure);
 * // {
 * //   name: "total_revenue",
 * //   expr: "sum(amount)",
 * //   description: "Total revenue",
 * //   args: []
 * // }
 * ```
 */
export function transformMeasureToMetric(measure: DbtMeasure): DatasetMetric {
  // Build the SQL expression based on aggregation type
  const expr = buildMeasureExpression(measure);

  return {
    name: measure.name,
    expr,
    description: measure.description || '',
    args: [], // dbt measures don't typically have parameterized args
  };
}

/**
 * Build the SQL expression for a measure based on its aggregation type
 *
 * @param measure - The dbt measure
 * @returns SQL expression string
 * @throws Error if aggregation requires expr but none provided
 */
function buildMeasureExpression(measure: DbtMeasure): string {
  const agg = measure.agg;
  const expr = measure.expr;

  switch (agg) {
    case 'count':
      // Count can work without an expression (count all rows)
      return expr ? `count(${expr})` : 'count(*)';

    case 'count_distinct':
      // Count distinct requires an expression
      if (!expr) {
        throw new Error(
          `Measure '${measure.name}' with aggregation 'count_distinct' requires an expr field`
        );
      }
      return `count(distinct ${expr})`;

    case 'sum':
      // Sum requires an expression
      if (!expr) {
        throw new Error(`Measure '${measure.name}' with aggregation 'sum' requires an expr field`);
      }
      return `sum(${expr})`;

    case 'average':
      // Average requires an expression
      if (!expr) {
        throw new Error(
          `Measure '${measure.name}' with aggregation 'average' requires an expr field`
        );
      }
      return `average(${expr})`;

    case 'median':
      // Median requires an expression
      if (!expr) {
        throw new Error(
          `Measure '${measure.name}' with aggregation 'median' requires an expr field`
        );
      }
      return `median(${expr})`;

    case 'min':
      // Min requires an expression
      if (!expr) {
        throw new Error(`Measure '${measure.name}' with aggregation 'min' requires an expr field`);
      }
      return `min(${expr})`;

    case 'max':
      // Max requires an expression
      if (!expr) {
        throw new Error(`Measure '${measure.name}' with aggregation 'max' requires an expr field`);
      }
      return `max(${expr})`;

    case 'percentile':
      // Percentile requires both expression and percentile parameter
      if (!expr) {
        throw new Error(
          `Measure '${measure.name}' with aggregation 'percentile' requires an expr field`
        );
      }
      if (!measure.agg_params?.percentile) {
        throw new Error(
          `Measure '${measure.name}' with aggregation 'percentile' requires agg_params.percentile`
        );
      }
      return `percentile(${expr}, ${measure.agg_params.percentile})`;

    case 'sum_boolean':
      // Sum boolean converts boolean to 1/0 and sums
      if (!expr) {
        throw new Error(
          `Measure '${measure.name}' with aggregation 'sum_boolean' requires an expr field`
        );
      }
      return `sum(case when ${expr} then 1 else 0 end)`;

    default:
      // Fallback for unknown aggregation types
      // This provides extensibility if new agg types are added
      return expr ? `${agg}(${expr})` : `${agg}(*)`;
  }
}

/**
 * Transform multiple dbt measures to Buster metrics
 *
 * @param measures - Array of dbt measures
 * @returns Array of Buster metrics
 */
export function transformMeasuresToMetrics(measures: DbtMeasure[]): DatasetMetric[] {
  return measures.map(transformMeasureToMetric);
}

/**
 * Validate that a measure has the required fields for its aggregation type
 *
 * @param measure - The dbt measure to validate
 * @returns Validation result with any error messages
 */
export function validateMeasure(measure: DbtMeasure): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required expr field based on aggregation type
  const requiresExpr = [
    'count_distinct',
    'sum',
    'average',
    'median',
    'min',
    'max',
    'percentile',
    'sum_boolean',
  ];

  if (requiresExpr.includes(measure.agg) && !measure.expr) {
    errors.push(`Aggregation '${measure.agg}' requires an expr field`);
  }

  // Check for percentile-specific requirements
  if (measure.agg === 'percentile') {
    if (!measure.agg_params?.percentile) {
      errors.push(`Aggregation 'percentile' requires agg_params.percentile`);
    } else if (measure.agg_params.percentile < 0 || measure.agg_params.percentile > 1) {
      errors.push(
        `agg_params.percentile must be between 0 and 1, got ${measure.agg_params.percentile}`
      );
    }
  }

  // Check for name
  if (!measure.name || measure.name.trim().length === 0) {
    errors.push('Measure must have a name');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
