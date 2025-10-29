import { z } from 'zod';
import { AssetTypeSchema } from './asset';

export const ChatUpdatedByTypeSchema = z
  .enum(['user', 'agent'])
  .describe('Type of entity that updated the chat');

export type ChatUpdatedByType = z.infer<typeof ChatUpdatedByTypeSchema>;

export const ChatListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  updated_at: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  created_by_id: z.string(),
  created_by_name: z.string(),
  created_by_avatar: z.string().nullable(),
  last_edited: z.string(),
  latest_file_id: z.string().nullable(),
  latest_file_type: AssetTypeSchema.exclude(['chat', 'collection']),
  latest_version_number: z.number().optional(),
  is_shared: z.boolean(),
});

export type ChatListItem = z.infer<typeof ChatListItemSchema>;
