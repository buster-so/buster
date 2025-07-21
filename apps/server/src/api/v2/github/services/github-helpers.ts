import {
  type User,
  db,
  githubIntegrations,
  users,
} from '@buster/database';
import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { tokenStorage } from './token-storage';

export type GitHubIntegration = InferSelectModel<typeof githubIntegrations>;

interface OriginalSettings {
  repositoryPermissions?: Record<string, unknown> | null;
}

interface GitHubIntegrationWithOAuth extends GitHubIntegration {
  oauthState?: string | null;
  oauthExpiresAt?: string | null;
  oauthMetadata?: Record<string, unknown> | null;
}

export async function getActiveIntegration(
  organizationId: string
): Promise<GitHubIntegration | null> {
  try {
    const [integration] = await db
      .select()
      .from(githubIntegrations)
      .where(
        and(
          eq(githubIntegrations.organizationId, organizationId),
          eq(githubIntegrations.status, 'active'),
          isNull(githubIntegrations.deletedAt)
        )
      )
      .limit(1);

    return integration || null;
  } catch (error) {
    console.error('Failed to get active GitHub integration:', error);
    throw new Error(
      `Failed to get active GitHub integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function getPendingIntegrationByState(
  state: string
): Promise<GitHubIntegrationWithOAuth | null> {
  try {
    const [integration] = await db
      .select()
      .from(githubIntegrations)
      .where(
        and(
          eq(githubIntegrations.status, 'pending'),
          eq(githubIntegrations.createdAt, state)
        )
      )
      .limit(1);

    return integration as GitHubIntegrationWithOAuth || null;
  } catch (error) {
    console.error('Failed to get pending integration by state:', error);
    throw new Error(
      `Failed to get pending integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function createPendingIntegration(params: {
  organizationId: string;
  userId: string;
  oauthState: string;
  oauthMetadata?: Record<string, unknown>;
}): Promise<string> {
  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const existing = await getActiveIntegration(params.organizationId);

    if (existing) {
      const originalSettings = {
        repositoryPermissions: existing.repositoryPermissions,
      };

      const metadata = {
        ...params.oauthMetadata,
        isReinstallation: true,
        originalIntegrationId: existing.id,
        originalSettings,
      };

      if (existing.tokenVaultKey) {
        try {
          await tokenStorage.deleteToken(existing.tokenVaultKey);
        } catch (error) {
          console.error('Failed to clean up vault token:', error);
        }
      }

      await db
        .update(githubIntegrations)
        .set({
          status: 'pending',
          tokenVaultKey: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(githubIntegrations.id, existing.id));

      return existing.id;
    }

    const existingNonActive = await getExistingIntegration(params.organizationId);

    if (existingNonActive && existingNonActive.status !== 'active') {
      if (existingNonActive.tokenVaultKey) {
        try {
          await tokenStorage.deleteToken(existingNonActive.tokenVaultKey);
        } catch (error) {
          console.error('Failed to clean up vault token:', error);
        }
      }

      await db.delete(githubIntegrations).where(eq(githubIntegrations.id, existingNonActive.id));
    }

    const [integration] = await db
      .insert(githubIntegrations)
      .values({
        organizationId: params.organizationId,
        userId: params.userId,
        installationId: '',
        githubOrgId: '',
        status: 'pending',
      })
      .returning({ id: githubIntegrations.id });

    if (!integration) {
      throw new Error('Failed to create pending GitHub integration');
    }

    return integration.id;
  } catch (error) {
    console.error('Failed to create pending GitHub integration:', error);
    throw new Error(
      `Failed to create pending integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function updateIntegrationAfterOAuth(
  integrationId: string,
  params: {
    installationId: string;
    appId?: string;
    githubOrgId: string;
    githubOrgName?: string;
    tokenVaultKey: string;
    repositoryPermissions?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const currentIntegration = await getIntegrationById(integrationId);
    const isReinstallation = false;
    const originalSettings: OriginalSettings = {
      repositoryPermissions: currentIntegration?.repositoryPermissions as Record<string, unknown>,
    };

    const baseUpdateData = {
      ...params,
      status: 'active' as const,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updateData =
      isReinstallation && originalSettings
        ? {
            ...baseUpdateData,
            ...(originalSettings.repositoryPermissions !== undefined && {
              repositoryPermissions: originalSettings.repositoryPermissions,
            }),
          }
        : baseUpdateData;

    await db
      .update(githubIntegrations)
      .set(updateData)
      .where(eq(githubIntegrations.id, integrationId));
  } catch (error) {
    console.error('Failed to update integration after OAuth:', error);
    throw new Error(
      `Failed to activate integration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function markIntegrationAsFailed(
  integrationId: string,
  _error?: string
): Promise<void> {
  try {
    const [integration] = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.id, integrationId))
      .limit(1);

    if (!integration) {
      return;
    }

    const isReinstallation = false;
    const originalSettings: OriginalSettings = {
      repositoryPermissions: integration.repositoryPermissions as Record<string, unknown>,
    };

    if (integration.status === 'pending') {
      if (isReinstallation && originalSettings) {
        await db
          .update(githubIntegrations)
          .set({
            status: 'active',
            ...(originalSettings.repositoryPermissions !== undefined && {
              repositoryPermissions: originalSettings.repositoryPermissions,
            }),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(githubIntegrations.id, integrationId));
      } else {
        if (integration.tokenVaultKey) {
          try {
            await tokenStorage.deleteToken(integration.tokenVaultKey);
          } catch (error) {
            console.error('Failed to clean up vault token:', error);
          }
        }

        await db.delete(githubIntegrations).where(eq(githubIntegrations.id, integrationId));
      }
    } else {
      await db
        .update(githubIntegrations)
        .set({
          status: 'suspended',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(githubIntegrations.id, integrationId));
    }
  } catch (error) {
    console.error('Failed to mark integration as failed:', error);
    throw new Error(
      `Failed to mark integration as failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function softDeleteIntegration(integrationId: string): Promise<void> {
  try {
    await db
      .update(githubIntegrations)
      .set({
        status: 'revoked',
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(githubIntegrations.id, integrationId));
  } catch (error) {
    console.error('Failed to soft delete integration:', error);
    throw new Error(
      `Failed to soft delete integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function updateLastUsedAt(integrationId: string): Promise<void> {
  try {
    await db
      .update(githubIntegrations)
      .set({
        lastUsedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(githubIntegrations.id, integrationId));
  } catch (error) {
    console.error('Failed to update last used timestamp:', error);
    throw new Error(
      `Failed to update last used timestamp: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function getIntegrationById(integrationId: string): Promise<GitHubIntegration | null> {
  try {
    const [integration] = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.id, integrationId))
      .limit(1);

    return integration || null;
  } catch (error) {
    console.error('Failed to get integration by ID:', error);
    throw new Error(
      `Failed to get integration by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function hasActiveIntegration(organizationId: string): Promise<boolean> {
  try {
    const integration = await getActiveIntegration(organizationId);
    return integration !== null;
  } catch (error) {
    console.error('Failed to check active integration:', error);
    throw new Error(
      `Failed to check active integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function getExistingIntegration(
  organizationId: string
): Promise<GitHubIntegration | null> {
  try {
    const [integration] = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.organizationId, organizationId))
      .orderBy(githubIntegrations.createdAt)
      .limit(1);

    return integration || null;
  } catch (error) {
    console.error('Failed to get existing GitHub integration:', error);
    throw new Error(
      `Failed to get existing GitHub integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function getAccessToken(tokenVaultKey: string): Promise<string | null> {
  try {
    return await tokenStorage.getToken(tokenVaultKey);
  } catch (error) {
    console.error('Failed to get access token from vault:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return user || null;
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    throw new Error(
      `Failed to get user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function cleanupExpiredPendingIntegrations(): Promise<number> {
  try {
    const expiredIntegrations = await db
      .select({ id: githubIntegrations.id, tokenVaultKey: githubIntegrations.tokenVaultKey })
      .from(githubIntegrations)
      .where(
        and(
          eq(githubIntegrations.status, 'pending'),
          lt(githubIntegrations.createdAt, new Date(Date.now() - 15 * 60 * 1000).toISOString())
        )
      );

    for (const integration of expiredIntegrations) {
      if (integration.tokenVaultKey) {
        try {
          await tokenStorage.deleteToken(integration.tokenVaultKey);
        } catch (error) {
          console.error(`Failed to clean up vault token ${integration.tokenVaultKey}:`, error);
        }
      }
    }

    const result = await db
      .delete(githubIntegrations)
      .where(
        and(
          eq(githubIntegrations.status, 'pending'),
          lt(githubIntegrations.createdAt, new Date(Date.now() - 15 * 60 * 1000).toISOString())
        )
      )
      .returning({ id: githubIntegrations.id });

    return result.length;
  } catch (error) {
    console.error('Failed to cleanup expired pending integrations:', error);
    throw new Error(
      `Failed to cleanup expired integrations: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export const GitHubHelpers = {
  getActiveIntegration,
  getPendingIntegrationByState,
  createPendingIntegration,
  updateIntegrationAfterOAuth,
  markIntegrationAsFailed,
  softDeleteIntegration,
  updateLastUsedAt,
  getIntegrationById,
  hasActiveIntegration,
  getExistingIntegration,
  cleanupExpiredPendingIntegrations,
  getAccessToken,
  getUserById,
};
