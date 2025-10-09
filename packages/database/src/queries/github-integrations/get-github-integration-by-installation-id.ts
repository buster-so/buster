import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { githubIntegrations } from '../../schema';

type GitHubIntegration = InferSelectModel<typeof githubIntegrations>;

/**
 * Get GitHub integration by installation ID
 */
export async function getGithubIntegrationByInstallationId(
  installationId: string
): Promise<GitHubIntegration | undefined> {
  const [integration] = await db
    .select()
    .from(githubIntegrations)
    .where(
      and(
        eq(githubIntegrations.installationId, installationId),
        isNull(githubIntegrations.deletedAt)
      )
    )
    .limit(1);

  return integration;
}
