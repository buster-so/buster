import { db, slackIntegrations } from '@buster/database';
import { and, eq, isNull } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as slackHelpers from './slack-helpers';
import { tokenStorage } from './token-storage';

// Skip tests if DATABASE_URL is not set
const skipIfNoDatabase = !process.env.DATABASE_URL;

// Mock the tokenStorage to track delete calls
vi.mock('./token-storage', () => ({
  tokenStorage: {
    deleteToken: vi.fn(),
  },
}));

const mockedTokenStorage = vi.mocked(tokenStorage);

describe.skipIf(skipIfNoDatabase)('Slack Helpers Integration Tests', () => {
  // Use existing seed data IDs
  const testOrganizationId = 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce';
  const testUserId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';
  let createdIntegrationIds: string[] = [];

  // Helper function to generate unique test IDs
  const generateTestIds = () => ({
    teamId: `T${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    botUserId: `U${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    enterpriseId: `E${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  });

  beforeAll(async () => {
    if (skipIfNoDatabase) {
      console.log('Skipping Slack helpers integration tests - DATABASE_URL not set');
      return;
    }

    // Clean up any existing test data for this organization
    try {
      await db
        .delete(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, testOrganizationId));

      // Also clean up any test integrations with our test team ID patterns
      await db.delete(slackIntegrations).where(eq(slackIntegrations.teamId, 'T12345'));
    } catch (error) {
      console.error('Error cleaning up existing test data:', error);
    }
  });

  afterAll(async () => {
    // Clean up only the specific test data created by this test suite
    if (!skipIfNoDatabase && createdIntegrationIds.length > 0) {
      for (const id of createdIntegrationIds) {
        try {
          await db.delete(slackIntegrations).where(eq(slackIntegrations.id, id));
        } catch (error) {
          console.error(`Failed to clean up integration ${id}:`, error);
        }
      }
      createdIntegrationIds = [];
    }
  });

  describe('getActiveIntegration', () => {
    it('should return null when no integration exists', async () => {
      const result = await slackHelpers.getActiveIntegration(
        'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      );
      expect(result).toBeNull();
    });

    it('should return active integration when it exists', async () => {
      const testIds = generateTestIds();
      // Create an active integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Test Workspace',
          teamDomain: 'test-workspace',
          botUserId: testIds.botUserId,
          scope: 'channels:read chat:write',
          tokenVaultKey: 'test-token-key',
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      const result = await slackHelpers.getActiveIntegration(testOrganizationId);
      expect(result).toBeTruthy();
      expect(result?.id).toBe(integration.id);
      expect(result?.status).toBe('active');
      expect(result?.teamName).toBe('Test Workspace');
    });

    it('should not return soft-deleted integrations', async () => {
      // First, ensure we have no active integrations by cleaning up any from previous tests
      const existingActive = await db
        .select({ id: slackIntegrations.id })
        .from(slackIntegrations)
        .where(
          and(
            eq(slackIntegrations.organizationId, testOrganizationId),
            eq(slackIntegrations.status, 'active'),
            isNull(slackIntegrations.deletedAt)
          )
        );

      for (const integration of existingActive) {
        await db.delete(slackIntegrations).where(eq(slackIntegrations.id, integration.id));
      }

      const testIds = generateTestIds();
      // Create a soft-deleted integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Deleted Workspace',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey: `deleted-token-${Date.now()}`,
          deletedAt: new Date().toISOString(),
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      const result = await slackHelpers.getActiveIntegration(testOrganizationId);
      expect(result).toBeNull();
    });

    it('should not return non-active integrations', async () => {
      // First, ensure we have no active integrations by cleaning up any from previous tests
      const existingActive = await db
        .select({ id: slackIntegrations.id })
        .from(slackIntegrations)
        .where(
          and(
            eq(slackIntegrations.organizationId, testOrganizationId),
            eq(slackIntegrations.status, 'active'),
            isNull(slackIntegrations.deletedAt)
          )
        );

      for (const integration of existingActive) {
        await db.delete(slackIntegrations).where(eq(slackIntegrations.id, integration.id));
      }

      // Create a pending integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: 'test-state',
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(), // 15 mins from now
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      const result = await slackHelpers.getActiveIntegration(testOrganizationId);
      expect(result).toBeNull();
    });
  });

  describe('getIntegrationById', () => {
    it('should return integration by id', async () => {
      const testIds = generateTestIds();
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Test Workspace',
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      const result = await slackHelpers.getIntegrationById(integration.id);
      expect(result).toBeTruthy();
      expect(result?.id).toBe(integration.id);
    });

    it('should return null for non-existent id', async () => {
      const result = await slackHelpers.getIntegrationById('f47ac10b-58cc-4372-a567-0e02b2c3d480');
      expect(result).toBeNull();
    });
  });

  describe('getPendingIntegrationByState', () => {
    it('should return pending integration with valid state', async () => {
      const testState = `test-state-${Date.now()}`;
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testState,
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(), // 15 mins from now
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      const result = await slackHelpers.getPendingIntegrationByState(testState);
      expect(result).toBeTruthy();
      expect(result?.id).toBe(integration.id);
      expect(result?.oauthState).toBe(testState);
    });

    it('should not return expired integrations', async () => {
      const testState = `expired-state-${Date.now()}`;
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testState,
          oauthExpiresAt: new Date(Date.now() - 60000).toISOString(), // 1 min ago
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      const result = await slackHelpers.getPendingIntegrationByState(testState);
      expect(result).toBeNull();
    });

    it('should not return non-pending integrations', async () => {
      const testState = `active-state-${Date.now()}`;
      const testIds = generateTestIds();
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          oauthState: testState,
          teamId: testIds.teamId,
          teamName: 'Test Workspace',
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      const result = await slackHelpers.getPendingIntegrationByState(testState);
      expect(result).toBeNull();
    });
  });

  describe('createPendingIntegration', () => {
    beforeEach(async () => {
      // Clean up any existing integrations for the test organization
      await db
        .delete(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, testOrganizationId));

      // Clear mock calls
      mockedTokenStorage.deleteToken.mockClear();
    });

    it('should create a new pending integration', async () => {
      const testState = `new-state-${Date.now()}`;
      const metadata = { returnUrl: '/dashboard', source: 'settings' };

      const integrationId = await slackHelpers.createPendingIntegration({
        organizationId: testOrganizationId,
        userId: testUserId,
        oauthState: testState,
        oauthMetadata: metadata,
      });

      expect(integrationId).toBeTruthy();
      createdIntegrationIds.push(integrationId);

      // Verify it was created correctly
      const [created] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integrationId));

      expect(created).toBeTruthy();
      expect(created.organizationId).toBe(testOrganizationId);
      expect(created.userId).toBe(testUserId);
      expect(created.status).toBe('pending');
      expect(created.oauthState).toBe(testState);
      expect(created.oauthMetadata).toEqual(metadata);

      // Check expiry is set to ~15 minutes
      const expiryTime = new Date(created.oauthExpiresAt!).getTime();
      const expectedExpiry = Date.now() + 15 * 60 * 1000;
      expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(5000); // Within 5 seconds
    });

    it('should delete revoked integration and create new pending', async () => {
      // First, create a revoked integration with a token vault key
      const testIds = generateTestIds();
      const tokenVaultKey = `revoked-token-${Date.now()}`;
      const [revokedIntegration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'revoked',
          teamId: testIds.teamId,
          teamName: 'Old Workspace',
          teamDomain: 'old-workspace',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey,
        })
        .returning();

      createdIntegrationIds.push(revokedIntegration.id);

      // Now try to create a new pending integration for the same org
      const newState = `reuse-state-${Date.now()}`;
      const newMetadata = { returnUrl: '/settings', source: 'reconnect' };

      const integrationId = await slackHelpers.createPendingIntegration({
        organizationId: testOrganizationId,
        userId: testUserId,
        oauthState: newState,
        oauthMetadata: newMetadata,
      });

      // Should be a new integration ID (not the same as revoked)
      expect(integrationId).not.toBe(revokedIntegration.id);
      createdIntegrationIds.push(integrationId);

      // Verify vault token cleanup was called
      expect(mockedTokenStorage.deleteToken).toHaveBeenCalledWith(tokenVaultKey);

      // Verify old integration was deleted
      const [deletedIntegration] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, revokedIntegration.id));

      expect(deletedIntegration).toBeUndefined();

      // Verify new integration was created correctly
      const [newIntegration] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integrationId));

      expect(newIntegration).toBeTruthy();
      expect(newIntegration.status).toBe('pending');
      expect(newIntegration.oauthState).toBe(newState);
      expect(newIntegration.oauthMetadata).toEqual(newMetadata);
      expect(newIntegration.organizationId).toBe(testOrganizationId);
    });

    it('should delete failed integration and create new pending', async () => {
      // First, create a failed integration with a token vault key
      const testIds = generateTestIds();
      const tokenVaultKey = `failed-token-${Date.now()}`;
      const [failedIntegration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'failed',
          teamId: testIds.teamId,
          teamName: 'Failed Workspace',
          tokenVaultKey,
        })
        .returning();

      createdIntegrationIds.push(failedIntegration.id);

      // Now try to create a new pending integration for the same org
      const newState = `retry-state-${Date.now()}`;

      const integrationId = await slackHelpers.createPendingIntegration({
        organizationId: testOrganizationId,
        userId: testUserId,
        oauthState: newState,
      });

      // Should be a new integration ID (not the same as failed)
      expect(integrationId).not.toBe(failedIntegration.id);
      createdIntegrationIds.push(integrationId);

      // Verify vault token cleanup was called
      expect(mockedTokenStorage.deleteToken).toHaveBeenCalledWith(tokenVaultKey);

      // Verify old integration was deleted
      const [deletedIntegration] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, failedIntegration.id));

      expect(deletedIntegration).toBeUndefined();

      // Verify new integration was created with pending status
      const [newIntegration] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integrationId));

      expect(newIntegration.status).toBe('pending');
      expect(newIntegration.oauthState).toBe(newState);
    });

    it('should not call deleteToken when integration has no vault key', async () => {
      // Create a revoked integration without a token vault key
      const testIds = generateTestIds();
      const [revokedIntegration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'revoked',
          teamId: testIds.teamId,
          teamName: 'Old Workspace Without Token',
          // No tokenVaultKey
        })
        .returning();

      createdIntegrationIds.push(revokedIntegration.id);

      // Create a new pending integration
      const newState = `no-token-state-${Date.now()}`;
      const integrationId = await slackHelpers.createPendingIntegration({
        organizationId: testOrganizationId,
        userId: testUserId,
        oauthState: newState,
      });

      createdIntegrationIds.push(integrationId);

      // Verify deleteToken was not called since there was no token vault key
      expect(mockedTokenStorage.deleteToken).not.toHaveBeenCalled();
    });

    it('should throw error if active integration exists', async () => {
      // Create an active integration
      const testIds = generateTestIds();
      const [activeIntegration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Active Workspace',
        })
        .returning();

      createdIntegrationIds.push(activeIntegration.id);

      // Try to create a new pending integration for the same org
      await expect(
        slackHelpers.createPendingIntegration({
          organizationId: testOrganizationId,
          userId: testUserId,
          oauthState: 'should-fail',
        })
      ).rejects.toThrow('Organization already has an active Slack integration');
    });
  });

  describe('updateIntegrationAfterOAuth', () => {
    it('should update pending integration to active with all fields', async () => {
      // Create a pending integration
      const uniqueState = `test-state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const [pending] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: uniqueState,
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(),
        })
        .returning();

      createdIntegrationIds.push(pending.id);

      const testIds = generateTestIds();
      // Update it with OAuth response data
      await slackHelpers.updateIntegrationAfterOAuth(pending.id, {
        teamId: testIds.teamId,
        teamName: 'OAuth Workspace',
        teamDomain: 'oauth-workspace',
        enterpriseId: testIds.enterpriseId,
        botUserId: testIds.botUserId,
        scope: 'channels:read chat:write channels:join',
        tokenVaultKey: `slack-token-${pending.id}`,
        installedBySlackUserId: 'U11111',
      });

      // Verify the update
      const [updated] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, pending.id));

      expect(updated.status).toBe('active');
      expect(updated.teamId).toBe(testIds.teamId);
      expect(updated.teamName).toBe('OAuth Workspace');
      expect(updated.teamDomain).toBe('oauth-workspace');
      expect(updated.enterpriseId).toBe(testIds.enterpriseId);
      expect(updated.botUserId).toBe(testIds.botUserId);
      expect(updated.scope).toBe('channels:read chat:write channels:join');
      expect(updated.tokenVaultKey).toBe(`slack-token-${pending.id}`);
      expect(updated.installedBySlackUserId).toBe('U11111');
      expect(updated.installedAt).toBeTruthy();
      expect(updated.oauthState).toBeNull();
      expect(updated.oauthExpiresAt).toBeNull();
    });

    it('should handle updates with minimal fields', async () => {
      // Create a pending integration
      const uniqueState = `test-state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const [pending] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: uniqueState,
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(),
        })
        .returning();

      createdIntegrationIds.push(pending.id);

      const testIds = generateTestIds();
      // Update with minimal required fields
      await slackHelpers.updateIntegrationAfterOAuth(pending.id, {
        teamId: testIds.teamId,
        teamName: 'Minimal Workspace',
        botUserId: testIds.botUserId,
        scope: 'basic',
        tokenVaultKey: 'minimal-token',
      });

      // Verify the update
      const [updated] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, pending.id));

      expect(updated.status).toBe('active');
      expect(updated.teamId).toBe(testIds.teamId);
      expect(updated.teamName).toBe('Minimal Workspace');
      expect(updated.teamDomain).toBeNull();
      expect(updated.enterpriseId).toBeNull();
    });
  });

  describe('markIntegrationAsFailed', () => {
    beforeEach(() => {
      // Clear mock calls
      mockedTokenStorage.deleteToken.mockClear();
    });

    it('should mark active integration as failed', async () => {
      const testIds = generateTestIds();
      // Create an active integration that we'll mark as failed
      const [active] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Failed Team',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey: 'test-failed-token',
        })
        .returning();

      createdIntegrationIds.push(active.id);

      await slackHelpers.markIntegrationAsFailed(active.id, 'Token revoked');

      const [updated] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, active.id));

      expect(updated).toBeDefined();
      expect(updated.status).toBe('failed');

      // Active integrations are not deleted, so vault token should not be cleaned up
      expect(mockedTokenStorage.deleteToken).not.toHaveBeenCalled();
    });

    it('should delete pending integration when marking as failed', async () => {
      // Create a pending integration
      const [pending] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: 'test-state-to-fail',
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(),
        })
        .returning();

      // Don't add to cleanup since it will be deleted
      // createdIntegrationIds.push(pending.id);

      await slackHelpers.markIntegrationAsFailed(pending.id, 'OAuth failed');

      const [deleted] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, pending.id));

      expect(deleted).toBeUndefined();

      // Pending integration without token vault key should not call deleteToken
      expect(mockedTokenStorage.deleteToken).not.toHaveBeenCalled();
    });

    it('should delete pending integration with token vault key and clean up vault', async () => {
      const tokenVaultKey = `pending-token-${Date.now()}`;
      // Create a pending integration with a token vault key
      const [pending] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: 'test-state-with-token',
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(),
          tokenVaultKey,
        })
        .returning();

      // Don't add to cleanup since it will be deleted

      await slackHelpers.markIntegrationAsFailed(pending.id, 'OAuth failed');

      const [deleted] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, pending.id));

      expect(deleted).toBeUndefined();

      // Verify vault token cleanup was called
      expect(mockedTokenStorage.deleteToken).toHaveBeenCalledWith(tokenVaultKey);
    });
  });

  describe('softDeleteIntegration', () => {
    it('should soft delete integration', async () => {
      const testIds = generateTestIds();
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'To Delete',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey: 'test-soft-delete-token',
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      await slackHelpers.softDeleteIntegration(integration.id);

      const [deleted] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integration.id));

      expect(deleted.deletedAt).toBeTruthy();
      expect(deleted.status).toBe('revoked');
    });
  });

  describe('cleanupExpiredPendingIntegrations', () => {
    beforeEach(() => {
      // Clear mock calls
      mockedTokenStorage.deleteToken.mockClear();
    });

    it('should delete expired pending integrations', async () => {
      // Create expired pending integration
      const [expired] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: 'expired-state',
          oauthExpiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        })
        .returning();

      // Create valid pending integration
      const [valid] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: 'valid-state',
          oauthExpiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        })
        .returning();

      createdIntegrationIds.push(expired.id, valid.id);

      const deletedCount = await slackHelpers.cleanupExpiredPendingIntegrations();
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Verify expired was deleted
      const [expiredCheck] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, expired.id));
      expect(expiredCheck).toBeUndefined();

      // Verify valid still exists
      const [validCheck] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, valid.id));
      expect(validCheck).toBeTruthy();

      // No token vault keys in this test, so deleteToken should not be called
      expect(mockedTokenStorage.deleteToken).not.toHaveBeenCalled();
    });

    it('should clean up vault tokens when deleting expired pending integrations', async () => {
      const expiredTokenKey = `expired-token-${Date.now()}`;
      const validTokenKey = `valid-token-${Date.now()}`;

      // Create expired pending integration with token vault key
      const [expired] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: 'expired-state-with-token',
          oauthExpiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          tokenVaultKey: expiredTokenKey,
        })
        .returning();

      // Create valid pending integration with token vault key
      const [valid] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: 'valid-state-with-token',
          oauthExpiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          tokenVaultKey: validTokenKey,
        })
        .returning();

      createdIntegrationIds.push(expired.id, valid.id);

      const deletedCount = await slackHelpers.cleanupExpiredPendingIntegrations();
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Verify expired was deleted
      const [expiredCheck] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, expired.id));
      expect(expiredCheck).toBeUndefined();

      // Verify valid still exists
      const [validCheck] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, valid.id));
      expect(validCheck).toBeTruthy();

      // Verify vault token cleanup was called only for the expired integration
      expect(mockedTokenStorage.deleteToken).toHaveBeenCalledWith(expiredTokenKey);
      expect(mockedTokenStorage.deleteToken).not.toHaveBeenCalledWith(validTokenKey);
    });

    it('should handle vault token cleanup errors gracefully', async () => {
      const expiredTokenKey = `error-token-${Date.now()}`;

      // Mock deleteToken to throw an error
      mockedTokenStorage.deleteToken.mockRejectedValueOnce(new Error('Vault error'));

      // Create expired pending integration with token vault key
      const [expired] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: 'expired-state-error',
          oauthExpiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          tokenVaultKey: expiredTokenKey,
        })
        .returning();

      createdIntegrationIds.push(expired.id);

      // Should not throw error even if vault cleanup fails
      const deletedCount = await slackHelpers.cleanupExpiredPendingIntegrations();
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Verify expired was still deleted despite vault error
      const [expiredCheck] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, expired.id));
      expect(expiredCheck).toBeUndefined();

      // Verify vault token cleanup was attempted
      expect(mockedTokenStorage.deleteToken).toHaveBeenCalledWith(expiredTokenKey);
    });
  });
});
