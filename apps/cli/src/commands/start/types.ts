import { z } from 'zod';

// Command arguments schema
export const StartArgsSchema = z.object({
  detached: z.boolean().default(false),
  telemetry: z.boolean().default(true),
});

export type StartArgs = z.infer<typeof StartArgsSchema>;

// Service status schema
export const ServiceStatusSchema = z.object({
  name: z.string(),
  status: z.enum(['starting', 'running', 'stopped', 'error']),
  port: z.number().optional(),
  message: z.string().optional(),
});

export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;