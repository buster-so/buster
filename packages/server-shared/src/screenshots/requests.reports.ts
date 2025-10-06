import { z } from 'zod';

export const PutReportScreenshotRequestSchema = z.object({
  base64Image: z.string(),
});

export type PutReportScreenshotRequest = z.infer<typeof PutReportScreenshotRequestSchema>;
