import { z } from 'zod';

// Command arguments schema
export const ResetArgsSchema = z.object({
  hard: z.boolean().default(false),
  force: z.boolean().default(false),
});

export type ResetArgs = z.infer<typeof ResetArgsSchema>;