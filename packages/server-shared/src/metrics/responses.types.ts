import { z } from 'zod';
import { DataMetadataSchema, DataResultSchema } from './metadata.type';
import { MetricSchema } from './metric.types';
import { MetricListItemSchema } from './metrics-list.types';

export const GetMetricResponseSchema = MetricSchema;
export const ListMetricsResponseSchema = z.array(MetricListItemSchema);
export const UpdateMetricResponseSchema = MetricSchema;
export const DuplicateMetricResponseSchema = MetricSchema;
export const DeleteMetricResponseSchema = z.array(z.string());
export const ShareMetricResponseSchema = MetricSchema;
export const ShareDeleteResponseSchema = MetricSchema;
export const ShareUpdateResponseSchema = MetricSchema;

export const BulkUpdateMetricVerificationStatusResponseSchema = z.object({
  failed_updates: z.array(MetricSchema),
  failure_count: z.number(),
  success_count: z.number(),
  total_processed: z.number(),
  updated_metrics: z.array(MetricSchema),
});

export const MetricDataResponseSchema = z.object({
  data: DataResultSchema.nullable(),
  data_metadata: DataMetadataSchema,
  metricId: z.string(),
  has_more_records: z.boolean(),
});

export type GetMetricResponse = z.infer<typeof GetMetricResponseSchema>;
export type ListMetricsResponse = z.infer<typeof ListMetricsResponseSchema>;
export type UpdateMetricResponse = z.infer<typeof UpdateMetricResponseSchema>;
export type DuplicateMetricResponse = z.infer<typeof DuplicateMetricResponseSchema>;
export type DeleteMetricResponse = z.infer<typeof DeleteMetricResponseSchema>;
export type BulkUpdateMetricVerificationStatusResponse = z.infer<
  typeof BulkUpdateMetricVerificationStatusResponseSchema
>;
export type ShareMetricResponse = z.infer<typeof ShareMetricResponseSchema>;
export type ShareDeleteResponse = z.infer<typeof ShareDeleteResponseSchema>;
export type ShareUpdateResponse = z.infer<typeof ShareUpdateResponseSchema>;
export type MetricDataResponse = z.infer<typeof MetricDataResponseSchema>;

/**
 * Path parameters for metric data endpoint
 */
export const MetricDataParamsSchema = z.object({
  id: z.string().uuid('Metric ID must be a valid UUID'),
});

export type MetricDataParams = z.infer<typeof MetricDataParamsSchema>;

/**
 * Query parameters for metric data endpoint
 */
export const MetricDataQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(5000).default(5000).optional(),
  version_number: z.coerce.number().int().min(1).optional(),
  report_file_id: z.string().uuid().optional(),
  password: z.string().min(1).optional(),
});

export type MetricDataQuery = z.infer<typeof MetricDataQuerySchema>;
