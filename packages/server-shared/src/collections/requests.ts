import { z } from 'zod';
import { ShareAssetTypeSchema } from '../share';
import { PaginatedRequestSchema } from '../type-utilities';

export const GetCollectionsRequestQuerySchema = z
  .object({
    shared_with_me: z.boolean().optional(),
    owned_by_me: z.boolean().optional(),
  })
  .merge(PaginatedRequestSchema);

export type GetCollectionsRequestQuery = z.infer<typeof GetCollectionsRequestQuerySchema>;

export const GetIndividualCollectionRequestParamsSchema = z.object({
  id: z.string(),
  password: z.string().optional(),
});

export type GetIndividualCollectionRequestParams = z.infer<
  typeof GetIndividualCollectionRequestParamsSchema
>;

export const CreateCollectionRequestBodySchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type CreateCollectionRequestBody = z.infer<typeof CreateCollectionRequestBodySchema>;

export const UpdateCollectionRequestBodySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  assets: z
    .array(
      z.object({
        type: ShareAssetTypeSchema,
        id: z.string(),
      })
    )
    .optional(),
  share_with: z.array(z.string()).optional(),
  share_type: z.string().optional(),
});
export type UpdateCollectionRequestBody = z.infer<typeof UpdateCollectionRequestBodySchema>;

export const DeleteCollectionRequestBodySchema = z.object({
  ids: z.array(z.string()),
});
export type DeleteCollectionRequestBody = z.infer<typeof DeleteCollectionRequestBodySchema>;

export const ShareCollectionRequestBodySchema = z.object({
  share_with: z.array(z.string()),
  share_type: z.string(),
});
export type ShareCollectionRequestBody = z.infer<typeof ShareCollectionRequestBodySchema>;

export const AddAssetToCollectionRequestBodySchema = z.object({
  assets: z.array(
    z.object({
      type: ShareAssetTypeSchema,
      id: z.string(),
    })
  ),
});
export type AddAssetToCollectionRequestBody = z.infer<typeof AddAssetToCollectionRequestBodySchema>;
