import type { ValidateApiKeyRequest, ValidateApiKeyResponse } from '@buster/server-shared';
import type { SDKConfig } from '../config';
import { post } from '../http';

/**
 * Validates an API key by calling the server endpoint
 * @param config - SDK configuration
 * @param apiKey - The API key to validate (optional, uses config.apiKey if not provided)
 * @returns Promise<ValidateApiKeyResponse> - Validation result with details
 */
export async function validateApiKey(
  config: SDKConfig,
  apiKey?: string
): Promise<ValidateApiKeyResponse> {
  const request: ValidateApiKeyRequest = {
    apiKey: apiKey || config.apiKey,
  };

  // The HTTP client will automatically add /api/v2 prefix
  console.info(`Validating API key with host: ${config.apiUrl}`);

  return post<ValidateApiKeyResponse>(config, '/auth/validate-api-key', request);
}

/**
 * Simple validation check that returns just a boolean
 * @param config - SDK configuration
 * @param apiKey - The API key to validate (optional, uses config.apiKey if not provided)
 * @returns Promise<boolean> - true if valid, false otherwise
 */
export async function isApiKeyValid(config: SDKConfig, apiKey?: string): Promise<boolean> {
  try {
    const response = await validateApiKey(config, apiKey);
    return response.valid;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}
