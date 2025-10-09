import { z } from 'zod';
import { DEFAULT_SCREENSHOT_CONFIG } from './methods/screenshot-config';
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

export const GetChatScreenshotQuerySchema = z
  .object({
    width: z.coerce.number().min(600).max(3840).default(DEFAULT_SCREENSHOT_CONFIG.width),
    height: z.coerce.number().min(300).max(2160).default(DEFAULT_SCREENSHOT_CONFIG.height),
    type: z.enum(['png', 'jpeg']).default('png'),
  })
  .merge(BaseScreenshotSearchSchema);

export type GetChatScreenshotQuery = z.infer<typeof GetChatScreenshotQuerySchema>;
