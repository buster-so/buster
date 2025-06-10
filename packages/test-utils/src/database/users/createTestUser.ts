import { db, users } from '@buster/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a test user record in the database
 * @param params - Optional parameters to override defaults
 * @returns The user ID
 */
export async function createTestUser(params?: {
  email?: string;
  name?: string;
}): Promise<string> {
  try {
    const userId = uuidv4();
    const email = params?.email || `test-${uuidv4()}@example.com`;
    const name = params?.name || 'Test User';

    await db.insert(users).values({
      id: userId,
      email,
      name,
    });

    return userId;
  } catch (error) {
    throw new Error(
      `Failed to create test user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
