import { z } from 'zod';

export const PutDashboardScreenshotRequestSchema = z.object({
  base64Image: z.string(),
});

export type PutDashboardScreenshotRequest = z.infer<typeof PutDashboardScreenshotRequestSchema>;

export const GetDashboardScreenshotParamsSchema = z.object({
  id: z.string(),
});

export type GetDashboardScreenshotParams = z.infer<typeof GetDashboardScreenshotParamsSchema>;

export const GetDashboardScreenshotQuerySchema = z.object({
  width: z.coerce.number().min(100).max(3840).default(800),
  height: z.coerce.number().min(100).max(4160).default(450),
  type: z.enum(['png', 'jpeg']).default('png'),
});

export type GetDashboardScreenshotQuery = z.infer<typeof GetDashboardScreenshotQuerySchema>;
