import { DashboardConfigSchema } from '@buster/database/schema-types';
import { z } from 'zod';
import { VerificationStatusSchema } from '../share';

// Dashboard Schema
export const DashboardSchema = z.object({
  config: DashboardConfigSchema,
  created_at: z.string(),
  created_by: z.string(),
  deleted_at: z.string().nullable(),
  description: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  updated_at: z.string().nullable(),
  updated_by: z.string(),
  status: VerificationStatusSchema,
  version_number: z.number(),
  file: z.string(), // yaml file
  file_name: z.string(),
});

export type { DashboardConfig, DashboardYml } from '@buster/database/schema-types';
// Export inferred types
export { DashboardConfigSchema, DashboardYmlSchema } from '@buster/database/schema-types';
export type Dashboard = z.infer<typeof DashboardSchema>;
