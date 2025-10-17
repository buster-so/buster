import { AssetTypeSchema } from '@buster/server-shared/assets';
import { z } from 'zod';

export const layoutSchema = z.enum(['grid', 'list']).default('grid');
export type LibraryLayout = z.infer<typeof layoutSchema>;

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  ordering: z.enum(['last_opened', 'created_at']).optional(),
  ordering_direction: z.enum(['asc', 'desc']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  owner_id: z.string().uuid().optional(),
  asset_type: z.array(AssetTypeSchema).optional(),
});
