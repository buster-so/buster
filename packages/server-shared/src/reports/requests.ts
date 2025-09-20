import { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities/pagination';

export const GetReportParamsSchema = z.object({
  id: z.string().uuid('Report ID must be a valid UUID'),
});

export const GetReportQuerySchema = z.object({
  password: z.string().min(1).optional(),
  version_number: z.coerce.number().int().min(1).optional(),
});

export const GetReportsListRequestSchema = PaginatedRequestSchema.extend({
  shared_with_me: z.coerce.boolean().optional(),
  only_my_reports: z.coerce.boolean().optional(),
});

// Define UpdateReportRequestSchema with explicit type annotation
export const UpdateReportRequestSchema = z
  .object({
    name: z.string().optional(),
    update_version: z.boolean().optional(),
    restore_to_version: z.number().optional(),
    content: z.string().optional(), //content will be validated as string in the database
  })
  .partial();

export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
export type GetReportsListRequest = z.infer<typeof GetReportsListRequestSchema>;
export type GetReportParams = z.infer<typeof GetReportParamsSchema>;
export type GetReportQuery = z.infer<typeof GetReportQuerySchema>;
