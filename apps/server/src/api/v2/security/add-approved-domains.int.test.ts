import type { User } from '@buster/database/queries';
import type { Organization } from '@buster/server-shared/organization';
import { HTTPException } from 'hono/http-exception';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addApprovedDomainsHandler } from './add-approved-domains';
import {
  cleanupTestOrganization,
  cleanupTestUser,
  createTestOrganizationInDb,
  createTestOrgMemberInDb,
  createTestUserInDb,
  createUserWithoutOrganization,
  getOrganizationFromDb,
} from './test-db-utils';

describe('addApprovedDomainsHandler (integration)', () => {
  let testUser: User;
  let testOrg: Organization;

  beforeEach(async () => {
    // Create unique test data for each test
    testUser = await createTestUserInDb();
    testOrg = await createTestOrganizationInDb({
      domains: ['existing.com'],
    });
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestUser(testUser.id);
    await cleanupTestOrganization(testOrg.id);
  });

  describe('Happy Path', () => {
    it('should add domains to organization with existing domains', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['new.com', 'another.com'] };
      const result = await addApprovedDomainsHandler(request, testUser);

      expect(result).toHaveLength(3);
      expect(result.map((d) => d.domain)).toContain('existing.com');
      expect(result.map((d) => d.domain)).toContain('new.com');
      expect(result.map((d) => d.domain)).toContain('another.com');

      // Verify database was updated
      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.domains).toEqual(['existing.com', 'new.com', 'another.com']);
    });

    it('should add domains to organization with no existing domains', async () => {
      const orgWithNoDomains = await createTestOrganizationInDb({
        domains: null,
      });
      await createTestOrgMemberInDb(testUser.id, orgWithNoDomains.id, 'data_admin');

      const request = { domains: ['first.com', 'second.com'] };
      const result = await addApprovedDomainsHandler(request, testUser);

      expect(result).toHaveLength(2);
      expect(result.map((d) => d.domain)).toContain('first.com');
      expect(result.map((d) => d.domain)).toContain('second.com');

      const updatedOrg = await getOrganizationFromDb(orgWithNoDomains.id);
      expect(updatedOrg?.domains).toEqual(['first.com', 'second.com']);

      await cleanupTestOrganization(orgWithNoDomains.id);
    });

    it('should return updated domains list', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['NEW.COM', '  test.io  '] }; // Test normalization
      const result = await addApprovedDomainsHandler(request, testUser);

      expect(result).toHaveLength(3);
      const domains = result.map((d) => d.domain);
      expect(domains).toContain('existing.com');
      expect(domains).toContain('new.com');
      expect(domains).toContain('test.io');
    });

    it('should handle duplicate domains correctly', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['EXISTING.COM', 'new.com'] };
      const result = await addApprovedDomainsHandler(request, testUser);

      expect(result).toHaveLength(2);
      const domains = result.map((d) => d.domain);
      expect(domains).toEqual(['existing.com', 'new.com']);

      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.domains).toEqual(['existing.com', 'new.com']);
    });
  });

  describe('Error Cases', () => {
    it('should return 403 for user without organization', async () => {
      const userWithoutOrg = await createUserWithoutOrganization();
      const request = { domains: ['new.com'] };

      await expect(addApprovedDomainsHandler(request, userWithoutOrg)).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });

      // Clean up the user created for this test
      await cleanupTestUser(userWithoutOrg.id);
    });

    it('should return 403 for non-admin user', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'querier');

      const request = { domains: ['new.com'] };

      await expect(addApprovedDomainsHandler(request, testUser)).rejects.toThrow(HTTPException);
      await expect(addApprovedDomainsHandler(request, testUser)).rejects.toMatchObject({
        status: 403,
        message: 'Insufficient admin permissions',
      });
    });

    it('should return 403 for user without valid organization membership', async () => {
      // Create a membership but then delete the organization to simulate non-existence
      const tempOrg = await createTestOrganizationInDb({});
      await createTestOrgMemberInDb(testUser.id, tempOrg.id, 'workspace_admin');
      await cleanupTestOrganization(tempOrg.id);

      const request = { domains: ['new.com'] };

      // When organization is deleted, user effectively has no organization
      await expect(addApprovedDomainsHandler(request, testUser)).rejects.toThrow(HTTPException);
      await expect(addApprovedDomainsHandler(request, testUser)).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });
    });
  });

  describe('Database State Verification', () => {
    it('should persist domains to database', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['persist1.com', 'persist2.com'] };
      await addApprovedDomainsHandler(request, testUser);

      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.domains).toContain('persist1.com');
      expect(updatedOrg?.domains).toContain('persist2.com');
      expect(updatedOrg?.domains).toContain('existing.com');
    });

    it("should update organization's updatedAt timestamp", async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const originalUpdatedAt = testOrg.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure time difference

      const request = { domains: ['new.com'] };
      await addApprovedDomainsHandler(request, testUser);

      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(updatedOrg!.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });
});
