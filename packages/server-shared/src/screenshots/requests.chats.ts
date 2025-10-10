import { z } from 'zod';
import { BaseScreenshotSearchSchema } from './requests.base';
import { PutMetricScreenshotRequestSchema } from './requests.metrics';

export const PutChatScreenshotRequestSchema = PutMetricScreenshotRequestSchema;
export const PutChatScreenshotParamsSchema = z.object({
  id: z.string().uuid('Asset ID must be a valid UUID'),
});

export type PutChatScreenshotRequest = z.infer<typeof PutChatScreenshotRequestSchema>;

export const GetChatScreenshotParamsSchema = z.object({
  id: z.string(),
});

export type GetChatScreenshotParams = z.infer<typeof GetChatScreenshotParamsSchema>;

export const GetChatScreenshotQuerySchema = z.object({}).merge(BaseScreenshotSearchSchema);

export type GetChatScreenshotQuery = z.infer<typeof GetChatScreenshotQuerySchema>;
