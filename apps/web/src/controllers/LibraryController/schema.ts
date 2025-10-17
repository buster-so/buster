import { AssetTypeSchema } from '@buster/server-shared/assets';
import { z } from 'zod';

export const layoutSchema = z.enum(['grid', 'list']).default('grid');
export const wrappedLayoutSchema = z
  .string()
  .transform((val) => {
    if (!val) return 'grid';
    const parsedFromCookie = JSON.parse(val) as { value: LibraryLayout };
    return layoutSchema.catch('grid').parse(parsedFromCookie.value);
  })
  .default('grid');
export type LibraryLayout = z.infer<typeof layoutSchema>;

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  ordering: z.enum(['last_opened', 'created_at', 'none']).optional(),
  ordering_direction: z.enum(['asc', 'desc']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  owner_ids: z.array(z.string().uuid()).optional(),
  asset_types: z.array(AssetTypeSchema).optional(),
  layout: layoutSchema.optional(),
  group_by: z.enum(['asset_type', 'owner', 'created_at', 'none']).default('none').optional(),
  filter: z.enum(['all', 'owned_by_me', 'shared_with_me']).default('all').optional(),
});

export type LibrarySearchParams = z.infer<typeof searchParamsSchema>;
