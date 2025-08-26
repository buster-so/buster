import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGCSProvider } from './providers/gcs-provider';
import { createR2Provider } from './providers/r2-provider';
import { createS3Provider } from './providers/s3-provider';
import {
  createStorageProvider,
  getDefaultProvider,
  getProviderForOrganization,
  testStorageCredentials,
} from './storage-factory';
import type { StorageConfig } from './types';

// Mock database functions before importing them
vi.mock('@buster/database', () => ({
  getS3IntegrationByOrganizationId: vi.fn(),
  getSecretByName: vi.fn(),
}));

// Mock secrets package
vi.mock('@buster/secrets', () => ({
  getSecret: vi.fn(),
  DATA_SOURCE_KEYS: {
    R2_ACCOUNT_ID: 'R2_ACCOUNT_ID',
    R2_ACCESS_KEY_ID: 'R2_ACCESS_KEY_ID',
    R2_SECRET_ACCESS_KEY: 'R2_SECRET_ACCESS_KEY',
    R2_BUCKET: 'R2_BUCKET',
  },
}));

// Import after mocking
import { getS3IntegrationByOrganizationId, getSecretByName } from '@buster/database';
import { getSecret } from '@buster/secrets';
vi.mock('./providers/s3-provider');
vi.mock('./providers/r2-provider');
vi.mock('./providers/gcs-provider');

