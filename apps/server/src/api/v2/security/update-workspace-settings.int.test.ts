import type { User } from '@buster/database/queries';
import type { organizations } from '@buster/database/schema';
import type { UserOrganizationRole } from '@buster/server-shared/organization';
import type { InferSelectModel } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupTestOrganization,
  cleanupTestUser,
  createTestOrganizationInDb,
  createTestOrgMemberInDb,
  createTestUserInDb,
  createUserWithoutOrganization,
  getOrganizationFromDb,
  verifyUserOrgMembership,
} from './test-db-utils';
import { updateWorkspaceSettingsHandler } from './update-workspace-settings';

type Organization = InferSelectModel<typeof organizations>;

describe('updateWorkspaceSettingsHandler (integration)', () => {
  let testUser: User;
  let testOrg: Organization;

  beforeEach(async () => {
    // Create unique test data for each test
    testUser = await createTestUserInDb();
    testOrg = await createTestOrganizationInDb({
      restrictNewUserInvitations: false,
      defaultRole: 'querier',
    });
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestUser(testUser.id);
    await cleanupTestOrganization(testOrg.id);
  });

  describe('Happy Path', () => {
    it('should update all settings fields', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      // Verify membership was created properly
      const membership = await verifyUserOrgMembership(testUser.id, testOrg.id);
      expect(membership).toBeTruthy();
      expect(membership?.role).toBe('workspace_admin');

      const request = {
        restrict_new_user_invitations: true,
        default_role: 'data_admin' as const,
      };
      const result = await updateWorkspaceSettingsHandler(request, testUser);

      expect(result).toEqual({
        restrict_new_user_invitations: true,
        default_role: 'data_admin',
        default_datasets: [],
      });

      // Verify database was updated
      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.restrictNewUserInvitations).toBe(true);
      expect(updatedOrg?.defaultRole).toBe('data_admin');
    });

    it('should handle partial updates correctly', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      // Update only restrict_new_user_invitations
      const request1 = { restrict_new_user_invitations: true };
      const result1 = await updateWorkspaceSettingsHandler(request1, testUser);

      expect(result1.restrict_new_user_invitations).toBe(true);
      expect(result1.default_role).toBe('querier'); // Should remain unchanged

      // Update only default_role
      const request2 = { default_role: 'data_admin' as const };
      const result2 = await updateWorkspaceSettingsHandler(request2, testUser);

      expect(result2.restrict_new_user_invitations).toBe(true); // Should keep previous update
      expect(result2.default_role).toBe('data_admin');

      const finalOrg = await getOrganizationFromDb(testOrg.id);
      expect(finalOrg?.restrictNewUserInvitations).toBe(true);
      expect(finalOrg?.defaultRole).toBe('data_admin');
    });

    it('should return updated settings', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = {
        restrict_new_user_invitations: true,
        default_role: 'viewer' as const,
      };
      const result = await updateWorkspaceSettingsHandler(request, testUser);

      expect(result.restrict_new_user_invitations).toBe(true);
      expect(result.default_role).toBe('viewer');
      expect(result.default_datasets).toEqual([]);
    });

    it('should handle boolean false value correctly', async () => {
      // Start with true
      const orgWithTrue = await createTestOrganizationInDb({
        restrictNewUserInvitations: true,
        defaultRole: 'querier',
      });
      const userForFalse = await createTestUserInDb();
      await createTestOrgMemberInDb(userForFalse.id, orgWithTrue.id, 'workspace_admin');

      // Update to false
      const request = { restrict_new_user_invitations: false };
      const result = await updateWorkspaceSettingsHandler(request, userForFalse);

      expect(result.restrict_new_user_invitations).toBe(false);

      const updatedOrg = await getOrganizationFromDb(orgWithTrue.id);
      expect(updatedOrg?.restrictNewUserInvitations).toBe(false);

      await cleanupTestUser(userForFalse.id);
      await cleanupTestOrganization(orgWithTrue.id);
    });
  });

  describe('Error Cases', () => {
    it('should return 403 for non-workspace-admin users', async () => {
      const roles: UserOrganizationRole[] = [
        'querier',
        'restricted_querier',
        'data_admin',
        'viewer',
      ];

      for (const role of roles) {
        // Create a fresh organization for each role test to avoid conflicts
        const roleTestOrg = await createTestOrganizationInDb({
          restrictNewUserInvitations: false,
          defaultRole: 'querier',
        });

        const roleUser = await createTestUserInDb();
        await createTestOrgMemberInDb(roleUser.id, roleTestOrg.id, role);

        const request = { restrict_new_user_invitations: true };

        await expect(updateWorkspaceSettingsHandler(request, roleUser)).rejects.toMatchObject({
          status: 403,
          message: 'Only workspace admins can update workspace settings',
        });

        // Verify settings weren't changed
        const org = await getOrganizationFromDb(roleTestOrg.id);
        expect(org?.restrictNewUserInvitations).toBe(false);

        // Clean up both user and org
        await cleanupTestUser(roleUser.id);
        await cleanupTestOrganization(roleTestOrg.id);
      }
    });

    it('should return 403 for user without valid organization membership', async () => {
      // Create a membership but then delete the organization to simulate non-existence
      const tempOrg = await createTestOrganizationInDb({});
      await createTestOrgMemberInDb(testUser.id, tempOrg.id, 'workspace_admin');
      await cleanupTestOrganization(tempOrg.id);

      const request = { restrict_new_user_invitations: true };

      // When organization is deleted, user effectively has no organization
      await expect(updateWorkspaceSettingsHandler(request, testUser)).rejects.toThrow(
        HTTPException
      );
      await expect(updateWorkspaceSettingsHandler(request, testUser)).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });
    });

    it('should return 403 for user without organization', async () => {
      const isolatedUser = await createUserWithoutOrganization();

      const request = { restrict_new_user_invitations: true };

      await expect(updateWorkspaceSettingsHandler(request, isolatedUser)).rejects.toThrow(
        HTTPException
      );
      await expect(updateWorkspaceSettingsHandler(request, isolatedUser)).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });

      // Clean up
      await cleanupTestUser(isolatedUser.id);
    });
  });

  describe('Database State Verification', () => {
    it('should persist settings changes', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = {
        restrict_new_user_invitations: true,
        default_role: 'viewer' as const,
      };
      await updateWorkspaceSettingsHandler(request, testUser);

      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.restrictNewUserInvitations).toBe(true);
      expect(updatedOrg?.defaultRole).toBe('viewer');
    });

    it('should not affect other organization fields', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const originalDomains = testOrg.domains;
      const originalName = testOrg.name;
      const originalCreatedAt = testOrg.createdAt;

      const request = { default_role: 'data_admin' as const };
      await updateWorkspaceSettingsHandler(request, testUser);

      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.domains).toEqual(originalDomains);
      expect(updatedOrg?.name).toBe(originalName);
      expect(new Date(updatedOrg!.createdAt).toISOString()).toBe(originalCreatedAt);
    });

    it("should update organization's updatedAt timestamp", async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const originalUpdatedAt = testOrg.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 100)); // Ensure time difference

      const request = { restrict_new_user_invitations: true };
      await updateWorkspaceSettingsHandler(request, testUser);

      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(updatedOrg!.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('should handle empty update request', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = {};
      const result = await updateWorkspaceSettingsHandler(request, testUser);

      // Should return current settings unchanged
      expect(result).toEqual({
        restrict_new_user_invitations: false,
        default_role: 'querier',
        default_datasets: [],
      });

      // But updatedAt should still be updated
      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(new Date(updatedOrg!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(testOrg.updatedAt).getTime()
      );
    });
  });
});
