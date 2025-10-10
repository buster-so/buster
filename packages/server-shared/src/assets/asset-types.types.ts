import type { AssetType } from '@buster/database/schema-types';
import { AssetTypeSchema } from '@buster/database/schema-types';
import type { z } from 'zod';

export const BaseAssetTypeSchema = AssetTypeSchema.exclude(['chat', 'collection']);

export type BaseAssetType = z.infer<typeof BaseAssetTypeSchema>;

export { AssetTypeSchema };

export type { AssetType };
