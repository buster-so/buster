import { z } from 'zod';

export const VersionSchema = z.object({
  version_number: z.number(),
  updated_at: z.string(),
});

export type Version = z.infer<typeof VersionSchema>;

export const VersionsSchema = z.array(VersionSchema);

export type Versions = z.infer<typeof VersionsSchema>;
