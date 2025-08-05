import type { ReportElements } from '@buster/database';
import { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities/pagination';

export const GetReportsListRequestSchema = PaginatedRequestSchema;

// Define UpdateReportRequestSchema with explicit type annotation
export const UpdateReportRequestSchema = z
  .object({
    name: z.string().optional(),
    update_version: z.boolean().optional(),
    content: z.any().optional() as z.ZodOptional<z.ZodType<ReportElements>>, //we use any here because we don't know the type of the content, will be validated in the database
  })
  .partial();

export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
export type GetReportsListRequest = z.infer<typeof GetReportsListRequestSchema>;
