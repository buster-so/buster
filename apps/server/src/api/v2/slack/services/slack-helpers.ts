import {
  type User,
  db,
  slackIntegrations,
  type slackSharingPermissionEnum,
  users,
} from '@buster/database';
import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import type { z } from 'zod';
import { tokenStorage } from './token-storage';

export type SlackIntegration = InferSelectModel<typeof slackIntegrations>;

interface OriginalSettings {
  defaultChannel?: { id: string; name: string } | Record<string, never> | null;
  defaultSharingPermissions?: 'shareWithWorkspace' | 'shareWithChannel' | 'noSharing';
}

/**
 * Get active Slack integration for an organization
 */
export async function getActiveIntegration(
  organizationId: string
): Promise<SlackIntegration | null> {
  try {
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(
        and(
          eq(slackIntegrations.organizationId, organizationId),
          eq(slackIntegrations.status, 'active'),
          isNull(slackIntegrations.deletedAt)
        )
      )
      .limit(1);

    return integration || null;
  } catch (error) {
    console.error('Failed to get active Slack integration:', error);
    throw new Error(
      `Failed to get active Slack integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get pending integration by OAuth state
 */
export async function getPendingIntegrationByState(
  state: string
): Promise<SlackIntegration | null> {
  try {
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(
        and(
          eq(slackIntegrations.oauthState, state),
          eq(slackIntegrations.status, 'pending'),
          gt(slackIntegrations.oauthExpiresAt, new Date().toISOString())
        )
      )
      .limit(1);

    return integration || null;
  } catch (error) {
    console.error('Failed to get pending integration by state:', error);
    throw new Error(
      `Failed to get pending integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Create a pending Slack integration
 */
export async function createPendingIntegration(params: {
  organizationId: string;
  userId: string;
  oauthState: string;
  oauthMetadata?: Record<string, unknown>;
}): Promise<string> {
  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minute expiry

    // Check for existing integration (including active ones for re-installation)
    const existing = await getActiveIntegration(params.organizationId);

    if (existing) {
      const originalSettings = {
        defaultChannel: existing.defaultChannel,
        defaultSharingPermissions: existing.defaultSharingPermissions,
      };

      const metadata = {
        ...params.oauthMetadata,
        isReinstallation: true,
        originalIntegrationId: existing.id,
        originalSettings,
      };

      // Clean up vault token before updating
      if (existing.tokenVaultKey) {
        try {
          await tokenStorage.deleteToken(existing.tokenVaultKey);
        } catch (error) {
          console.error('Failed to clean up vault token:', error);
        }
      }

      await db
        .update(slackIntegrations)
        .set({
          oauthState: params.oauthState,
          oauthExpiresAt: expiresAt.toISOString(),
          oauthMetadata: metadata,
          status: 'pending',
          tokenVaultKey: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(slackIntegrations.id, existing.id));

      return existing.id;
    }

    // Check for existing non-active integration (revoked/failed ones)
    const existingNonActive = await getExistingIntegration(params.organizationId);

    if (existingNonActive && existingNonActive.status !== 'active') {
      // Clean up vault token before deleting the old integration
      if (existingNonActive.tokenVaultKey) {
        try {
          await tokenStorage.deleteToken(existingNonActive.tokenVaultKey);
        } catch (error) {
          console.error('Failed to clean up vault token:', error);
          // Continue with deletion even if vault cleanup fails
        }
      }

      // Delete the old revoked/failed integration to avoid constraint issues
      await db.delete(slackIntegrations).where(eq(slackIntegrations.id, existingNonActive.id));
    }

    // No existing integration, create new one
    const [integration] = await db
      .insert(slackIntegrations)
      .values({
        organizationId: params.organizationId,
        userId: params.userId,
        oauthState: params.oauthState,
        oauthExpiresAt: expiresAt.toISOString(),
        oauthMetadata: params.oauthMetadata || {},
        status: 'pending',
      })
      .returning({ id: slackIntegrations.id });

    if (!integration) {
      throw new Error('Failed to create pending Slack integration');
    }

    return integration.id;
  } catch (error) {
    console.error('Failed to create pending Slack integration:', error);
    throw new Error(
      `Failed to create pending integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Update integration after successful OAuth
 */
export async function updateIntegrationAfterOAuth(
  integrationId: string,
  params: {
    teamId: string;
    teamName: string;
    teamDomain?: string;
    enterpriseId?: string;
    botUserId: string;
    scope: string;
    tokenVaultKey: string;
    installedBySlackUserId?: string;
  }
): Promise<void> {
  try {
    const currentIntegration = await getIntegrationById(integrationId);
    const isReinstallation = (currentIntegration?.oauthMetadata as Record<string, unknown>)
      ?.isReinstallation;
    const originalSettings = (currentIntegration?.oauthMetadata as Record<string, unknown>)
      ?.originalSettings as OriginalSettings;

    const baseUpdateData = {
      ...params,
      status: 'active' as const,
      installedAt: new Date().toISOString(),
      oauthState: null,
      oauthExpiresAt: null,
      oauthMetadata: {},
      updatedAt: new Date().toISOString(),
    };

    const updateData =
      isReinstallation && originalSettings
        ? {
            ...baseUpdateData,
            ...(originalSettings.defaultChannel !== undefined && {
              defaultChannel: originalSettings.defaultChannel,
            }),
            ...(originalSettings.defaultSharingPermissions !== undefined && {
              defaultSharingPermissions: originalSettings.defaultSharingPermissions,
            }),
          }
        : baseUpdateData;

    await db
      .update(slackIntegrations)
      .set(updateData)
      .where(eq(slackIntegrations.id, integrationId));
  } catch (error) {
    console.error('Failed to update integration after OAuth:', error);
    throw new Error(
      `Failed to activate integration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Mark integration as failed
 */
export async function markIntegrationAsFailed(
  integrationId: string,
  _error?: string
): Promise<void> {
  try {
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.id, integrationId))
      .limit(1);

    if (!integration) {
      return;
    }

    const isReinstallation = (integration.oauthMetadata as Record<string, unknown>)
      ?.isReinstallation;
    const originalSettings = (integration.oauthMetadata as Record<string, unknown>)
      ?.originalSettings as OriginalSettings;

    if (integration.status === 'pending') {
      if (isReinstallation && originalSettings) {
        await db
          .update(slackIntegrations)
          .set({
            status: 'active',
            oauthState: null,
            oauthExpiresAt: null,
            oauthMetadata: {},
            ...(originalSettings.defaultChannel !== undefined && {
              defaultChannel: originalSettings.defaultChannel,
            }),
            ...(originalSettings.defaultSharingPermissions !== undefined && {
              defaultSharingPermissions: originalSettings.defaultSharingPermissions,
            }),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(slackIntegrations.id, integrationId));
      } else {
        // Clean up vault token if exists before deletion
        if (integration.tokenVaultKey) {
          try {
            await tokenStorage.deleteToken(integration.tokenVaultKey);
          } catch (error) {
            console.error('Failed to clean up vault token:', error);
          }
        }

        // Delete the pending integration to allow retry
        await db.delete(slackIntegrations).where(eq(slackIntegrations.id, integrationId));
      }
    } else {
      // For active integrations, mark as failed
      await db
        .update(slackIntegrations)
        .set({
          status: 'failed',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(slackIntegrations.id, integrationId));
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

/**
 * Soft delete an integration
 */
export async function softDeleteIntegration(integrationId: string): Promise<void> {
  try {
    await db
      .update(slackIntegrations)
      .set({
        status: 'revoked',
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(slackIntegrations.id, integrationId));
  } catch (error) {
    console.error('Failed to soft delete integration:', error);
    throw new Error(
      `Failed to soft delete integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Update last used timestamp
 */
export async function updateLastUsedAt(integrationId: string): Promise<void> {
  try {
    await db
      .update(slackIntegrations)
      .set({
        lastUsedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(slackIntegrations.id, integrationId));
  } catch (error) {
    console.error('Failed to update last used timestamp:', error);
    throw new Error(
      `Failed to update last used timestamp: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get integration by ID
 */
export async function getIntegrationById(integrationId: string): Promise<SlackIntegration | null> {
  try {
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.id, integrationId))
      .limit(1);

    return integration || null;
  } catch (error) {
    console.error('Failed to get integration by ID:', error);
    throw new Error(
      `Failed to get integration by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if organization already has active Slack integration
 */
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

/**
 * Get any existing integration for an organization (active, revoked, or failed)
 */
export async function getExistingIntegration(
  organizationId: string
): Promise<SlackIntegration | null> {
  try {
    // Get the most recent non-deleted integration for this organization
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.organizationId, organizationId))
      .orderBy(slackIntegrations.createdAt)
      .limit(1);

    return integration || null;
  } catch (error) {
    console.error('Failed to get existing Slack integration:', error);
    throw new Error(
      `Failed to get existing Slack integration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Update default channel for Slack integration
 */
export async function updateDefaultChannel(
  integrationId: string,
  defaultChannel: { name: string; id: string }
): Promise<void> {
  try {
    await db
      .update(slackIntegrations)
      .set({
        defaultChannel,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(slackIntegrations.id, integrationId));
  } catch (error) {
    console.error('Failed to update default channel:', error);
    throw new Error(
      `Failed to update default channel: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Update default sharing permissions for Slack integration
 */
export async function updateDefaultSharingPermissions(
  integrationId: string,
  defaultSharingPermissions: (typeof slackSharingPermissionEnum.enumValues)[number]
): Promise<void> {
  try {
    await db
      .update(slackIntegrations)
      .set({
        defaultSharingPermissions,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(slackIntegrations.id, integrationId));
  } catch (error) {
    console.error('Failed to update default sharing permissions:', error);
    throw new Error(
      `Failed to update default sharing permissions: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Clean up expired pending integrations
 */
export async function cleanupExpiredPendingIntegrations(): Promise<number> {
  try {
    // First, get the expired integrations to clean up their vault tokens
    const expiredIntegrations = await db
      .select({ id: slackIntegrations.id, tokenVaultKey: slackIntegrations.tokenVaultKey })
      .from(slackIntegrations)
      .where(
        and(
          eq(slackIntegrations.status, 'pending'),
          lt(slackIntegrations.oauthExpiresAt, new Date().toISOString())
        )
      );

    // Clean up vault tokens for each expired integration
    for (const integration of expiredIntegrations) {
      if (integration.tokenVaultKey) {
        try {
          await tokenStorage.deleteToken(integration.tokenVaultKey);
        } catch (error) {
          console.error(`Failed to clean up vault token ${integration.tokenVaultKey}:`, error);
          // Continue with cleanup even if vault token deletion fails
        }
      }
    }

    // Now delete the expired integrations
    const result = await db
      .delete(slackIntegrations)
      .where(
        and(
          eq(slackIntegrations.status, 'pending'),
          lt(slackIntegrations.oauthExpiresAt, new Date().toISOString())
        )
      )
      .returning({ id: slackIntegrations.id });

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

/**
 * Get active Slack integration by Slack team ID
 */
export async function getActiveIntegrationByTeamId(
  teamId: string
): Promise<SlackIntegration | null> {
  try {
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(
        and(
          eq(slackIntegrations.teamId, teamId),
          eq(slackIntegrations.status, 'active'),
          isNull(slackIntegrations.deletedAt)
        )
      )
      .limit(1);

    return integration || null;
  } catch (error) {
    console.error('Failed to get active Slack integration by team ID:', error);
    throw new Error(
      `Failed to get active Slack integration by team ID: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get access token from vault
 */
export async function getAccessToken(tokenVaultKey: string): Promise<string | null> {
  try {
    return await tokenStorage.getToken(tokenVaultKey);
  } catch (error) {
    console.error('Failed to get access token from vault:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
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

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email)))
      .limit(1);

    return user || null;
  } catch (error) {
    console.error('Failed to get user by email:', error);
    throw new Error(
      `Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update integration settings
 */
export async function updateIntegrationSettings(
  organizationId: string,
  settings: {
    defaultChannel?: { id: string; name: string };
    defaultSharingPermissions?: (typeof slackSharingPermissionEnum.enumValues)[number];
  }
): Promise<void> {
  try {
    const integration = await getActiveIntegration(organizationId);

    if (!integration) {
      throw new Error('No active Slack integration found');
    }

    await db
      .update(slackIntegrations)
      .set({
        defaultChannel: settings.defaultChannel,
        defaultSharingPermissions: settings.defaultSharingPermissions,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(slackIntegrations.id, integration.id));
  } catch (error) {
    console.error('Failed to update integration settings:', error);
    throw new Error(
      `Failed to update integration settings: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

// Export as namespace for easier import
export const SlackHelpers = {
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
  updateDefaultChannel,
  updateDefaultSharingPermissions,
  updateIntegrationSettings,
  cleanupExpiredPendingIntegrations,
  getActiveIntegrationByTeamId,
  getAccessToken,
  getUserById,
  getUserByEmail,
};
