import { z } from 'zod';
import { PaginatedResponseSchema } from '../type-utilities/pagination';
import { ReportIndividualResponseSchema, ReportListItemSchema } from './reports.types';

export const GetReportsListResponseSchema = PaginatedResponseSchema(ReportListItemSchema);
export const UpdateReportResponseSchema = ReportIndividualResponseSchema;
export const ShareUpdateResponseSchema = ReportIndividualResponseSchema;

// Sharing operation response schemas
export const SharePostResponseSchema = z.object({
  success: z.boolean(),
  shared: z.array(z.string()),
  notFound: z.array(z.string()),
});

export const ShareDeleteResponseSchema = z.object({
  success: z.boolean(),
  removed: z.array(z.string()),
  notFound: z.array(z.string()),
});

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
export type GetReportResponse = z.infer<typeof ReportIndividualResponseSchema>;
export type ShareUpdateResponse = z.infer<typeof ShareUpdateResponseSchema>;
export type SharePostResponse = z.infer<typeof SharePostResponseSchema>;
export type ShareDeleteResponse = z.infer<typeof ShareDeleteResponseSchema>;
export type ShareGetResponse = z.infer<typeof ShareGetResponseSchema>;
