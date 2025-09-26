import z from 'zod';
import { AssetTypeSchema } from './asset';

export const TextSearchResultSchema = z.object({
  assetId: z.string().uuid(),
  assetType: AssetTypeSchema,
  title: z.string(),
  additionalText: z.string().nullable(),
  updatedAt: z.string().datetime(),
});
