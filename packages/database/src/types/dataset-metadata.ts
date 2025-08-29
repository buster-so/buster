import { z } from 'zod';

// Column profile type (matching the introspection output)
export const DatasetColumnProfileSchema = z.object({
  columnName: z.string(),
  dataType: z.string(),

  // Basic statistics
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

  // Numeric statistics (optional)
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
});

export const DatasetMetadataSchema = z.object({
  rowCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().nonnegative().optional(),
  sampleSize: z.number().int().nonnegative(),
  samplingMethod: z.string(),
  columnProfiles: z.array(DatasetColumnProfileSchema),
  sampleRows: z.array(z.record(z.unknown())).optional(), // Complete sample rows to show column relationships
  introspectedAt: z.string(), // ISO date string
});

export type DatasetColumnProfile = z.infer<typeof DatasetColumnProfileSchema>;
export type DatasetMetadata = z.infer<typeof DatasetMetadataSchema>;
