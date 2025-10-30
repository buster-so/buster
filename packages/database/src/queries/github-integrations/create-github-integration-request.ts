import { db } from '../../connection';
import { githubIntegrationRequests } from '../../schema';

/**
 * Create a new GitHub integration request
 */
export async function createGithubIntegrationRequest(data: {
  organizationId: string;
  userId: string;
  githubLogin: string;
}) {
  const [request] = await db
    .insert(githubIntegrationRequests)
    .values({
      organizationId: data.organizationId,
      userId: data.userId,
      githubLogin: data.githubLogin,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing({
      target: [githubIntegrationRequests.organizationId, githubIntegrationRequests.userId],
    })
    .returning();

  return request;
}
