import { and, eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '../../connection';
import { apiKeys } from '../../schema';

/**
 * Soft deletes an API key by setting deleted_at timestamp
 * @param apiKeyId The API key ID to delete
 * @param userId The user ID who owns the API key
 * @returns True if the API key was deleted, false if not found
 */
export async function deleteApiKey(apiKeyId: string, userId: string): Promise<boolean> {
  const db = getDb();

  const result = await db
    .update(apiKeys)
    .set({
      deletedAt: sql`NOW()`,
    })
    .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.ownerId, userId), isNull(apiKeys.deletedAt)))
    .returning({ id: apiKeys.id });

  return result.length > 0;
}
