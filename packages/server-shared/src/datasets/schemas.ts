import { z } from 'zod';

// ============================================================================
// Model Schemas - Define the structure of semantic layer models
// ============================================================================

// Helper to allow {{TODO}} as a placeholder in any string field
const TODO_MARKER = '{{TODO}}';
const _stringWithTodo = z.union([z.string(), z.literal(TODO_MARKER)]);

export const ArgumentSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

// Support string, number, boolean, {{TODO}}, or object for dimension options
// YAML automatically converts true/false to booleans
const DimensionOptionSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.literal(TODO_MARKER),
  z.object({
    value: z.union([z.string(), z.number(), z.boolean(), z.literal(TODO_MARKER)]),
    description: z.string().optional(),
  }),
]);

export const DimensionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  searchable: z.boolean().optional().default(false),
  options: z.array(DimensionOptionSchema).optional().nullable(),
});

export const MeasureSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
});

export const DatasetMetricSchema = z.object({
  name: z.string(),
  expr: z.string(),
  description: z.string().optional(),
  args: z.array(ArgumentSchema).default([]),
});

export const FilterSchema = z.object({
  name: z.string(),
  expr: z.string(),
  description: z.string().optional(),
  args: z.array(ArgumentSchema).default([]),
});

export const RelationshipSchema = z.object({
  name: z.string(),
  source_col: z.string(),
  ref_col: z.string(),
  type: z.string().optional(),
  cardinality: z.string().optional(),
  description: z.string().optional(),
});

export const ModelSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    data_source_name: z.string().optional(),
    database: z.string().optional(),
    schema: z.string().optional(),
    dimensions: z.array(DimensionSchema).optional().default([]),
    measures: z.array(MeasureSchema).optional().default([]),
    metrics: z.array(DatasetMetricSchema).optional().default([]),
    filters: z.array(FilterSchema).optional().default([]),
    relationships: z.array(RelationshipSchema).optional().default([]),
    clarifications: z.array(z.string()).optional().default([]),
  })
  .refine(
    (data) => {
      // Check for duplicate dimension names
      const dimensionNames = data.dimensions.map((d) => d.name);
      return dimensionNames.length === new Set(dimensionNames).size;
    },
    (data) => {
      const dimensionNames = data.dimensions.map((d) => d.name);
      const duplicates = dimensionNames.filter(
        (name, index) => dimensionNames.indexOf(name) !== index
      );
      return {
        message: `Duplicate dimension name: ${duplicates[0]}`,
        path: ['dimensions'],
      };
    }
  )
  .refine(
    (data) => {
      // Check for duplicate measure names
      const measureNames = data.measures.map((m) => m.name);
      return measureNames.length === new Set(measureNames).size;
    },
    (data) => {
      const measureNames = data.measures.map((m) => m.name);
      const duplicates = measureNames.filter((name, index) => measureNames.indexOf(name) !== index);
      return {
        message: `Duplicate measure name: ${duplicates[0]}`,
        path: ['measures'],
      };
    }
  )
  .refine(
    (data) => {
      // Check for duplicate metric names
      const metricNames = data.metrics.map((m) => m.name);
      return metricNames.length === new Set(metricNames).size;
    },
    (data) => {
      const metricNames = data.metrics.map((m) => m.name);
      const duplicates = metricNames.filter((name, index) => metricNames.indexOf(name) !== index);
      return {
        message: `Duplicate metric name: ${duplicates[0]}`,
        path: ['metrics'],
      };
    }
  )
  .refine(
    (data) => {
      // Check for duplicate filter names
      const filterNames = data.filters.map((f) => f.name);
      return filterNames.length === new Set(filterNames).size;
    },
    (data) => {
      const filterNames = data.filters.map((f) => f.name);
      const duplicates = filterNames.filter((name, index) => filterNames.indexOf(name) !== index);
      return {
        message: `Duplicate filter name: ${duplicates[0]}`,
        path: ['filters'],
      };
    }
  );

// Support both single model and multi-model YAML files
export const SingleModelSchema = ModelSchema;
export const MultiModelSchema = z.object({
  models: z.array(ModelSchema),
});

