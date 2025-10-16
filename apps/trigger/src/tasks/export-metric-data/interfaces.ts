import { z } from 'zod';

// Re-export the output type from server-shared
export type { ExportMetricDataOutput } from '@buster/server-shared/metrics';
export { ExportMetricDataOutputSchema } from '@buster/server-shared/metrics';

// Input schema for the export task
export const ExportMetricDataInputSchema = z.object({
  metricId: z.string().uuid('Metric ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
  reportFileId: z.string().uuid('Report file ID must be a valid UUID').optional(),
  metricVersionNumber: z.number().optional(),
});

export type ExportMetricDataInput = z.infer<typeof ExportMetricDataInputSchema>;

// Schema for cleanup task
export const CleanupExportFileInputSchema = z.object({
  key: z.string().min(1, 'Storage key is required'),
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
});

export type CleanupExportFileInput = z.infer<typeof CleanupExportFileInputSchema>;
