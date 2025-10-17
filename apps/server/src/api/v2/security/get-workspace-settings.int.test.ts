import { db, eq } from '@buster/database/connection';
import type { User } from '@buster/database/queries';
import { organizations } from '@buster/database/schema';
import type { UserOrganizationRole } from '@buster/server-shared/organization';
import type { InferSelectModel } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getWorkspaceSettingsHandler } from './get-workspace-settings';
import {
  cleanupTestOrganization,
  cleanupTestUser,
  createTestOrganizationInDb,
  createTestOrgMemberInDb,
  createTestUserInDb,
  createUserWithoutOrganization,
} from './test-db-utils';

type Organization = InferSelectModel<typeof organizations>;

describe('getWorkspaceSettingsHandler (integration)', () => {
  let testUser: User;
  let testOrg: Organization;

  beforeEach(async () => {
    // Create unique test data for each test
    testUser = await createTestUserInDb();
    testOrg = await createTestOrganizationInDb({
      restrictNewUserInvitations: true,
      defaultRole: 'querier',
    });
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestUser(testUser.id);
    await cleanupTestOrganization(testOrg.id);
  });

  describe('Happy Path', () => {
    it('should return settings for valid organization', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'querier');

      const result = await getWorkspaceSettingsHandler(testUser);

      expect(result).toEqual({
        restrict_new_user_invitations: true,
        default_role: 'querier',
        default_datasets: [],
      });
    });

    it('should handle all field types correctly', async () => {
      const orgWithDifferentSettings = await createTestOrganizationInDb({
        restrictNewUserInvitations: false,
        defaultRole: 'data_admin',
      });
      await createTestOrgMemberInDb(testUser.id, orgWithDifferentSettings.id, 'querier');

      const result = await getWorkspaceSettingsHandler(testUser);

      expect(result.restrict_new_user_invitations).toBe(false);
      expect(result.default_role).toBe('data_admin');
      expect(result.default_datasets).toEqual([]);

      await cleanupTestOrganization(orgWithDifferentSettings.id);
    });

    it('should work for users with different roles', async () => {
      const roles: UserOrganizationRole[] = [
        'querier',
        'restricted_querier',
        'data_admin',
        'workspace_admin',
      ];

      for (const role of roles) {
        const roleUser = await createTestUserInDb();
        await createTestOrgMemberInDb(roleUser.id, testOrg.id, role);

        const result = await getWorkspaceSettingsHandler(roleUser);

        expect(result).toEqual({
          restrict_new_user_invitations: true,
          default_role: 'querier',
          default_datasets: [],
        });

        await cleanupTestUser(roleUser.id);
      }
    });

    it('should return correct boolean values', async () => {
      // Test with false value
      const orgWithFalse = await createTestOrganizationInDb({
        restrictNewUserInvitations: false,
        defaultRole: 'querier',
      });
      await createTestOrgMemberInDb(testUser.id, orgWithFalse.id, 'querier');

      const resultFalse = await getWorkspaceSettingsHandler(testUser);
      expect(resultFalse.restrict_new_user_invitations).toBe(false);

      await cleanupTestOrganization(orgWithFalse.id);

      // Test with true value
      const orgWithTrue = await createTestOrganizationInDb({
        restrictNewUserInvitations: true,
        defaultRole: 'querier',
      });
      const userForTrue = await createTestUserInDb();
      await createTestOrgMemberInDb(userForTrue.id, orgWithTrue.id, 'querier');

      const resultTrue = await getWorkspaceSettingsHandler(userForTrue);
      expect(resultTrue.restrict_new_user_invitations).toBe(true);

      await cleanupTestUser(userForTrue.id);
      await cleanupTestOrganization(orgWithTrue.id);
    });
  });

  describe('Error Cases', () => {
    it('should return 403 for user without organization', async () => {
      const userWithoutOrg = await createUserWithoutOrganization();

      await expect(getWorkspaceSettingsHandler(userWithoutOrg)).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });

      await cleanupTestUser(userWithoutOrg.id);
    });

    it('should return 403 for user without valid organization membership', async () => {
      // Create a membership but then delete the organization to simulate non-existence
      const tempOrg = await createTestOrganizationInDb({});
      await createTestOrgMemberInDb(testUser.id, tempOrg.id, 'querier');
      await cleanupTestOrganization(tempOrg.id);

      // When organization is deleted, user effectively has no organization
      await expect(getWorkspaceSettingsHandler(testUser)).rejects.toThrow(HTTPException);
      await expect(getWorkspaceSettingsHandler(testUser)).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });
    });

    it('should return 404 for deleted organization', async () => {
      const deletedOrg = await createTestOrganizationInDb({
        deletedAt: new Date().toISOString(),
      });
      await createTestOrgMemberInDb(testUser.id, deletedOrg.id, 'querier');

      await expect(getWorkspaceSettingsHandler(testUser)).rejects.toThrow(HTTPException);
      await expect(getWorkspaceSettingsHandler(testUser)).rejects.toMatchObject({
        status: 404,
        message: 'Organization not found',
      });

      await cleanupTestOrganization(deletedOrg.id);
    });
  });

  describe('Data Integrity', () => {
    it('should not modify any data (read-only operation)', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'querier');

      const originalOrg = { ...testOrg };
      await getWorkspaceSettingsHandler(testUser);

      // Verify organization data wasn't modified
      const orgAfter = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrg.id))
        .limit(1);

      expect(orgAfter.length).toBe(1);
      expect(orgAfter[0]?.restrictNewUserInvitations).toEqual(
        originalOrg.restrictNewUserInvitations
      );
      expect(orgAfter[0]?.defaultRole).toEqual(originalOrg.defaultRole);
      expect(new Date(orgAfter[0]!.updatedAt).toISOString()).toEqual(originalOrg.updatedAt);
    });

    it('should always return empty default_datasets array', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'querier');

      const result = await getWorkspaceSettingsHandler(testUser);

      expect(result.default_datasets).toBeDefined();
      expect(Array.isArray(result.default_datasets)).toBe(true);
      expect(result.default_datasets).toHaveLength(0);
    });

    it('should return settings in correct format', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'querier');

      const result = await getWorkspaceSettingsHandler(testUser);

      // Check property names are in snake_case
      expect(result).toHaveProperty('restrict_new_user_invitations');
      expect(result).toHaveProperty('default_role');
      expect(result).toHaveProperty('default_datasets');

      // Check property types
      expect(typeof result.restrict_new_user_invitations).toBe('boolean');
      expect(typeof result.default_role).toBe('string');
      expect(Array.isArray(result.default_datasets)).toBe(true);
    });
  });
});
