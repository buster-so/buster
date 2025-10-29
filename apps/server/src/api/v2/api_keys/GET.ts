import type { User } from '@buster/database/queries';
import { listApiKeys } from '@buster/database/queries';
import type { GetApiKeysResponse } from '@buster/server-shared/api';

/**
 * Handler for GET /api/v2/api_keys - List all API keys for the authenticated user
 */
export async function listApiKeysHandler(user: User): Promise<GetApiKeysResponse> {
  const apiKeys = await listApiKeys(user.id);

  return {
    api_keys: apiKeys,
  };
}
