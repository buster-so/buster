import {
  findUserByEmail as dbFindUserByEmail,
  findUsersByEmails as dbFindUsersByEmails,
  searchUsers as dbSearchUsers,
} from '@buster/database';
// TODO: Import createUser when implemented in database package
// import { createUser } from '@buster/database';
import type { User } from '@buster/database';
import type { UserInfo } from '../types/asset-permissions';
import { AccessControlError } from '../types/errors';

/**
 * Find a user by email address
 */
export async function findUserByEmail(
  email: string,
  options?: {
    createIfNotExists?: boolean;
    organizationId?: string;
  }
): Promise<UserInfo | null> {
  // Validate email format
  if (!email.includes('@')) {
    throw new AccessControlError('invalid_email', `Invalid email address: ${email}`);
  }

  try {
    const user = await dbFindUserByEmail(email);

    // Create user if requested and not found
    if (!user && options?.createIfNotExists) {
      // TODO: Implement user creation when createUser is available
      throw new AccessControlError(
        'not_implemented',
        'User creation not yet implemented - createUser function needs to be added to database package'
      );

      // TODO: If organizationId is provided, add user to organization
    }

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  } catch (error) {
    if (error instanceof AccessControlError) {
      throw error;
    }
    throw new AccessControlError('database_error', 'Failed to find user by email', { error });
  }
}

/**
 * Find multiple users by their email addresses
 */
export async function findUsersByEmails(
  emails: string[],
  options?: {
    createIfNotExists?: boolean;
    organizationId?: string;
  }
): Promise<{
  users: UserInfo[];
  notFound: string[];
  created: string[];
}> {
  // Validate all emails
  for (const email of emails) {
    if (!email.includes('@')) {
      throw new AccessControlError('invalid_email', `Invalid email address: ${email}`);
    }
  }

  // Handle empty array case
  if (emails.length === 0) {
    return { users: [], notFound: [], created: [] };
  }

  try {
    const userMap = await dbFindUsersByEmails(emails);
    const users: UserInfo[] = [];
    const notFound: string[] = [];
    const created: string[] = [];

    for (const email of emails) {
      const user = userMap.get(email);

      if (user) {
        users.push({
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        });
      } else if (options?.createIfNotExists) {
        // TODO: Create user when createUser is available
        // For now, treat as not found since creation is not implemented
        notFound.push(email);
      } else {
        notFound.push(email);
      }
    }

    return { users, notFound, created };
  } catch (error) {
    if (error instanceof AccessControlError) {
      throw error;
    }
    throw new AccessControlError('database_error', 'Failed to find users by emails', { error });
  }
}

/**
 * Search for users by query
 */
export async function searchUsers(
  query: string,
  options?: {
    organizationId?: string;
    includeTeams?: boolean;
    limit?: number;
  }
): Promise<UserInfo[]> {
  const { limit = 10 } = options || {};

  try {
    const users = await dbSearchUsers(query, limit);

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    }));

    // TODO: Implement team search when teams table is available
  } catch (error) {
    throw new AccessControlError('database_error', 'Failed to search users', { error });
  }
}
