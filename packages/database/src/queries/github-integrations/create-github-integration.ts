import { db } from '../../connection';
import { githubIntegrations } from '../../schema';

/**
 * Create a new GitHub integration
 */
export async function createGithubIntegration(data: {
  organizationId: string;
  userId: string;
  appId: string;
  githubOrgId: string;
  installationId: string;
  githubOrgName?: string;
  accessibleRepositories?: string[];
  permissions?: Record<string, string>;
  status?: 'pending' | 'active' | 'suspended' | 'revoked';
}) {
  const [integration] = await db
    .insert(githubIntegrations)
    .values({
      organizationId: data.organizationId,
      userId: data.userId,
      appId: data.appId,
      githubOrgId: data.githubOrgId,
      installationId: data.installationId,
      githubOrgName: data.githubOrgName,
      accessibleRepositories: data.accessibleRepositories,
      permissions: data.permissions,
      status: data.status || 'pending',
      createdAt: new Date().toISOString(),
    })
    .returning();

  return integration;
}
