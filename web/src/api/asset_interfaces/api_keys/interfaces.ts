import { z } from 'zod/v4-mini';

export const BusterApiKeyListItemSchema = z.object({
  id: z.string(),
  owner_id: z.string('Owner ID is required'),
  owner_email: z.string('Owner email is required'),
  created_at: z.string('Created at is required')
});

export type BusterApiKeyListItem = z.infer<typeof BusterApiKeyListItemSchema>;

// API Response schemas
export const GetApiKeysResponseSchema = z.object({
  api_keys: z.array(BusterApiKeyListItemSchema)
});

export type GetApiKeysResponse = z.infer<typeof GetApiKeysResponseSchema>;

export const CreateApiKeyResponseSchema = z.object({
  api_key: z.string('API Key is required')
});
