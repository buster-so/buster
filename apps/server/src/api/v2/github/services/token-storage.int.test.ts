import { randomUUID } from 'node:crypto';
import { deleteSecret, getSecretByName } from '@buster/database/queries';
import { afterEach, describe, expect, it } from 'vitest';
import {
  deleteInstallationToken,
  generateTokenVaultKey,
  isTokenExpired,
  retrieveInstallationToken,
  storeInstallationToken,
} from './token-storage';

describe('token-storage integration tests', () => {
  const testInstallationId = randomUUID();
  const testToken = `ghs_${randomUUID()}`;
  const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
  const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

  afterEach(async () => {
    // Clean up test data
    const key = generateTokenVaultKey(testInstallationId);
    const secret = await getSecretByName(key);
    if (secret) {
      await deleteSecret(secret.id);
    }
  });

  describe('generateTokenVaultKey', () => {
    it('should generate consistent vault key for installation ID', () => {
      // Act
      const key1 = generateTokenVaultKey('12345');
      const key2 = generateTokenVaultKey('12345');

      // Assert
      expect(key1).toBe('github_installation_12345_token');
      expect(key1).toBe(key2);
    });
  });

  describe('storeInstallationToken', () => {
    it('should store a new installation token', async () => {
      // Act
      const vaultId = await storeInstallationToken(
        testInstallationId,
        testToken,
        futureDate,
        { contents: 'read', issues: 'write' },
        'all'
      );

      // Assert
      expect(vaultId).toBeDefined();
      expect(typeof vaultId).toBe('string');

      // Verify token was stored
      const key = generateTokenVaultKey(testInstallationId);
      const secret = await getSecretByName(key);
      expect(secret).toBeDefined();
      expect(secret?.secret).toBe(testToken);
    });

    it('should update existing installation token', async () => {
      // Arrange - Store initial token
      await storeInstallationToken(testInstallationId, 'old-token', pastDate);

      // Act - Update with new token
      const newToken = `ghs_${randomUUID()}`;
      const vaultId = await storeInstallationToken(
        testInstallationId,
        newToken,
        futureDate,
        { contents: 'write' },
        'selected'
      );

      // Assert
      expect(vaultId).toBeDefined();

      // Verify token was updated
      const key = generateTokenVaultKey(testInstallationId);
      const secret = await getSecretByName(key);
      expect(secret?.secret).toBe(newToken);

      // Verify metadata was updated
      const metadata = JSON.parse(secret?.description || '{}');
      expect(metadata.expiresAt).toBe(futureDate);
      expect(metadata.permissions).toEqual({ contents: 'write' });
      expect(metadata.repositorySelection).toBe('selected');
    });
  });

  describe('retrieveInstallationToken', () => {
    it('should retrieve stored token with metadata', async () => {
      // Arrange
      await storeInstallationToken(
        testInstallationId,
        testToken,
        futureDate,
        { contents: 'read' },
        'all'
      );

      // Act
      const result = await retrieveInstallationToken(testInstallationId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.token).toBe(testToken);
      expect(result?.metadata.installationId).toBe(testInstallationId);
      expect(result?.metadata.expiresAt).toBe(futureDate);
      expect(result?.metadata.permissions).toEqual({ contents: 'read' });
      expect(result?.metadata.repositorySelection).toBe('all');
    });

    it('should return null for non-existent token', async () => {
      // Act
      const result = await retrieveInstallationToken('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle invalid metadata gracefully', async () => {
      // Arrange - Store token with invalid metadata
      const key = generateTokenVaultKey(testInstallationId);
      await storeInstallationToken(testInstallationId, testToken, futureDate);

      // Manually update with invalid JSON in description
      const secret = await getSecretByName(key);
      if (secret) {
        await updateSecret({
          id: secret.id,
          secret: testToken,
          name: key,
          description: 'invalid-json',
        });
      }

      // Act
      const result = await retrieveInstallationToken(testInstallationId);

      // Assert - Should still return token with minimal metadata
      expect(result).toBeDefined();
      expect(result?.token).toBe(testToken);
      expect(result?.metadata.installationId).toBe(testInstallationId);
    });
  });

  describe('deleteInstallationToken', () => {
    it('should delete existing token', async () => {
      // Arrange
      await storeInstallationToken(testInstallationId, testToken, futureDate);

      // Act
      await deleteInstallationToken(testInstallationId);

      // Assert
      const key = generateTokenVaultKey(testInstallationId);
      const secret = await getSecretByName(key);
      expect(secret).toBeNull();
    });

    it('should not throw when deleting non-existent token', async () => {
      // Act & Assert - Should not throw
      await expect(deleteInstallationToken('non-existent-id')).resolves.toBeUndefined();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for future expiry date', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

      // Act
      const expired = isTokenExpired(futureDate);

      // Assert
      expect(expired).toBe(false);
    });

    it('should return true for past expiry date', () => {
      // Arrange
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

      // Act
      const expired = isTokenExpired(pastDate);

      // Assert
      expect(expired).toBe(true);
    });

    it('should consider token expired 5 minutes before actual expiry', () => {
      // Arrange
      const nearFutureDate = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 minutes from now

      // Act
      const expired = isTokenExpired(nearFutureDate);

      // Assert
      expect(expired).toBe(true); // Should be expired due to 5-minute buffer
    });

    it('should handle edge case at exactly 5 minutes before expiry', () => {
      // Arrange
      const exactBufferDate = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Exactly 5 minutes from now

      // Act
      const expired = isTokenExpired(exactBufferDate);

      // Assert
      expect(expired).toBe(true); // Should be expired due to >= comparison with buffer
    });
  });
});

// Import updateSecret for the test that manually updates metadata
import { updateSecret } from '@buster/database/queries';
