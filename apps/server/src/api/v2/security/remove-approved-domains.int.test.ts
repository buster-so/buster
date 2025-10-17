import type { User } from '@buster/database/queries';
import type { organizations } from '@buster/database/schema';
import type { InferSelectModel } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { removeApprovedDomainsHandler } from './remove-approved-domains';
import {
  cleanupTestOrganization,
  cleanupTestUser,
  createTestOrganizationInDb,
  createTestOrgMemberInDb,
  createTestUserInDb,
  createUserWithoutOrganization,
  getOrganizationFromDb,
} from './test-db-utils';

type Organization = InferSelectModel<typeof organizations>;

describe('removeApprovedDomainsHandler (integration)', () => {
  let testUser: User;
  let testOrg: Organization;

  beforeEach(async () => {
    // Create unique test data for each test
    testUser = await createTestUserInDb();
    testOrg = await createTestOrganizationInDb({
      domains: ['remove1.com', 'remove2.com', 'keep.com', 'stay.com'],
    });
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestUser(testUser.id);
    await cleanupTestOrganization(testOrg.id);
  });

  describe('Happy Path', () => {
    it('should remove specified domains', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['remove1.com', 'remove2.com'] };
      const result = await removeApprovedDomainsHandler(request, testUser);

      expect(result).toHaveLength(2);
      expect(result.map((d) => d.domain)).toContain('keep.com');
      expect(result.map((d) => d.domain)).toContain('stay.com');

      // Verify database was updated
      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.domains).toEqual(['keep.com', 'stay.com']);
    });

    it('should handle non-existent domain removal gracefully', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['notfound.com', 'alsonotfound.com'] };
      const result = await removeApprovedDomainsHandler(request, testUser);

      expect(result).toHaveLength(4); // All original domains remain
      const domains = result.map((d) => d.domain);
      expect(domains).toContain('remove1.com');
      expect(domains).toContain('remove2.com');
      expect(domains).toContain('keep.com');
      expect(domains).toContain('stay.com');

      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.domains).toEqual(testOrg.domains);
    });

    it('should return remaining domains', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['remove1.com'] };
      const result = await removeApprovedDomainsHandler(request, testUser);

      expect(result).toHaveLength(3);
      const domains = result.map((d) => d.domain);
      expect(domains).not.toContain('remove1.com');
      expect(domains).toContain('remove2.com');
      expect(domains).toContain('keep.com');
      expect(domains).toContain('stay.com');
    });

    it('should handle case-insensitive removal', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['REMOVE1.COM', 'Remove2.COM'] };
      const result = await removeApprovedDomainsHandler(request, testUser);

      expect(result).toHaveLength(2);
      const domains = result.map((d) => d.domain);
      expect(domains).toEqual(['keep.com', 'stay.com']);
    });

    it('should handle removal with whitespace', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['  remove1.com  ', '\tremove2.com\n'] };
      const result = await removeApprovedDomainsHandler(request, testUser);

      expect(result).toHaveLength(2);
      const domains = result.map((d) => d.domain);
      expect(domains).toEqual(['keep.com', 'stay.com']);
    });
  });

  describe('Error Cases', () => {
    it('should return 403 for non-admin users', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'querier');

      const request = { domains: ['remove1.com'] };

      await expect(removeApprovedDomainsHandler(request, testUser)).rejects.toThrow(HTTPException);
      await expect(removeApprovedDomainsHandler(request, testUser)).rejects.toMatchObject({
        status: 403,
        message: 'Insufficient admin permissions',
      });

      // Verify no domains were removed
      const org = await getOrganizationFromDb(testOrg.id);
      expect(org?.domains).toEqual(testOrg.domains);
    });

    it('should return 403 for user without valid organization membership', async () => {
      // Create a membership but then delete the organization to simulate non-existence
      const tempOrg = await createTestOrganizationInDb({});
      await createTestOrgMemberInDb(testUser.id, tempOrg.id, 'workspace_admin');
      await cleanupTestOrganization(tempOrg.id);

      const request = { domains: ['remove1.com'] };

      // When organization is deleted, user effectively has no organization
      await expect(removeApprovedDomainsHandler(request, testUser)).rejects.toThrow(HTTPException);
      await expect(removeApprovedDomainsHandler(request, testUser)).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });
    });

    it('should return 403 for user without organization', async () => {
      const userWithoutOrg = await createUserWithoutOrganization();
      const request = { domains: ['remove1.com'] };

      await expect(removeApprovedDomainsHandler(request, userWithoutOrg)).rejects.toThrow(
        HTTPException
      );
      await expect(removeApprovedDomainsHandler(request, userWithoutOrg)).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });

      // Clean up the user without organization
      await cleanupTestUser(userWithoutOrg.id);
    });
  });

  describe('Database State Verification', () => {
    it('should persist domain removal', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const request = { domains: ['remove1.com', 'remove2.com'] };
      await removeApprovedDomainsHandler(request, testUser);

      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.domains).not.toContain('remove1.com');
      expect(updatedOrg?.domains).not.toContain('remove2.com');
      expect(updatedOrg?.domains).toContain('keep.com');
      expect(updatedOrg?.domains).toContain('stay.com');
    });

    it("should update organization's updatedAt timestamp", async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'workspace_admin');

      const originalUpdatedAt = testOrg.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 100)); // Ensure time difference

      const request = { domains: ['remove1.com'] };
      await removeApprovedDomainsHandler(request, testUser);

      const updatedOrg = await getOrganizationFromDb(testOrg.id);
      expect(updatedOrg?.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(updatedOrg!.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('should handle removing all domains', async () => {
      const orgWithFewDomains = await createTestOrganizationInDb({
        domains: ['only1.com', 'only2.com'],
      });
      await createTestOrgMemberInDb(testUser.id, orgWithFewDomains.id, 'workspace_admin');

      const request = { domains: ['only1.com', 'only2.com'] };
      const result = await removeApprovedDomainsHandler(request, testUser);

      expect(result).toEqual([]);

      const updatedOrg = await getOrganizationFromDb(orgWithFewDomains.id);
      expect(updatedOrg?.domains).toEqual([]);

      await cleanupTestOrganization(orgWithFewDomains.id);
    });
  });
});
