import { AssetTypeSchema } from '@buster/server-shared/assets';
import { z } from 'zod';

export const layoutSchema = z.enum(['grid', 'list']).default('grid');
export const wrappedLayoutSchema = z
  .string()
  .transform((val) => {
    if (!val) return 'grid';
    try {
      const stringValue = layoutSchema.safeParse(val);
      if (stringValue.success) {
        return stringValue.data;
      }
      const parsedFromCookie = JSON.parse(val) as { value: LibraryLayout };
      return layoutSchema.catch('grid').parse(parsedFromCookie.value);
    } catch (error) {
      return 'grid';
    }
  })
  .default('grid');
export type LibraryLayout = z.infer<typeof layoutSchema>;
export type SharedWithMeLayout = LibraryLayout;

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  ordering: z.enum(['updated_at', 'created_at', 'none']).optional(),
  ordering_direction: z.enum(['asc', 'desc']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  owner_ids: z.array(z.string().uuid()).optional(),
  asset_types: z.array(AssetTypeSchema).optional(),
  layout: layoutSchema.optional(),
  group_by: z
    .enum(['asset_type', 'owner', 'created_at', 'updated_at', 'none'])
    .default('none')
    .catch('none')
    .optional(),
  filter: z.enum(['all', 'owned_by_me', 'shared_with_me']).default('all').catch('all').optional(),
});

//omit the filter field
export const sharedWithMeSearchParamsSchema = searchParamsSchema.omit({ filter: true }).extend({
  filter: z.enum(['all', 'collections', 'assets']).default('all').catch('all').optional(),
});

export type LibrarySearchParams = z.infer<typeof searchParamsSchema>;
export type SharedWithMeSearchParams = z.infer<typeof sharedWithMeSearchParamsSchema>;
