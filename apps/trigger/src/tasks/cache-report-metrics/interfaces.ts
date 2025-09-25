import { z } from 'zod';

/**
 * Input schema for caching report metrics
 */
export const CacheReportMetricsInputSchema = z.object({
  reportId: z.string().uuid('Report ID must be a valid UUID'),
  metricIds: z.array(z.string().uuid()).min(1, 'At least one metric ID is required'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
});

export type CacheReportMetricsInput = z.infer<typeof CacheReportMetricsInputSchema>;

/**
 * Output schema for cache report metrics task
 */
export const CacheReportMetricsOutputSchema = z.object({
  success: z.boolean(),
  reportId: z.string(),
  cached: z.array(
    z.object({
      metricId: z.string(),
      success: z.boolean(),
      rowCount: z.number().optional(),
      error: z.string().optional(),
      version: z.number().optional().describe('The version number of the cached metric'),
    })
  ),
  totalMetrics: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  executionTimeMs: z.number(),
});

export type CacheReportMetricsOutput = z.infer<typeof CacheReportMetricsOutputSchema>;
