import { z } from 'zod';
import { DataSourceType } from '@buster/data-source';

// Re-export the introspection types from data-source package
export type {
  IntrospectionFilters,
  TableMetadata,
  StructuralMetadata,
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

// Sample table sub-task input
export const SampleTableTaskInputSchema = z.object({
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

export type SampleTableTaskInput = z.infer<typeof SampleTableTaskInputSchema>;

// Sample table sub-task output
export const SampleTableTaskOutputSchema = z.object({
  success: z.boolean(),
  tableId: z.string(),
  sampleSize: z.number(),
  actualSamples: z.number(),
  samplingMethod: z.string(),
  error: z.string().optional(),
});

export type SampleTableTaskOutput = z.infer<typeof SampleTableTaskOutputSchema>;