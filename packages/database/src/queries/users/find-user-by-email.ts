import type { InferSelectModel } from 'drizzle-orm';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../../connection';
import { users } from '../../schema';

type User = InferSelectModel<typeof users>;

/**
 * Find a user by their email address
 * Returns null if user not found
 */

export async function findUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return user || null;
}

/**
 * Find multiple users by their email addresses
 * Returns a map of email to user
 */
export async function findUsersByEmails(emails: string[]): Promise<Map<string, User>> {
  if (emails.length === 0) {
    return new Map();
  }

  // Use inArray for efficient bulk lookup
  const foundUsers = await db.select().from(users).where(inArray(users.email, emails));

  // Create map of email to user
  const userMap = new Map<string, User>();
  foundUsers.forEach((user) => {
    userMap.set(user.email, user);
  });

  return userMap;
}

/**
 * Search users by name or email
 */
export async function searchUsers(query: string, limit = 10): Promise<User[]> {
  // For now, do exact email match
  // TODO: Implement proper search with ILIKE for name/email
  return await db.select().from(users).where(eq(users.email, query)).limit(limit);
}
