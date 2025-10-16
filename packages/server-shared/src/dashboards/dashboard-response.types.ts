import { DashboardListItemSchema } from '@buster/database/schema-types';
import { z } from 'zod';
import { MetricSchema } from '../metrics';
import { ShareConfigSchema } from '../share';
import { PaginatedResponseSchema } from '../type-utilities/pagination';
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

// GET Dashboards list response schema
export const GetDashboardsResponseSchema = PaginatedResponseSchema(DashboardListItemSchema);

// DELETE Dashboard response schema (single)
export const DeleteDashboardResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// DELETE Dashboards response schema (bulk)
export const DeleteDashboardsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  deleted_count: z.number(),
  failed_ids: z.array(z.string()).optional(),
});

export type GetDashboardResponse = z.infer<typeof GetDashboardResponseSchema>;
export type GetDashboardsResponse = z.infer<typeof GetDashboardsResponseSchema>;
export type PostDashboardResponse = z.infer<typeof PostDashboardResponseSchema>;
export type UpdateDashboardResponse = z.infer<typeof UpdateDashboardResponseSchema>;
export type DeleteDashboardResponse = z.infer<typeof DeleteDashboardResponseSchema>;
export type DeleteDashboardsResponse = z.infer<typeof DeleteDashboardsResponseSchema>;
