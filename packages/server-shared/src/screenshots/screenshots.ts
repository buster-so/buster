import { z } from 'zod';

export const PutScreenshotResponseSchema = z.object({
  success: z.boolean(),
  bucketKey: z.string().min(1, 'Bucket key is required'),
});

export type PutScreenshotResponse = z.infer<typeof PutScreenshotResponseSchema>;

export const GetScreenshotResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().optional(),
  error: z.string().optional(),
});

export type GetScreenshotResponse = z.infer<typeof GetScreenshotResponseSchema>;
