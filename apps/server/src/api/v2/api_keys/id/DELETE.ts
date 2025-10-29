import type { User } from '@buster/database/queries';
import { deleteApiKey } from '@buster/database/queries';
import type { DeleteApiKeyResponse } from '@buster/server-shared/api';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for DELETE /api/v2/api_keys/:id - Delete an API key
 */
export async function deleteApiKeyHandler(
  apiKeyId: string,
  user: User
): Promise<DeleteApiKeyResponse> {
  const success = await deleteApiKey(apiKeyId, user.id);

  if (!success) {
    throw new HTTPException(404, { message: 'API key not found' });
  }

  return {
    success: true,
    message: 'API key deleted successfully',
  };
}
