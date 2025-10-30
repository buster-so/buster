import { z } from 'zod';

// GET /api/v2/api_keys - List API Keys
export const BusterApiKeyListItemSchema = z.object({
  id: z.string().describe('API key ID'),
  owner_id: z.string().describe('Owner user ID'),
  owner_email: z.string().describe('Owner email address'),
  created_at: z.string().describe('Creation timestamp'),
});

export type BusterApiKeyListItem = z.infer<typeof BusterApiKeyListItemSchema>;

export const GetApiKeysResponseSchema = z.object({
  api_keys: z.array(BusterApiKeyListItemSchema).describe('List of API keys'),
});

export type GetApiKeysResponse = z.infer<typeof GetApiKeysResponseSchema>;

// GET /api/v2/api_keys/:id - Get Single API Key
export const GetApiKeyResponseSchema = BusterApiKeyListItemSchema;

export type GetApiKeyResponse = z.infer<typeof GetApiKeyResponseSchema>;

// POST /api/v2/api_keys - Create API Key
export const CreateApiKeyResponseSchema = z.object({
  api_key: z.string().describe('Generated API key JWT token'),
});

export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;

// DELETE /api/v2/api_keys/:id - Delete API Key
export const DeleteApiKeyResponseSchema = z.object({
  success: z.boolean().describe('Whether the deletion was successful'),
  message: z.string().describe('Success message'),
});

export type DeleteApiKeyResponse = z.infer<typeof DeleteApiKeyResponseSchema>;

// POST /api/v2/api_keys/validate - Validate API Key
export const ValidateApiKeyResponseSchema = z.boolean().describe('Whether the API key is valid');

export type ValidateApiKeyResponse = z.infer<typeof ValidateApiKeyResponseSchema>;
