import { z } from 'zod';

export const DeployArgsSchema = z.object({
  dryRun: z.boolean().default(false),
  path: z.string().default('./buster'),
});

export type DeployArgs = z.infer<typeof DeployArgsSchema>;

export const DeploymentResultSchema = z.object({
  success: z.boolean(),
  modelsDeployed: z.number(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

export type DeploymentResult = z.infer<typeof DeploymentResultSchema>;