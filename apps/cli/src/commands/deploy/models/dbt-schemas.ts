import { RelationshipSchema } from '@buster/server-shared';
import { z } from 'zod';

/**
 * DBT YAML Schema Definitions
 *
 * These schemas define the structure of dbt metadata YAML files,
 * including both traditional model definitions and MetricFlow semantic layer structures.
 *
 * CUSTOM BUSTER EXTENSIONS:
 * This implementation adds optional custom fields to the dbt format that are
 * ignored by dbt but recognized by Buster:
 * - models.relationships: Array of relationship definitions (model-level)
 * - columns.searchable: Boolean flag for searchable dimensions (top-level)
 * - columns.options: Array of categorical options (top-level)
 *
 * Precedence: top-level fields > config.meta fields > inference
 */

// ============================================================================
// Column and Test Schemas
// ============================================================================

/**
 * Schema for dbt column constraints
 */
export const DbtConstraintSchema = z
  .object({
    type: z.string().describe('Constraint type (e.g., primary_key, foreign_key, not_null, unique)'),
    // Allow any additional constraint properties
  })
  .passthrough();

/**
 * Schema for dbt column tests
 * Tests can be either a string (simple test name) or an object (test with config)
 */
export const DbtTestSchema = z.union([
  z.string().describe('Simple test name like "unique" or "not_null"'),
  z
    .object({
      // For relationship tests
      relationships: z
        .object({
          to: z.string().describe('Target model reference, e.g., ref("model_name")'),
          field: z.string().describe('Target column name'),
        })
        .optional(),
    })
    .passthrough() // Allow other test types
    .describe('Test configuration object'),
]);

/**
 * Schema for dbt column definition
 *
 * CUSTOM BUSTER EXTENSIONS (optional, ignored by dbt):
 * - searchable: Boolean flag for searchable dimensions (checked before config.meta.searchable)
 * - options: Array of categorical options (checked before config.meta.options)
 */
