import z from 'zod';
import { AssetTypeSchema } from './asset';

export const TextSearchResultSchema = z.object({
  assetId: z.string().uuid(),
  assetType: AssetTypeSchema,
  title: z.string(),
  additionalText: z.string().nullable(),
  updatedAt: z.string().datetime(),
  screenshotBucketKey: z.string().nullable(),
  createdBy: z.string().uuid(),
  createdByName: z.string(),
  createdByAvatarUrl: z.string().nullable(),
  addedToLibrary: z.boolean().default(false).optional(),
  //this will only show up IF collectionId is passed in the request query.
  inCollection: z.boolean().optional(),
});
