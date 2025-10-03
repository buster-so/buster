import {
  type BulkUpdateLibraryFieldResponse,
  BulkUpdateLibraryFieldResponseSchema,
  type ListPermissionedLibraryAssetsResponse,
} from '@buster/database/schema-types';

export type LibraryGetResponse = ListPermissionedLibraryAssetsResponse;

export const LibraryPostResponseSchema = BulkUpdateLibraryFieldResponseSchema;

export type LibraryPostResponse = BulkUpdateLibraryFieldResponse;

export const LibraryDeleteResponseSchema = BulkUpdateLibraryFieldResponseSchema;

export type LibraryDeleteResponse = BulkUpdateLibraryFieldResponse;
