import { DataSourceType } from '@buster/data-source';
import { z } from 'zod';

// Re-export the introspection types from data-source package
export type {
  IntrospectionFilters,
  StructuralMetadata,
  TableMetadata,
  TableSample,
} from '@buster/data-source';

// Main introspection task input
export const IntrospectDataTaskInputSchema = z.object({
  dataSourceId: z.string().min(1, 'Data source ID is required'),
  filters: z
    .object({
      databases: z.array(z.string()).optional(),
      schemas: z.array(z.string()).optional(),
      tables: z.array(z.string()).optional(),
      excludeTables: z.array(z.string()).optional(),
    })
    .optional(),
});

export type IntrospectDataTaskInput = z.infer<typeof IntrospectDataTaskInputSchema>;

// Main introspection task output
export const IntrospectDataTaskOutputSchema = z.object({
  success: z.boolean(),
  dataSourceId: z.string(),
  tablesFound: z.number(),
  subTasksTriggered: z.number(),
  error: z.string().optional(),
});

export type IntrospectDataTaskOutput = z.infer<typeof IntrospectDataTaskOutputSchema>;

// Get table statistics sub-task input
export const GetTableStatisticsInputSchema = z.object({
  dataSourceId: z.string().min(1, 'Data source ID is required'),
  table: z.object({
    name: z.string(),
    schema: z.string(),
    database: z.string(),
    rowCount: z.number(),
    sizeBytes: z.number().optional(),
    type: z.enum(['TABLE', 'VIEW', 'MATERIALIZED_VIEW', 'EXTERNAL_TABLE', 'TEMPORARY_TABLE']),
  }),
  sampleSize: z.number().int().positive(),
});

export type GetTableStatisticsInput = z.infer<typeof GetTableStatisticsInputSchema>;

// Column profile schema
export const ColumnProfileSchema = z.object({
  columnName: z.string(),
  dataType: z.string(),

  // Basic Statistics
  nullRate: z.number().min(0).max(1),
  distinctCount: z.number().int().nonnegative(),
  uniquenessRatio: z.number().min(0).max(1),
  emptyStringRate: z.number().min(0).max(1),

  // Distribution
  topValues: z.array(
    z.object({
      value: z.unknown(),
      count: z.number(),
      percentage: z.number(),
    })
  ),
  entropy: z.number(),
  giniCoefficient: z.number().min(0).max(1),

  // Sample values
  sampleValues: z.array(z.unknown()),

  // Numeric-specific
  numericStats: z
    .object({
      mean: z.number(),
      median: z.number(),
      stdDev: z.number(),
      skewness: z.number(),
      percentiles: z.object({
        p25: z.number(),
        p50: z.number(),
        p75: z.number(),
        p95: z.number(),
        p99: z.number(),
      }),
      outlierRate: z.number().min(0).max(1),
    })
    .optional(),

  // Classification
  classification: z.object({
    isLikelyEnum: z.boolean(),
    isLikelyIdentifier: z.boolean(),
    identifierType: z
      .enum(['primary_key', 'foreign_key', 'natural_key', 'sequential', 'uuid_like'])
      .optional(),
    enumValues: z.array(z.string()).optional(),
  }),

  // Dynamic metadata based on detected column semantics
  dynamicMetadata: z
    .union([
      z.object({ type: z.literal('datetime') }).passthrough(),
      z.object({ type: z.literal('numeric') }).passthrough(),
      z.object({ type: z.literal('identifier') }).passthrough(),
      z.object({ type: z.literal('url') }).passthrough(),
      z.object({ type: z.literal('email') }).passthrough(),
      z.object({ type: z.literal('json') }).passthrough(),
    ])
    .optional(),
});

export type ColumnProfile = z.infer<typeof ColumnProfileSchema>;

// Get table statistics sub-task output
export const GetTableStatisticsOutputSchema = z.object({
  success: z.boolean(),
  tableId: z.string(),
  totalRows: z.number(),
  sampleSize: z.number(),
  actualSamples: z.number(),
  samplingMethod: z.string(),

  // NEW: Statistical analysis results
  columnProfiles: z.array(ColumnProfileSchema).optional(),
  tableMetadata: z
    .object({
      sampleSize: z.number(),
      totalRows: z.number(),
      samplingRate: z.number(),
      analysisTimeMs: z.number(),
    })
    .optional(),

  error: z.string().optional(),
});

export type GetTableStatisticsOutput = z.infer<typeof GetTableStatisticsOutputSchema>;

// Keep old names for backward compatibility temporarily
export const SampleTableTaskInputSchema = GetTableStatisticsInputSchema;
export type SampleTableTaskInput = GetTableStatisticsInput;
export const SampleTableTaskOutputSchema = GetTableStatisticsOutputSchema;
export type SampleTableTaskOutput = GetTableStatisticsOutput;
