import { z } from 'zod';
import { BaseScreenshotSearchSchema } from './requests.base';

export const GetMetricScreenshotParamsSchema = z.object({
  id: z.string(),
});

export const GetMetricScreenshotQuerySchema = z
  .object({
    version_number: z.coerce.number().min(1).optional(),
    width: z.coerce.number().min(100).max(3840).default(800),
    height: z.coerce.number().min(100).max(2160).default(450),
    type: z.enum(['png', 'jpeg']).default('png'),
  })
  .merge(BaseScreenshotSearchSchema);

export type GetMetricScreenshotParams = z.infer<typeof GetMetricScreenshotParamsSchema>;
export type GetMetricScreenshotQuery = z.infer<typeof GetMetricScreenshotQuerySchema>;

export const PutMetricScreenshotRequestSchema = z.object({
  base64Image: z.string(),
});

export type PutMetricScreenshotRequest = z.infer<typeof PutMetricScreenshotRequestSchema>;
