import { z } from 'zod';

export const BaseScreenshotSearchSchema = z.object({
  backgroundColor: z.string().default('#ffffff').optional(),
});

export type ScreenshotSearch = z.infer<typeof BaseScreenshotSearchSchema>;
