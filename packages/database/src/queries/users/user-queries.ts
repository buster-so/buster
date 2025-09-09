import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { users, usersToOrganizations } from '../../schema';
import type { User } from './user';

// Use the full User type from the schema internally
type FullUser = typeof users.$inferSelect;

/**
 * Converts a full user to the public User type
 */
function toPublicUser(user: FullUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Finds a user by email address (alternative implementation)
 * @param email The email address to search for
 * @returns The user if found, null otherwise
 */
export async function findUserByEmailAlt(email: string): Promise<User | null> {
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

    const user = result[0];
    return user ? toPublicUser(user) : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

/**
 * Finds a user by email within a specific organization
 * @param email The email address to search for
 * @param organizationId The organization ID to search within
 * @returns The user if found in the organization, null otherwise
 */
export async function findUserByEmailInOrganization(
  email: string,
  organizationId: string
): Promise<User | null> {
  try {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        config: users.config,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        attributes: users.attributes,
        avatarUrl: users.avatarUrl,
        suggestedPrompts: users.suggestedPrompts,
      })
      .from(users)
      .innerJoin(
        usersToOrganizations,
        and(
          eq(users.id, usersToOrganizations.userId),
          eq(usersToOrganizations.organizationId, organizationId),
          isNull(usersToOrganizations.deletedAt)
        )
      )
      .where(eq(users.email, email))
      .limit(1);

    const user = result[0];
    return user ? toPublicUser(user) : null;
  } catch (error) {
    console.error('Error finding user in organization:', error);
    return null;
  }
}

/**
 * Creates a new user
 * @param email The user's email address
 * @param name Optional name for the user
 * @returns The created user
 */
export async function createUser(email: string, name?: string): Promise<User> {
  try {
    const result = await db
      .insert(users)
      .values({
        email,
        name: name || email.split('@')[0], // Use email prefix as default name
        config: {},
        attributes: {},
      })
      .returning();

    const user = result[0];
    if (!user) {
      throw new Error('Failed to create user');
    }

    return toPublicUser(user);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Adds a user to an organization
 * @param userId The user ID
 * @param organizationId The organization ID
 * @param role The user's role in the organization
 */
export async function addUserToOrganization(
  userId: string,
  organizationId: string,
  role:
    | 'workspace_admin'
    | 'data_admin'
    | 'querier'
    | 'restricted_querier'
    | 'viewer' = 'restricted_querier'
) {
  try {
    await db.insert(usersToOrganizations).values({
      userId,
      organizationId,
      role,
      sharingSetting: 'none',
      editSql: false,
      uploadCsv: false,
      exportAssets: false,
      emailSlackEnabled: false,
      createdBy: userId, // Self-created for API users
      updatedBy: userId,
      status: 'active',
    });
  } catch (error) {
    console.error('Error adding user to organization:', error);
    throw error;
  }
}
