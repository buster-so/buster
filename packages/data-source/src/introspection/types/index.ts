import { z } from 'zod';
import type { DatabaseAdapter } from '../../adapters/base';
import { DataSourceType } from '../../types/credentials';

// Filters for introspection operations
export const IntrospectionFiltersSchema = z.object({
  databases: z.array(z.string()).optional(),
  schemas: z.array(z.string()).optional(),
  tables: z.array(z.string()).optional(),
  excludeTables: z.array(z.string()).optional(),
});

export type IntrospectionFilters = z.infer<typeof IntrospectionFiltersSchema>;

// Table metadata from structural introspection
export const TableMetadataSchema = z.object({
  name: z.string(),
  schema: z.string(),
  database: z.string(),
  rowCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().nonnegative().optional(),
  type: z.enum(['TABLE', 'VIEW', 'MATERIALIZED_VIEW', 'EXTERNAL_TABLE', 'TEMPORARY_TABLE']),
  comment: z.string().optional(),
  created: z.date().optional(),
  lastModified: z.date().optional(),
  clusteringKeys: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type TableMetadata = z.infer<typeof TableMetadataSchema>;

// Structural metadata result from initial introspection
export const StructuralMetadataSchema = z.object({
  dataSourceId: z.string(),
  dataSourceType: z.nativeEnum(DataSourceType),
  tables: z.array(TableMetadataSchema),
  introspectedAt: z.date(),
  filters: IntrospectionFiltersSchema.optional(),
});

export type StructuralMetadata = z.infer<typeof StructuralMetadataSchema>;

// Column schema information for sampled data
export const ColumnSchemaSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean().optional(),
  length: z.number().optional(),
  precision: z.number().optional(),
  scale: z.number().optional(),
});

export type ColumnSchema = z.infer<typeof ColumnSchemaSchema>;

// Table sample data
export const TableSampleSchema = z.object({
  tableId: z.string(), // Composite of database.schema.table
  rowCount: z.number().int().nonnegative(),
  sampleSize: z.number().int().nonnegative(),
  sampleData: z.array(z.record(z.unknown())), // Raw sample rows
  columnSchemas: z.array(ColumnSchemaSchema).optional(), // Column schema information
  sampledAt: z.date(),
  samplingMethod: z.string(), // e.g., "TABLESAMPLE", "RANDOM", etc.
});

export type TableSample = z.infer<typeof TableSampleSchema>;

// Function signatures for factory pattern
export type StructuralMetadataFetcher = (
  adapter: DatabaseAdapter,
  filters?: IntrospectionFilters
) => Promise<StructuralMetadata>;

export type TableSampler = (
  adapter: DatabaseAdapter,
  table: TableMetadata,
  sampleSize: number
) => Promise<TableSample>;

// Dialect type for factory routing
export type IntrospectionDialect = DataSourceType;
