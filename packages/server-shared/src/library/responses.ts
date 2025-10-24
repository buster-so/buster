import {
  type AssetListItem,
  type BulkUpdateLibraryFieldResponse,
  BulkUpdateLibraryFieldResponseSchema,
  type LibraryAssetListItem,
  type ListPermissionedAssetsResponse,
  type ListPermissionedLibraryAssetsResponse,
} from '@buster/database/schema-types';

export type AssetGetResponse = ListPermissionedAssetsResponse;

// Keep the old names for backward compatibility
export type LibraryGetResponse = ListPermissionedLibraryAssetsResponse;

export type { AssetListItem, LibraryAssetListItem };

export const LibraryPostResponseSchema = BulkUpdateLibraryFieldResponseSchema;

export type LibraryPostResponse = BulkUpdateLibraryFieldResponse;

export const LibraryDeleteResponseSchema = BulkUpdateLibraryFieldResponseSchema;

export type LibraryDeleteResponse = BulkUpdateLibraryFieldResponse;
