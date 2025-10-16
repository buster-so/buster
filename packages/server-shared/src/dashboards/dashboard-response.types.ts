import { z } from 'zod';
import { MetricSchema } from '../metrics';
import { ShareConfigSchema, ShareRoleSchema } from '../share';
import { DashboardSchema } from './dashboard.types';

export const GetDashboardResponseSchema = z.object({
  metrics: z.record(z.string(), MetricSchema),
  dashboard: DashboardSchema,
  collections: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  versions: z.array(
    z.object({
      version_number: z.number(),
      updated_at: z.string(),
    })
  ),
  ...ShareConfigSchema.shape,
});

// PUT Dashboard response schema - reuses the same structure as GET
export const UpdateDashboardResponseSchema = GetDashboardResponseSchema;
export const PostDashboardResponseSchema = GetDashboardResponseSchema;

export type GetDashboardResponse = z.infer<typeof GetDashboardResponseSchema>;
export type PostDashboardResponse = z.infer<typeof PostDashboardResponseSchema>;
export type UpdateDashboardResponse = z.infer<typeof UpdateDashboardResponseSchema>;
