import z from 'zod';
import { AssetTypeSchema } from './asset';
import {
  InfinitePaginationSchema,
  type PaginatedResponse,
  PaginationInputSchema,
} from './pagination';

export const LibraryAssetIdentifierSchema = z.object({
  assetId: z.string().uuid(),
  assetType: AssetTypeSchema,
});
export type LibraryAssetIdentifier = z.infer<typeof LibraryAssetIdentifierSchema>;

export const BulkUpdateLibraryFieldInputSchema = z.array(LibraryAssetIdentifierSchema);
export type BulkUpdateLibraryFieldInput = z.infer<typeof BulkUpdateLibraryFieldInputSchema>;

export const BulkUpdateLibraryFieldResponseSchema = z.object({
  success: z.boolean(),
  successItems: z.array(LibraryAssetIdentifierSchema),
  failedItems: z.array(
    LibraryAssetIdentifierSchema.extend({
      error: z.string(),
    })
  ),
});

export type BulkUpdateLibraryFieldResponse = z.infer<typeof BulkUpdateLibraryFieldResponseSchema>;

export const LibraryAssetListItemSchema = z.object({
  asset_id: z.string().uuid(),
  asset_type: AssetTypeSchema,
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid(),
  created_by_name: z.string().nullable(),
  created_by_email: z.string(),
  created_by_avatar_url: z.string().nullable(),
  screenshot_url: z.string().nullable(),
});

export type LibraryAssetListItem = z.infer<typeof LibraryAssetListItemSchema>;

export const ListPermissionedLibraryAssetsInputSchema = z
  .object({
    organizationId: z.string().uuid(),
    userId: z.string().uuid(),
    assetTypes: AssetTypeSchema.array().min(1).optional(),
    createdById: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    includeCreatedBy: z.string().uuid().array().optional(),
    excludeCreatedBy: z.string().uuid().array().optional(),
    ordering: z.enum(['updated_at', 'created_at', 'none']).optional(),
    orderingDirection: z.enum(['asc', 'desc']).optional(),
    groupBy: z.enum(['asset_type', 'owner', 'created_at', 'updated_at', 'none']).optional(),
    query: z.string().optional(),
    includeAssetChildren: z.boolean().optional(),
  })
  .merge(PaginationInputSchema);

export type ListPermissionedLibraryAssetsInput = z.infer<
  typeof ListPermissionedLibraryAssetsInputSchema
>;

export const GroupedLibraryAssetsResponseSchema = z.object({
  groups: z.record(z.string(), LibraryAssetListItemSchema.array()),
  pagination: InfinitePaginationSchema,
});

export type GroupedLibraryAssets = z.infer<typeof GroupedLibraryAssetsResponseSchema>['groups'];

export type GroupedLibraryAssetsResponse = z.infer<typeof GroupedLibraryAssetsResponseSchema>;

export type ListPermissionedLibraryAssetsResponse =
  | PaginatedResponse<LibraryAssetListItem>
  | GroupedLibraryAssetsResponse;
