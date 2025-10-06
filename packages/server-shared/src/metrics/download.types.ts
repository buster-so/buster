import { z } from 'zod';

/**
 * Path parameters for metric download endpoint
 */
export const MetricDownloadParamsSchema = z.object({
  id: z.string().uuid('Metric ID must be a valid UUID'),
});
export const MetricDownloadQueryParamsSchema = z.object({
  report_file_id: z.string().uuid('Report file ID must be a valid UUID').optional(),
  metric_version_number: z.coerce.number().optional(),
});

export type MetricDownloadParams = z.infer<typeof MetricDownloadParamsSchema>;
export type MetricDownloadQueryParams = z.infer<typeof MetricDownloadQueryParamsSchema>;
/**
 * Response for successful metric download
 */
export const MetricDownloadResponseSchema = z.object({
  downloadUrl: z.string().url('Download URL must be valid'),
  expiresAt: z.string().datetime({ offset: true }),
  fileSize: z.number().int().positive(),
  fileName: z.string(),
  rowCount: z.number().int().nonnegative(),
  message: z.string().optional(),
});

export type MetricDownloadResponse = z.infer<typeof MetricDownloadResponseSchema>;

/**
 * Error response for metric download
 */
export const MetricDownloadErrorSchema = z.object({
  error: z.string(),
  code: z.enum(['UNAUTHORIZED', 'NOT_FOUND', 'EXPORT_FAILED', 'TIMEOUT']),
});

export type MetricDownloadError = z.infer<typeof MetricDownloadErrorSchema>;

/**
 * Output schema for export metric data task
 * This is the output from the Trigger.dev task
 */
export const ExportMetricDataOutputSchema = z.object({
  success: z.boolean(),
  downloadUrl: z.string().url('Download URL must be valid').optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  fileSize: z.number().int().positive().optional(),
  rowCount: z.number().int().nonnegative().optional(),
  fileName: z.string().optional(),
  error: z.string().optional(),
  errorCode: z
    .enum(['UNAUTHORIZED', 'NOT_FOUND', 'QUERY_ERROR', 'UPLOAD_ERROR', 'UNKNOWN'])
    .optional(),
});

export type ExportMetricDataOutput = z.infer<typeof ExportMetricDataOutputSchema>;
