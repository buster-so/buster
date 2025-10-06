import { z } from 'zod';

export const PutReportScreenshotRequestSchema = z.object({
  base64Image: z.string(),
});

export type PutReportScreenshotRequest = z.infer<typeof PutReportScreenshotRequestSchema>;

export const GetReportScreenshotParamsSchema = z.object({
  id: z.string(),
});

export type GetReportScreenshotParams = z.infer<typeof GetReportScreenshotParamsSchema>;

export const GetReportScreenshotQuerySchema = z.object({
  width: z.coerce.number().min(100).max(3840).default(800),
  height: z.coerce.number().min(100).max(2160).default(450),
  type: z.enum(['png', 'jpeg']).default('png'),
});

export type GetReportScreenshotQuery = z.infer<typeof GetReportScreenshotQuerySchema>;
