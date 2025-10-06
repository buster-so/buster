import { z } from 'zod';

export const PutChatScreenshotRequestSchema = z.object({
  base64Image: z.string(),
});

export type PutChatScreenshotRequest = z.infer<typeof PutChatScreenshotRequestSchema>;
