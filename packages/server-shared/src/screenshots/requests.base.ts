import { z } from 'zod';

export const BaseScreenshotSearchSchema = z.object({
  backgroundColor: z.string().optional().default('#ffffff'),
});

export type ScreenshotSearch = z.infer<typeof BaseScreenshotSearchSchema>;