// ============================================================================
// Configuration Schemas - Define buster.yml structure
// ============================================================================

// Schema for logs configuration in buster.yml
export const LogsConfigSchema = z.object({
  data_source: z
    .string()
    .optional()
    .describe('Data source to use for logs writeback (defaults to first available)'),
  database: z.string().describe('Database name for logs'),
  schema: z.string().describe('Schema name for logs'),
  table_name: z.string().optional().describe('Table name for logs (defaults to buster_query_logs)'),
});

export const ProjectContextSchema = z.object({
  name: z.string(),
  data_source: z.string(),
  database: z.string().optional(),
  schema: z.string(),
  include: z.array(z.string()).default(['**/*.yml', '**/*.yaml']),
  exclude: z.array(z.string()).default([]),
});

export const BusterConfigSchema = z.object({
  projects: z.array(ProjectContextSchema).min(1),
  logs: LogsConfigSchema.optional().describe('Logs writeback configuration'),
});

// ============================================================================
// Deployment Request/Response Schemas - For API interaction
// ============================================================================

export const DeployColumnSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  semantic_type: z.string().optional(),
  expr: z.string().optional(),
  type: z.string().optional(),
  agg: z.string().optional(),
  searchable: z.boolean().default(false),
});

export const DeployModelSchema = z.object({
  name: z.string(),
  data_source_name: z.string(),
  database: z.string().optional(),
  schema: z.string(),
  description: z.string().default(''),
  sql_definition: z.string().optional(),
  yml_file: z.string().optional(),
  columns: z.array(DeployColumnSchema),
  // Optional fields for future use
  metrics: z.array(DatasetMetricSchema).optional(),
  filters: z.array(FilterSchema).optional(),
  relationships: z.array(RelationshipSchema).optional(),
  clarifications: z.array(z.string()).optional(),
});

export const DeployRequestSchema = z.object({
  models: z.array(DeployModelSchema),
  // Optional: specify behavior for models not in the list
  deleteAbsentModels: z.boolean().default(true),
});

// ============================================================================
// Deployment Result Schemas
// ============================================================================

export const DeploymentItemSchema = z.object({
  name: z.string(),
  dataSource: z.string(),
  schema: z.string(),
  database: z.string().optional(),
});

export const DeploymentFailureSchema = z.object({
  name: z.string(),
  dataSource: z.string(),
  errors: z.array(z.string()),
});

export const DeployResponseSchema = z.object({
  success: z.array(DeploymentItemSchema).default([]),
  updated: z.array(DeploymentItemSchema).default([]),
  noChange: z.array(DeploymentItemSchema).default([]),
  failures: z.array(DeploymentFailureSchema).default([]),
  deleted: z.array(z.string()).default([]),
  summary: z.object({
    totalModels: z.number(),
    successCount: z.number(),
    updateCount: z.number(),
    noChangeCount: z.number(),
    failureCount: z.number(),
    deletedCount: z.number(),
  }),
});

// ============================================================================
// Type Exports - Inferred from schemas
// ============================================================================

export type Argument = z.infer<typeof ArgumentSchema>;
export type Dimension = z.infer<typeof DimensionSchema>;
export type Measure = z.infer<typeof MeasureSchema>;
export type DatasetMetric = z.infer<typeof DatasetMetricSchema>;
export type Filter = z.infer<typeof FilterSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type Model = z.infer<typeof ModelSchema>;

export type ProjectContext = z.infer<typeof ProjectContextSchema>;
export type BusterConfig = z.infer<typeof BusterConfigSchema>;

export type DeployColumn = z.infer<typeof DeployColumnSchema>;
export type DeployModel = z.infer<typeof DeployModelSchema>;
export type DeployRequest = z.infer<typeof DeployRequestSchema>;

export type DeploymentItem = z.infer<typeof DeploymentItemSchema>;
export type DeploymentFailure = z.infer<typeof DeploymentFailureSchema>;
export type DeployResponse = z.infer<typeof DeployResponseSchema>;
