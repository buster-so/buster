import { z } from 'zod';
import { ShareRoleSchema, VerificationStatusSchema, WorkspaceShareRoleSchema } from '../share';
import { ChartConfigPropsSchema } from './charts';

export const GetMetricRequestSchema = z.object({
  id: z.string(),
  password: z.string().optional(),
  version_number: z.number().optional(), //api will default to latest if not provided
});

export const GetMetricDataRequestSchema = GetMetricRequestSchema;

export const GetMetricListRequestSchema = z.object({
  /** The token representing the current page number for pagination */
  page_token: z.number().default(0),
  /** The number of items to return per page */
  page_size: z.number().optional().default(250),
  /** Filtering options for metrics based on verification status */
  status: z.array(VerificationStatusSchema).nullable().optional(),
});

export const UpdateMetricRequestSchema = z.object({
  /** The unique identifier of the metric to update */
  id: z.string(),
  /** New title for the metric */
  name: z.string().optional(),
  /** SQL query associated with the metric */
  sql: z.string().optional(),
  /** chart_config to update */
  chart_config: ChartConfigPropsSchema.optional(),
  /** file in yaml format to update */
  file: z.string().optional(),
  /** update the version number of the metric - default is true */
  update_version: z.boolean().optional(),
  /** restore the metric to a specific version */
  restore_to_version: z.number().optional(),
});

export const DeleteMetricRequestSchema = z.object({
  ids: z.array(z.string()),
});

export const DuplicateMetricRequestSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  share_with_same_people: z.boolean().default(false),
});

export const BulkUpdateMetricVerificationStatusRequestSchema = z.array(
  z.object({
    id: z.string(),
    status: VerificationStatusSchema,
  })
);

export const ShareUpdateRequestSchema = z.object({
  users: z
    .array(
      z.object({
        email: z.string(),
        role: ShareRoleSchema,
      })
    )
    .optional(),
  publicly_accessible: z.boolean().optional(),
  public_password: z.string().nullable().optional(),
  public_expiry_date: z.string().nullable().optional(),
  workspace_sharing: WorkspaceShareRoleSchema.nullable().optional(),
});

export type GetMetricDataRequest = z.infer<typeof GetMetricDataRequestSchema>;
export type GetMetricRequest = z.infer<typeof GetMetricRequestSchema>;
export type GetMetricListRequest = z.infer<typeof GetMetricListRequestSchema>;
export type UpdateMetricRequest = z.infer<typeof UpdateMetricRequestSchema>;
export type DeleteMetricRequest = z.infer<typeof DeleteMetricRequestSchema>;
export type DuplicateMetricRequest = z.infer<typeof DuplicateMetricRequestSchema>;
export type BulkUpdateMetricVerificationStatusRequest = z.infer<
  typeof BulkUpdateMetricVerificationStatusRequestSchema
>;
