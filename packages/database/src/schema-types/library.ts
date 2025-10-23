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

export const AssetListItemSchema = z.object({
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

export type AssetListItem = z.infer<typeof AssetListItemSchema>;

// Keep the old names for backward compatibility
export const LibraryAssetListItemSchema = AssetListItemSchema;
export type LibraryAssetListItem = AssetListItem;

export const ListPermissionedAssetsInputSchema = z
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

export type ListPermissionedAssetsInput = z.infer<typeof ListPermissionedAssetsInputSchema>;

// Keep the old names for backward compatibility
export const ListPermissionedLibraryAssetsInputSchema = ListPermissionedAssetsInputSchema;
export type ListPermissionedLibraryAssetsInput = ListPermissionedAssetsInput;

export const GroupedAssetsResponseSchema = z.object({
  groups: z.record(z.string(), AssetListItemSchema.array()),
  pagination: InfinitePaginationSchema,
});

// Keep the old name for backward compatibility
export const GroupedLibraryAssetsResponseSchema = GroupedAssetsResponseSchema;

export type GroupedAssets = z.infer<typeof GroupedAssetsResponseSchema>['groups'];
export type GroupedAssetsResponse = z.infer<typeof GroupedAssetsResponseSchema>;

export type ListPermissionedAssetsResponse =
  | PaginatedResponse<AssetListItem>
  | GroupedAssetsResponse;

// Keep the old names for backward compatibility
export type GroupedLibraryAssets = GroupedAssets;
export type GroupedLibraryAssetsResponse = GroupedAssetsResponse;
export type ListPermissionedLibraryAssetsResponse = ListPermissionedAssetsResponse;
