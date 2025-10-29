import { getDb } from '../../connection';
import { apiKeys } from '../../schema';

export interface CreateApiKeyParams {
  ownerId: string;
  key: string;
  organizationId: string;
}

/**
 * Creates a new API key in the database
 * @param params The API key parameters
 * @returns The created API key's ID
 */
export async function createApiKey(params: CreateApiKeyParams): Promise<string> {
  const db = getDb();

  const [result] = await db
    .insert(apiKeys)
    .values({
      ownerId: params.ownerId,
      key: params.key,
      organizationId: params.organizationId,
    })
    .returning({ id: apiKeys.id });

  if (!result) {
    throw new Error('Failed to create API key');
  }

  return result.id;
}
