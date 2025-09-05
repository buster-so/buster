import { z } from 'zod';

/**
 * Request schema for validating an API key
 */
export const validateApiKeyRequestSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

export type ValidateApiKeyRequest = z.infer<typeof validateApiKeyRequestSchema>;
