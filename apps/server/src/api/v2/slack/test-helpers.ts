import { randomUUID } from 'node:crypto';
import {
  db,
  organizations,
  slackIntegrations,
  users,
  usersToOrganizations,
} from '@buster/database';
import { eq } from 'drizzle-orm';

/**
 * Creates a test organization and user, linking them together
 * @returns The created organization and user IDs
 */
export async function createTestOrgAndUser() {
  const organizationId = randomUUID();
  const userId = randomUUID();
  const timestamp = Date.now();

  try {
    // Create organization with all required fields
    await db.insert(organizations).values({
      id: organizationId,
      name: `Test Organization ${timestamp}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      domain: `test-${timestamp}`,
      paymentRequired: false,
    });

    // Create user with all required fields
    await db.insert(users).values({
      id: userId,
      email: `test-${timestamp}@example.com`,
      name: `Test User ${timestamp}`,
      // Let the database handle defaults
    });

    // Link user to organization with all required fields
    await db.insert(usersToOrganizations).values({
      userId,
      organizationId,
      role: 'workspace_admin',
      createdBy: userId,
      updatedBy: userId,
      // Let the database handle defaults for other fields
    });

    return { organizationId, userId };
  } catch (error) {
    // If creation fails, clean up any partial data
    try {
      await db
        .delete(usersToOrganizations)
        .where(eq(usersToOrganizations.organizationId, organizationId));
      await db.delete(organizations).where(eq(organizations.id, organizationId));
      await db.delete(users).where(eq(users.id, userId));
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    throw error;
  }
}

/**
 * Cleans up test organization, user, and all related data
 * @param organizationId - The organization ID to clean up
 * @param userId - The user ID to clean up
 */
export async function cleanupTestOrgAndUser(organizationId: string, userId: string) {
  try {
    // Delete in order of dependencies
    // 1. Delete slack integrations first (has foreign key constraints)
    await db.delete(slackIntegrations).where(eq(slackIntegrations.organizationId, organizationId));

    // 2. Delete user-organization link
    await db
      .delete(usersToOrganizations)
      .where(eq(usersToOrganizations.organizationId, organizationId));

    // 3. Delete organization
    await db.delete(organizations).where(eq(organizations.id, organizationId));

    // 4. Delete user
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    // Continue cleanup even if some parts fail
  }
}
