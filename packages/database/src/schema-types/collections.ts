import z from 'zod';

export const CollectionListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  updated_at: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  created_by_name: z.string().nullable(),
  created_by_email: z.string(),
  created_by_avatar_url: z.string().nullable(),
  is_shared: z.boolean(),
});

export type CollectionListItem = z.infer<typeof CollectionListItemSchema>;

