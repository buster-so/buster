import {
  type Argument,
  ArgumentSchema,
  type BusterConfig,
  BusterConfigSchema,
  type DatasetMetric,
  DatasetMetricSchema,
  type DeployColumn,
  DeployColumnSchema,
  type DeployModel,
  DeployModelSchema,
  type DeploymentFailure,
  DeploymentFailureSchema,
  type DeploymentItem,
  DeploymentItemSchema,
  type DeployRequest,
  DeployRequestSchema,
  type DeployResponse,
  DeployResponseSchema,
  type Dimension,
  DimensionSchema,
  deploy,
  type Filter,
  FilterSchema,
  type Measure,
  MeasureSchema,
  type Model,
  ModelSchema,
  type ProjectContext,
  ProjectContextSchema,
  type Relationship,
  RelationshipSchema,
} from '@buster/server-shared';
import { z } from 'zod';

// Get DocDeployResultSchema from deploy namespace
const DocDeployResultSchema = deploy.DocDeployResultSchema;

// Re-export all the shared schemas from server-shared
export {
  ArgumentSchema,
  DimensionSchema,
  MeasureSchema,
  DatasetMetricSchema,
  FilterSchema,
  RelationshipSchema,
  ModelSchema,
  ProjectContextSchema,
  BusterConfigSchema,
  DeployColumnSchema,
  DeployModelSchema,
  DeployRequestSchema,
  DeploymentItemSchema,
  DeploymentFailureSchema,
  DeployResponseSchema,
  type Argument,
  type Dimension,
  type Measure,
  type DatasetMetric,
  type Filter,
  type Relationship,
  type Model,
  type ProjectContext,
  type BusterConfig,
  type DeployColumn,
  type DeployModel,
  type DeployRequest,
  type DeploymentItem,
  type DeploymentFailure,
  type DeployResponse,
};

// Re-export deploy schemas from server-shared deploy namespace (already imported above)

// Alias for backward compatibility in CLI
export { DatasetMetricSchema as MetricSchema } from '@buster/server-shared';
export type Metric = DatasetMetric;

// ============================================================================
// CLI-specific schemas (not shared with server)
// ============================================================================

// Resolved config after merging CLI options, file config, and defaults
export const ResolvedConfigSchema = z.object({
  data_source_name: z.string(),
  database: z.string().optional(),
  schema: z.string(),
  include: z.array(z.string()).default(['**/*.yml', '**/*.yaml']),
  exclude: z.array(z.string()).default([]),
});

// ============================================================================
// CLI Options Schema (CLI-specific, not in server-shared)
// ============================================================================

export const DeployOptionsSchema = z.object({
  path: z.string().optional(),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
  debug: z.boolean().default(false),
});

// ============================================================================
// CLI-specific Result Schema (includes file paths for local reporting)
// ============================================================================

// CLI-specific deployment item (includes file path)
export const CLIDeploymentItemSchema = z.object({
  file: z.string(),
  modelName: z.string(),
  dataSource: z.string(),
});

// CLI-specific deployment failure (includes file path)
export const CLIDeploymentFailureSchema = z.object({
  file: z.string(),
  modelName: z.string(),
  errors: z.array(z.string()),
});

export const DeploymentExcludedSchema = z.object({
  file: z.string(),
  reason: z.string(),
});

// TODO files that were skipped (not errors)
export const TodoFileSchema = z.object({
  file: z.string(),
  modelName: z.string().optional(),
});

// Use DocDeployResultSchema from server-shared instead of duplicating

export const CLIDeploymentResultSchema = z.object({
  success: z.array(CLIDeploymentItemSchema).default([]),
  updated: z.array(CLIDeploymentItemSchema).default([]),
  noChange: z.array(CLIDeploymentItemSchema).default([]),
  failures: z.array(CLIDeploymentFailureSchema).default([]),
  excluded: z.array(DeploymentExcludedSchema).default([]),
  todos: z.array(TodoFileSchema).default([]), // New field for TODO files
  docs: DocDeployResultSchema.optional(), // Track doc deployment results
});

// ============================================================================
// Type Exports - CLI-specific types
// ============================================================================

export type ResolvedConfig = z.infer<typeof ResolvedConfigSchema>;
export type DeployOptions = z.infer<typeof DeployOptionsSchema>;
export type DeploymentExcluded = z.infer<typeof DeploymentExcludedSchema>;
export type CLIDeploymentResult = z.infer<typeof CLIDeploymentResultSchema>;
