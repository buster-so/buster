// import { randomUUID } from 'node:crypto';
// import { db } from '@buster/database/connection';
// import { createGithubIntegration, getSecretByName } from '@buster/database/queries';
// import { createSecret, deleteSecret } from '@buster/database/queries';
// import {
//   githubIntegrations,
//   organizations,
//   users,
//   usersToOrganizations,
// } from '@buster/database/schema';
// import { eq } from 'drizzle-orm';
// import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// import { generateTestId, skipIfNoGitHubCredentials } from '../test-helpers/github-test-setup';
// import { authCallbackHandler } from './auth-callback';

// describe('Auth Callback Handler Integration Tests', () => {
//   const testIds: string[] = [];
//   const secretIds: string[] = [];
//   let testOrgId: string;
//   let testUserId: string;

//   beforeEach(async () => {
//     if (skipIfNoGitHubCredentials()) {
//       return;
//     }

//     // Set BUSTER_URL for redirect testing
//     process.env.BUSTER_URL = 'http://localhost:3000';

//     // Create test organization
//     const [org] = await db
//       .insert(organizations)
//       .values({
//         id: randomUUID(),
//         name: generateTestId('test-org'),
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       })
//       .returning();
//     if (!org) throw new Error('Failed to create test organization');
//     testOrgId = org.id;
//     testIds.push(org.id);

//     // Create test user
//     const [user] = await db
//       .insert(users)
//       .values({
//         id: randomUUID(),
//         email: `${generateTestId('test')}@example.com`,
//         name: 'Test User',
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       })
//       .returning();
//     if (!user) throw new Error('Failed to create test user');
//     testUserId = user.id;
//     testIds.push(user.id);

//     // Create user organization grant
//     const [grant] = await db
//       .insert(usersToOrganizations)
//       .values({
//         userId: testUserId,
//         organizationId: testOrgId,
//         role: 'workspace_admin',
//         createdBy: testUserId,
//         updatedBy: testUserId,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       })
//       .returning();
//   });

//   afterEach(async () => {
//     // Clean up secrets
//     for (const secretId of secretIds) {
//       try {
//         await deleteSecret(secretId);
//       } catch (error) {
//         // Ignore deletion errors
//       }
//     }
//     secretIds.length = 0;

//     // Clean up test integrations
//     await db.delete(githubIntegrations).where(eq(githubIntegrations.organizationId, testOrgId));

//     // Clean up test data
//     for (const id of testIds) {
//       try {
//         await db.delete(organizations).where(eq(organizations.id, id));
//         await db.delete(users).where(eq(users.id, id));
//       } catch (error) {
//         // Ignore deletion errors
//       }
//     }
//     testIds.length = 0;
//   });

//   describe('OAuth Callback Handling', () => {
//     it('should handle user cancellation', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const result = await authCallbackHandler({
//         error: 'access_denied',
//         error_description: 'User cancelled the authorization',
//       });

//       expect(result.redirectUrl).toBe(
//         'http://localhost:3000/app/settings/integrations?status=cancelled'
//       );
//     });

//     it('should handle GitHub errors', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const result = await authCallbackHandler({
//         error: 'server_error',
//         error_description: 'GitHub had an internal error',
//       });

//       expect(result.redirectUrl).toContain('status=error');
//       expect(result.redirectUrl).toContain('error=GitHub%20had%20an%20internal%20error');
//     });

//     it('should handle missing installation_id', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const result = await authCallbackHandler({
//         state: 'some-state',
//       });

//       expect(result.redirectUrl).toBe(
//         'http://localhost:3000/app/settings/integrations?status=error&error=missing_installation_id'
//       );
//     });

//     it('should handle missing state', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const result = await authCallbackHandler({
//         installation_id: '12345',
//       });

//       expect(result.redirectUrl).toBe(
//         'http://localhost:3000/app/settings/integrations?status=error&error=missing_state'
//       );
//     });

//     it('should handle invalid state', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const result = await authCallbackHandler({
//         installation_id: '12345',
//         state: 'invalid-state-that-does-not-exist',
//       });

//       expect(result.redirectUrl).toBe(
//         'http://localhost:3000/app/settings/integrations?status=error&error=invalid_state'
//       );
//     });

//     it('should handle expired state', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const stateId = generateTestId('state');
//       const stateKey = `github_oauth_state_${stateId}`;

//       // Create an expired state (expired 10 minutes ago)
//       const expiredMetadata = {
//         userId: testUserId,
//         organizationId: testOrgId,
//         expiresAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
//       };

