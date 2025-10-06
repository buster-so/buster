import { z } from 'zod';
import { BaseScreenshotSearchSchema } from './requests.base';
import { PutMetricScreenshotRequestSchema } from './requests.metrics';

export const PutDashboardScreenshotRequestSchema = PutMetricScreenshotRequestSchema;
export const PutDashboardScreenshotParamsSchema = z.object({
  id: z.string().uuid('Asset ID must be a valid UUID'),
});

export type PutDashboardScreenshotRequest = z.infer<typeof PutDashboardScreenshotRequestSchema>;

export const GetDashboardScreenshotParamsSchema = z.object({
  id: z.string(),
});

export type GetDashboardScreenshotParams = z.infer<typeof GetDashboardScreenshotParamsSchema>;

export const GetDashboardScreenshotQuerySchema = z
  .object({
    width: z.coerce.number().min(100).max(3840).default(800),
    height: z.coerce.number().min(100).max(4160).default(450),
    type: z.enum(['png', 'jpeg']).default('png'),
    version_number: z.coerce.number().optional(),
  })
  .merge(BaseScreenshotSearchSchema);

export type GetDashboardScreenshotQuery = z.infer<typeof GetDashboardScreenshotQuerySchema>;
