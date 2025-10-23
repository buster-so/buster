import {
  type BulkUpdateLibraryFieldResponse,
  BulkUpdateLibraryFieldResponseSchema,
  type LibraryAssetListItem,
  type ListPermissionedLibraryAssetsResponse,
} from '@buster/database/schema-types';

export type LibraryGetResponse = ListPermissionedLibraryAssetsResponse;

export type { LibraryAssetListItem };

export const LibraryPostResponseSchema = BulkUpdateLibraryFieldResponseSchema;

export type LibraryPostResponse = BulkUpdateLibraryFieldResponse;

export const LibraryDeleteResponseSchema = BulkUpdateLibraryFieldResponseSchema;

export type LibraryDeleteResponse = BulkUpdateLibraryFieldResponse;
