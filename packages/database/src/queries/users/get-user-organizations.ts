import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { usersToOrganizations } from '../../schema';

type UserOrganization = InferSelectModel<typeof usersToOrganizations>;

/**
 * Get all organizations a user belongs to
 * Returns array of user-organization relationships
 */
export async function getUserOrganizationsByUserId(userId: string): Promise<UserOrganization[]> {
  return await db
    .select()
    .from(usersToOrganizations)
    .where(and(eq(usersToOrganizations.userId, userId), isNull(usersToOrganizations.deletedAt)));
}
