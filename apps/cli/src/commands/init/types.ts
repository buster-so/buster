import { z } from 'zod';

// Command arguments schema
export const InitArgsSchema = z.object({
  name: z.string().optional(),
  path: z.string().default(process.cwd()),
  skipPrompts: z.boolean().default(false),
});

export type InitArgs = z.infer<typeof InitArgsSchema>;

// Project configuration schema
export const ProjectConfigSchema = z.object({
  version: z.string().default('1.0'),
  projectName: z.string(),
  organization: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;