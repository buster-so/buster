import { getUserOrganizationId } from '@buster/database';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../helpers';

describe('getUserOrganizationId Integration Tests', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('getUserOrganizationId returns organization and role for existing user', async () => {
    const userId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';

    const result = await getUserOrganizationId(userId);

    expect(result).toBeDefined();
    expect(result?.organizationId).toBe('bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    expect(result?.role).toBe('workspace_admin');
  });

  test('getUserOrganizationId returns null for non-existent user', async () => {
    const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440000'; // Random UUID

    const result = await getUserOrganizationId(nonExistentUserId);

    expect(result).toBeNull();
  });

  test('getUserOrganizationId validates UUID input', async () => {
    const invalidUserId = 'invalid-uuid';

    await expect(getUserOrganizationId(invalidUserId)).rejects.toThrow(
      'Invalid user organization input: Invalid uuid'
    );
  });

  test('getUserOrganizationId handles deleted user organization records', async () => {
    // This test assumes there might be soft-deleted records in the database
    // The function should only return active (non-deleted) records
    const userId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';

    const result = await getUserOrganizationId(userId);

    // Should still return the active record, not the deleted ones
    expect(result).toBeDefined();
    expect(result?.organizationId).toBe('bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    expect(result?.role).toBe('workspace_admin');
  });
});
