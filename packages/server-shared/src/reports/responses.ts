import type { z } from 'zod';
import { PaginatedResponseSchema } from '../type-utilities/pagination';
import { ReportIndividualResponseSchema, ReportListItemSchema } from './reports.types';

export const GetReportsListResponseSchema = PaginatedResponseSchema(ReportListItemSchema);
export const UpdateReportResponseSchema = ReportIndividualResponseSchema;
export const ShareUpdateResponseSchema = ReportIndividualResponseSchema;

export type GetReportsListResponse = z.infer<typeof GetReportsListResponseSchema>;
export type UpdateReportResponse = z.infer<typeof UpdateReportResponseSchema>;
export type GetReportIndividualResponse = z.infer<typeof ReportIndividualResponseSchema>;
export type ShareUpdateResponse = z.infer<typeof ShareUpdateResponseSchema>;