export const DbtColumnSchema = z.object({
  name: z.string().describe('Column name'),
  description: z.string().optional().describe('Column description in markdown'),
  data_type: z.string().optional().describe('SQL data type (e.g., varchar, integer, timestamp)'),
  quote: z.boolean().optional().describe('Whether to quote the column name in SQL'),
  constraints: z.array(DbtConstraintSchema).optional().describe('Column constraints'),
  data_tests: z.array(DbtTestSchema).optional().describe('dbt tests for this column'),
  config: z
    .object({
      meta: z.record(z.unknown()).optional().describe('Custom metadata for the column'),
      tags: z.array(z.string()).optional().describe('Tags for the column'),
    })
    .optional()
    .describe('Column configuration'),
  granularity: z.string().optional().describe('Time granularity for time_spine columns'),

  // Custom Buster extensions (optional, ignored by dbt)
  searchable: z
    .boolean()
    .optional()
    .describe(
      '[BUSTER EXTENSION] Whether dimension is searchable (takes precedence over config.meta.searchable)'
    ),
  options: z
    .array(z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .describe('[BUSTER EXTENSION] Categorical options (takes precedence over config.meta.options)'),
});

export type DbtColumn = z.infer<typeof DbtColumnSchema>;
export type DbtTest = z.infer<typeof DbtTestSchema>;
export type DbtConstraint = z.infer<typeof DbtConstraintSchema>;

// ============================================================================
// Traditional dbt Model Schema
// ============================================================================

/**
 * Schema for traditional dbt model definition
 *
 * CUSTOM BUSTER EXTENSION (optional, ignored by dbt):
 * - relationships: Array of relationship definitions at the model level
 */
export const DbtModelSchema = z.object({
  name: z.string().describe('Model name (must match the filename)'),
  description: z.string().optional().describe('Model description in markdown'),
  latest_version: z.string().optional().describe('Latest version identifier'),
  deprecation_date: z.string().optional().describe('Date when model will be deprecated'),
  config: z
    .object({
      docs: z
        .object({
          show: z.boolean().optional(),
          node_color: z.string().optional(),
        })
        .optional(),
      access: z.enum(['private', 'protected', 'public']).optional(),
    })
    .passthrough() // Allow other config properties
    .optional()
    .describe('Model configuration'),
  constraints: z.array(DbtConstraintSchema).optional().describe('Model-level constraints'),
  data_tests: z.array(DbtTestSchema).optional().describe('Model-level tests'),
  columns: z.array(DbtColumnSchema).optional().default([]).describe('Column definitions'),
  time_spine: z
    .object({
      standard_granularity_column: z.string(),
    })
    .optional()
    .describe('Time spine configuration'),
  versions: z.array(z.any()).optional().describe('Model versions'),

  // Custom Buster extension (optional, ignored by dbt)
  relationships: z
    .array(RelationshipSchema)
    .optional()
    .describe(
      '[BUSTER EXTENSION] Model-level relationships (takes precedence over semantic entities and column tests)'
    ),
});

export type DbtModel = z.infer<typeof DbtModelSchema>;

// ============================================================================
// Semantic Layer Schemas (MetricFlow)
// ============================================================================

/**
 * Entity types in dbt semantic layer
 */
export const DbtEntityTypeSchema = z.enum(['primary', 'foreign', 'unique', 'natural']);

/**
 * Schema for semantic model entity
 */
export const DbtEntitySchema = z.object({
  name: z.string().describe('Entity name (used as join key identifier)'),
  type: DbtEntityTypeSchema.describe('Entity type: primary, foreign, unique, or natural'),
  expr: z.string().optional().describe('SQL expression or column name for the entity'),
});

export type DbtEntity = z.infer<typeof DbtEntitySchema>;
export type DbtEntityType = z.infer<typeof DbtEntityTypeSchema>;

/**
 * Dimension types in dbt semantic layer
 */
export const DbtDimensionTypeSchema = z.enum(['time', 'categorical']);

/**
 * Schema for time dimension parameters
 */
export const DbtTimeParamsSchema = z.object({
  time_granularity: z
    .string()
    .optional()
    .describe('Time granularity: day, week, month, quarter, year'),
});

/**
 * Schema for semantic model dimension
 */
export const DbtDimensionSchema = z.object({
  name: z.string().describe('Dimension name'),
  type: DbtDimensionTypeSchema.optional().describe('Dimension type: time or categorical'),
  type_params: DbtTimeParamsSchema.optional().describe('Parameters for time dimensions'),
  description: z.string().optional().describe('Dimension description'),
  expr: z.string().optional().describe('SQL expression for the dimension'),
});

export type DbtDimension = z.infer<typeof DbtDimensionSchema>;
export type DbtDimensionType = z.infer<typeof DbtDimensionTypeSchema>;
export type DbtTimeParams = z.infer<typeof DbtTimeParamsSchema>;

/**
 * Aggregation types supported by dbt semantic layer
 */
export const DbtAggregationSchema = z.enum([
  'sum',
  'max',
  'min',
  'average',
  'median',
  'count_distinct',
  'percentile',
  'sum_boolean',
  'count',
]);

/**
 * Schema for aggregation parameters (e.g., percentile value)
 */
export const DbtAggParamsSchema = z.object({
  percentile: z.number().min(0).max(1).optional().describe('Percentile value (0-1)'),
});

/**
 * Schema for non-additive dimension configuration
 */
export const DbtNonAdditiveDimensionSchema = z.object({
  name: z.string().describe('Dimension that should not be aggregated over'),
  window_choice: z.enum(['min', 'max']).optional().describe('Which value to use when aggregating'),
  window_groupings: z
    .array(z.string())
    .optional()
    .describe('Dimensions to group by when applying window choice'),
});

/**
 * Schema for semantic model measure
 */
export const DbtMeasureSchema = z.object({
  name: z.string().describe('Measure name (must be unique across all semantic models)'),
  description: z.string().optional().describe('Measure description'),
  agg: DbtAggregationSchema.describe('Aggregation type'),
  expr: z
    .string()
    .optional()
    .describe('SQL expression or column name to aggregate (required for most aggs)'),
  non_additive_dimension: DbtNonAdditiveDimensionSchema.optional().describe(
    'Configuration for non-additive measures'
  ),
  agg_params: DbtAggParamsSchema.optional().describe('Aggregation-specific parameters'),
  agg_time_dimension: z
    .string()
    .optional()
    .describe('Time dimension for this measure (overrides semantic model default)'),
  label: z.string().optional().describe('Display label for the measure'),
  create_metric: z
    .boolean()
    .optional()
    .describe('Whether to automatically create a simple metric from this measure'),
  config: z
    .object({
      meta: z.record(z.unknown()).optional().describe('Custom metadata'),
    })
    .optional()
    .describe('Measure configuration'),
});

export type DbtMeasure = z.infer<typeof DbtMeasureSchema>;
export type DbtAggregation = z.infer<typeof DbtAggregationSchema>;
export type DbtAggParams = z.infer<typeof DbtAggParamsSchema>;
export type DbtNonAdditiveDimension = z.infer<typeof DbtNonAdditiveDimensionSchema>;

/**
 * Schema for semantic model defaults
 */
export const DbtSemanticModelDefaultsSchema = z.object({
  agg_time_dimension: z
    .string()
    .describe('Default time dimension for measures (required if model has measures)'),
});

/**
 * Schema for complete semantic model
 */
export const DbtSemanticModelSchema = z.object({
  name: z.string().describe('Semantic model name (must be unique)'),
  description: z.string().optional().describe('Semantic model description'),
  model: z.string().describe('Reference to dbt model using ref() function'),
  defaults: DbtSemanticModelDefaultsSchema.optional().describe('Default configurations'),
  entities: z.array(DbtEntitySchema).optional().default([]).describe('Entity definitions'),
  dimensions: z.array(DbtDimensionSchema).optional().default([]).describe('Dimension definitions'),
  measures: z.array(DbtMeasureSchema).optional().default([]).describe('Measure definitions'),
  primary_entity: z
    .string()
    .optional()
    .describe('Primary entity name if no primary entity exists in entities array'),
  label: z.string().optional().describe('Display label for the semantic model'),
  config: z
    .object({
      enabled: z.boolean().optional().describe('Whether semantic model is enabled'),
      group: z.string().optional().describe('Group name for organization'),
      meta: z.record(z.unknown()).optional().describe('Custom metadata'),
    })
    .optional()
    .describe('Semantic model configuration'),
});

export type DbtSemanticModel = z.infer<typeof DbtSemanticModelSchema>;
export type DbtSemanticModelDefaults = z.infer<typeof DbtSemanticModelDefaultsSchema>;

// ============================================================================
// Top-Level dbt File Schema
// ============================================================================

/**
 * Schema for complete dbt YAML file
 * Can contain models, semantic_models, or both
 */
export const DbtFileSchema = z.object({
  version: z.number().optional().describe('dbt schema version (typically 2)'),
  models: z.array(DbtModelSchema).optional().default([]).describe('Traditional model definitions'),
  semantic_models: z
    .array(DbtSemanticModelSchema)
    .optional()
    .default([])
    .describe('Semantic layer model definitions'),
});

export type DbtFile = z.infer<typeof DbtFileSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Parse and validate a dbt YAML file
 */
export function parseDbtFile(data: unknown): {
  success: boolean;
  data?: DbtFile;
  error?: z.ZodError;
} {
  const result = DbtFileSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Validate that a dbt file has at least one model or semantic model
 */
export function validateDbtFileHasContent(dbtFile: DbtFile): boolean {
  return dbtFile.models.length > 0 || dbtFile.semantic_models.length > 0;
}
