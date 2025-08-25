import {
  type User,
  and,
  dbInitialized,
  eq,
  isNull,
  organizations,
  users,
  usersToOrganizations,
} from '@buster/database';
import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';

// Zod schemas for validation
const CheckUserInOrganizationSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

const GetUserOrganizationsSchema = z.object({
  userId: z.string().uuid(),
});

const CheckEmailDomainSchema = z.object({
  email: z.string().email(),
  organizationId: z.string().uuid(),
});

const CreateUserInOrganizationSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  organizationId: z.string().uuid(),
  createdById: z.string().uuid(),
});

// Type definitions
type Organization = InferSelectModel<typeof organizations>;
type UserOrganization = InferSelectModel<typeof usersToOrganizations>;

// Response types
export interface UserOrganizationInfo {
  userId: string;
  organizationId: string;
  role: UserOrganization['role'];
  status: UserOrganization['status'];
}

export type OrganizationWithDefaults = Organization;

/**
 * Check if a user exists in an organization
 * @param userId The user ID to check
 * @param organizationId The organization ID
 * @returns User organization info if exists, null otherwise
 */
export async function checkUserInOrganization(
  userId: string,
  organizationId: string
): Promise<UserOrganizationInfo | null> {
  const input = CheckUserInOrganizationSchema.parse({ userId, organizationId });
  const db = await dbInitialized;

  const result = await db
    .select({
      userId: usersToOrganizations.userId,
      organizationId: usersToOrganizations.organizationId,
      role: usersToOrganizations.role,
      status: usersToOrganizations.status,
    })
    .from(usersToOrganizations)
    .where(
      and(
        eq(usersToOrganizations.userId, input.userId),
        eq(usersToOrganizations.organizationId, input.organizationId),
        isNull(usersToOrganizations.deletedAt)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0] as UserOrganizationInfo;
}

/**
 * Get all organizations a user belongs to
 * @param userId The user ID
 * @returns Array of user organization relationships
 */
export async function getUserOrganizations(userId: string): Promise<UserOrganizationInfo[]> {
  const input = GetUserOrganizationsSchema.parse({ userId });
  const db = await dbInitialized;

  const results = await db
    .select({
      userId: usersToOrganizations.userId,
      organizationId: usersToOrganizations.organizationId,
      role: usersToOrganizations.role,
      status: usersToOrganizations.status,
    })
    .from(usersToOrganizations)
    .where(
      and(eq(usersToOrganizations.userId, input.userId), isNull(usersToOrganizations.deletedAt))
    );

  return results;
}

/**
 * Check if an email domain matches any of the organization's allowed domains
 * @param email The email address to check
 * @param organizationId The organization ID
 * @returns true if the email domain is allowed for the organization
 */
export async function checkEmailDomainForOrganization(
  email: string,
  organizationId: string
): Promise<boolean> {
  const input = CheckEmailDomainSchema.parse({ email, organizationId });
  const db = await dbInitialized;

  // Get organization domains
  const orgResult = await db
    .select({
      domains: organizations.domains,
    })
    .from(organizations)
    .where(and(eq(organizations.id, input.organizationId), isNull(organizations.deletedAt)))
    .limit(1);

  if (orgResult.length === 0) {
    return false;
  }

  const orgData = orgResult[0];
  if (!orgData || !orgData.domains) {
    return false;
  }

  const domains = orgData.domains;
  const emailDomain = input.email.split('@')[1]?.toLowerCase();

  if (!emailDomain) {
    return false;
  }

  // Check if email domain matches any organization domain
  return domains.some((domain: string) => {
    const normalizedDomain = domain.toLowerCase().replace(/^@/, '');
    return emailDomain === normalizedDomain;
  });
}

/**
 * Get organization with its default settings
 * @param organizationId The organization ID
 * @returns Organization with defaults or null
 */
export async function getOrganizationWithDefaults(
  organizationId: string
): Promise<OrganizationWithDefaults | null> {
  const db = await dbInitialized;

  const result = await db
    .select()
    .from(organizations)
    .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0] as OrganizationWithDefaults;
}

/**
 * Create a new user and add them to an organization
 * @param email User email
 * @param name User name (optional)
 * @param organizationId Organization to add user to
 * @param createdById ID of the user creating this user (for audit)
 * @returns The created user and organization membership
 */
export async function createUserInOrganization(
  email: string,
  name: string | undefined,
  organizationId: string,
  createdById: string
): Promise<{ user: User; membership: UserOrganizationInfo }> {
  const input = CreateUserInOrganizationSchema.parse({ email, name, organizationId, createdById });
  const db = await dbInitialized;

  // Get organization defaults
  const org = await getOrganizationWithDefaults(input.organizationId);
  if (!org) {
    throw new Error(`Organization ${input.organizationId} not found`);
  }

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

  let user: User;

  if (existingUser.length > 0) {
    user = existingUser[0] as User;
  } else {
    // Create new user
    const newUsers = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name || input.email.split('@')[0], // Default name from email
        config: {},
        attributes: {},
      })
      .returning();

    user = newUsers[0] as User;
  }

  // Create organization membership
  await db
    .insert(usersToOrganizations)
    .values({
      userId: user.id,
      organizationId: input.organizationId,
      role: org.defaultRole,
      status: 'active',
      createdBy: input.createdById,
      updatedBy: input.createdById,
      // Use default permissions based on role
      sharingSetting: 'none',
      editSql: false,
      uploadCsv: false,
      exportAssets: false,
      emailSlackEnabled: false,
    })
    .onConflictDoUpdate({
      target: [usersToOrganizations.userId, usersToOrganizations.organizationId],
      set: {
        deletedAt: null,
        status: 'active',
        updatedBy: input.createdById,
        updatedAt: new Date().toISOString(),
      },
    });

  const membership: UserOrganizationInfo = {
    userId: user.id,
    organizationId: input.organizationId,
    role: org.defaultRole,
    status: 'active',
  };

  return { user, membership };
}
