import { z } from 'zod';
import {
  ShareAssetTypeSchema,
  ShareConfigSchema,
  ShareRoleSchema,
} from '../share/share-interfaces.types';
import { SearchPaginatedResponseSchema } from '../type-utilities';

export const BusterCollectionListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  updated_at: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  created_by_name: z.string().nullable(),
  created_by_email: z.string(),
  created_by_avatar_url: z.string().nullable(),
  is_shared: z.boolean(),
});

export type BusterCollectionListItem = z.infer<typeof BusterCollectionListItemSchema>;

export const GetCollectionsResponseSchema = SearchPaginatedResponseSchema(
  BusterCollectionListItemSchema
);
export type GetCollectionsResponse = z.infer<typeof GetCollectionsResponseSchema>;

export const BusterCollectionItemAssetSchema = z.object({
  asset_type: ShareAssetTypeSchema,
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  name: z.string(),
  created_by: z.object({
    email: z.string(),
    name: z.string(),
    avatar_url: z.string().nullable(),
  }),
  screenshot_url: z.string().nullable(),
});

export const BusterCollectionSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    created_at: z.string(),
    assets: z.array(BusterCollectionItemAssetSchema).nullable(),
    created_by: z.string(),
    deleted_at: z.string().nullable(),
    permission: ShareRoleSchema,
    updated_at: z.string(),
    updated_by: z.string(),
  })
  .merge(ShareConfigSchema);

export type BusterCollection = z.infer<typeof BusterCollectionSchema>;
export type BusterCollectionItemAsset = z.infer<typeof BusterCollectionItemAssetSchema>;

export const DeleteCollectionsResponseSchema = z.object({
  success_ids: z.array(z.string()),
  failure_ids: z.array(z.string()),
});

export type DeleteCollectionsResponse = z.infer<typeof DeleteCollectionsResponseSchema>;
