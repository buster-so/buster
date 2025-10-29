import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '../../connection';
import { apiKeys, users } from '../../schema';

export interface ApiKeyInfo {
  id: string;
  owner_id: string;
  owner_email: string;
  created_at: string;
}

/**
 * Gets a single API key by ID for a specific user
 * @param apiKeyId The API key ID
 * @param userId The user ID who owns the API key
 * @returns The API key info if found, null otherwise
 */
export async function getApiKey(apiKeyId: string, userId: string): Promise<ApiKeyInfo | null> {
  const db = getDb();

  const result = await db
    .select({
      id: apiKeys.id,
      owner_id: apiKeys.ownerId,
      owner_email: users.email,
      created_at: apiKeys.createdAt,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.ownerId, users.id))
    .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.ownerId, userId), isNull(apiKeys.deletedAt)))
    .limit(1);

  return result[0] || null;
}