//       const secretId = await createSecret({
//         name: stateKey,
//         secret: 'test-secret',
//         description: JSON.stringify(expiredMetadata),
//       });
//       secretIds.push(secretId);

//       const result = await authCallbackHandler({
//         installation_id: '12345',
//         state: stateId,
//       });

//       expect(result.redirectUrl).toBe(
//         'http://localhost:3000/app/settings/integrations?status=error&error=invalid_state'
//       );
//     });

//     it('should handle valid state but user no longer has org access', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const stateId = generateTestId('state');
//       const stateKey = `github_oauth_state_${stateId}`;

//       // Create a different org that user doesn't have access to
//       const [differentOrg] = await db
//         .insert(organizations)
//         .values({
//           id: randomUUID(),
//           name: generateTestId('different-org'),
//           createdAt: new Date().toISOString(),
//           updatedAt: new Date().toISOString(),
//         })
//         .returning();
//       if (!differentOrg) throw new Error('Failed to create different org');
//       testIds.push(differentOrg.id);

//       // Create state with different org
//       const stateMetadata = {
//         userId: testUserId,
//         organizationId: differentOrg.id, // User doesn't have access to this org
//         expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
//       };

//       const secretId = await createSecret({
//         name: stateKey,
//         secret: 'test-secret',
//         description: JSON.stringify(stateMetadata),
//       });
//       secretIds.push(secretId);

//       const result = await authCallbackHandler({
//         installation_id: '12345',
//         state: stateId,
//       });

//       expect(result.redirectUrl).toBe(
//         'http://localhost:3000/app/settings/integrations?status=error&error=unauthorized'
//       );
//     });

//     it('should handle successful callback and create integration', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const stateId = generateTestId('state');
//       const stateKey = `github_oauth_state_${stateId}`;
//       const installationId = generateTestId('install');

//       // Create valid state
//       const stateMetadata = {
//         userId: testUserId,
//         organizationId: testOrgId,
//         expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
//       };

//       const secretId = await createSecret({
//         name: stateKey,
//         secret: 'test-secret',
//         description: JSON.stringify(stateMetadata),
//       });
//       secretIds.push(secretId);

//       const result = await authCallbackHandler({
//         installation_id: installationId,
//         state: stateId,
//         setup_action: 'install',
//       });

//       // Should redirect to success
//       expect(result.redirectUrl).toContain('status=success');

//       // Verify integration was created
//       const [integration] = await db
//         .select()
//         .from(githubIntegrations)
//         .where(eq(githubIntegrations.installationId, installationId));

//       expect(integration).toBeTruthy();
//       expect(integration?.userId).toBe(testUserId);
//       expect(integration?.status).toBe('pending'); // Initial status before webhook
//     });

//     it('should handle update action for existing installation', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const stateId = generateTestId('state');
//       const stateKey = `github_oauth_state_${stateId}`;
//       const installationId = generateTestId('install');

//       // Create existing integration
//       await createGithubIntegration({
//         organizationId: testOrgId,
//         userId: testUserId,
//         installationId: installationId,
//         githubOrgId: generateTestId('github-org'),
//         status: 'active',
//       });

//       // Create valid state
//       const stateMetadata = {
//         userId: testUserId,
//         organizationId: testOrgId,
//         expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
//       };

//       const secretId = await createSecret({
//         name: stateKey,
//         secret: 'test-secret',
//         description: JSON.stringify(stateMetadata),
//       });
//       secretIds.push(secretId);

//       const result = await authCallbackHandler({
//         installation_id: installationId,
//         state: stateId,
//         setup_action: 'update',
//       });

//       // Should redirect to success
//       expect(result.redirectUrl).toContain('status=success');
//     });

//     it('should clean up state after successful callback', async () => {
//       if (skipIfNoGitHubCredentials()) {
//         return;
//       }

//       const stateId = generateTestId('state');
//       const stateKey = `github_oauth_state_${stateId}`;
//       const installationId = generateTestId('install');

//       // Create valid state
//       const stateMetadata = {
//         userId: testUserId,
//         organizationId: testOrgId,
//         expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
//       };

//       const secretId = await createSecret({
//         name: stateKey,
//         secret: 'test-secret',
//         description: JSON.stringify(stateMetadata),
//       });
//       // Don't track for cleanup since it should be auto-deleted

//       await authCallbackHandler({
//         installation_id: installationId,
//         state: stateId,
//       });

//       // Verify state was deleted
//       const deletedState = await getSecretByName(stateKey);
//       expect(deletedState).toBeNull();
//     });
//   });
// });
