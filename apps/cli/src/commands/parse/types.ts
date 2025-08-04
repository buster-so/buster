import { z } from 'zod';

export const ParseArgsSchema = z.object({
  path: z.string().default('./buster'),
  files: z.array(z.string()).default([]),
});

export type ParseArgs = z.infer<typeof ParseArgsSchema>;