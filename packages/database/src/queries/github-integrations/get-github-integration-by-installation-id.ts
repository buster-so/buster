import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { apiKeys, githubIntegrations } from '../../schema';

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

export async function getApiKeyForInstallationId(
  installationId: number
): Promise<string | undefined> {
  const installationIdString = installationId.toString();
  const [orgId] = await db
    .select({
      id: githubIntegrations.organizationId,
    })
    .from(githubIntegrations)
    .where(eq(githubIntegrations.installationId, installationIdString))
    .limit(1);

  if (!orgId) {
    return undefined;
  }

  const result = await db
    .select({
      key: apiKeys.key,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.organizationId, orgId.id), isNull(apiKeys.deletedAt)))
    .limit(1);

  return result[0]?.key;
}
