import { z } from 'zod';
import { BaseScreenshotSearchSchema } from './requests.base';
import { PutMetricScreenshotRequestSchema } from './requests.metrics';

export const PutReportScreenshotRequestSchema = PutMetricScreenshotRequestSchema;
export const PutReportScreenshotParamsSchema = z.object({
  id: z.string().uuid('Asset ID must be a valid UUID'),
});

export type PutReportScreenshotRequest = z.infer<typeof PutReportScreenshotRequestSchema>;

export const GetReportScreenshotParamsSchema = z.object({
  id: z.string(),
});

export type GetReportScreenshotParams = z.infer<typeof GetReportScreenshotParamsSchema>;

export const GetReportScreenshotQuerySchema = z
  .object({
    version_number: z.coerce.number().optional(),
  })
  .merge(BaseScreenshotSearchSchema);

export type GetReportScreenshotQuery = z.infer<typeof GetReportScreenshotQuerySchema>;
