import { validateApiKey } from '@buster/database';
import type { ValidateApiKeyRequest, ValidateApiKeyResponse } from '@buster/server-shared';

/**
 * Handler for validating an API key
 * @param request - The validation request containing the API key
 * @returns Promise<ValidateApiKeyResponse> - Response with validation status and details
 */
export async function validateApiKeyHandler(
  request: ValidateApiKeyRequest
): Promise<ValidateApiKeyResponse> {
  try {
    // Validate the API key and get its details in one call
    const apiKeyData = await validateApiKey(request.apiKey);

    if (!apiKeyData) {
      return {
        valid: false,
      };
    }

    return {
      valid: true,
      organizationId: apiKeyData.organizationId,
      ownerId: apiKeyData.ownerId,
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    // Don't expose internal errors to the client
    return {
      valid: false,
    };
  }
}
