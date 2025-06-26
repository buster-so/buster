import { db, slackIntegrations } from '@buster/database';
import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { tokenStorage } from './token-storage';

export type SlackIntegration = InferSelectModel<typeof slackIntegrations>;

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
      `Failed to get active Slack integration: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      `Failed to get pending integration: ${error instanceof Error ? error.message : 'Unknown error'}`
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

    // Check for existing integration (including revoked ones)
    const existing = await getExistingIntegration(params.organizationId);

    if (existing) {
      if (existing.status === 'active') {
        // Active integration exists
        throw new Error('Organization already has an active Slack integration');
      }

      // Clean up vault token before deleting the old integration
      if (existing.tokenVaultKey) {
        try {
          await tokenStorage.deleteToken(existing.tokenVaultKey);
        } catch (error) {
          console.error('Failed to clean up vault token:', error);
          // Continue with deletion even if vault cleanup fails
        }
      }

      // Delete the old revoked/failed integration to avoid constraint issues
      await db.delete(slackIntegrations).where(eq(slackIntegrations.id, existing.id));
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
      `Failed to create pending integration: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    await db
      .update(slackIntegrations)
      .set({
        ...params,
        status: 'active',
        installedAt: new Date().toISOString(),
        oauthState: null,
        oauthExpiresAt: null,
        oauthMetadata: {},
        updatedAt: new Date().toISOString(),
      })
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
    // Due to database constraint, we cannot mark a pending integration as failed
    // without a team_id. Instead, we'll delete it to allow retry
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.id, integrationId))
      .limit(1);

    if (!integration) {
      return;
    }

    if (integration.status === 'pending') {
      // For pending integrations, clean up vault token if exists before deletion
      if (integration.tokenVaultKey) {
        try {
          await tokenStorage.deleteToken(integration.tokenVaultKey);
        } catch (error) {
          console.error('Failed to clean up vault token:', error);
          // Continue with deletion even if vault cleanup fails
        }
      }

      // Delete the pending integration to allow retry
      await db.delete(slackIntegrations).where(eq(slackIntegrations.id, integrationId));
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
      `Failed to mark integration as failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      `Failed to soft delete integration: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      `Failed to update last used timestamp: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      `Failed to check active integration: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      `Failed to get existing Slack integration: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      `Failed to cleanup expired integrations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
