import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { githubIntegrations } from '../../schema';
import type { GithubRepository } from '../../schema-types/github';

/**
 * Update GitHub integration
 */
export async function updateGithubIntegration(
  integrationId: string,
  data: {
    githubOrgName?: string;
    githubOrgId?: string;
    permissions?: Record<string, string>;
    accessibleRepositories?: GithubRepository[] | undefined;
    status?: 'pending' | 'active' | 'suspended' | 'revoked';
    deletedAt?: string;
  }
) {
  const updateData: Record<
    string,
    string | number | Record<string, string> | undefined | GithubRepository[]
  > = {
    updatedAt: new Date().toISOString(),
  };

  // Only add defined fields to update
  if (data.githubOrgName !== undefined) updateData.githubOrgName = data.githubOrgName;
  if (data.githubOrgId !== undefined) updateData.githubOrgId = data.githubOrgId;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.accessibleRepositories !== undefined)
    updateData.accessibleRepositories = data.accessibleRepositories;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt;

  const [updated] = await db
    .update(githubIntegrations)
    .set(updateData)
    .where(
      data.deletedAt !== undefined
        ? eq(githubIntegrations.id, integrationId) // Allow updating already deleted records when setting deletedAt
        : and(eq(githubIntegrations.id, integrationId), isNull(githubIntegrations.deletedAt))
    )
    .returning();

  return updated;
}
