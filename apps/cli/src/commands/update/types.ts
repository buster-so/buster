import { z } from 'zod';

// Command arguments schema
export const UpdateArgsSchema = z.object({
  check: z.boolean().default(false),
  force: z.boolean().default(false),
});

export type UpdateArgs = z.infer<typeof UpdateArgsSchema>;

// Version info schema
export const VersionInfoSchema = z.object({
  current: z.string(),
  latest: z.string(),
  updateAvailable: z.boolean(),
  releaseNotes: z.string().optional(),
});

export type VersionInfo = z.infer<typeof VersionInfoSchema>;