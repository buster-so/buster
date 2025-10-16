import z from 'zod';
import { VerificationSchema } from './verification';

// Dashboard Config Schema
export const DashboardConfigSchema = z.object({
  rows: z
    .array(
      z.object({
        columnSizes: z
          .array(z.number().min(1).max(12))
          .refine((arr) => arr.reduce((sum, n) => sum + n, 0) === 12, {
            message: 'columnSizes must add up to 12',
          })
          .optional(), // columns sizes 1 - 12. MUST add up to 12
        rowHeight: z.number().optional(), // pixel based!
        id: z.union([z.string(), z.number()]).transform((val) => String(val)),
        items: z.array(
          z.object({
            id: z.string(),
          })
        ),
      })
    )
    .optional(),
});

export const DashboardYmlSchema = z
  .object({
    name: z.string(),
    description: z.string(),
  })
  .merge(DashboardConfigSchema);

export const DashboardVersionHistorySchema = z.record(
  z.string(),
  z.object({
    version_number: z.number(),
    updated_at: z.string(),
    content: DashboardYmlSchema,
  })
);

export const DashboardListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  last_edited: z.string(),
  owner: z.object({
    id: z.string(),
    name: z.string(),
    avatar_url: z.string().nullable(),
  }),
  status: VerificationSchema,
  is_shared: z.boolean(),
});

export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type DashboardYml = z.infer<typeof DashboardYmlSchema>;
export type DashboardVersionHistory = z.infer<typeof DashboardVersionHistorySchema>;
export type DashboardListItem = z.infer<typeof DashboardListItemSchema>;
