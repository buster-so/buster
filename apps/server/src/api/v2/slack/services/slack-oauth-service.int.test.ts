import { db, slackIntegrations } from '@buster/database';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupTestOrgAndUser, createTestOrgAndUser } from '../test-helpers';
import * as slackHelpers from './slack-helpers';

// Skip tests if required environment variables are not set
const skipIfNoEnv =
  !process.env.DATABASE_URL ||
  !process.env.SLACK_CLIENT_ID ||
  !process.env.SLACK_CLIENT_SECRET ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mock the Slack auth service to avoid actual OAuth calls
vi.mock('@buster/slack', () => ({
  SlackAuthService: vi.fn().mockImplementation(() => {
    // Generate unique IDs for each mock instance
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    const mockIds = {
      teamId: `T${timestamp}-mock-${random}`,
      botUserId: `U${timestamp}-bot-${random}`,
      installerUserId: `U${timestamp}-installer-${random}`,
    };

    return {
      generateAuthUrl: vi.fn().mockResolvedValue({
        authUrl: 'https://slack.com/oauth/v2/authorize?client_id=test&state=test',
        state: 'mocked-state',
      }),
      handleCallback: vi.fn().mockResolvedValue({
        ok: true,
        access_token: 'xoxb-test-token',
        teamId: mockIds.teamId,
        teamName: 'Test Workspace',
        teamDomain: 'test-workspace',
        botUserId: mockIds.botUserId,
        scope: 'channels:read,chat:write',
        installerUserId: mockIds.installerUserId,
      }),
    };
  }),
}));

