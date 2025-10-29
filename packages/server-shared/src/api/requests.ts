import { z } from 'zod';

// POST /api/v2/api_keys - Create API Key
export const CreateApiKeyRequestSchema = z.object({
  name: z.string().optional().describe('Optional name for the API key (currently unused)'),
});

export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;

// POST /api/v2/api_keys/validate - Validate API Key
export const ValidateApiKeyRequestSchema = z.object({
  api_key: z.string().describe('API key to validate'),
});

export type ValidateApiKeyRequest = z.infer<typeof ValidateApiKeyRequestSchema>;
