import type { UserOrganizationRole } from '@buster/access-controls';
import { db, eq } from '@buster/database/connection';
import type { User } from '@buster/database/queries';
import { organizations } from '@buster/database/schema';
import type { Organization } from '@buster/server-shared/organization';
import { HTTPException } from 'hono/http-exception';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getApprovedDomainsHandler } from './get-approved-domains';
import {
  cleanupTestOrganization,
  cleanupTestUser,
  createTestOrganizationInDb,
  createTestOrgMemberInDb,
  createTestUserInDb,
  createUserWithoutOrganization,
} from './test-db-utils';

describe('getApprovedDomainsHandler (integration)', () => {
  let testUser: User;
  let testOrg: Organization;

  beforeEach(async () => {
    // Create unique test data for each test
    testUser = await createTestUserInDb();
    testOrg = await createTestOrganizationInDb({
      domains: ['example.com', 'test.io'],
    });
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestUser(testUser.id);
    await cleanupTestOrganization(testOrg.id);
  });

  describe('Happy Path', () => {
    it('should return domains for valid organization', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'querier');

      const result = await getApprovedDomainsHandler(testUser);

      expect(result).toHaveLength(2);
      expect(result.map((d) => d.domain)).toContain('example.com');
      expect(result.map((d) => d.domain)).toContain('test.io');
    });

    it('should return empty array for org with no domains', async () => {
      const orgWithNoDomains = await createTestOrganizationInDb({
        domains: null,
      });
      await createTestOrgMemberInDb(testUser.id, orgWithNoDomains.id, 'querier');

      const result = await getApprovedDomainsHandler(testUser);

      expect(result).toEqual([]);

      await cleanupTestOrganization(orgWithNoDomains.id);
    });

    it('should return empty array for org with empty domains array', async () => {
      const orgWithEmptyDomains = await createTestOrganizationInDb({
        domains: [],
      });
      await createTestOrgMemberInDb(testUser.id, orgWithEmptyDomains.id, 'querier');

      const result = await getApprovedDomainsHandler(testUser);

      expect(result).toEqual([]);

      await cleanupTestOrganization(orgWithEmptyDomains.id);
    });

    it('should work for users with different roles', async () => {
      const roles: UserOrganizationRole[] = ['querier', 'data_admin', 'workspace_admin'];

      for (const role of roles) {
        let roleUser: User | undefined;
        try {
          roleUser = await createTestUserInDb();
          await createTestOrgMemberInDb(roleUser.id, testOrg.id, role);

          const result = await getApprovedDomainsHandler(roleUser);

          expect(result).toHaveLength(2);
          expect(result.map((d) => d.domain)).toContain('example.com');
          expect(result.map((d) => d.domain)).toContain('test.io');
        } finally {
          if (roleUser) {
            await cleanupTestUser(roleUser.id);
          }
        }
      }
    });
  });

  describe('Error Cases', () => {
    it('should return 403 for user without organization', async () => {
      let userWithoutOrg: User | undefined;
      try {
        userWithoutOrg = await createUserWithoutOrganization();

        await expect(getApprovedDomainsHandler(userWithoutOrg)).rejects.toThrow(HTTPException);
        await expect(getApprovedDomainsHandler(userWithoutOrg)).rejects.toMatchObject({
          status: 403,
          message: 'User is not associated with an organization',
        });
      } finally {
        if (userWithoutOrg) {
          await cleanupTestUser(userWithoutOrg.id);
        }
      }
    });

    it('should return 404 for deleted organization', async () => {
      const deletedOrg = await createTestOrganizationInDb({
        deletedAt: new Date().toISOString(),
      });
      await createTestOrgMemberInDb(testUser.id, deletedOrg.id, 'querier');

      await expect(getApprovedDomainsHandler(testUser)).rejects.toThrow(HTTPException);
      await expect(getApprovedDomainsHandler(testUser)).rejects.toMatchObject({
        status: 404,
        message: 'Organization not found',
      });

      await cleanupTestOrganization(deletedOrg.id);
    });

    it('should return 403 for user without valid organization membership', async () => {
      // Create a membership but then delete the organization to simulate non-existence
      const tempOrg = await createTestOrganizationInDb({});
      await createTestOrgMemberInDb(testUser.id, tempOrg.id, 'querier');
      await cleanupTestOrganization(tempOrg.id);

      // When organization is deleted, user effectively has no organization
      await expect(getApprovedDomainsHandler(testUser)).rejects.toThrow(HTTPException);
      await expect(getApprovedDomainsHandler(testUser)).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });
    });
  });

  describe('Data Integrity', () => {
    it('should not modify any data (read-only operation)', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'querier');

      const originalOrg = { ...testOrg };
      await getApprovedDomainsHandler(testUser);

      // Verify organization data wasn't modified
      const orgAfter = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrg.id))
        .limit(1);

      expect(orgAfter[0]?.domains).toEqual(originalOrg.domains);
      expect(new Date(orgAfter[0]!.updatedAt).toISOString()).toEqual(
        new Date(originalOrg.updatedAt).toISOString()
      );
    });

    it('should return domains in the correct format', async () => {
      await createTestOrgMemberInDb(testUser.id, testOrg.id, 'querier');

      const result = await getApprovedDomainsHandler(testUser);

      for (const domainEntry of result) {
        expect(domainEntry).toHaveProperty('domain');
        expect(domainEntry).toHaveProperty('created_at');
        expect(typeof domainEntry.domain).toBe('string');
        expect(typeof domainEntry.created_at).toBe('string');
        // Verify it's a valid ISO string
        expect(() => new Date(domainEntry.created_at)).not.toThrow();
        expect(domainEntry.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
    });
  });
});
