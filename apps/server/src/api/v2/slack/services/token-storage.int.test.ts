import { db, slackIntegrations } from '@buster/database';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseOAuthStateStorage, DatabaseVaultTokenStorage } from './token-storage';

// Skip tests if required environment variables are not set
const skipIfNoEnv =
  !process.env.DATABASE_URL || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

describe.skipIf(skipIfNoEnv)('Token Storage Integration Tests', () => {
  beforeAll(() => {
    if (skipIfNoEnv) {
      console.log(
        'Skipping token storage integration tests - required environment variables not set'
      );
    }
  });

  describe('DatabaseVaultTokenStorage', () => {
    let storage: DatabaseVaultTokenStorage;
    const testKey = `test-token-${Date.now()}`;

    beforeEach(() => {
      if (!skipIfNoEnv) {
        storage = new DatabaseVaultTokenStorage();
      }
    });

    it('should store and retrieve token', async () => {
      const testToken = 'xoxb-test-token-12345';

      try {
        // Store token
        await storage.storeToken(testKey, testToken);

        // Retrieve token
        const retrieved = await storage.getToken(testKey);
        expect(retrieved).toBe(testToken);

        // Clean up
        await storage.deleteToken(testKey);
      } catch (error) {
        // Skip test if Supabase Vault is not properly configured
        if (error instanceof Error && error.message.includes('Failed to store token')) {
          console.log('Skipping test - Supabase Vault not configured');
          return;
        }
        throw error;
      }
    });

    it('should return null for non-existent token', async () => {
      const result = await storage.getToken('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check token existence', async () => {
      const testToken = 'xoxb-existence-test';

      try {
        // Initially should not exist
        expect(await storage.hasToken(testKey)).toBe(false);

        // Store token
        await storage.storeToken(testKey, testToken);

        // Should exist now
        expect(await storage.hasToken(testKey)).toBe(true);

        // Clean up
        await storage.deleteToken(testKey);

        // Should not exist after deletion
        expect(await storage.hasToken(testKey)).toBe(false);
      } catch (error) {
        // Skip test if Supabase Vault is not properly configured
        if (error instanceof Error && error.message.includes('Failed to store token')) {
          console.log('Skipping test - Supabase Vault not configured');
          return;
        }
        throw error;
      }
    });

    it('should handle token deletion gracefully', async () => {
      // Delete non-existent token should not throw
      await expect(storage.deleteToken('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('DatabaseOAuthStateStorage', () => {
    let storage: DatabaseOAuthStateStorage;
    // Use existing seed data IDs
    const testOrganizationId = 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce';
    const testUserId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';
    const createdIntegrationIds: string[] = [];

    beforeEach(() => {
      if (!skipIfNoEnv) {
        storage = new DatabaseOAuthStateStorage();
      }
    });

    afterAll(async () => {
      // Clean up all test data
      if (!skipIfNoEnv && createdIntegrationIds.length > 0) {
        for (const id of createdIntegrationIds) {
          await db.delete(slackIntegrations).where(eq(slackIntegrations.id, id));
        }
      }
    });

    it('should retrieve state data from pending integration', async () => {
      const testState = `test-state-${Date.now()}`;
      const expiresAt = new Date(Date.now() + 900000 + 5000); // 15 mins + 5 seconds buffer from now
      const metadata = { returnUrl: '/dashboard', source: 'test' };

      // Create a pending integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testState,
          oauthExpiresAt: expiresAt.toISOString(),
          oauthMetadata: metadata,
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      // Retrieve state
      const stateData = await storage.getState(testState);

      expect(stateData).toBeTruthy();
      expect(stateData?.expiresAt).toBe(expiresAt.getTime());
      expect(stateData?.metadata).toEqual(metadata);
    });

    it('should return null for non-existent state', async () => {
      const result = await storage.getState('non-existent-state');
      expect(result).toBeNull();
    });

    it('should return null for expired state', async () => {
      const testState = `expired-state-${Date.now()}`;
      const expiresAt = new Date(Date.now() - 60000); // 1 min ago

      // Create an expired pending integration
      const [integration] = await db
        .insert(slackIntegrations)
        .values({
          organizationId: testOrganizationId,
          userId: testUserId,
          status: 'pending',
          oauthState: testState,
          oauthExpiresAt: expiresAt.toISOString(),
        })
        .returning();

      createdIntegrationIds.push(integration.id);

      // Should return null for expired state
      const stateData = await storage.getState(testState);
      expect(stateData).toBeNull();
    });

    it('should handle storeState (no-op in this implementation)', async () => {
      // This is a no-op in our implementation since we create the state
      // directly in the database during initiateOAuth
      await expect(
        storage.storeState('test', { expiresAt: Date.now(), metadata: {} })
      ).resolves.toBeUndefined();
    });

    it('should handle deleteState (no-op in this implementation)', async () => {
      // This is a no-op in our implementation since state is cleaned up
      // automatically when integration is updated
      await expect(storage.deleteState('test')).resolves.toBeUndefined();
    });
  });
});
