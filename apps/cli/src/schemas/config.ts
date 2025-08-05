import { z } from 'zod';

// buster.yml configuration schema
export const BusterYmlSchema = z.object({
  version: z.string().default('1.0'),
  projectName: z.string(),
  organization: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  settings: z.object({
    autoUpdate: z.boolean().default(true),
    telemetry: z.boolean().default(true),
  }).optional(),
});

export type BusterYml = z.infer<typeof BusterYmlSchema>;

// CLI global configuration schema
export const CLIConfigSchema = z.object({
  version: z.string(),
  defaultEnvironment: z.enum(['local', 'cloud']).default('cloud'),
  telemetry: z.boolean().default(true),
  autoUpdate: z.boolean().default(true),
});

export type CLIConfig = z.infer<typeof CLIConfigSchema>;