import { z } from 'zod';

export const AssetCollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export type AssetCollection = z.infer<typeof AssetCollectionSchema>;

export const AssetCollectionsSchema = z.array(AssetCollectionSchema);

export type AssetCollections = z.infer<typeof AssetCollectionsSchema>;
