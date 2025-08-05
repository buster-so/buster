import { z } from 'zod';

// Command arguments schema
export const ConfigArgsSchema = z.object({
  set: z.string().optional(),
  get: z.string().optional(),
  list: z.boolean().default(false),
  reset: z.boolean().default(false),
});

export type ConfigArgs = z.infer<typeof ConfigArgsSchema>;

// Configuration key-value schema
export const ConfigKeyValueSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type ConfigKeyValue = z.infer<typeof ConfigKeyValueSchema>;