describe.skipIf(skipIfNoEnv)('SlackOAuthService Integration Tests', () => {
  let service: any;
  // Create unique organization and user for this test suite
  let testOrganizationId: string;
  let testUserId: string;
  const createdIntegrationIds: string[] = [];

  // Add unique test run identifier to prevent conflicts
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  const testRunId = `oauth-service-${timestamp}-${random}`;

  // Helper function to generate unique test IDs
  const generateTestIds = () => ({
    teamId: `T${testRunId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    botUserId: `U${testRunId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    enterpriseId: `E${testRunId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  });

  beforeAll(async () => {
    if (skipIfNoEnv) {
      console.log(
        'Skipping Slack OAuth integration tests - required environment variables not set'
      );
      return;
    }

    // Create unique test organization and user
    const { organizationId, userId } = await createTestOrgAndUser();
    testOrganizationId = organizationId;
    testUserId = userId;
  });

  beforeEach(async () => {
    if (!skipIfNoEnv) {
      // Clean up any active integrations before each test to ensure clean state
      try {
        await db
          .delete(slackIntegrations)
          .where(
            and(
              eq(slackIntegrations.organizationId, testOrganizationId),
              eq(slackIntegrations.status, 'active')
            )
          );
      } catch (error) {
        console.error('Error cleaning up active integrations:', error);
      }

      // Set test environment variables
      process.env.SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || 'test-client-id';
      process.env.SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || 'test-client-secret';
      process.env.SERVER_URL = process.env.SERVER_URL || 'https://test.com';
      const { SlackOAuthService } = await import('./slack-oauth-service');
      service = new SlackOAuthService();
    }
  });

  afterAll(async () => {
    // Clean up all test data for our unique test organization
    if (!skipIfNoEnv && testOrganizationId && testUserId) {
      await cleanupTestOrgAndUser(testOrganizationId, testUserId);
    }
  });

  describe.sequential('initiateOAuth', () => {
    it('should create pending integration and return auth URL', async () => {
      // Ensure no existing integration
      const existing = await slackHelpers.getActiveIntegration(testOrganizationId);
      expect(existing).toBeNull();

      // Initiate OAuth
      const result = await service.initiateOAuth({
        organizationId: testOrganizationId,
        userId: testUserId,
        metadata: {
          returnUrl: '/dashboard',
          source: 'settings',
          projectId: '550e8400-e29b-41d4-a716-446655440000',
        },
      });

      expect(result.authUrl).toContain('https://slack.com/oauth');
      expect(result.state).toBeTruthy();

      // Verify pending integration was created
      const [pending] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, testOrganizationId));

      expect(pending).toBeTruthy();
      createdIntegrationIds.push(pending!.id);

      expect(pending!.status).toBe('pending');
      expect(pending!.userId).toBe(testUserId);
      expect(pending!.oauthState).toBeTruthy();
      expect(pending!.oauthMetadata).toMatchObject({
        returnUrl: '/dashboard',
        source: 'settings',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        initiatedAt: expect.any(String),
      });
    });

    it('should prevent duplicate active integrations', async () => {
      const testIds = generateTestIds();
      // Create an active integration with unique team ID
      const [existing] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Existing Workspace',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey: `existing-token-${Date.now()}`,
        })
        .returning();

      createdIntegrationIds.push(existing!.id);

      // Try to initiate OAuth again
      await expect(
        service.initiateOAuth({
          organizationId: testOrganizationId,
          userId: testUserId,
        })
      ).rejects.toThrow('Organization already has an active Slack integration');
    });
  });

  describe.sequential('handleOAuthCallback', () => {
    it('should complete OAuth flow and activate integration', async () => {
      // Clean up to ensure no interference
      await db
        .delete(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, testOrganizationId));

      // First create a pending integration
      const testState = `test-callback-state-${testRunId}-${Date.now()}-${Math.random()}`;
      const [pending] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testState,
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(),
          oauthMetadata: {
            returnUrl: '/settings',
            source: 'onboarding',
          },
        })
        .returning()!;

      createdIntegrationIds.push(pending!.id);

      const testIds = generateTestIds();
      // Mock the auth service to return specific state
      const mockHandleCallback = vi.fn().mockResolvedValue({
        ok: true,
        access_token: 'xoxb-callback-token',
        teamId: testIds.teamId,
        teamName: 'Callback Workspace',
        teamDomain: 'callback-workspace',
        botUserId: testIds.botUserId,
        scope: 'channels:read,chat:write,channels:join',
        installerUserId: 'U88888',
      });
      (service as any).slackAuth.handleCallback = mockHandleCallback;

      // Handle callback
      const result = await service.handleOAuthCallback({
        code: 'test-code',
        state: testState,
      });

      expect(result.success).toBe(true);
      expect(result.integrationId).toBe(pending!.id);
      expect(result.teamName).toBe('Callback Workspace');
      expect(result.metadata).toMatchObject({
        returnUrl: '/settings',
        source: 'onboarding',
      });

      // Wait for database to update
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify integration was activated
      const activatedList = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, pending!.id));

      expect(activatedList.length).toBe(1);
      const activated = activatedList[0];
      expect(activated).toBeDefined();
      expect(activated!.status).toBe('active');
      expect(activated!.teamId).toBe(testIds.teamId);
      expect(activated!.teamName).toBe('Callback Workspace');
      expect(activated!.teamDomain).toBe('callback-workspace');
      expect(activated!.botUserId).toBe(testIds.botUserId);
      expect(activated!.scope).toBe('channels:read,chat:write,channels:join');
      expect(activated!.tokenVaultKey).toBe(`slack-token-${pending!.id}`);
      expect(activated!.installedBySlackUserId).toBe('U88888');
      expect(activated!.installedAt).toBeTruthy();
      expect(activated!.oauthState).toBeNull();
      expect(activated!.oauthExpiresAt).toBeNull();
    });

    it('should handle invalid state', async () => {
      const result = await service.handleOAuthCallback({
        code: 'test-code',
        state: 'invalid-state-12345',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired OAuth state');
    });

    it('should handle OAuth errors and clean up integration', async () => {
      // Create a pending integration
      const testState = `test-error-state-${testRunId}-${Date.now()}`;
      const [pending] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testState,
          oauthExpiresAt: new Date(Date.now() + 900000).toISOString(),
        })
        .returning();

      // Don't add to cleanup since it will be deleted during the test
      // createdIntegrationIds.push(pending.id);

      // Mock OAuth error that throws
      const mockHandleCallback = vi
        .fn()
        .mockRejectedValue(new Error('Failed to exchange code for token'));
      (service as any).slackAuth.handleCallback = mockHandleCallback;

      const result = await service.handleOAuthCallback({
        code: 'bad-code',
        state: testState,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to exchange code for token');
      expect(result.integrationId).toBe(pending!.id);

      // Verify the pending integration was deleted (to allow retry)
      const integrations = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, pending!.id));

      expect(integrations.length).toBe(0);
    });
  });

  describe.sequential('getIntegrationStatus', () => {
    it('should return connected status with integration details', async () => {
      const testIds = generateTestIds();
      // Create an active integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'Status Test Workspace',
          teamDomain: 'status-test',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey: `test-token-${Date.now()}`,
          installedAt: new Date('2024-01-01').toISOString(),
          lastUsedAt: new Date('2024-01-15').toISOString(),
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const status = await service.getIntegrationStatus(testOrganizationId);

      expect(status.connected).toBe(true);
      expect(status.integration).toBeDefined();
      expect(status.integration!.id).toBe(integration!.id);
      expect(status.integration!.teamName).toBe('Status Test Workspace');
      expect(status.integration!.teamDomain).toBe('status-test');
      expect(status.integration!.installedAt).toContain('2024-01-01');
      expect(status.integration!.lastUsedAt).toContain('2024-01-15');
    });

    it('should return not connected when no integration exists', async () => {
      // Create a new organization without any integrations
      const { organizationId } = await createTestOrgAndUser();
      const status = await service.getIntegrationStatus(organizationId);

      expect(status.connected).toBe(false);
      expect(status.integration).toBeUndefined();

      // Clean up
      await db
        .delete(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, organizationId));
    });
  });

  describe.sequential('removeIntegration', () => {
    it('should soft delete integration and clean up token', async () => {
      const testIds = generateTestIds();
      // Create an active integration with a unique token vault key
      const uniqueTokenKey = `slack-token-to-remove-${testRunId}-${Date.now()}-${Math.random()}`;
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: testIds.teamId,
          teamName: 'To Remove Workspace',
          botUserId: testIds.botUserId,
          scope: 'channels:read',
          tokenVaultKey: uniqueTokenKey,
        })
        .returning();

      // Store the ID immediately
      const integrationId = integration!.id;
      createdIntegrationIds.push(integrationId);

      // Verify it was created
      const [created] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integrationId));

      expect(created).toBeDefined();
      expect(created!.status).toBe('active');

      // The service will try to delete the token from vault
      // In integration tests, we let it run naturally
      const result = await service.removeIntegration(testOrganizationId, testUserId);

      expect(result.success).toBe(true);

      // Wait a moment for the database to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify integration was soft deleted - query directly to ensure we get it
      const removedIntegrations = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integrationId));

      expect(removedIntegrations.length).toBe(1);
      const removed = removedIntegrations[0];
      expect(removed).toBeDefined();
      expect(removed!.status).toBe('revoked');
      expect(removed!.deletedAt).toBeTruthy();
    });

    it('should handle non-existent integration', async () => {
      // Create a new organization without any integrations
      const { organizationId, userId } = await createTestOrgAndUser();
      const result = await service.removeIntegration(organizationId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active Slack integration found');

      // Clean up
      await cleanupTestOrgAndUser(organizationId, userId);
    });
  });
});
