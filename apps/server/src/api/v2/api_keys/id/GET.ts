import type { User } from '@buster/database/queries';
import { getApiKey } from '@buster/database/queries';
import type { GetApiKeyResponse } from '@buster/server-shared/api';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for GET /api/v2/api_keys/:id - Get a single API key
 */
export async function getApiKeyHandler(apiKeyId: string, user: User): Promise<GetApiKeyResponse> {
  const apiKey = await getApiKey(apiKeyId, user.id);

  if (!apiKey) {
    throw new HTTPException(404, { message: 'API key not found' });
  }

  return apiKey;
}
