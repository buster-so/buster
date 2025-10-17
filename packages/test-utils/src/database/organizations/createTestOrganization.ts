import { db } from '@buster/database/connection';
import { organizations } from '@buster/database/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a test organization record in the database
 * @param params - Optional parameters to override defaults
 * @returns The organization ID
 */
export async function createTestOrganization(params?: { name?: string }): Promise<string> {
  try {
    const organizationId = uuidv4();
    const name = params?.name || `Test Organization ${uuidv4()}`;

    await db.insert(organizations).values({
      id: organizationId,
      name,
    });

    return organizationId;
  } catch (error) {
    throw new Error(
      `Failed to create test organization: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
