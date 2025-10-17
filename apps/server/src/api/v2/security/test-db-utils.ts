import { randomUUID } from 'node:crypto';
import { db } from '@buster/database/connection';
import type { User } from '@buster/database/queries';
import { organizations, users, usersToOrganizations } from '@buster/database/schema';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

type Organization = InferSelectModel<typeof organizations>;

import type { UserOrganizationRole } from '@buster/access-controls';
import { and, eq, isNull } from 'drizzle-orm';

export async function createTestUserInDb(userData: Partial<User> = {}): Promise<User> {
  const id = randomUUID();
  // Use a unique domain that won't match any test organization
  const uniqueEmail = `test-${id}@user-${id.substring(0, 8)}.test`;
  const user = {
    id,
    email: userData.email || uniqueEmail,
    name: 'Test User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    auth0Id: `auth0|test-${id}`,
    busterEnabled: true,
    ...userData,
  };

  try {
    await db.insert(users).values(user);
  } catch (error: unknown) {
    // If the insert fails due to the auto_add_user_to_organizations trigger,
    // it means there's a missing organization. In tests, we can ignore this
    // and clean up any partial data
    if (
      error instanceof Error &&
      error.message?.includes('users_to_organizations_organization_id_fkey')
    ) {
      // Try to clean up any partial user data
      await db.delete(usersToOrganizations).where(eq(usersToOrganizations.userId, id));
      // Re-throw to let the test handle it
      throw new Error(
        `Failed to create test user: Database trigger tried to add user to non-existent organization. ${error.message}`
      );
    }
    throw error;
  }

  return user as User;
}

export async function createTestOrganizationInDb(
  orgData: Partial<Organization> = {}
): Promise<Organization> {
  const id = randomUUID();
  // Use a unique domain for each organization to avoid conflicts with the trigger
  const uniqueDomain = `test-${id.substring(0, 8)}.com`;
  const org: Organization = {
    id,
    name: `Test Organization ${id}`,
    domains: orgData.domains !== undefined ? orgData.domains : [uniqueDomain],
    restrictNewUserInvitations: false,
    defaultRole: 'restricted_querier' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    domain: null,
    paymentRequired: true,
    organizationColorPalettes: {
      selectedId: null,
      palettes: [],
      selectedDictionaryPalette: null,
    },
    ...orgData,
  };

  await db.insert(organizations).values(org);
  return org;
}

export async function createTestOrgMemberInDb(
  userId: string,
  organizationId: string,
  role: UserOrganizationRole = 'querier'
): Promise<void> {
  // First check if there's already a membership
  const existing = await db
    .select()
    .from(usersToOrganizations)
    .where(and(eq(usersToOrganizations.userId, userId), isNull(usersToOrganizations.deletedAt)));

  if (existing.length > 0) {
    // Delete existing memberships silently
    await db.delete(usersToOrganizations).where(eq(usersToOrganizations.userId, userId));
  }

  const member: InferInsertModel<typeof usersToOrganizations> = {
    userId,
    organizationId,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    createdBy: userId,
    updatedBy: userId,
  };

  await db.insert(usersToOrganizations).values(member);

  // Verify the membership was created
  const verification = await db
    .select()
    .from(usersToOrganizations)
    .where(
      and(
        eq(usersToOrganizations.userId, userId),
        eq(usersToOrganizations.organizationId, organizationId),
        isNull(usersToOrganizations.deletedAt)
      )
    )
    .limit(1);

  if (!verification.length) {
    throw new Error('Failed to create test organization membership');
  }

  if (verification[0]?.role !== role) {
    throw new Error(`Role mismatch: expected ${role}, got ${verification[0]?.role}`);
  }
}

export async function cleanupTestUser(userId: string): Promise<void> {
  // Delete organization memberships
  await db.delete(usersToOrganizations).where(eq(usersToOrganizations.userId, userId));

  // Delete user
  await db.delete(users).where(eq(users.id, userId));
}

export async function cleanupTestOrganization(orgId: string): Promise<void> {
  // Import the necessary tables for cleanup
  const { permissionGroups, datasetsToPermissionGroups } = await import('@buster/database/schema');

  // Delete dataset associations for default permission group
  const defaultPermissionGroupName = `default:${orgId}`;
  const pgResult = await db
    .select({ id: permissionGroups.id })
    .from(permissionGroups)
    .where(eq(permissionGroups.name, defaultPermissionGroupName))
    .limit(1);

  if (pgResult[0]) {
    await db
      .delete(datasetsToPermissionGroups)
      .where(eq(datasetsToPermissionGroups.permissionGroupId, pgResult[0].id));
  }

  // Delete permission groups
  await db.delete(permissionGroups).where(eq(permissionGroups.organizationId, orgId));

  // Delete organization memberships
  await db.delete(usersToOrganizations).where(eq(usersToOrganizations.organizationId, orgId));

  // Delete organization
  await db.delete(organizations).where(eq(organizations.id, orgId));
}

export async function getOrganizationFromDb(orgId: string): Promise<Organization | null> {
  const result = await db
    .select()
    .from(organizations)
    .where(and(eq(organizations.id, orgId), isNull(organizations.deletedAt)))
    .limit(1);

  return (result[0] as Organization) || null;
}

// Helper to verify user organization membership
export async function verifyUserOrgMembership(
  userId: string,
  organizationId: string
): Promise<{
  organizationId: string;
  role: string;
} | null> {
  const result = await db
    .select({
      organizationId: usersToOrganizations.organizationId,
      role: usersToOrganizations.role,
    })
    .from(usersToOrganizations)
    .where(
      and(
        eq(usersToOrganizations.userId, userId),
        eq(usersToOrganizations.organizationId, organizationId),
        isNull(usersToOrganizations.deletedAt)
      )
    )
    .limit(1);

  return result[0] || null;
}

// Helper to create a user without any organization
export async function createUserWithoutOrganization(): Promise<User> {
  const user = await createTestUserInDb();

  // Remove any auto-created organization memberships
  await db.delete(usersToOrganizations).where(eq(usersToOrganizations.userId, user.id));

  return user;
}
