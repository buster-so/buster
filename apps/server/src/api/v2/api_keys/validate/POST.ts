import { isApiKeyValid } from '@buster/database/queries';
import type { ValidateApiKeyRequest, ValidateApiKeyResponse } from '@buster/server-shared/api';

/**
 * Handler for POST /api/v2/api_keys/validate - Validate an API key (no auth required)
 */
export async function validateApiKeyHandler(
  request: ValidateApiKeyRequest
): Promise<ValidateApiKeyResponse> {
  return await isApiKeyValid(request.api_key);
}
