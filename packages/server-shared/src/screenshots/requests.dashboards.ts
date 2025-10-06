import { z } from 'zod';

export const PutDashboardScreenshotRequestSchema = z.object({
  base64Image: z.string(),
});

export type PutDashboardScreenshotRequest = z.infer<typeof PutDashboardScreenshotRequestSchema>;