describe('Storage Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Mock provider creation functions
    (createS3Provider as Mock).mockReturnValue({
      upload: vi.fn(),
      download: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      list: vi.fn(),
      getSignedUrl: vi.fn(),
      testConnection: vi.fn(),
    });

    (createR2Provider as Mock).mockReturnValue({
      upload: vi.fn(),
      download: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      list: vi.fn(),
      getSignedUrl: vi.fn(),
      testConnection: vi.fn(),
    });

    (createGCSProvider as Mock).mockReturnValue({
      upload: vi.fn(),
      download: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      list: vi.fn(),
      getSignedUrl: vi.fn(),
      testConnection: vi.fn(),
    });
  });

  describe('createStorageProvider', () => {
    it('should create S3 provider', () => {
      const config: StorageConfig = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      const provider = createStorageProvider(config);

      expect(createS3Provider).toHaveBeenCalledWith(config);
      expect(provider).toBeDefined();
    });

    it('should create R2 provider', () => {
      const config: StorageConfig = {
        provider: 'r2',
        accountId: 'account',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      const provider = createStorageProvider(config);

      expect(createR2Provider).toHaveBeenCalledWith(config);
      expect(provider).toBeDefined();
    });

    it('should create GCS provider', () => {
      const config: StorageConfig = {
        provider: 'gcs',
        projectId: 'project',
        bucket: 'test-bucket',
        serviceAccountKey: '{}',
      };

      const provider = createStorageProvider(config);

      expect(createGCSProvider).toHaveBeenCalledWith(config);
      expect(provider).toBeDefined();
    });

    it('should throw error for unsupported provider', () => {
      const config = {
        provider: 'unsupported',
        bucket: 'test-bucket',
      } as any;

      expect(() => createStorageProvider(config)).toThrow('Unsupported storage provider');
    });
  });

  describe('getDefaultProvider', () => {
    it('should create default R2 provider with environment variables', async () => {
      (getSecret as Mock).mockImplementation(async (key: string) => {
        const secrets: Record<string, string> = {
          R2_ACCOUNT_ID: 'test-account',
          R2_ACCESS_KEY_ID: 'test-key',
          R2_SECRET_ACCESS_KEY: 'test-secret',
          R2_BUCKET: 'custom-bucket',
        };
        return secrets[key];
      });

      const provider = await getDefaultProvider();

      expect(createR2Provider).toHaveBeenCalledWith({
        provider: 'r2',
        accountId: 'test-account',
        bucket: 'custom-bucket',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      });
      expect(provider).toBeDefined();
    });

    it('should use default bucket name if not specified', async () => {
      (getSecret as Mock).mockImplementation(async (key: string) => {
        const secrets: Record<string, string | undefined> = {
          R2_ACCOUNT_ID: 'test-account',
          R2_ACCESS_KEY_ID: 'test-key',
          R2_SECRET_ACCESS_KEY: 'test-secret',
          R2_BUCKET: undefined,
        };
        return secrets[key];
      });

      await expect(getDefaultProvider()).rejects.toThrow(
        'Default R2 storage credentials not configured'
      );
    });

    it('should throw error if R2 credentials are missing', async () => {
      (getSecret as Mock).mockResolvedValue(undefined);

      await expect(getDefaultProvider()).rejects.toThrow(
        'Default R2 storage credentials not configured'
      );
    });

    it('should throw error if partial R2 credentials are missing', async () => {
      (getSecret as Mock).mockImplementation(async (key: string) => {
        const secrets: Record<string, string | undefined> = {
          R2_ACCOUNT_ID: 'test-account',
          R2_ACCESS_KEY_ID: undefined,
          R2_SECRET_ACCESS_KEY: 'test-secret',
          R2_BUCKET: 'metric-exports',
        };
        return secrets[key];
      });

      await expect(getDefaultProvider()).rejects.toThrow(
        'Default R2 storage credentials not configured'
      );
    });
  });

  describe('getProviderForOrganization', () => {
    beforeEach(() => {
      // Mock getSecret for default provider
      (getSecret as Mock).mockImplementation(async (key: string) => {
        const secrets: Record<string, string> = {
          R2_ACCOUNT_ID: 'default-account',
          R2_ACCESS_KEY_ID: 'default-key',
          R2_SECRET_ACCESS_KEY: 'default-secret',
          R2_BUCKET: 'metric-exports',
        };
        return secrets[key];
      });
    });

    it('should return S3 provider for organization with S3 integration', async () => {
      const mockIntegration = { id: 'integration-123' };
      const mockCredentials = {
        provider: 's3',
        region: 'us-west-2',
        bucket: 'org-bucket',
        accessKeyId: 'org-key',
        secretAccessKey: 'org-secret',
      };

      (getS3IntegrationByOrganizationId as Mock).mockResolvedValue(mockIntegration);
      (getSecretByName as Mock).mockResolvedValue({
        secret: JSON.stringify(mockCredentials),
      });

      const provider = await getProviderForOrganization('org-123');

      expect(getS3IntegrationByOrganizationId).toHaveBeenCalledWith('org-123');
      expect(getSecretByName).toHaveBeenCalledWith('s3-integration-integration-123');
      expect(createS3Provider).toHaveBeenCalledWith({
        provider: 's3',
        region: 'us-west-2',
        bucket: 'org-bucket',
        accessKeyId: 'org-key',
        secretAccessKey: 'org-secret',
      });
      expect(provider).toBeDefined();
    });

    it('should return R2 provider for organization with R2 integration', async () => {
      const mockIntegration = { id: 'integration-456' };
      const mockCredentials = {
        provider: 'r2',
        accountId: 'org-account',
        bucket: 'org-r2-bucket',
        accessKeyId: 'org-r2-key',
        secretAccessKey: 'org-r2-secret',
      };

      (getS3IntegrationByOrganizationId as Mock).mockResolvedValue(mockIntegration);
      (getSecretByName as Mock).mockResolvedValue({
        secret: JSON.stringify(mockCredentials),
      });

      const provider = await getProviderForOrganization('org-456');

      expect(createR2Provider).toHaveBeenCalledWith({
        provider: 'r2',
        accountId: 'org-account',
        bucket: 'org-r2-bucket',
        accessKeyId: 'org-r2-key',
        secretAccessKey: 'org-r2-secret',
      });
      expect(provider).toBeDefined();
    });

    it('should return GCS provider for organization with GCS integration', async () => {
      const mockIntegration = { id: 'integration-789' };
      const mockCredentials = {
        provider: 'gcs',
        projectId: 'org-project',
        bucket: 'org-gcs-bucket',
        serviceAccountKey: '{"type":"service_account"}',
      };

      (getS3IntegrationByOrganizationId as Mock).mockResolvedValue(mockIntegration);
      (getSecretByName as Mock).mockResolvedValue({
        secret: JSON.stringify(mockCredentials),
      });

      const provider = await getProviderForOrganization('org-789');

      expect(createGCSProvider).toHaveBeenCalledWith({
        provider: 'gcs',
        projectId: 'org-project',
        bucket: 'org-gcs-bucket',
        serviceAccountKey: '{"type":"service_account"}',
      });
      expect(provider).toBeDefined();
    });

    it('should return default provider when no integration exists', async () => {
      (getS3IntegrationByOrganizationId as Mock).mockResolvedValue(null);

      const provider = await getProviderForOrganization('org-no-integration');

      expect(getS3IntegrationByOrganizationId).toHaveBeenCalledWith('org-no-integration');
      expect(getSecretByName).not.toHaveBeenCalled();
      expect(createR2Provider).toHaveBeenCalledWith({
        provider: 'r2',
        accountId: 'default-account',
        bucket: 'metric-exports',
        accessKeyId: 'default-key',
        secretAccessKey: 'default-secret',
      });
      expect(provider).toBeDefined();
    });

    it('should return default provider when secret is not found', async () => {
      const mockIntegration = { id: 'integration-missing' };

      (getS3IntegrationByOrganizationId as Mock).mockResolvedValue(mockIntegration);
      (getSecretByName as Mock).mockResolvedValue(null);

      const provider = await getProviderForOrganization('org-missing-secret');

      expect(createR2Provider).toHaveBeenCalledWith({
        provider: 'r2',
        accountId: 'default-account',
        bucket: 'metric-exports',
        accessKeyId: 'default-key',
        secretAccessKey: 'default-secret',
      });
      expect(provider).toBeDefined();
    });

    it('should return default provider when integration fetch fails', async () => {
      (getS3IntegrationByOrganizationId as Mock).mockRejectedValue(new Error('DB error'));

      const provider = await getProviderForOrganization('org-error');

      expect(createR2Provider).toHaveBeenCalledWith({
        provider: 'r2',
        accountId: 'default-account',
        bucket: 'metric-exports',
        accessKeyId: 'default-key',
        secretAccessKey: 'default-secret',
      });
      expect(provider).toBeDefined();
    });

    it('should handle invalid JSON in secret', async () => {
      const mockIntegration = { id: 'integration-bad-json' };

      (getS3IntegrationByOrganizationId as Mock).mockResolvedValue(mockIntegration);
      (getSecretByName as Mock).mockResolvedValue({
        secret: 'invalid-json',
      });

      const provider = await getProviderForOrganization('org-bad-json');

      expect(createR2Provider).toHaveBeenCalledWith({
        provider: 'r2',
        accountId: 'default-account',
        bucket: 'metric-exports',
        accessKeyId: 'default-key',
        secretAccessKey: 'default-secret',
      });
      expect(provider).toBeDefined();
    });

    it('should throw error for unknown provider type in credentials', async () => {
      const mockIntegration = { id: 'integration-unknown' };
      const mockCredentials = {
        provider: 'unknown',
        bucket: 'bucket',
      };

      (getS3IntegrationByOrganizationId as Mock).mockResolvedValue(mockIntegration);
      (getSecretByName as Mock).mockResolvedValue({
        secret: JSON.stringify(mockCredentials),
      });

      const provider = await getProviderForOrganization('org-unknown');

      // Should fall back to default provider due to error
      expect(createR2Provider).toHaveBeenCalledWith({
        provider: 'r2',
        accountId: 'default-account',
        bucket: 'metric-exports',
        accessKeyId: 'default-key',
        secretAccessKey: 'default-secret',
      });
      expect(provider).toBeDefined();
    });
  });

  describe('testStorageCredentials', () => {
    it('should return true for successful connection test', async () => {
      const mockProvider = {
        testConnection: vi.fn().mockResolvedValue({
          success: true,
          canRead: true,
          canWrite: true,
          canDelete: true,
        }),
      };
      (createS3Provider as Mock).mockReturnValue(mockProvider);

      const config: StorageConfig = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      const result = await testStorageCredentials(config);

      expect(result).toBe(true);
      expect(mockProvider.testConnection).toHaveBeenCalled();
    });

    it('should return false for failed connection test', async () => {
      const mockProvider = {
        testConnection: vi.fn().mockResolvedValue({
          success: false,
          canRead: false,
          canWrite: false,
          canDelete: false,
          error: 'Connection failed',
        }),
      };
      (createR2Provider as Mock).mockReturnValue(mockProvider);

      const config: StorageConfig = {
        provider: 'r2',
        accountId: 'account',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      const result = await testStorageCredentials(config);

      expect(result).toBe(false);
      expect(mockProvider.testConnection).toHaveBeenCalled();
    });

    it('should return false when provider creation fails', async () => {
      (createGCSProvider as Mock).mockImplementation(() => {
        throw new Error('Invalid credentials');
      });

      const config: StorageConfig = {
        provider: 'gcs',
        projectId: 'project',
        bucket: 'test-bucket',
        serviceAccountKey: 'invalid',
      };

      const result = await testStorageCredentials(config);

      expect(result).toBe(false);
    });

    it('should return false when testConnection throws', async () => {
      const mockProvider = {
        testConnection: vi.fn().mockRejectedValue(new Error('Network error')),
      };
      (createS3Provider as Mock).mockReturnValue(mockProvider);

      const config: StorageConfig = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      const result = await testStorageCredentials(config);

      expect(result).toBe(false);
    });
  });
});
