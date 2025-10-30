import { eq } from 'drizzle-orm';
import { db } from '../../connection';
import { githubIntegrationRequests } from '../../schema';

/**
 * Soft delete a GitHub integration request by ID
 */
export async function softDeleteGithubIntegrationRequest(id: string) {
  const [deleted] = await db
    .update(githubIntegrationRequests)
    .set({
      deletedAt: new Date().toISOString(),
    })
    .where(eq(githubIntegrationRequests.id, id))
    .returning();

  return deleted;
}
