import {
  AssetTypeSchema,
  type BulkUpdateLibraryFieldInput,
  BulkUpdateLibraryFieldInputSchema,
} from '@buster/database/schema-types';
import { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities';

export const GetAssetsRequestQuerySchema = z
  .object({
    assetTypes: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          return [val];
        }
        return val;
      }, AssetTypeSchema.array().min(1))
      .optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    includeCreatedBy: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          return [val];
        }
        return val;
      }, z.string().uuid().array())
      .optional(),
    excludeCreatedBy: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          return [val];
        }
        return val;
      }, z.string().uuid().array())
      .optional(),
    ordering: z.enum(['updated_at', 'created_at', 'none']).optional(),
    groupBy: z.enum(['asset_type', 'owner', 'created_at', 'updated_at', 'none']).optional(),
    query: z.string().optional(),
    orderingDirection: z.enum(['asc', 'desc']).optional(),
    includeAssetChildren: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          return val.toLowerCase() === 'true';
        }
        return Boolean(val);
      }, z.boolean())
      .default(false)
      .optional(),
    pinCollections: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          return val.toLowerCase() === 'true';
        }
        return Boolean(val);
      }, z.boolean())
      .optional(),
  })
  .merge(PaginatedRequestSchema)
  .refine(
    (data) => {
      if (data.pinCollections === true) {
        return data.groupBy === 'none' || data.groupBy === undefined;
      }
      return true;
    },
    {
      message: 'Cannot set pinCollections to true if groupBy is already set',
      path: ['pinCollections'],
    }
  );

export type GetAssetsRequestQuery = z.infer<typeof GetAssetsRequestQuerySchema>;

// Keep the old names for backward compatibility
export const GetLibraryAssetsRequestQuerySchema = GetAssetsRequestQuerySchema;
export type GetLibraryAssetsRequestQuery = GetAssetsRequestQuery;

export const LibraryPostRequestBodySchema = BulkUpdateLibraryFieldInputSchema;

export type LibraryPostRequestBody = BulkUpdateLibraryFieldInput;

export const LibraryDeleteRequestBodySchema = BulkUpdateLibraryFieldInputSchema;

export type LibraryDeleteRequestBody = BulkUpdateLibraryFieldInput;
