import { db, slackIntegrations } from '@buster/database';
import type {
  GetIntegrationResponse,
  InitiateOAuthResponse,
  RemoveIntegrationResponse,
  SlackErrorResponse,
} from '@buster/server-shared/slack';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import slackRoutes from './index';
import { cleanupTestOrgAndUser, createTestOrgAndUser } from './test-helpers';

// Skip tests if required environment variables are not set
const skipIfNoEnv =
  !process.env.DATABASE_URL ||
  !process.env.SLACK_CLIENT_ID ||
  !process.env.SLACK_CLIENT_SECRET ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mock the requireAuth middleware
vi.mock('../../../middleware/auth', () => ({
  requireAuth: (c: Context, next: () => Promise<void>) => {
    // For tests, we'll set the auth data directly in the test
    return next();
  },
}));

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

describe.skipIf(skipIfNoEnv)('SlackHandler Integration Tests', () => {
  let app: Hono;
  // Create unique organization and user for this test suite
  let testOrganizationId: string;
  let testUserId: string;
  const createdIntegrationIds: string[] = [];

  // Add unique test run identifier to prevent conflicts
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  const testRunId = `handler-${timestamp}-${random}`;

  beforeAll(async () => {
    if (skipIfNoEnv) {
      console.log(
        'Skipping Slack handler integration tests - required environment variables not set'
      );
      return;
    }

    // Set required env vars if not already set (for testing)
    process.env.SLACK_INTEGRATION_ENABLED = 'true';
    // Ensure all required env vars are set for the service
    process.env.SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || 'test-client-id';
    process.env.SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || 'test-client-secret';

    // Create unique test organization and user
    const { organizationId, userId } = await createTestOrgAndUser();
    testOrganizationId = organizationId;
    testUserId = userId;
  });

  beforeEach(async () => {
    if (!skipIfNoEnv) {
      // Clean up only active integrations before each test to avoid conflicts
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

      // Create a new Hono app for each test
      app = new Hono();

      // Add middleware to set auth context for protected routes
      app.use('*', async (c, next) => {
        // Set auth context for protected routes
        const path = c.req.path;
        if (path.includes('/auth/init') || path.includes('/integration')) {
          (c as Context).set('busterUser', {
            id: testUserId,
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: 'https://example.com/avatar.png',
          });
          (c as Context).set('organizationId', testOrganizationId);
        }
        await next();
      });

      // Mount the Slack routes (they already have requireAuth middleware where needed)
      app.route('/api/v2/slack', slackRoutes);
    }
  });

  afterAll(async () => {
    // Clean up all test data for our unique test organization
    if (!skipIfNoEnv && testOrganizationId && testUserId) {
      await cleanupTestOrgAndUser(testOrganizationId, testUserId);
    }
  });

  describe.sequential('POST /api/v2/slack/auth/init', () => {
    it('should return 503 when integration is disabled', async () => {
      // Temporarily disable the integration
      const originalEnabled = process.env.SLACK_INTEGRATION_ENABLED;
      process.env.SLACK_INTEGRATION_ENABLED = 'false';

      // Need to clear the module cache and re-import to pick up the env change
      vi.resetModules();

      // Re-import the routes to get a fresh instance with disabled integration
      const { default: freshRoutes } = await import('./index');

      // Create a fresh app instance with the new routes
      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        if (c.req.path.includes('/auth/init')) {
          (c as Context).set('busterUser', {
            id: testUserId,
            name: 'Test User',
            email: 'test@example.com',
            avatarUrl: 'https://example.com/avatar.png',
          });
          (c as Context).set('organizationId', testOrganizationId);
        }
        await next();
      });
      testApp.route('/api/v2/slack', freshRoutes);

      const response = await testApp.request('/api/v2/slack/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata: { returnUrl: '/dashboard' } }),
      });

      expect(response.status).toBe(503);
      const data = (await response.json()) as SlackErrorResponse;
      expect(data.error).toBe('Slack integration is not enabled');
      expect(data.code).toBe('INTEGRATION_DISABLED');

      // Restore original value and reset modules again
      process.env.SLACK_INTEGRATION_ENABLED = originalEnabled;
      vi.resetModules();
    });

    it('should return 401 when user is not authenticated', async () => {
      // Create app without auth middleware but mock requireAuth to fail
      const unauthApp = new Hono();

      // Override requireAuth for this test
      vi.doMock('../../../middleware/auth', () => ({
        requireAuth: () => {
          throw new HTTPException(401, { message: 'Authentication required' });
        },
      }));

      // Re-import routes to pick up the mocked requireAuth
      const { default: slackRoutesWithFailingAuth } = await import('./index');

      unauthApp.route('/api/v2/slack', slackRoutesWithFailingAuth);

      const response = await unauthApp.request('/api/v2/slack/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata: { returnUrl: '/dashboard' } }),
      });

      expect(response.status).toBe(401);

      // Restore mock
      vi.doUnmock('../../../middleware/auth');
    });

    it('should successfully initiate OAuth flow', async () => {
      // Clean up any existing integrations before this test
      await db
        .delete(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, testOrganizationId));

      const response = await app.request('/api/v2/slack/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            returnUrl: '/dashboard',
            source: 'settings',
            projectId: '550e8400-e29b-41d4-a716-446655440000',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as InitiateOAuthResponse;
      expect(data.auth_url).toContain('https://slack.com/oauth');
      expect(data.state).toBeTruthy();

      // Verify pending integration was created in database
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

    it('should handle existing integration error', async () => {
      // Create an active integration
      const [existing] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: `T${testRunId}-existing-${Date.now()}`,
          teamName: 'Existing Workspace',
          botUserId: `U${testRunId}-bot-${Date.now()}`,
          scope: 'channels:read',
          tokenVaultKey: `existing-token-${testRunId}-${Date.now()}`,
        })
        .returning();

      createdIntegrationIds.push(existing!.id);

      const response = await app.request('/api/v2/slack/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata: { returnUrl: '/dashboard' } }),
      });

      expect(response.status).toBe(409);
      const data = (await response.json()) as SlackErrorResponse;
      expect(data.error).toBe('Organization already has an active Slack integration');
      expect(data.code).toBe('INTEGRATION_EXISTS');
    });
  });

  describe.sequential('GET /api/v2/slack/auth/callback', () => {
    it('should redirect on user denial', async () => {
      const response = await app.request('/api/v2/slack/auth/callback?error=access_denied', {
        method: 'GET',
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/app/settings/integrations?status=cancelled');
    });

    it('should redirect on invalid parameters', async () => {
      const response = await app.request('/api/v2/slack/auth/callback?invalid=params', {
        method: 'GET',
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(
        '/app/settings/integrations?status=error&error=invalid_parameters'
      );
    });

    it('should handle successful OAuth callback', async () => {
      // First create a pending integration
      const testState = `test-callback-state-${testRunId}-${Date.now()}`;
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
        .returning();

      createdIntegrationIds.push(pending!.id);

      const response = await app.request(
        `/api/v2/slack/auth/callback?code=test-code&state=${testState}`,
        {
          method: 'GET',
        }
      );

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/settings?status=success');

      // Verify integration was activated in database
      const [activated] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, pending!.id));

      expect(activated!.status).toBe('active');
      expect(activated!.teamName).toBe('Test Workspace');
      expect(activated!.tokenVaultKey).toBe(`slack-token-${pending!.id}`);
      expect(activated!.installedAt).toBeTruthy();
      expect(activated!.oauthState).toBeNull();
      expect(activated!.oauthExpiresAt).toBeNull();
    });

    it('should handle invalid state', async () => {
      const response = await app.request(
        '/api/v2/slack/auth/callback?code=test-code&state=invalid-state-12345',
        {
          method: 'GET',
        }
      );

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(
        '/app/settings/integrations?status=error&error=Invalid%20or%20expired%20OAuth%20state'
      );
    });
  });

  describe.sequential('GET /api/v2/slack/integration', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Create app without auth middleware
      const unauthApp = new Hono();
      unauthApp.route('/api/v2/slack', slackRoutes);

      const response = await unauthApp.request('/api/v2/slack/integration', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });

    it('should return integration status when connected', async () => {
      // Create an active integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: `T${testRunId}-status-${Date.now()}`,
          teamName: 'Status Test Workspace',
          teamDomain: 'status-test',
          botUserId: `U${testRunId}-bot-${Date.now()}`,
          scope: 'channels:read',
          tokenVaultKey: `test-token-${testRunId}-${Date.now()}`,
          installedAt: new Date('2024-01-01').toISOString(),
          lastUsedAt: new Date('2024-01-15').toISOString(),
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const response = await app.request('/api/v2/slack/integration', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as GetIntegrationResponse;
      expect(data.connected).toBe(true);
      expect(data.integration).toBeDefined();
      expect(data.integration!.id).toBe(integration!.id);
      expect(data.integration!.team_name).toBe('Status Test Workspace');
      expect(data.integration!.team_domain).toBe('status-test');
    });

    it('should return not connected when no integration exists', async () => {
      // Clean up any existing integrations
      await db
        .delete(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, testOrganizationId));

      const response = await app.request('/api/v2/slack/integration', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as GetIntegrationResponse;
      expect(data.connected).toBe(false);
      expect(data.integration).toBeUndefined();
    });
  });

  describe.sequential('DELETE /api/v2/slack/integration', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Create app without auth middleware
      const unauthApp = new Hono();
      unauthApp.route('/api/v2/slack', slackRoutes);

      const response = await unauthApp.request('/api/v2/slack/integration', {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });

    it('should successfully remove integration', async () => {
      // Ensure clean state before test
      await db
        .delete(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, testOrganizationId));

      // Wait for deletion to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create an active integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: `T${testRunId}-remove-${Date.now()}`,
          teamName: 'To Remove Workspace',
          botUserId: `U${testRunId}-bot-${Date.now()}`,
          scope: 'channels:read',
          tokenVaultKey: `slack-token-to-remove-${testRunId}-${Date.now()}`,
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const response = await app.request('/api/v2/slack/integration', {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as RemoveIntegrationResponse;
      expect(data.message).toBe('Slack integration removed successfully');

      // Wait a moment for the database to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify integration was soft deleted
      const removedList = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integration!.id));

      expect(removedList.length).toBe(1);
      const removed = removedList[0];
      expect(removed).toBeDefined();
      expect(removed!.status).toBe('revoked');
      expect(removed!.deletedAt).toBeTruthy();
    });

    it('should handle non-existent integration', async () => {
      // Clean up any existing integrations
      await db
        .delete(slackIntegrations)
        .where(eq(slackIntegrations.organizationId, testOrganizationId));

      // Wait a bit to ensure deletion is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await app.request('/api/v2/slack/integration', {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
      const data = (await response.json()) as SlackErrorResponse;
      expect(data.error).toBe('No active Slack integration found');
      expect(data.code).toBe('INTEGRATION_NOT_FOUND');
    });
  });
});
