import type { User } from '@buster/database';
import {
  addUserToOrganization,
  createUser,
  db,
  findUserByEmailInOrganization,
} from '@buster/database';
import { PublicChatError, PublicChatErrorCode } from '@buster/server-shared';

/**
 * Resolves a user by email within an organization
 * Creates the user if they don't exist
 * @param email The user's email address
 * @param organizationId The organization ID
 * @returns The resolved user
 */
export async function resolveUser(email: string, organizationId: string): Promise<User> {
  try {
    // First, try to find the user in the organization
    let user = await findUserByEmailInOrganization(email, organizationId);

    if (!user) {
      // User doesn't exist in org, create them with transaction for atomicity
      user = await db.transaction(async (_tx) => {
        // Create the user
        const newUser = await createUser(email);

        // Add user to the organization with restricted_querier role
        await addUserToOrganization(newUser.id, organizationId, 'restricted_querier');

        return newUser;
      });
    }

    return user;
  } catch (error) {
    console.error('Error resolving user:', error);
    throw new PublicChatError(
      PublicChatErrorCode.USER_CREATION_FAILED,
      'Failed to resolve user',
      500
    );
  }
}

/**
 * Validates that a user has permissions within an organization
 * @param user The user to validate
 * @param organizationId The organization ID
 * @returns True if the user has valid permissions
 */
export async function validateUserPermissions(
  user: User,
  _organizationId: string
): Promise<boolean> {
  // For now, we just check that the user exists
  // In the future, we might check specific permissions
  if (!user || !user.id) {
    return false;
  }

  // Additional permission checks can be added here
  // For example, checking if the user's role allows API access

  return true;
}

/**
 * Enriches user context with additional data if needed
 * @param user The user to enrich
 * @returns The enriched user
 */
export async function enrichUserContext(user: User): Promise<User> {
  // For now, just return the user as-is
  // In the future, we might add:
  // - User preferences
  // - API usage limits
  // - Custom attributes
  return user;
}

/**
 * Composed function to resolve and validate a user
 * @param email The user's email
 * @param organizationId The organization ID
 * @returns The validated user
 */
export async function resolveAndValidateUser(email: string, organizationId: string): Promise<User> {
  // Resolve the user (create if needed)
  const user = await resolveUser(email, organizationId);

  // Validate permissions
  const hasPermissions = await validateUserPermissions(user, organizationId);
  if (!hasPermissions) {
    throw new PublicChatError(
      PublicChatErrorCode.INSUFFICIENT_PERMISSIONS,
      'User does not have valid permissions',
      403
    );
  }

  // Enrich the user context
  const enrichedUser = await enrichUserContext(user);

  return enrichedUser;
}
