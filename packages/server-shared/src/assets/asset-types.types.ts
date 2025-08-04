import { z } from 'zod';

export const AssetTypeSchema = z.enum(['metric', 'dashboard', 'collection', 'chat', 'report']);

export type AssetType = z.infer<typeof AssetTypeSchema>;
