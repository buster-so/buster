import { z } from 'zod';
import { MetricSchemaWithFilters } from '../metrics';
import { ShareConfigSchema, ShareRoleSchema } from '../share';
import { DashboardSchema } from './dashboard.types';

export const GetDashboardResponseSchema = z.object({
  metrics: z.record(z.string(), MetricSchemaWithFilters),
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

export type GetDashboardResponse = z.infer<typeof GetDashboardResponseSchema>;
