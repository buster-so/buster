import { DashboardConfigSchema } from '@buster/database/schema-types';
import { z } from 'zod';
import { VerificationStatusSchema } from '../share';

export const GetDashboardParamsSchema = z.object({
  id: z.string().uuid('Dashboard ID must be a valid UUID'),
});

export const GetDashboardQuerySchema = z.object({
  password: z.string().optional(),
  version_number: z.coerce.number().optional(),
});

// PUT Dashboard request schema
export const UpdateDashboardParamsSchema = z.object({
  id: z.string().uuid('Dashboard ID must be a valid UUID'),
});

export const UpdateDashboardRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  config: DashboardConfigSchema.optional(),
  file: z.string().optional(),
  update_version: z.boolean().optional(),
  restore_to_version: z.number().optional(),
});

// Export inferred types
export type GetDashboardParams = z.infer<typeof GetDashboardParamsSchema>;
export type GetDashboardQuery = z.infer<typeof GetDashboardQuerySchema>;
export type UpdateDashboardParams = z.infer<typeof UpdateDashboardParamsSchema>;
export type UpdateDashboardRequest = z.infer<typeof UpdateDashboardRequestSchema>;
