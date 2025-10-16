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

export const PostDashboardRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  config: DashboardConfigSchema.optional(),
});

// DELETE Dashboard request schema - accepts either single ID or array of IDs
export const DeleteDashboardParamsSchema = z.object({
  id: z.string().uuid('Dashboard ID must be a valid UUID'),
});

export const DeleteDashboardsRequestSchema = z.object({
  ids: z
    .array(z.string().uuid('Dashboard ID must be a valid UUID'))
    .min(1, 'At least one dashboard ID is required'),
});

// Export inferred types
export type GetDashboardParams = z.infer<typeof GetDashboardParamsSchema>;
export type GetDashboardQuery = z.infer<typeof GetDashboardQuerySchema>;
export type UpdateDashboardParams = z.infer<typeof UpdateDashboardParamsSchema>;
export type UpdateDashboardRequest = z.infer<typeof UpdateDashboardRequestSchema>;
export type PostDashboardRequest = z.infer<typeof PostDashboardRequestSchema>;
export type DeleteDashboardParams = z.infer<typeof DeleteDashboardParamsSchema>;
export type DeleteDashboardsRequest = z.infer<typeof DeleteDashboardsRequestSchema>;
