import { z } from 'zod';
import { PaginatedResponseSchema } from '../type-utilities/pagination';
import { ReportListItemSchema, ReportResponseSchema } from './reports.types';

export const GetReportsListResponseSchema = PaginatedResponseSchema(ReportListItemSchema);
export const UpdateReportResponseSchema = ReportResponseSchema;
export const ShareUpdateResponseSchema = ReportResponseSchema;

// For GET sharing endpoint - matches AssetPermissionWithUser from database
export const ShareGetResponseSchema = z.object({
  permissions: z.array(
    z.object({
      permission: z.object({
        identityId: z.string(),
        identityType: z.string(),
        assetId: z.string(),
        assetType: z.string(),
        role: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
        createdBy: z.string(),
        updatedBy: z.string(),
        deletedAt: z.string().nullable(),
      }),
      user: z
        .object({
          id: z.string(),
          email: z.string(),
          name: z.string().nullable(),
          avatarUrl: z.string().nullable(),
        })
        .nullable(),
    })
  ),
});

export type GetReportsListResponse = z.infer<typeof GetReportsListResponseSchema>;
export type UpdateReportResponse = z.infer<typeof UpdateReportResponseSchema>;
export type GetReportResponse = z.infer<typeof ReportResponseSchema>;
export type ShareUpdateResponse = z.infer<typeof ShareUpdateResponseSchema>;
export type ShareGetResponse = z.infer<typeof ShareGetResponseSchema>;
