import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from '../../connection';
import { apiKeys, users } from '../../schema';

export interface ApiKeyListItem {
  id: string;
  owner_id: string;
  owner_email: string;
  created_at: string;
}

/**
 * Lists all API keys for a specific user
 * @param userId The user ID to list API keys for
 * @returns Array of API keys with owner information
 */
export async function listApiKeys(userId: string): Promise<ApiKeyListItem[]> {
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
    .where(and(eq(apiKeys.ownerId, userId), isNull(apiKeys.deletedAt)))
    .orderBy(desc(apiKeys.createdAt));

  return result;
}
