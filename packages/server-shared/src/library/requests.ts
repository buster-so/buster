import {
  type BulkUpdateLibraryFieldInput,
  BulkUpdateLibraryFieldInputSchema,
  LibraryAssetTypeSchema,
} from '@buster/database/schema-types';
import { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities';

export const GetLibraryAssetsRequestQuerySchema = z
  .object({
    assetTypes: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          return [val];
        }
        return val;
      }, LibraryAssetTypeSchema.array().min(1))
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
    ordering: z.enum(['last_opened', 'created_at', 'none']).optional(),
    groupBy: z.enum(['asset_type', 'owner', 'created_at', 'updated_at', 'none']).optional(),
    query: z.string().optional(),
    orderingDirection: z.enum(['asc', 'desc']).optional(),
  })
  .merge(PaginatedRequestSchema);

export type GetLibraryAssetsRequestQuery = z.infer<typeof GetLibraryAssetsRequestQuerySchema>;

export const LibraryPostRequestBodySchema = BulkUpdateLibraryFieldInputSchema;

export type LibraryPostRequestBody = BulkUpdateLibraryFieldInput;

export const LibraryDeleteRequestBodySchema = BulkUpdateLibraryFieldInputSchema;

export type LibraryDeleteRequestBody = BulkUpdateLibraryFieldInput;
