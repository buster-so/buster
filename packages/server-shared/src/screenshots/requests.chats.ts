import { z } from 'zod';

export const PutChatScreenshotRequestSchema = z.object({
  base64Image: z.string(),
});

export type PutChatScreenshotRequest = z.infer<typeof PutChatScreenshotRequestSchema>;

export const GetChatScreenshotParamsSchema = z.object({
  id: z.string(),
});

export type GetChatScreenshotParams = z.infer<typeof GetChatScreenshotParamsSchema>;

export const GetChatScreenshotQuerySchema = z.object({
  width: z.coerce.number().min(600).max(3840).default(600),
  height: z.coerce.number().min(300).max(2160).default(338),
  type: z.enum(['png', 'jpeg']).default('png'),
});

export type GetChatScreenshotQuery = z.infer<typeof GetChatScreenshotQuerySchema>;
