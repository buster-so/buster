import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createSecret,
  deleteSecret,
  getSecret,
  getSecretByName,
  listSecrets,
  updateSecret,
} from './vault';

describe('Vault integration tests', () => {
  const testSecretIds: string[] = [];
  const testPrefix = `test_vault_${Date.now()}_`;

  // Helper to track created secrets for cleanup
  const createTestSecret = async (secret: string, name?: string, description?: string) => {
    const id = await createSecret({
      secret,
      name: name ? `${testPrefix}${name}` : undefined,
      description,
    });
    testSecretIds.push(id);
    return id;
  };

  // Clean up all test secrets after tests
  afterAll(async () => {
    for (const id of testSecretIds) {
      try {
        await deleteSecret(id);
      } catch (error) {
        console.error(`Failed to clean up test secret ${id}:`, error);
      }
    }
  });

  // Additional cleanup before tests to ensure clean state
  beforeAll(async () => {
    // List secrets and clean up any orphaned test secrets from previous runs
    try {
      const secrets = await listSecrets(1000);
      const orphanedTestSecrets = secrets.filter((s) => s.name?.startsWith('test_vault_'));
      for (const secret of orphanedTestSecrets) {
        try {
          await deleteSecret(secret.id);
        } catch (error) {
          console.error(`Failed to clean up orphaned test secret ${secret.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to clean up orphaned test secrets:', error);
    }
  });

  it('should create a secret without name or description', async () => {
    const secretValue = 'my_test_secret_123';
    const id = await createTestSecret(secretValue);

    expect(id).toBeTruthy();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should create a secret with name and description', async () => {
    const secretValue = 'my_named_secret_456';
    const name = 'named_secret';
    const description = 'This is a test secret with name';

    const id = await createTestSecret(secretValue, name, description);

    expect(id).toBeTruthy();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should get a secret by ID', async () => {
    const secretValue = 'secret_to_retrieve_789';
    const name = 'retrievable_secret';
    const description = 'Secret for retrieval test';

    const id = await createTestSecret(secretValue, name, description);
    const retrieved = await getSecret(id);

    expect(retrieved).toBeTruthy();
    expect(retrieved?.id).toBe(id);
    expect(retrieved?.secret).toBe(secretValue);
    expect(retrieved?.name).toBe(`${testPrefix}${name}`);
    expect(retrieved?.description).toBe(description);
    expect(retrieved?.created_at).toBeTruthy();
    expect(retrieved?.updated_at).toBeTruthy();
  });

  it('should get a secret by name', async () => {
    const secretValue = 'secret_by_name_101112';
    const name = 'findable_by_name';
    const description = 'Secret findable by name';

    await createTestSecret(secretValue, name, description);
    const retrieved = await getSecretByName(`${testPrefix}${name}`);

    expect(retrieved).toBeTruthy();
    expect(retrieved?.secret).toBe(secretValue);
    expect(retrieved?.name).toBe(`${testPrefix}${name}`);
    expect(retrieved?.description).toBe(description);
  });

  it('should return null for non-existent secret', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const retrieved = await getSecret(nonExistentId);
    expect(retrieved).toBeNull();
  });

  it('should return null for non-existent secret by name', async () => {
    const retrieved = await getSecretByName('non_existent_secret_name_xyz');
    expect(retrieved).toBeNull();
  });

  it('should update a secret', async () => {
    const originalSecret = 'original_secret_131415';
    const originalName = 'update_test';
    const originalDescription = 'Original description';

    const id = await createTestSecret(originalSecret, originalName, originalDescription);

    // Update the secret
    const newSecret = 'updated_secret_161718';
    const newName = 'updated_test';
    const newDescription = 'Updated description';

    const updatedId = await updateSecret({
      id,
      secret: newSecret,
      name: `${testPrefix}${newName}`,
      description: newDescription,
    });

    expect(updatedId).toBe(id);

    // Verify the update
    const retrieved = await getSecret(id);
    expect(retrieved?.secret).toBe(newSecret);
    expect(retrieved?.name).toBe(`${testPrefix}${newName}`);
    expect(retrieved?.description).toBe(newDescription);
  });

  it('should delete a secret', async () => {
    const secretValue = 'secret_to_delete_192021';
    const name = 'deletable_secret';

    const id = await createTestSecret(secretValue, name);

    // Delete the secret
    await deleteSecret(id);

    // Remove from tracking since we manually deleted it
    const index = testSecretIds.indexOf(id);
    if (index > -1) {
      testSecretIds.splice(index, 1);
    }

    // Verify it's deleted
    const retrieved = await getSecret(id);
    expect(retrieved).toBeNull();
  });

  it('should list secrets with limit', async () => {
    // Create a few test secrets
    await createTestSecret('list_test_1', 'list_1');
    await createTestSecret('list_test_2', 'list_2');
    await createTestSecret('list_test_3', 'list_3');

    // List with a reasonable limit
    const secrets = await listSecrets(50);

    expect(Array.isArray(secrets)).toBe(true);
    expect(secrets.length).toBeGreaterThan(0);
    expect(secrets.length).toBeLessThanOrEqual(50);

    // Verify structure of returned secrets
    if (secrets.length > 0) {
      const firstSecret = secrets[0];
      expect(firstSecret).toHaveProperty('id');
      expect(firstSecret).toHaveProperty('secret');
      expect(firstSecret).toHaveProperty('created_at');
      expect(firstSecret).toHaveProperty('updated_at');
    }

    // Verify our test secrets are included
    const testSecrets = secrets.filter((s) => s.name?.startsWith(testPrefix));
    expect(testSecrets.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle errors gracefully', async () => {
    // Test invalid UUID
    await expect(getSecret('invalid-uuid')).rejects.toThrow();

    // Test update of non-existent secret (Supabase doesn't throw error, just returns the ID)
    const nonExistentUpdateResult = await updateSecret({
      id: '00000000-0000-0000-0000-000000000000',
      secret: 'test',
    });
    expect(nonExistentUpdateResult).toBe('00000000-0000-0000-0000-000000000000');

    // Test invalid delete
    await expect(deleteSecret('invalid-uuid')).rejects.toThrow();
  });
});
