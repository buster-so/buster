import { z } from 'zod';

/**
 * Response schema for API key validation
 */
export const validateApiKeyResponseSchema = z.object({
  valid: z.boolean(),
  organizationId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
});

export type ValidateApiKeyResponse = z.infer<typeof validateApiKeyResponseSchema>;
