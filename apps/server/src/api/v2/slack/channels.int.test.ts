import { db } from '@buster/database/connection';
import { slackIntegrations } from '@buster/database/schema';
import type { GetChannelsResponse, SlackErrorResponse } from '@buster/server-shared/slack';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import slackRoutes from './index';
import { cleanupTestOrgAndUser, createTestOrgAndUser } from './test-helpers';

// Skip tests if required environment variables are not set
const skipIfNoEnv =
  !process.env.DATABASE_URL ||
  !process.env.SLACK_CLIENT_ID ||
  !process.env.SLACK_CLIENT_SECRET ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !process.env.SLACK_TEST_ACCESS_TOKEN; // Additional env var for testing channels

// Mock the requireAuth middleware
vi.mock('../../../middleware/auth', () => ({
  requireAuth: (c: Context, next: () => Promise<void>) => {
    return next();
  },
}));

// Mock SlackChannelService if needed
const mockChannels = [
  { id: 'C1234567890', name: 'general', is_private: false, is_archived: false, is_member: true },
  { id: 'C0987654321', name: 'random', is_private: false, is_archived: false, is_member: true },
  {
    id: 'C1111111111',
    name: 'engineering',
    is_private: false,
    is_archived: false,
    is_member: false,
  },
];

// Conditionally mock SlackChannelService based on environment
if (!process.env.SLACK_TEST_ACCESS_TOKEN) {
  vi.mock('@buster/slack', () => ({
    SlackChannelService: vi.fn().mockImplementation(() => ({
      getAvailableChannels: vi.fn().mockResolvedValue(mockChannels),
    })),
    SlackAuthService: vi.fn(),
  }));
}

describe.skipIf(skipIfNoEnv)('Slack Channels Integration Tests', () => {
  let app: Hono;
  let testOrganizationId: string;
  let testUserId: string;
  const createdIntegrationIds: string[] = [];
  const testRunId = Date.now().toString();

  beforeAll(async () => {
    if (skipIfNoEnv) {
      console.log(
        'Skipping Slack channels integration tests - required environment variables not set'
      );
      return;
    }

    // Create unique test organization and user
    const { organizationId, userId } = await createTestOrgAndUser();
    testOrganizationId = organizationId;
    testUserId = userId;

    if (process.env.SLACK_TEST_ACCESS_TOKEN) {
      console.log('Running with real Slack API access token');
    } else {
      console.log('Running with mocked Slack responses');
    }
  });

  beforeEach(async () => {
    if (!skipIfNoEnv) {
      // Clean up any existing active integrations
      try {
        await db
          .delete(slackIntegrations)
          .where(eq(slackIntegrations.organizationId, testOrganizationId));
      } catch (error) {
        console.error('Error cleaning up integrations:', error);
      }

      // Create a new Hono app for each test
      app = new Hono();

      // Add middleware to set auth context
      app.use('*', async (c, next) => {
        const path = c.req.path;
        if (path.includes('/channels')) {
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

      // Mount the Slack routes
      app.route('/api/v2/slack', slackRoutes);
    }
  });

  afterAll(async () => {
    // Clean up all test data
    if (!skipIfNoEnv && testOrganizationId && testUserId) {
      await cleanupTestOrgAndUser(testOrganizationId, testUserId);
    }
  });

  describe('GET /api/v2/slack/channels', () => {
    it('should return 404 when no integration exists', async () => {
      const response = await app.request('/api/v2/slack/channels', {
        method: 'GET',
      });

      expect(response.status).toBe(404);
      const data = (await response.json()) as SlackErrorResponse;
      expect(data.error).toBe('No active Slack integration found');
      expect(data.code).toBe('INTEGRATION_NOT_FOUND');
    });

    it('should return channels for active integration', async () => {
      // Create an active integration with a token
      const tokenVaultKey = `test-token-${testRunId}-${Date.now()}`;

      // If we have a real token, store it in the vault
      if (process.env.SLACK_TEST_ACCESS_TOKEN) {
        const { createSecret } = await import('@buster/database/queries');
        await createSecret({
          secret: process.env.SLACK_TEST_ACCESS_TOKEN,
          name: tokenVaultKey,
          description: 'Test Slack OAuth token',
        });
      }

      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: `T${testRunId}-channels`,
          teamName: 'Test Workspace',
          teamDomain: 'test-workspace',
          botUserId: `U${testRunId}-bot`,
          scope: 'channels:read',
          tokenVaultKey,
          installedAt: new Date().toISOString(),
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const response = await app.request('/api/v2/slack/channels', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as GetChannelsResponse;
      expect(data.channels).toBeDefined();
      expect(Array.isArray(data.channels)).toBe(true);

      // Each channel should have id and name
      if (data.channels.length > 0) {
        expect(data.channels[0]).toHaveProperty('id');
        expect(data.channels[0]).toHaveProperty('name');
        // Should not have other properties (only id and name as requested)
        expect(Object.keys(data.channels[0]!)).toEqual(['id', 'name']);
      }

      // Clean up the secret if we created one
      if (process.env.SLACK_TEST_ACCESS_TOKEN) {
        const { deleteSecret, getSecretByName } = await import('@buster/database/queries');
        const secret = await getSecretByName(tokenVaultKey);
        if (secret) {
          await deleteSecret(secret.id);
        }
      }
    });

    it('should update last used timestamp when fetching channels', async () => {
      // Create an active integration
      const tokenVaultKey = `test-token-lastused-${testRunId}-${Date.now()}`;

      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: `T${testRunId}-lastused`,
          teamName: 'Test Workspace',
          teamDomain: 'test-workspace',
          botUserId: `U${testRunId}-bot`,
          scope: 'channels:read',
          tokenVaultKey,
          installedAt: new Date().toISOString(),
          lastUsedAt: null, // Initially null
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      await app.request('/api/v2/slack/channels', {
        method: 'GET',
      });

      // Check that lastUsedAt was updated
      const [updated] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.id, integration!.id));

      expect(updated!.lastUsedAt).toBeTruthy();
      expect(new Date(updated!.lastUsedAt!).getTime()).toBeGreaterThan(
        new Date(integration!.createdAt).getTime()
      );
    });

    it('should handle token retrieval errors', async () => {
      // Create an integration with a non-existent token key
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'active',
          teamId: `T${testRunId}-notoken`,
          teamName: 'Test Workspace',
          teamDomain: 'test-workspace',
          botUserId: `U${testRunId}-bot`,
          scope: 'channels:read',
          tokenVaultKey: 'non-existent-token-key',
          installedAt: new Date().toISOString(),
        })
        .returning();

      createdIntegrationIds.push(integration!.id);

      const response = await app.request('/api/v2/slack/channels', {
        method: 'GET',
      });

      expect(response.status).toBe(500);
      const data = (await response.json()) as SlackErrorResponse;
      expect(data.error).toBe('Failed to retrieve authentication token');
      expect(data.code).toBe('TOKEN_RETRIEVAL_ERROR');
    });
  });
});
